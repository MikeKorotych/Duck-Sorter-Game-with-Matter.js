import './App.css';
import Game from './components/Game';

function App() {
  return (
    <>
      <div className="game-title">Duck sorter game 🦆</div>
      <div className="board">
        <Game />
      </div>
    </>
  );
}

export default App;
