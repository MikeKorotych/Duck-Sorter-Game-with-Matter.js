import React, { useState } from 'react';
import ReactConfetti from 'react-confetti';
import GameSettings from '../GameSettings/GameSettings';
import StartControls from '../StartControls/StartControls';
import './VictoryScreen.css';
import '../common.css';

interface VictoryScreenProps {
  finalTime: number;
  seed: number;
  onRestartGame: (
    seed: number,
    numGroups: number,
    ducksPerGroup: number
  ) => void;
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

  const handleRestart = (seed: number) => {
    onRestartGame(seed, numGroups, ducksPerGroup);
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

      <GameSettings
        numGroups={numGroups}
        setNumGroups={setNumGroups}
        ducksPerGroup={ducksPerGroup}
        setDucksPerGroup={setDucksPerGroup}
      />

      <StartControls onStart={handleRestart} />
    </div>
  );
};

export default VictoryScreen;