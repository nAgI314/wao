// import React, { useRef, useEffect, useState } from "react";

// const ROWS = 20;
// const COLS = 10;
// const BLOCK_SIZE = 30;

// type Cell = string | null;
// type Board = Cell[][];

// const Tetris: React.FC = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [board, setBoard] = useState<Board>(
//     Array.from({ length: ROWS }, () => Array(COLS).fill(null))
//   );

//   // テトリスブロックを1つだけ仮描画（動作確認用）
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     const draw = () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // グリッド描画
//       ctx.strokeStyle = "#333";
//       for (let y = 0; y < ROWS; y++) {
//         for (let x = 0; x < COLS; x++) {
//           ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
//         }
//       }

//       // テトリミノっぽい形を1個表示
//       ctx.fillStyle = "cyan";
//       ctx.fillRect(4 * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
//       ctx.fillRect(5 * BLOCK_SIZE, 0, BLOCK_SIZE, BLOCK_SIZE);
//       ctx.fillRect(4 * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
//       ctx.fillRect(5 * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
//     };

//     draw();
//   }, []);

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
//       <h1 className="text-3xl font-bold mb-4">Tetris</h1>
//       <canvas
//         ref={canvasRef}
//         width={COLS * BLOCK_SIZE}
//         height={ROWS * BLOCK_SIZE}
//         className="border border-gray-600 bg-black"
//       />
//     </div>
//   );
// };

// export default Tetris;
