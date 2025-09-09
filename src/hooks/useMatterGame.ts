import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import {
  BASE_COLORS,
  BOUNDS_BUFFER,
  BOUNDS_FORCE,
  COMFORT_FORCE,
  COMFORT_RADIUS,
  DUCK_SIZE,
  FEAR_FORCE,
  FEAR_RADIUS,
  FRICTION_AIR,
  GAME_SIZE,
  GROUPING_FORCE,
  LERP_SPEED,
  SORTING_RADIUS,
  SPAWN_RADIUS,
  STARTING_PLAYER_POSITION,
} from '../constants';
import { seededRandom } from '../utils';

interface UseMatterGameProps {
  sceneRef: React.RefObject<HTMLDivElement | null>;
  seed: number;
  gameState: string;
  numGroups: number;
  ducksPerGroup: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  setFinalTime: React.Dispatch<React.SetStateAction<number>>;
  setGameState: React.Dispatch<React.SetStateAction<string>>;
  startTimeRef: React.MutableRefObject<number>;
}

type PlayArea = {
  min: { x: number; y: number };
  max: { x: number; y: number };
};

type OuterBounds = {
  min: { x: number; y: number };
  max: { x: number; y: number };
};

export const useMatterGame = ({
  sceneRef,
  seed,
  gameState,
  numGroups,
  ducksPerGroup,
  setTime,
  setFinalTime,
  setGameState,
  startTimeRef,
}: UseMatterGameProps) => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  useEffect(() => {
    if (!sceneRef?.current || gameState !== 'playing') {
      // Cleanup Matter.js if it was running and game state changed away from playing
      if (engineRef.current) {
        Matter.Runner.stop(runnerRef.current!); // Use ! for non-null assertion
        Matter.Render.stop(renderRef.current!); // Use ! for non-null assertion
        Matter.Engine.clear(engineRef.current);
        if (renderRef.current!.canvas) renderRef.current!.canvas.remove();
        engineRef.current = null;
        runnerRef.current = null;
        renderRef.current = null;
      }
      return;
    }

    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Vector = Matter.Vector;

    const engine = Engine.create();
    const world = engine.world;
    engine.gravity.y = 0;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: GAME_SIZE,
        height: GAME_SIZE,
        wireframes: false,
        background: 'transparent',
      },
    });

    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = Runner.create();

    const player = Bodies.circle(
      STARTING_PLAYER_POSITION.x,
      STARTING_PLAYER_POSITION.y,
      10,
      { isStatic: true, render: { fillStyle: '#ffffff' } }
    );

    const ducks: Matter.Body[] = [];
    const centerX = render.options.width! / 2;
    const centerY = render.options.height! / 2;
    const availableColors = [...BASE_COLORS];

    for (let i = 0; i < numGroups; i++) {
      const colorIndex = Math.floor(
        seededRandom(seed + i) * availableColors.length
      );
      const color = availableColors.splice(colorIndex, 1)[0];
      for (let j = 0; j < ducksPerGroup; j++) {
        const angle = seededRandom(seed + i * 10 + j) * 2 * Math.PI;
        const radius =
          SPAWN_RADIUS * Math.sqrt(seededRandom(seed + i * 20 + j));
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const duck = Bodies.circle(x, y, DUCK_SIZE, {
          render: { fillStyle: color },
          restitution: 0.5,
          friction: 0.1,
          frictionAir: FRICTION_AIR,
          plugin: { groupId: i },
        });
        ducks.push(duck);
      }
    }

    Composite.add(world, [...ducks, player]);

    let mousePosition = STARTING_PLAYER_POSITION;
    const handleMouseMove = (event: MouseEvent) => {
      const bounds = render.canvas.getBoundingClientRect();
      mousePosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };
    render.canvas.addEventListener('mousemove', handleMouseMove);

    const playArea: PlayArea = {
      min: { x: 0, y: 0 },
      max: { x: render.options.width!, y: render.options.height! },
    };
    const outerBounds: OuterBounds = {
      min: {
        x: playArea.min.x - BOUNDS_BUFFER,
        y: playArea.min.y - BOUNDS_BUFFER,
      },
      max: {
        x: playArea.max.x + BOUNDS_BUFFER,
        y: playArea.max.y + BOUNDS_BUFFER,
      },
    };

    const updatePlayerPosition = (
      player: Matter.Body,
      mousePos: Matter.Vector,
      lerpSpeed: number
    ) => {
      const currentPos = player.position;
      const newX = currentPos.x + (mousePos.x - currentPos.x) * lerpSpeed;
      const newY = currentPos.y + (mousePos.y - currentPos.y) * lerpSpeed;
      Body.setPosition(player, { x: newX, y: newY });
    };

    const applyDuckRepulsion = (
      ducks: Matter.Body[],
      comfortRadius: number,
      comfortForce: number
    ) => {
      for (let i = 0; i < ducks.length; i++) {
        for (let j = i + 1; j < ducks.length; j++) {
          const duckA = ducks[i];
          const duckB = ducks[j];
          const vectorBetween = Vector.sub(duckA.position, duckB.position);
          const distance = Vector.magnitude(vectorBetween);
          if (distance < comfortRadius && distance > 0) {
            const forceMagnitude = (comfortRadius - distance) * comfortForce;
            const force = Vector.mult(
              Vector.normalise(vectorBetween),
              forceMagnitude
            );
            Body.applyForce(duckA, duckA.position, force);
            Body.applyForce(duckB, duckB.position, Vector.neg(force));
          }
        }
      }
    };

    const calculateAndApplyCohesion = (
      ducks: Matter.Body[],
      groupingForce: number
    ) => {
      const totalCenterOfMass = ducks.reduce(
        (acc, duck) => Vector.add(acc, duck.position),
        Vector.create(0, 0)
      );
      if (ducks.length > 0) {
        totalCenterOfMass.x /= ducks.length;
        totalCenterOfMass.y /= ducks.length;
      }

      ducks.forEach((duck) => {
        if (ducks.length > 1) {
          const pos = duck.position;
          const centerOfOthers = {
            x:
              (totalCenterOfMass.x * ducks.length - pos.x) / (ducks.length - 1),
            y:
              (totalCenterOfMass.y * ducks.length - pos.y) / (ducks.length - 1),
          };
          const vectorToCenter = Vector.sub(centerOfOthers, pos);
          const cohesionForce = Vector.mult(
            Vector.normalise(vectorToCenter),
            Vector.magnitude(vectorToCenter) * groupingForce
          );
          Body.applyForce(duck, pos, cohesionForce);
        }
      });
    };

    const updateDuckVisualStatus = (
      duck: Matter.Body,
      allDucks: Matter.Body[],
      sortingRadius: number
    ) => {
      let foundSameGroupFriend = false;
      let foundForeigner = false;
      const groupId = duck.plugin.groupId;

      for (const otherDuck of allDucks) {
        if (duck.id === otherDuck.id) continue;
        const distance = Vector.magnitude(
          Vector.sub(duck.position, otherDuck.position)
        );
        if (distance < sortingRadius) {
          const otherGroupId = otherDuck.plugin.groupId;
          if (groupId === otherGroupId) {
            foundSameGroupFriend = true;
          } else {
            foundForeigner = true;
            break;
          }
        }
      }
      const isIndividuallySorted = foundSameGroupFriend && !foundForeigner;
      duck.render.strokeStyle = isIndividuallySorted ? '#ffffff' : (duck.render.fillStyle as string);
      duck.render.lineWidth = isIndividuallySorted ? 2 : 0;
    };

    const checkGroupSortingStatus = (
      allDucks: Matter.Body[],
      numGroups: number,
      sortingRadius: number
    ) => {
      if (allDucks.length === 0) {
        return false;
      }
      const groupDucks: Matter.Body[][] = Array.from({ length: numGroups }, () => []);
      allDucks.forEach(duck => {
        if (duck.plugin.groupId !== undefined) {
          groupDucks[duck.plugin.groupId].push(duck);
        }
      });

      const sortedGroups = new Array(numGroups).fill(true);

      for (let i = 0; i < numGroups; i++) {
        const currentGroup = groupDucks[i];
        if (currentGroup.length < ducksPerGroup) {
          sortedGroups[i] = false;
          continue;
        }

        // 1. Check for foreigners
        for (const duck of currentGroup) {
          for (const otherDuck of allDucks) {
            if (duck.plugin.groupId !== otherDuck.plugin.groupId) {
              const distance = Vector.magnitude(Vector.sub(duck.position, otherDuck.position));
              if (distance < sortingRadius) {
                sortedGroups[i] = false;
                break;
              }
            }
          }
          if (!sortedGroups[i]) break;
        }
        if (!sortedGroups[i]) continue;

        // 2. Check for intra-group cohesion using BFS for connectivity
        const visited = new Set<number>();
        const queue: Matter.Body[] = [];
        if (currentGroup.length > 0) {
          queue.push(currentGroup[0]);
          visited.add(currentGroup[0].id);
        }

        let head = 0;
        while (head < queue.length) {
          const duck = queue[head++]; // More performant than .shift()
          for (const otherDuck of currentGroup) {
            if (!visited.has(otherDuck.id)) {
              const distance = Vector.magnitude(Vector.sub(duck.position, otherDuck.position));
              if (distance < sortingRadius) {
                visited.add(otherDuck.id);
                queue.push(otherDuck);
              }
            }
          }
        }

        if (visited.size !== currentGroup.length) {
          sortedGroups[i] = false;
        }
      }
      return sortedGroups.every(isSorted => isSorted);
    };

    const applyFearAndContainmentForces = (
      duck: Matter.Body,
      player: Matter.Body,
      playArea: PlayArea,
      outerBounds: OuterBounds,
      fearRadius: number,
      fearForce: number,
      boundsForce: number
    ) => {
      const pos = duck.position;

      // Fear logic: Apply if duck is within fearRadius of player, regardless of playArea
      const vectorToPlayer = Vector.sub(pos, player.position);
      if (Vector.magnitude(vectorToPlayer) < fearRadius) {
        const forceMagnitude =
          fearForce * (1 - Vector.magnitude(vectorToPlayer) / fearRadius);
        const force = Vector.mult(
          Vector.normalise(vectorToPlayer),
          forceMagnitude
        );
        Body.applyForce(duck, pos, force);
      }

      // Containment logic: Apply if duck is outside playArea (even within the buffer)
      const isInsidePlayArea =
        pos.x >= playArea.min.x &&
        pos.x <= playArea.max.x &&
        pos.y >= playArea.min.y &&
        pos.y <= playArea.max.y;

      if (!isInsidePlayArea) {
        const containmentForce = Vector.create(0, 0);
        if (pos.x < outerBounds.min.x)
          containmentForce.x = (outerBounds.min.x - pos.x) * boundsForce;
        else if (pos.x > outerBounds.max.x)
          containmentForce.x = (outerBounds.max.x - pos.x) * boundsForce;
        if (pos.y < outerBounds.min.y)
          containmentForce.y = (outerBounds.min.y - pos.y) * boundsForce;
        else if (pos.y > outerBounds.max.y)
          containmentForce.y = (outerBounds.max.y - pos.y) * boundsForce;
        if (Vector.magnitude(containmentForce) > 0)
          Body.applyForce(duck, pos, containmentForce);
      }
    };

    Events.on(engine, 'beforeUpdate', () => {
      setTime((Date.now() - startTimeRef.current) / 1000);

      updatePlayerPosition(player, mousePosition, LERP_SPEED);
      applyDuckRepulsion(ducks, COMFORT_RADIUS, COMFORT_FORCE);
      calculateAndApplyCohesion(ducks, GROUPING_FORCE);

      ducks.forEach((duck) => {
        applyFearAndContainmentForces(
          duck,
          player,
          playArea,
          outerBounds,
          FEAR_RADIUS,
          FEAR_FORCE,
          BOUNDS_FORCE
        );
        updateDuckVisualStatus(duck, ducks, SORTING_RADIUS);
      });

      const allGroupsSorted = checkGroupSortingStatus(ducks, numGroups, SORTING_RADIUS);

      if (allGroupsSorted) {
        setFinalTime((Date.now() - startTimeRef.current) / 1000);
        setGameState('won');
      }
    });

    Runner.run(runnerRef.current!, engine);
    Render.run(render);

    return () => {
      render.canvas.removeEventListener('mousemove', handleMouseMove);
      if (engineRef.current) {
        Matter.Runner.stop(runnerRef.current!); // Use ! for non-null assertion
        Render.stop(renderRef.current!); // Use ! for non-null assertion
        Engine.clear(engineRef.current);
        if (renderRef.current!.canvas) renderRef.current!.canvas.remove();
        engineRef.current = null;
        runnerRef.current = null;
        renderRef.current = null;
      }
    };
  }, [
    seed,
    gameState,
    numGroups,
    ducksPerGroup,
    sceneRef,
    setFinalTime,
    setGameState,
    setTime,
    startTimeRef,
  ]);
};
