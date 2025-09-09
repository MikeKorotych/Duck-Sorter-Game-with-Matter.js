import React, { useState } from 'react';
import { GAME_SIZE } from '../../constants';
import GameSettings from '../GameSettings/GameSettings';
import StartControls from '../StartControls/StartControls';
import './StartScreen.css';
import '../common.css';

interface StartScreenProps {
  onStartGame: (seed: number, numGroups: number, ducksPerGroup: number) => void;
  initialNumGroups: number;
  initialDucksPerGroup: number;
}

const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  initialNumGroups,
  initialDucksPerGroup,
}) => {
  const [numGroups, setNumGroups] = useState(initialNumGroups);
  const [ducksPerGroup, setDucksPerGroup] = useState(initialDucksPerGroup);

  const handleStart = (seed: number) => {
    onStartGame(seed, numGroups, ducksPerGroup);
  };

  return (
    <div
      className="start-screen"
      style={{ width: `${GAME_SIZE}px`, height: `${GAME_SIZE}px` }}
    >
      <h1>Duck Sorter</h1>

      <GameSettings
        numGroups={numGroups}
        setNumGroups={setNumGroups}
        ducksPerGroup={ducksPerGroup}
        setDucksPerGroup={setDucksPerGroup}
      />

      <StartControls onStart={handleStart} />
    </div>
  );
};

export default StartScreen;