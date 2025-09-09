import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { GAME_SIZE, LERP_SPEED } from '../constants';

// GAME
const SPAWN_RADIUS = 8; // Radius of the invisible spawn circle

const FEAR_RADIUS = 250; // The distance at which ducks start to flee
const FEAR_FORCE = 0.0003; // The maximum force applied to a duck

const BOUNDS_FORCE = 0.001; // The force that pushes ducks back into the play area
const BOUNDS_BUFFER = 15; // The buffer zone outside the play area where nothing happens

const GROUPING_FORCE = 0.0000005; // The gentle force pulling ducks together

const COMFORT_RADIUS = 20; // Ducks' personal space radius
const COMFORT_FORCE = 0.00005; // Force to push ducks apart
const SORTING_RADIUS = 40; // Radius to check for foreign ducks

// PLAYER
const STARTING_PLAYER_POSITION = { x: 295, y: 500 };

// DUCKS

const DUCK_SIZE = 8;
const DUCK_GROUP_SIZE = 4;
const DUCK_GROUP_COUNT = 3;
const FRICTION_AIR = 0.1;

// COLORS
const AVAILABLE_COLORS = [
  '#ddcf99',
  '#cca87b',
  '#b97a60',
  '#9c524e',
  '#774251',
  '#4b3d44',
  '#4e5463',
  '#5b7d73',
  '#8e9f7d',
  '#645355',
  '#8c7c79',
  '#a99c8d',
  '#7d7b62',
  '#aaa25d',
  '#846d59',
  '#a88a5e',
];

