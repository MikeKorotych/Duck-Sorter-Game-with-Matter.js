import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { LERP_SPEED } from '../constants';

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
      Events = Matter.Events;

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

    // Duck group size
    const duckSize = 8;
    const duckGroupSize = 4;
    const duckGoupCount = 3;
    const ducks = [];
    const allColors = [
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

    // create ducks and player
    const player = Bodies.circle(300, 300, 10, {
      isStatic: true,
      render: {
        fillStyle: '#ffffff',
      },
    });

    // fill the ducks array
    for (let i = 0; i < duckGoupCount; i++) {
      for (let j = 0; j < duckGroupSize; j++) {
        // pick available color from the allColors array (it shouldn't repeat)
        const colorIndex = Math.floor(Math.random() * allColors.length);
        const color = allColors[colorIndex];
        allColors.splice(colorIndex, 1);
      }
    }
    const circleA = Bodies.circle(400, 200, 8, {
      render: {
        fillStyle: '#cca87b',
      },
    });

    const circleB = Bodies.circle(450, 50, 8, {
      render: {
        fillStyle: '#5b7d73',
      },
    });

    const circleC = Bodies.circle(500, 200, 8, {
      render: {
        fillStyle: '#774251',
      },
    });

    // add all of the bodies to the world
    Composite.add(world, [circleA, circleB, circleC, player]);

    // --- Mouse and Movement Logic ---
    let mousePosition = { x: 400, y: 300 };
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

    Events.on(engine, 'beforeUpdate', () => {
      const currentPos = player.position;
      const newX = lerp(currentPos.x, mousePosition.x, LERP_SPEED);
      const newY = lerp(currentPos.y, mousePosition.y, LERP_SPEED);
      Body.setPosition(player, { x: newX, y: newY });
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

  return <div ref={sceneRef} style={{ width: '600px', height: '600px' }} />;
};

export default Game;
