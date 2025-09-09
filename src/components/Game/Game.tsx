import { useState, useRef } from 'react';
import { GAME_SIZE, GameState } from '../../constants';
import './Game.css';
import { getInitialSeed } from '../../utils';
import StartScreen from '../StartScreen/StartScreen';
import VictoryScreen from '../VictoryScreen/VictoryScreen';
import { useMatterGame } from '../../hooks/useMatterGame';

// --- COMPONENT ---
const Game = () => {
  const [seed, setSeed] = useState(getInitialSeed);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [numGroups, setNumGroups] = useState(3);
  const [ducksPerGroup, setDucksPerGroup] = useState(4);
  const [time, setTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());

  const handleStartGame = (
    newSeed: number,
    newNumGroups: number,
    newDucksPerGroup: number
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set('seed', String(newSeed));
    window.history.pushState({}, '', url); // Update URL without reloading

    setSeed(newSeed);
    setNumGroups(newNumGroups);
    setDucksPerGroup(newDucksPerGroup);
    setGameState(GameState.PLAYING);
    setTime(0);
    startTimeRef.current = Date.now();
  };

  // Call our custom hook
  useMatterGame({
    sceneRef,
    seed,
    gameState,
    numGroups,
    ducksPerGroup,
    setTime,
    setFinalTime,
    setGameState,
    startTimeRef,
  });

  return (
    <div
      className="game-container"
      style={{ width: `${GAME_SIZE}px`, height: `${GAME_SIZE}px` }}
    >
      {gameState === GameState.START && (
        <StartScreen
          onStartGame={handleStartGame}
          initialNumGroups={numGroups}
          initialDucksPerGroup={ducksPerGroup}
        />
      )}

      {gameState === GameState.PLAYING && (
        <>
          <div className="timer">{time.toFixed(0)}</div>
          <div ref={sceneRef} className="game-canvas-container" />
        </>
      )}

      {gameState === GameState.WON && (
        <VictoryScreen
          finalTime={finalTime}
          seed={seed}
          onRestartGame={handleStartGame}
          currentNumGroups={numGroups}
          currentDucksPerGroup={ducksPerGroup}
        />
      )}
    </div>
  );
};

export default Game;
