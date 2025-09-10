// Импортируем необходимые зависимости из React и Matter.js, а также константы и утилиты
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
  GameState,
  LERP_SPEED,
  SORTING_RADIUS,
  SPAWN_RADIUS,
  STARTING_PLAYER_POSITION,
} from '../constants';
import { seededRandom } from '../utils';

interface UseMatterGameProps {
  sceneRef: React.RefObject<HTMLDivElement | null>;
  seed: number; // Зерно для генерации случайных чисел, чтобы обеспечить повторяемость
  gameState: GameState;
  numGroups: number;
  ducksPerGroup: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  setFinalTime: React.Dispatch<React.SetStateAction<number>>;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  startTimeRef: React.RefObject<number>;
}

// Тип для определения игровой зоны
type PlayArea = {
  min: { x: number; y: number };
  max: { x: number; y: number };
};

// Тип для определения внешних границ, за которые утки не должны выходить и будут отталкиваться
type OuterBounds = {
  min: { x: number; y: number };
  max: { x: number; y: number };
};

// Основной хук, отвечающий за логику игры с использованием Matter.js
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
  // Ссылки для хранения экземпляров движка Matter.js
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Основной useEffect, который запускается при изменении зависимостей
  useEffect(() => {
    // Если сцена не готова или игра не в состоянии PLAYING, очищаем ресурсы Matter.js
    if (!sceneRef?.current || gameState !== GameState.PLAYING) {
      if (engineRef.current) {
        Matter.Runner.stop(runnerRef.current!);
        Matter.Render.stop(renderRef.current!);
        Matter.Engine.clear(engineRef.current);
        if (renderRef.current!.canvas) renderRef.current!.canvas.remove();
        engineRef.current = null;
        runnerRef.current = null;
        renderRef.current = null;
      }
      return;
    }

    // Деструктуризация модулей Matter.js для удобства
    const { Engine, Render, Runner, Bodies, Body, Composite, Events, Vector } =
      Matter;

    // Создание движка и мира
    const engine = Engine.create();
    const world = engine.world;
    engine.gravity.y = 0; // Отключаем гравитацию

    // Создание рендера для отображения симуляции
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: GAME_SIZE,
        height: GAME_SIZE,
        wireframes: false, // Отключаем каркасный режим для отображения сплошных цветов
        background: 'transparent',
      },
    });

    // Сохраняем экземпляры в ссылки
    engineRef.current = engine;
    renderRef.current = render;
    runnerRef.current = Runner.create();

    // Создание объекта игрока (курсора)
    const player = Bodies.circle(
      STARTING_PLAYER_POSITION.x,
      STARTING_PLAYER_POSITION.y,
      10,
      { isStatic: true, render: { fillStyle: '#ffffff' } }
    );

    // Создание уток
    const ducks: Matter.Body[] = [];
    const centerX = render.options.width! / 2;
    const centerY = render.options.height! / 2;
    const availableColors = [...BASE_COLORS];

    for (let i = 0; i < numGroups; i++) {
      // Выбираем случайный цвет для группы
      const colorIndex = Math.floor(
        seededRandom(seed + i) * availableColors.length
      );
      const color = availableColors.splice(colorIndex, 1)[0];
      for (let j = 0; j < ducksPerGroup; j++) {
        // Генерируем случайные координаты для уток внутри радиуса спавна
        const angle = seededRandom(seed + i * 10 + j) * 2 * Math.PI;
        const radius =
          SPAWN_RADIUS * Math.sqrt(seededRandom(seed + i * 20 + j));
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Создаем основное тело утки
        const duckBody = Bodies.circle(x, y, DUCK_SIZE, {
          render: { fillStyle: color },
        });

        // Создаем круг-индикатор
        const indicatorCircle = Bodies.circle(x, y, 3, {
          isSensor: true, // Делаем его сенсором, чтобы он не участвовал в столкновениях
          render: { fillStyle: 'transparent' }, // Изначально прозрачный
        });

        // Создаем составное тело, объединяя утку и индикатор
        const duck = Body.create({
          parts: [duckBody, indicatorCircle],
          restitution: 0.5, // Упругость
          friction: 0.1, // Трение
          frictionAir: FRICTION_AIR, // Сопротивление воздуха
          plugin: {
            groupId: i, // Присваиваем ID группы
          },
        });

        ducks.push(duck);
      }
    }

    // Добавляем все объекты (утки и игрок) в мир
    Composite.add(world, [...ducks, player]);

    // Обработка движения мыши для обновления позиции игрока
    let mousePosition = STARTING_PLAYER_POSITION;
    const handleMouseMove = (event: MouseEvent) => {
      const bounds = render.canvas.getBoundingClientRect();
      mousePosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };
    render.canvas.addEventListener('mousemove', handleMouseMove);

    // Определение границ игровой зоны и внешних границ
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

    // Функция для плавного обновления позиции игрока (интерполяция)
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

    // Применяет силу отталкивания между утками, чтобы они не слипались
    const applyDuckComfortZone = (
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

    // Рассчитывает и применяет силу сплоченности, чтобы утки одной группы держались вместе
    const calculateAndApplyGrouping = (
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

    // Обновляет визуальный статус утки (обводка), если она отсортирована
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

      // Обновляем цвет индикатора в зависимости от статуса сортировки
      // Индикатор - это третья часть составного тела (0: родитель, 1: тело, 2: индикатор)
      if (duck.parts.length > 2) {
        const indicator = duck.parts[2];
        indicator.render.fillStyle = isIndividuallySorted
          ? '#ffffff'
          : 'transparent';
      }
    };

    // Проверяет, отсортированы ли все группы уток
    const checkGroupSortingStatus = (
      allDucks: Matter.Body[],
      numGroups: number,
      sortingRadius: number
    ) => {
      if (allDucks.length === 0) {
        return false;
      }
      const groupDucks: Matter.Body[][] = Array.from(
        { length: numGroups },
        () => []
      );
      allDucks.forEach((duck) => {
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

        // 1. Проверка на наличие "чужих" уток поблизости
        for (const duck of currentGroup) {
          for (const otherDuck of allDucks) {
            if (duck.plugin.groupId !== otherDuck.plugin.groupId) {
              const distance = Vector.magnitude(
                Vector.sub(duck.position, otherDuck.position)
              );
              if (distance < sortingRadius) {
                sortedGroups[i] = false;
                break;
              }
            }
          }
          if (!sortedGroups[i]) break;
        }
        if (!sortedGroups[i]) continue;

        // 2. Проверка на связность группы (все утки должны быть рядом друг с другом)
        const visited = new Set<number>();
        const queue: Matter.Body[] = [];
        if (currentGroup.length > 0) {
          queue.push(currentGroup[0]);
          visited.add(currentGroup[0].id);
        }

        let head = 0;
        while (head < queue.length) {
          const duck = queue[head++];
          for (const otherDuck of currentGroup) {
            if (!visited.has(otherDuck.id)) {
              const distance = Vector.magnitude(
                Vector.sub(duck.position, otherDuck.position)
              );
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
      // Возвращает true, если все группы отсортированы
      return sortedGroups.every((isSorted) => isSorted);
    };

    // Применяет силы страха (от игрока) и удержания в границах
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

      // Логика страха: утки отталкиваются от курсора игрока
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

      // Логика удержания: утки отталкиваются от границ игровой зоны
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

    // Основной игровой цикл, который выполняется перед каждым обновлением кадра
    Events.on(engine, 'beforeUpdate', () => {
      setTime((Date.now() - startTimeRef.current) / 1000);

      // Обновляем позицию игрока и применяем все силы к уткам
      updatePlayerPosition(player, mousePosition, LERP_SPEED);
      applyDuckComfortZone(ducks, COMFORT_RADIUS, COMFORT_FORCE);
      calculateAndApplyGrouping(ducks, GROUPING_FORCE);

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

      // Проверяем, выиграл ли игрок
      const allGroupsSorted = checkGroupSortingStatus(
        ducks,
        numGroups,
        SORTING_RADIUS
      );

      if (allGroupsSorted) {
        setFinalTime((Date.now() - startTimeRef.current) / 1000);
        setGameState(GameState.WON);
      }
    });

    // Запускаем движок
    Runner.run(runnerRef.current!, engine);
    Render.run(render);

    // Все чистим при размонтировании
    return () => {
      render.canvas.removeEventListener('mousemove', handleMouseMove);
      if (engineRef.current) {
        Matter.Runner.stop(runnerRef.current!);
        Render.stop(renderRef.current!);
        Engine.clear(engineRef.current);
        if (renderRef.current!.canvas) renderRef.current!.canvas.remove();
        engineRef.current = null;
        runnerRef.current = null;
        renderRef.current = null;
      }
    };
  }, [
    // Зависимости
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