const Game = () => {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    // module aliases
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Vector = Matter.Vector;

    // create an engine
    const engine = Engine.create();
    const world = engine.world;

    // create a renderer
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 600,
        height: 600,
        wireframes: false,
        background: '#242424',
      },
    });

    // Disable gravity
    engine.gravity.y = 0;

    // --- Create Player ---
    const player = Bodies.circle(
      STARTING_PLAYER_POSITION.x,
      STARTING_PLAYER_POSITION.y,
      10,
      {
        isStatic: true, // Player is moved manually, so it's 'static' to the physics engine
        render: {
          fillStyle: '#ffffff',
        },
      }
    );

    // --- Create Ducks ---
    const ducks: Matter.Body[] = [];
    const centerX = render.options.width! / 2;
    const centerY = render.options.height! / 2;

    for (let i = 0; i < DUCK_GROUP_COUNT; i++) {
      // Pck a color for the group and remove it from the available list
      const colorIndex = Math.floor(Math.random() * AVAILABLE_COLORS.length);
      const color = AVAILABLE_COLORS.splice(colorIndex, 1)[0];

      for (let j = 0; j < DUCK_GROUP_SIZE; j++) {
        // Calculate a random position within the spawn circle
        const angle = Math.random() * 2 * Math.PI;
        const radius = SPAWN_RADIUS * Math.sqrt(Math.random());
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        const duck = Bodies.circle(x, y, DUCK_SIZE, {
          render: {
            fillStyle: color,
          },
          restitution: 0.5, // Make them a bit bouncy
          friction: 0.1,
          frictionAir: FRICTION_AIR,
          plugin: {
            groupId: i,
          },
        });

        ducks.push(duck);
      }
    }

    // add all of the bodies to the world
    Composite.add(world, [...ducks, player]);

    // --- Mouse and Movement Logic ---
    let mousePosition = STARTING_PLAYER_POSITION;
    let isMouseInside = false;

    const lerp = (start: number, end: number, amount: number) => {
      return start + (end - start) * amount;
    };

    // Mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      if (isMouseInside) {
        const bounds = render.canvas.getBoundingClientRect();
        mousePosition = {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        };
      }
    };

    const handleMouseEnter = () => {
      isMouseInside = true;
    };

    const handleMouseLeave = () => {
      isMouseInside = false;
    };

    render.canvas.addEventListener('mouseenter', handleMouseEnter);
    render.canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousemove', handleMouseMove);

    // --- Main Game Loop ---
    const playArea = {
      min: { x: 0, y: 0 },
      max: { x: render.options.width!, y: render.options.height! },
    };

    const outerBounds = {
      min: {
        x: playArea.min.x - BOUNDS_BUFFER,
        y: playArea.min.y - BOUNDS_BUFFER,
      },
      max: {
        x: playArea.max.x + BOUNDS_BUFFER,
        y: playArea.max.y + BOUNDS_BUFFER,
      },
    };

    //! Update
    Events.on(engine, 'beforeUpdate', () => {
      // 1. Move the player towards the mouse
      const currentPos = player.position;
      const newX = lerp(currentPos.x, mousePosition.x, LERP_SPEED);
      const newY = lerp(currentPos.y, mousePosition.y, LERP_SPEED);
      Body.setPosition(player, { x: newX, y: newY });

      // 2. Apply push-back force between ducks to create personal space
      for (let i = 0; i < ducks.length; i++) {
        for (let j = i + 1; j < ducks.length; j++) {
          const duckA = ducks[i];
          const duckB = ducks[j];

          const vectorBetween = Vector.sub(duckA.position, duckB.position);
          const distance = Vector.magnitude(vectorBetween);

          if (distance < COMFORT_RADIUS && distance > 0) {
            const forceMagnitude = (COMFORT_RADIUS - distance) * COMFORT_FORCE;
            const forceDirection = Vector.normalise(vectorBetween);
            const force = Vector.mult(forceDirection, forceMagnitude);

            // Apply opposite forces
            Body.applyForce(duckA, duckA.position, force);
            Body.applyForce(duckB, duckB.position, Vector.neg(force));
          }
        }
      }

      // 3. Calculate Grouping behavior
      const totalCenterOfMass = ducks.reduce(
        (acc, duck) => {
          acc.x += duck.position.x;
          acc.y += duck.position.y;
          return acc;
        },
        { x: 0, y: 0 }
      );
      totalCenterOfMass.x /= ducks.length;
      totalCenterOfMass.y /= ducks.length;

      ducks.forEach((duck) => {
        // --- Sorting Logic ---
        let foundSameGroupFriend = false;
        let foundForeigner = false;
        const groupId = duck.plugin.groupId;

        for (const otherDuck of ducks) {
          if (duck.id === otherDuck.id) continue;

          const distance = Vector.magnitude(
            Vector.sub(duck.position, otherDuck.position)
          );

          if (distance < SORTING_RADIUS) {
            const otherGroupId = otherDuck.plugin.groupId;
            if (groupId === otherGroupId) {
              foundSameGroupFriend = true;
            } else {
              foundForeigner = true;
              // A foreigner nearby is an instant fail for sorting status
              break;
            }
          }
        }

        // A duck is sorted if it has a friend from the same group AND no foreigners nearby.
        const isSorted = foundSameGroupFriend && !foundForeigner;

        // Apply visual feedback
        if (isSorted) {
          duck.render.strokeStyle = '#ffffff';
          duck.render.lineWidth = 2;
        } else {
          // Reset to default
          duck.render.strokeStyle = duck.render.fillStyle;
          duck.render.lineWidth = 0;
        }
        // --- End Sorting Logic ---

        const pos = duck.position;

        // Apply Grouping Force
        if (ducks.length > 1) {
          const centerOfOthers = {
            x:
              (totalCenterOfMass.x * ducks.length - pos.x) / (ducks.length - 1),
            y:
              (totalCenterOfMass.y * ducks.length - pos.y) / (ducks.length - 1),
          };
          const vectorToCenter = Vector.sub(centerOfOthers, pos);
          const distanceToCenter = Vector.magnitude(vectorToCenter);
          const cohesionForceMagnitude = distanceToCenter * GROUPING_FORCE;
          const cohesionForceDirection = Vector.normalise(vectorToCenter);
          const cohesionForce = Vector.mult(
            cohesionForceDirection,
            cohesionForceMagnitude
          );
          Body.applyForce(duck, pos, cohesionForce);
        }

        // Apply Fear and Containment forces
        const isInsidePlayArea =
          pos.x >= playArea.min.x &&
          pos.x <= playArea.max.x &&
          pos.y >= playArea.min.y &&
          pos.y <= playArea.max.y;

        // Behavior 1: Inside the play area -> Flee from player
        if (isInsidePlayArea) {
          const vectorToPlayer = Vector.sub(pos, player.position);
          const distance = Vector.magnitude(vectorToPlayer);

          if (distance < FEAR_RADIUS) {
            const forceMagnitude = FEAR_FORCE * (1 - distance / FEAR_RADIUS);
            const forceDirection = Vector.normalise(vectorToPlayer);
            const force = Vector.mult(forceDirection, forceMagnitude);
            Body.applyForce(duck, pos, force);
          }
        }
        // Behavior 2: Outside the play area -> Check for containment
        else {
          const containmentForce = Vector.create(0, 0);

          // Check if the duck has breached the outer bounds (beyond the buffer)
          if (pos.x < outerBounds.min.x) {
            containmentForce.x = (outerBounds.min.x - pos.x) * BOUNDS_FORCE;
          } else if (pos.x > outerBounds.max.x) {
            containmentForce.x = (outerBounds.max.x - pos.x) * BOUNDS_FORCE;
          }

          if (pos.y < outerBounds.min.y) {
            containmentForce.y = (outerBounds.min.y - pos.y) * BOUNDS_FORCE;
          } else if (pos.y > outerBounds.max.y) {
            containmentForce.y = (outerBounds.max.y - pos.y) * BOUNDS_FORCE;
          }

          if (Vector.magnitude(containmentForce) > 0) {
            Body.applyForce(duck, pos, containmentForce);
          }
        }
      });
    });

    // Run the render and engine
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      render.canvas.removeEventListener('mouseenter', handleMouseEnter);
      render.canvas.removeEventListener('mouseleave', handleMouseLeave);
      Runner.stop(runner);
      Render.stop(render);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      style={{ width: `${GAME_SIZE}px`, height: `${GAME_SIZE}px` }}
    />
  );
};

export default Game;
