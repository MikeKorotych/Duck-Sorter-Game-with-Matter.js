
import Game from './components/Game/Game';
import { GAME_SIZE } from './constants';

function App() {
  return (
    <>
      <div
        className="board"
        style={{ width: `${GAME_SIZE}px`, height: `${GAME_SIZE}` }}
      >
        <Game />
      </div>
    </>
  );
}

export default App;
