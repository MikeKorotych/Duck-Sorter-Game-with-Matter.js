import React from 'react';
import { getDailySeed, generateRandomSeed } from '../../utils';

interface StartControlsProps {
  onStart: (seed: number) => void;
}

const StartControls: React.FC<StartControlsProps> = ({ onStart }) => {
  return (
    <div className="anim-delay-3">
      <div className="button-group-label">Play with:</div>
      <div className="button-group">
        <button
          className="start-button"
          onClick={() => onStart(getDailySeed())}
        >
          Daily Seed
        </button>
        <button
          className="start-button"
          onClick={() => onStart(generateRandomSeed())}
        >
          Random Seed
        </button>
      </div>
    </div>
  );
};

export default StartControls;
