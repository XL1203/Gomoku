import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from './components/Board';
import { createEmptyBoard, checkWin, checkDraw } from './services/gameLogic';
import { getGeminiMove } from './services/geminiService';
import { Player, GameStatus, Move, Difficulty } from './types';
import { DIFFICULTIES } from './constants';
import { RotateCcw, Undo2, Settings, BrainCircuit, User, Bot, Users, Trophy } from 'lucide-react';

const App: React.FC = () => {
  const [board, setBoard] = useState<Player[][]>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Playing);
  const [winner, setWinner] = useState<Player | null>(null);
  const [history, setHistory] = useState<Move[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // Settings
  const [gameMode, setGameMode] = useState<'PvE' | 'PvP'>('PvE');
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [aiPlayer, setAiPlayer] = useState<Player>(Player.White); // AI plays White by default

  const gameEndRef = useRef<HTMLDivElement>(null);

  // Check API Key on mount
  useEffect(() => {
    if (!process.env.API_KEY) {
      setErrorMessage("缺少 API Key。AI 无法运行。");
      setShowApiKeyModal(true);
    }
  }, []);

  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (gameStatus !== GameStatus.Playing || isAiThinking) return;
    if (board[row][col] !== Player.None) return;

    // Make the move
    makeMove(row, col, currentPlayer);
  }, [board, gameStatus, isAiThinking, currentPlayer]);

  const makeMove = (row: number, col: number, player: Player) => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = player;
    setBoard(newBoard);

    const move = { row, col };
    setHistory(prev => [...prev, move]);

    if (checkWin(newBoard, move, player)) {
      setGameStatus(GameStatus.Won);
      setWinner(player);
      return;
    }

    if (checkDraw(newBoard)) {
      setGameStatus(GameStatus.Draw);
      return;
    }

    // Switch turn
    setCurrentPlayer(prev => prev === Player.Black ? Player.White : Player.Black);
  };

  // AI Turn Effect
  useEffect(() => {
    // Only run AI logic if in PvE mode AND it's AI's turn
    if (gameMode === 'PvE' && gameStatus === GameStatus.Playing && currentPlayer === aiPlayer) {
      const makeAiMove = async () => {
        setIsAiThinking(true);
        setErrorMessage(null);
        try {
          const move = await getGeminiMove(board, aiPlayer, difficulty.model, difficulty.thinkingBudget);
          makeMove(move.row, move.col, aiPlayer);
        } catch (error) {
          console.error("AI Move failed", error);
          setErrorMessage("AI 落子失败，请重试或悔棋。");
        } finally {
          setIsAiThinking(false);
        }
      };

      // Small delay for UX
      const timer = setTimeout(makeAiMove, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, gameStatus, aiPlayer, board, difficulty, gameMode]);

  const resetGame = () => {
    setBoard(createEmptyBoard());
    // For PvE, if AI is Black, AI moves first. 
    // Usually Black moves first. 
    // If Player chose "Play as White", then AI is Black and moves first.
    // If Player chose "Play as Black", Player moves first.
    setCurrentPlayer(Player.Black); 
    
    setGameStatus(GameStatus.Playing);
    setWinner(null);
    setHistory([]);
    setErrorMessage(null);
  };

  const undoMove = () => {
    if (history.length === 0 || gameStatus !== GameStatus.Playing || isAiThinking) return;

    let movesToUndo = 1;
    
    if (gameMode === 'PvE') {
         // In PvE, undo 2 moves to get back to user's turn
         if (history.length >= 2) {
             movesToUndo = 2;
         } else {
             movesToUndo = history.length;
         }
    } else {
        // PvP: Undo 1 move
        movesToUndo = 1;
    }

    const newHistory = history.slice(0, history.length - movesToUndo);
    
    // Reconstruct board
    const newBoard = createEmptyBoard();
    newHistory.forEach((m, i) => {
       const p = i % 2 === 0 ? Player.Black : Player.White;
       newBoard[m.row][m.col] = p;
    });

    setBoard(newBoard);
    setHistory(newHistory);
    setCurrentPlayer(newHistory.length % 2 === 0 ? Player.Black : Player.White);
    setGameStatus(GameStatus.Playing);
    setWinner(null);
  };

  const handleModeChange = (mode: 'PvE' | 'PvP') => {
      if (mode === gameMode) return;
      setGameMode(mode);
      // When switching mode, we should probably reset to apply clean state
      // But we can defer reset until user confirms or just do it immediately
      // Immediate reset is standard for mode switches to avoid invalid states
      setTimeout(resetGame, 0);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans flex flex-col items-center py-4 lg:py-8 px-0 lg:px-4">
      
      {/* Header */}
      <header className="mb-4 lg:mb-8 text-center px-4">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-stone-900 mb-1 lg:mb-2 tracking-tight">Gemini 五子棋</h1>
        <p className="text-stone-500 font-medium text-sm lg:text-base">Google Generative AI 驱动的策略博弈</p>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center w-full max-w-7xl">
        
        {/* Left Panel: Game Board */}
        {/* Changed from max-w-[600px] to w-full to allow full expansion */}
        <div className="flex-1 flex flex-col items-center w-full mx-auto order-2 lg:order-1 px-1 lg:px-0">
           <div className="relative w-full md:w-[600px] lg:w-[680px] aspect-square shadow-2xl rounded-lg overflow-hidden">
             <Board 
               board={board} 
               onCellClick={handleCellClick} 
               lastMove={history.length > 0 ? history[history.length - 1] : null}
               disabled={gameStatus !== GameStatus.Playing || isAiThinking}
               winningLine={null}
               currentPlayer={currentPlayer}
             />
           </div>
           <p className="text-stone-400 text-xs mt-3 lg:hidden">点击交叉点落子</p>
        </div>

        {/* Right Panel: Controls */}
        <div className="w-full lg:w-80 flex flex-col gap-5 order-1 lg:order-2 px-4 lg:px-0">
          
          {/* 1. Mode Tabs */}
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-stone-200 flex select-none">
             <button
                onClick={() => handleModeChange('PvE')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                    gameMode === 'PvE'
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                }`}
             >
               <Bot className="w-4 h-4" /> 人机对战
             </button>
             <button
                onClick={() => handleModeChange('PvP')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                    gameMode === 'PvP'
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                }`}
             >
               <Users className="w-4 h-4" /> 双人对战
             </button>
          </div>

          {/* 2. Status Card */}
          <div className={`p-6 rounded-2xl shadow-sm border-2 text-center relative overflow-hidden transition-all duration-500 group ${
             gameStatus === GameStatus.Playing && currentPlayer === Player.Black 
                ? 'border-stone-800 bg-stone-50 shadow-[0_4px_20px_rgba(0,0,0,0.08)]' 
                : 'border-stone-200 bg-white'
             } ${
             gameStatus === GameStatus.Playing && currentPlayer === Player.White 
                ? 'border-stone-400 bg-white shadow-md' 
                : ''
             }`}>
            
            {/* Background decoration - Progress bar style top border */}
            <div className={`absolute top-0 left-0 h-1.5 transition-all duration-500 ${
                gameStatus === GameStatus.Playing 
                ? (currentPlayer === Player.Black ? 'w-full bg-stone-900' : 'w-full bg-stone-300') 
                : (gameStatus === GameStatus.Won ? 'w-full bg-green-500' : 'w-full bg-orange-500')
            }`} />
            
            {gameStatus === GameStatus.Playing ? (
              <div className="flex flex-col items-center gap-4 mt-2">
                {isAiThinking ? (
                  <>
                     <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                        <div className="w-16 h-16 rounded-full bg-white border border-blue-100 flex items-center justify-center relative z-10 shadow-sm">
                            <BrainCircuit className="w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                     </div>
                     <div>
                       <div className="text-xl font-bold text-stone-800 animate-pulse">AI 思考中</div>
                       <div className="text-sm text-stone-400 font-medium">Gemini 正在计算棋路...</div>
                     </div>
                  </>
                ) : (
                  <>
                     <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 transform ${
                         currentPlayer === Player.Black 
                         ? 'bg-stone-900 scale-110 ring-4 ring-stone-200' 
                         : 'bg-white border-4 border-stone-200 scale-100'
                     }`}>
                        {gameMode === 'PvE' && currentPlayer !== aiPlayer ? (
                           <User className={`w-8 h-8 ${currentPlayer === Player.Black ? 'text-white' : 'text-stone-400'}`} />
                        ) : (
                           // Stone representation
                           <div className={`w-8 h-8 rounded-full shadow-inner ${
                               currentPlayer === Player.Black 
                               ? 'bg-gradient-to-br from-stone-700 to-black' 
                               : 'bg-gradient-to-br from-white to-stone-200 border border-stone-300'
                           }`} />
                        )}
                     </div>
                     <div className="space-y-1">
                       <div className="text-2xl font-black text-stone-800">
                           {gameMode === 'PvE' 
                             ? (currentPlayer === aiPlayer ? '等待 AI 落子' : '轮到你了') 
                             : (currentPlayer === Player.Black ? '黑方执子' : '白方执子')}
                       </div>
                       <div className={`text-sm font-bold px-3 py-1 rounded-full inline-block transition-colors duration-300 ${
                           currentPlayer === Player.Black 
                           ? 'bg-stone-900 text-white' 
                           : 'bg-stone-100 text-stone-600 border border-stone-200'
                       }`}>
                           {currentPlayer === Player.Black ? '黑棋 (先手)' : '白棋 (后手)'}
                       </div>
                     </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-2 animate-in zoom-in duration-300">
                 <div className="mx-auto w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6" />
                 </div>
                <div className={`text-2xl font-black mb-2 ${gameStatus === GameStatus.Won ? 'text-stone-800' : 'text-orange-600'}`}>
                    {gameStatus === GameStatus.Won 
                    ? (winner === aiPlayer && gameMode === 'PvE' ? '你输了！' : (winner === Player.Black ? '黑方获胜！' : '白方获胜！')) 
                    : '平局！'}
                </div>
                <div className="text-sm text-stone-500">
                   {gameStatus === GameStatus.Won ? '五子连珠，精彩对局' : '棋逢对手，难分高下'}
                </div>
              </div>
            )}
          </div>

          {/* 3. Settings Area (Conditional) */}
          {gameMode === 'PvE' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-5 animate-in slide-in-from-right-4 duration-500">
                {/* Difficulty Section */}
                <div>
                   <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Settings className="w-3 h-3" /> 难度选择
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.name}
                          onClick={() => {
                            setDifficulty(d);
                            // Only reset if changed? Usually safer to just reset to apply new AI config
                            if(difficulty.name !== d.name) setTimeout(resetGame, 0);
                          }}
                          className={`py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                            difficulty.name === d.name 
                            ? 'bg-stone-100 border-stone-400 text-stone-900 ring-1 ring-stone-200' 
                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                          }`}
                        >
                          {d.name}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Side Selection Section */}
                <div>
                   <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                      选择执子 (重新开始生效)
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                            if(aiPlayer !== Player.White) {
                                setAiPlayer(Player.White);
                                setTimeout(resetGame, 0);
                            }
                        }}
                        className={`py-2 px-3 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 transition-all ${
                            aiPlayer === Player.White
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border ${aiPlayer === Player.White ? 'bg-white border-transparent' : 'bg-black border-transparent'}`}></span>
                        我执黑 (先)
                      </button>
                      <button
                        onClick={() => {
                             if(aiPlayer !== Player.Black) {
                                setAiPlayer(Player.Black);
                                setTimeout(resetGame, 0);
                            }
                        }}
                        className={`py-2 px-3 text-sm font-medium rounded-lg border flex items-center justify-center gap-2 transition-all ${
                            aiPlayer === Player.Black
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border ${aiPlayer === Player.Black ? 'bg-white border-transparent' : 'bg-white border-stone-400'}`}></span>
                        我执白 (后)
                      </button>
                   </div>
                </div>
            </div>
          )}

          {/* 4. Action Buttons (Footer) */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
             <button 
                onClick={resetGame}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-stone-900 text-white rounded-xl shadow-lg hover:bg-black hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm"
             >
               <RotateCcw className="w-4 h-4" /> 重新开始
             </button>
             <button 
                onClick={undoMove}
                disabled={history.length === 0 || gameStatus !== GameStatus.Playing || isAiThinking}
                className="flex items-center justify-center gap-2 px-4 py-3.5 bg-white border border-stone-200 text-stone-700 rounded-xl shadow-sm hover:bg-stone-50 hover:border-stone-300 active:scale-95 transition-all font-bold text-sm disabled:opacity-50 disabled:active:scale-100"
             >
               <Undo2 className="w-4 h-4" /> 悔棋
             </button>
          </div>
          
          {errorMessage && (
            <div className="text-xs text-red-600 text-center px-3 py-2 bg-red-50 rounded-lg border border-red-100 animate-pulse">
              {errorMessage}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default App;