import React, { useState } from 'react';
import { getDailySeed, generateRandomSeed } from '../../utils';
import { GAME_SIZE, GROUP_OPTIONS, DUCKS_OPTIONS } from '../../constants';
import './StartScreen.css';

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

  const handleStart = (seed?: number) => {
    const finalSeed = seed ?? generateRandomSeed();
    onStartGame(finalSeed, numGroups, ducksPerGroup);
  };

  return (
    <div
      className="start-screen"
      style={{ width: `${GAME_SIZE}px`, height: `${GAME_SIZE}px` }}
    >
      <h1>Duck Sorter</h1>

      <div className="control-group anim-delay-1">
        <div className="control-group-label">Number of Groups: {numGroups}</div>
        <div className="button-group">
          {GROUP_OPTIONS.map((count) => (
            <button
              key={count}
              className="start-button"
              onClick={() => setNumGroups(count)}
              disabled={numGroups === count}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group anim-delay-2">
        <div className="control-group-label">
          Ducks per Group: {ducksPerGroup}
        </div>
        <div className="button-group">
          {DUCKS_OPTIONS.map((count) => (
            <button
              key={count}
              className="start-button"
              onClick={() => setDucksPerGroup(count)}
              disabled={ducksPerGroup === count}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="anim-delay-3">
        <div className="button-group-label">Play with:</div>
        <div className="button-group">
          <button
            className="start-button"
            onClick={() => handleStart(getDailySeed())}
          >
            Daily Seed
          </button>
          <button className="start-button" onClick={() => handleStart()}>
            Random Seed
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
