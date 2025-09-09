import React, { useState } from 'react';
import ReactConfetti from 'react-confetti';
import {
  GROUP_OPTIONS,
  DUCKS_OPTIONS,
} from '../../constants';
import { getDailySeed, generateRandomSeed } from '../../utils';
import './VictoryScreen.css';

interface VictoryScreenProps {
  finalTime: number;
  seed: number;
  onRestartGame: (seed: number, numGroups: number, ducksPerGroup: number) => void;
  currentNumGroups: number;
  currentDucksPerGroup: number;
}

const VictoryScreen: React.FC<VictoryScreenProps> = ({
  finalTime,
  seed,
  onRestartGame,
  currentNumGroups,
  currentDucksPerGroup,
}) => {
  const [numGroups, setNumGroups] = useState(currentNumGroups);
  const [ducksPerGroup, setDucksPerGroup] = useState(currentDucksPerGroup);

  const handleStart = (seed?: number) => {
    const finalSeed = seed ?? generateRandomSeed();
    onRestartGame(finalSeed, numGroups, ducksPerGroup);
  };

  return (
    <div className="victory-overlay">
      <ReactConfetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={400}
        tweenDuration={10000}
        style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
      />
      <div className="victory-title">
        You sorted the ducks in {finalTime.toFixed(2)} seconds!
      </div>
      <div className="victory-text">on seed: {seed}</div>

      {/* New Controls */}
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

      <div className="button-group anim-delay-3">
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
  );
};

export default VictoryScreen;
