import { useState, useEffect, useCallback } from 'react';

const BOARD_WIDTH = 6;
const BOARD_HEIGHT = 12;
const CELL_SIZE = 40;

type Board = number[][];
type Position = { x: number; y: number };
type Puyo = { x: number; y: number; color: number };

const COLORS = [
  '#ff0000', // 赤
  '#00ff00', // 緑
  '#0000ff', // 青
  '#ffff00', // 黄
  '#ff00ff', // 紫
];

export default function PuyoPuyo() {
  const [board, setBoard] = useState<Board>(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPair, setCurrentPair] = useState<Puyo[]>([]);
  const [pairRotation, setPairRotation] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [clearingPositions, setClearingPositions] = useState<Position[]>([]);
  const [chainCount, setChainCount] = useState<number>(0);
  const [showChainText, setShowChainText] = useState<boolean>(false);
  const [clearedCount, setClearedCount] = useState<number>(0);

  const createNewPair = useCallback((): Puyo[] => {
    const color1 = Math.floor(Math.random() * COLORS.length) + 1;
    const color2 = Math.floor(Math.random() * COLORS.length) + 1;
    return [
      { x: 2, y: 0, color: color1 },
      { x: 2, y: 1, color: color2 }
    ];
  }, []);

  const checkCollision = useCallback((puyos: Puyo[], brd: Board = board): boolean => {
    for (const puyo of puyos) {
      if (
        puyo.x < 0 ||
        puyo.x >= BOARD_WIDTH ||
        puyo.y >= BOARD_HEIGHT ||
        (puyo.y >= 0 && brd[puyo.y][puyo.x])
      ) {
        return true;
      }
    }
    return false;
  }, [board]);

  const findConnectedGroups = useCallback((brd: Board): Position[][] => {
    const visited = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(false));
    const groups: Position[][] = [];

    const dfs = (y: number, x: number, color: number, group: Position[]) => {
      if (y < 0 || y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) return;
      if (visited[y][x] || brd[y][x] !== color || brd[y][x] === 0) return;

      visited[y][x] = true;
      group.push({ x, y });

      dfs(y - 1, x, color, group);
      dfs(y + 1, x, color, group);
      dfs(y, x - 1, color, group);
      dfs(y, x + 1, color, group);
    };

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (!visited[y][x] && brd[y][x] > 0) {
          const group: Position[] = [];
          dfs(y, x, brd[y][x], group);

          if (group.length >= 4) {
            groups.push(group);
          }
        }
      }
    }

    return groups;
  }, []);

  const applyGravity = useCallback((brd: Board): Board => {
    const newBoard = brd.map(row => [...row]);

    for (let x = 0; x < BOARD_WIDTH; x++) {
      let writePos = BOARD_HEIGHT - 1;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y][x] > 0) {
          if (writePos !== y) {
            newBoard[writePos][x] = newBoard[y][x];
            newBoard[y][x] = 0;
          }
          writePos--;
        }
      }
    }

    return newBoard;
  }, []);

  const placePair = useCallback(() => {
    if (currentPair.length === 0) return;

    setIsDropping(true);
    let newBoard = board.map(row => [...row]);

    for (const puyo of currentPair) {
      if (puyo.y >= 0) {
        newBoard[puyo.y][puyo.x] = puyo.color;
      }
    }

    newBoard = applyGravity(newBoard);
    setBoard(newBoard);

    let chain = 0;
    let totalCleared = 0;

    const processChains = () => {
      const groups = findConnectedGroups(newBoard);

      if (groups.length > 0) {
        chain++;
        
        // すべての消えるぷよを一度に収集
        const allToRemove: Position[] = groups.flat();
        totalCleared += allToRemove.length;

        playSound('/wao.mp3');

        // 消えるアニメーション
        setClearingPositions(allToRemove);
        setClearedCount(allToRemove.length);
        
        // 連鎖数表示
        setChainCount(chain);
        setShowChainText(true);

        // アニメーション後に実際に消す
        setTimeout(() => {
          setClearingPositions([]);
          setShowChainText(false);
          
          // すべての消えるぷよを削除
          const clearedBoard = newBoard.map(row => [...row]);
          for (const pos of allToRemove) {
            clearedBoard[pos.y][pos.x] = 0;
          }
          
          // 重力適用
          newBoard = applyGravity(clearedBoard);
          setBoard(newBoard);
          
          // 次の連鎖をチェック
          setTimeout(() => processChains(), 300);
        }, 400);
      } else {
        // 連鎖終了
        if (totalCleared > 0) {
          const bonus = chain > 1 ? Math.pow(2, chain - 1) : 1;
          setScore(s => s + totalCleared * 10 * bonus);
        }

        const newPair = createNewPair();
        if (checkCollision(newPair, newBoard)) {
          setGameOver(true);
        } else {
          setCurrentPair(newPair);
          setPairRotation(0);
        }
        setIsDropping(false);
      }
    };

    // 少し待ってから連鎖処理開始
    setTimeout(() => processChains(), 200);
  }, [board, currentPair, applyGravity, findConnectedGroups, createNewPair, checkCollision]);

  const moveDown = useCallback(() => {
    if (currentPair.length === 0 || gameOver || isPaused || isDropping) return;

    const newPair = currentPair.map(p => ({ ...p, y: p.y + 1 }));
    if (!checkCollision(newPair)) {
      setCurrentPair(newPair);
    } else {
      placePair();
    }
  }, [currentPair, gameOver, isPaused, isDropping, checkCollision, placePair]);

  const moveHorizontal = useCallback((dir: number) => {
    if (currentPair.length === 0 || gameOver || isPaused || isDropping) return;

    const newPair = currentPair.map(p => ({ ...p, x: p.x + dir }));
    if (!checkCollision(newPair)) {
      setCurrentPair(newPair);
    }
  }, [currentPair, gameOver, isPaused, isDropping, checkCollision]);

  const rotate = useCallback(() => {
    if (currentPair.length !== 2 || gameOver || isPaused || isDropping) return;

    const [axis, satellite] = currentPair;
    const newRotation = (pairRotation + 1) % 4;

    let newSatellite = { ...satellite };
    if (newRotation === 0) newSatellite = { x: axis.x, y: axis.y - 1, color: satellite.color };
    else if (newRotation === 1) newSatellite = { x: axis.x + 1, y: axis.y, color: satellite.color };
    else if (newRotation === 2) newSatellite = { x: axis.x, y: axis.y + 1, color: satellite.color };
    else if (newRotation === 3) newSatellite = { x: axis.x - 1, y: axis.y, color: satellite.color };

    const newPair = [axis, newSatellite];
    if (!checkCollision(newPair)) {
      setCurrentPair(newPair);
      setPairRotation(newRotation);
    }
  }, [currentPair, pairRotation, gameOver, isPaused, isDropping, checkCollision]);

  const hardDrop = useCallback(() => {
    if (currentPair.length === 0 || gameOver || isPaused || isDropping) return;

    let newPair = currentPair.map(p => ({ ...p }));
    while (!checkCollision(newPair.map(p => ({ ...p, y: p.y + 1 })))) {
      newPair = newPair.map(p => ({ ...p, y: p.y + 1 }));
    }
    setCurrentPair(newPair);
    setTimeout(() => placePair(), 50);
  }, [currentPair, gameOver, isPaused, isDropping, checkCollision, placePair]);

  useEffect(() => {
    if (currentPair.length === 0 && !gameOver && !isDropping) {
      const newPair = createNewPair();
      setCurrentPair(newPair);
      setPairRotation(0);
    }
  }, [currentPair, gameOver, isDropping, createNewPair]);

  useEffect(() => {
    const interval = setInterval(moveDown, 800);
    return () => clearInterval(interval);
  }, [moveDown]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveHorizontal(-1);
      if (e.key === 'ArrowRight') moveHorizontal(1);
      if (e.key === 'ArrowDown') moveDown();
      if (e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') rotate();
      if (e.key === ' ') {
        e.preventDefault();
        hardDrop();
      }
      if (e.key === 'p' || e.key === 'P') setIsPaused(p => !p);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveHorizontal, moveDown, rotate, hardDrop]);
  const playSound = useCallback((src: string) => {
  const audio = new Audio(src);
  audio.volume = 0.6; // 音量調整（0〜1）
  audio.currentTime = 0;
  audio.play().catch(() => {}); // 再生エラーを無視
}, []);

  const resetGame = () => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPair([]);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setIsDropping(false);
    setClearingPositions([]);
    setChainCount(0);
    setClearedCount(0);
    setShowChainText(false);
  };

  const renderBoard = (): Board => {
    const displayBoard = board.map(row => [...row]);

    for (const puyo of currentPair) {
      if (puyo.y >= 0 && puyo.y < BOARD_HEIGHT && puyo.x >= 0 && puyo.x < BOARD_WIDTH) {
        displayBoard[puyo.y][puyo.x] = puyo.color;
      }
    }

    return displayBoard;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 p-4 w-screen h-screen">
      <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">ぷよぷよ</h1>

      <div className="mb-4 text-center relative">
        <div className="text-3xl font-bold text-white mb-2 drop-shadow">スコア: {score}</div>
        {isPaused && <div className="text-xl text-yellow-300 font-bold">一時停止中</div>}
        {gameOver && <div className="text-2xl text-red-300 font-bold animate-pulse">ゲームオーバー</div>}
      </div>

      {showChainText && (
        <div 
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          style={{
            animation: 'fadeInOut 0.6s ease-out'
          }}
        >
          <div className="text-center">
            <div 
              className="text-8xl font-black text-yellow-300 mb-2"
              style={{
                textShadow: '4px 4px 0 #ff00ff, -4px -4px 0 #00ffff, 0 0 20px rgba(255,255,255,0.8)',
                animation: 'scaleUp 0.6s ease-out'
              }}
            >
              {clearedCount}個消した！
            </div>
            {chainCount > 1 && (
              <div 
                className="text-6xl font-bold text-white"
                style={{
                  textShadow: '3px 3px 0 #ff6b6b, -2px -2px 0 #4ecdc4',
                  animation: 'scaleUp 0.6s ease-out 0.1s both'
                }}
              >
                {chainCount}連鎖！
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div className="relative">
        <div
          className="border-8 border-white rounded-lg shadow-2xl mb-4"
          style={{
            width: BOARD_WIDTH * CELL_SIZE,
            height: BOARD_HEIGHT * CELL_SIZE,
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${CELL_SIZE}px)`,
            backgroundColor: '#f0f0f0'
          }}
        >
          {renderBoard().map((row, y) =>
            row.map((cell, x) => {
              const isClearing = clearingPositions.some(p => p.x === x && p.y === y);
              return (
                <div
                  key={`${y}-${x}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: cell ? COLORS[cell - 1] : 'transparent',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: cell ? '50%' : '0',
                    boxSizing: 'border-box',
                    boxShadow: cell
                      ? 'inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.5)'
                      : 'none',
                    transform: isClearing ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)',
                    opacity: isClearing ? 0 : 1,
                    transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    transformOrigin: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {cell > 0 && (
                    <span 
                      style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                        userSelect: 'none',
                        fontFamily: 'monospace',
                      }}
                    >
                      ﾜｵ!
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-white text-center mb-4 bg-blue-800 bg-opacity-50 p-4 rounded-lg">
        <div className="mb-2 font-bold">矢印キー: 移動</div>
        <div className="mb-2 font-bold">↑ / Z: 回転</div>
        <div className="mb-2 font-bold">スペース: 高速落下</div>
        <div className="font-bold">P: 一時停止</div>
        <div className="mt-2 text-sm">4つ以上つなげると消えるよ！</div>
      </div>

      {gameOver && (
        <button
          onClick={resetGame}
          className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold rounded-full text-xl transition-all transform hover:scale-105 shadow-lg"
        >
          もう一回！
        </button>
      )}

      <div className="mt-6 grid grid-cols-3 gap-2 md:hidden">
        <button onClick={() => moveHorizontal(-1)} className="px-4 py-3 bg-blue-800 text-white rounded-lg font-bold">←</button>
        <button onClick={rotate} className="px-4 py-3 bg-blue-800 text-white rounded-lg font-bold">↻</button>
        <button onClick={() => moveHorizontal(1)} className="px-4 py-3 bg-blue-800 text-white rounded-lg font-bold">→</button>
        <button onClick={moveDown} className="px-4 py-3 bg-blue-800 text-white rounded-lg font-bold col-start-2">↓</button>
        <button onClick={hardDrop} className="px-4 py-3 bg-yellow-400 text-blue-900 rounded-lg font-bold col-span-3">高速落下</button>
      </div>
    </div>
  );
}