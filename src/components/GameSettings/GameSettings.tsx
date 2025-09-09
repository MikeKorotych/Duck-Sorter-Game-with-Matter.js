import React from 'react';
import { GROUP_OPTIONS, DUCKS_OPTIONS } from '../../constants';

interface GameSettingsProps {
  numGroups: number;
  setNumGroups: (value: number) => void;
  ducksPerGroup: number;
  setDucksPerGroup: (value: number) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  numGroups,
  setNumGroups,
  ducksPerGroup,
  setDucksPerGroup,
}) => {
  return (
    <>
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
    </>
  );
};

export default GameSettings;
