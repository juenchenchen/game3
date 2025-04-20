// 引入必要的 React Hooks
import { useState, useEffect, useCallback } from 'react'
// 引入樣式檔案
import './App.css'

// App 主元件
function App() {
  // 遊戲狀態相關的 state
  const [score, setScore] = useState(0)  // 當前分數
  const [timeLeft, setTimeLeft] = useState(15)  // 剩餘時間
  const [round, setRound] = useState(1)  // 當前輪次
  const [isResting, setIsResting] = useState(false)  // 是否在休息時間
  const [restTime, setRestTime] = useState(5)  // 休息時間倒數
  const [activeMole, setActiveMole] = useState(null)  // 當前出現的地鼠位置
  const [showRoundScore, setShowRoundScore] = useState(false)  // 是否顯示該輪分數
  const [isFadingOut, setIsFadingOut] = useState(false)  // 是否正在淡出
  const [gameOver, setGameOver] = useState(false)  // 遊戲是否結束
  const [wrongHit, setWrongHit] = useState(null)  // 錯誤點擊的位置
  const [roundScores, setRoundScores] = useState([0, 0, 0])  // 記錄每輪得分
  const [gameStarted, setGameStarted] = useState(false)  // 遊戲是否開始
  const [startTime, setStartTime] = useState(null)  // 遊戲開始時間

  // 根據輪次決定地鼠出現的速度（毫秒）
  const getMoleSpeed = () => {
    switch (round) {
      case 1: return 800   // 第一輪：較慢
      case 2: return 700   // 第二輪：中等
      case 3: return 600   // 第三輪：較快
      default: return 800
    }
  }

  // 獲取當前輪次的初始時間
  const getInitialTime = (roundNumber) => {
    switch (roundNumber) {
      case 1: return 15;  // 第一輪 15 秒
      case 2: return 15;  // 第二輪 15 秒
      case 3: return 15;  // 第三輪 10 秒
      default: return 15;
    }
  };

  // 休息時間計時器
  useEffect(() => {
    let restTimer;
    if (isResting) {
      if (restTime === 0) {
        setIsFadingOut(true);
        setTimeout(() => {
          const nextRound = round + 1;
          // 先儲存當前輪次得分
          setRoundScores(prev => {
            const newScores = [...prev];
            newScores[round - 1] = score;
            return newScores;
          });
          
          // 重置所有狀態
          setStartTime(null);  // 先重置開始時間
          setIsResting(false);
          setShowRoundScore(false);
          setIsFadingOut(false);
          setScore(0);
          setRound(nextRound);
          
          // 使用 getInitialTime 設置新的時間
          setTimeLeft(getInitialTime(nextRound));
          
          // 延遲一下再設置新的開始時間，確保時間已經被正確設置
          setTimeout(() => {
            setStartTime(Date.now());
          }, 0);
        }, 1000);
        return;
      }

      restTimer = setTimeout(() => {
        setRestTime(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (restTimer) {
        clearTimeout(restTimer);
      }
    };
  }, [isResting, restTime, round, score]);

  // 遊戲計時器
  useEffect(() => {
    let animationFrameId;
    
    const updateTimer = () => {
      if (gameStarted && !isResting && !gameOver && startTime) {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const initialTime = getInitialTime(round);  // 使用 getInitialTime
        const newTimeLeft = Math.max(initialTime - elapsed, 0);
        
        setTimeLeft(newTimeLeft);
        
        if (newTimeLeft === 0) {
          if (round === 3) {
            setRoundScores(prev => {
              const newScores = [...prev];
              newScores[2] = score;
              return newScores;
            });
            setGameOver(true);
          } else {
            setIsResting(true);
            setShowRoundScore(true);
            setRestTime(5);
          }
          return;
        }
        
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (gameStarted && !isResting && !gameOver) {
      if (!startTime) {
        setTimeLeft(getInitialTime(round));  // 使用 getInitialTime
        setStartTime(Date.now());
      } else {
        animationFrameId = requestAnimationFrame(updateTimer);
      }
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, isResting, gameOver, startTime, round, score]);

  // 地鼠出現邏輯 Effect
  useEffect(() => {
    let moleTimer;
    if (gameStarted && !isResting && timeLeft > 0 && !gameOver) {
      if (activeMole === null && wrongHit === null) {
        // 隨機延遲 0.3-0.8 秒後出現新地鼠
        const randomDelay = Math.random() * 500 + 300;
        moleTimer = setTimeout(() => {
          setActiveMole(Math.floor(Math.random() * 9));
        }, randomDelay);
      } else if (activeMole !== null) {
        // 地鼠顯示時間根據當前關卡速度決定
        moleTimer = setTimeout(() => {
          setActiveMole(null);
        }, getMoleSpeed());
      }
    }
    return () => {
      if (moleTimer) {
        clearTimeout(moleTimer);
      }
    };
  }, [isResting, timeLeft, activeMole, gameOver, wrongHit, gameStarted, round]);

  // 點擊地鼠的處理函數
  const handleMoleClick = (index) => {
    if (gameOver || !gameStarted) return;  // 添加 !gameStarted 條件
    
    if (index === activeMole) {
      setScore(prev => prev + 1);
      setActiveMole(null);  // 清除當前地鼠，觸發新的地鼠生成
      setWrongHit(null);  // 清除之前的錯誤標記
    } else {
      // 打錯一律扣分
      setScore(prev => Math.max(0, prev - 1));
      setWrongHit(index);  // 設置打錯的位置
      
      // 先讓當前地鼠消失
      setActiveMole(null);
      
      // 顯示叉叉一段時間後，清除叉叉並生成新地鼠
      setTimeout(() => {
        setWrongHit(null);
        // 生成新的地鼠位置，確保和當前位置不同
        let newPosition;
        do {
          newPosition = Math.floor(Math.random() * 9);
        } while (newPosition === index);  // 確保新位置不會和打錯的位置相同
        setActiveMole(newPosition);
      }, 500);
    }
  };

  // 重新開始遊戲的處理函數
  const handleRestart = () => {
    setScore(0);
    setTimeLeft(getInitialTime(1));  // 使用 getInitialTime 函數
    setRound(1);
    setIsResting(false);
    setRestTime(5);
    setActiveMole(null);
    setShowRoundScore(false);
    setIsFadingOut(false);
    setGameOver(false);
    setWrongHit(null);
    setRoundScores([0, 0, 0]);
    setGameStarted(false);
    setStartTime(null);
  };

  // 開始遊戲的處理函數
  const handleStartGame = () => {
    setGameStarted(true);
    setTimeLeft(getInitialTime(1));  // 使用 getInitialTime 函數
    setStartTime(Date.now());
  };

  // 計算總分
  const totalScore = roundScores.reduce((sum, score) => sum + score, 0);

  // 渲染遊戲介面
  return (
    <div className="game-container">
      {!gameStarted ? (
        // 開始畫面
        <div className="start-screen">
          <h1>打地鼠遊戲</h1>
          <p>準備好開始遊戲了嗎？</p>
          <button onClick={handleStartGame} className="start-button">
            開始遊戲
          </button>
        </div>
      ) : (
        <>
          {/* 遊戲資訊顯示區 */}
          <div className="game-info">
            <p>第 {round} 輪</p>
            <p>分數: {score}</p>
            <p>時間: {timeLeft}秒</p>
          </div>

          {/* 地鼠網格 */}
          <div className="mole-grid">
            {Array(9).fill(null).map((_, index) => (
              <div 
                key={index}
                className={`mole-hole ${activeMole === index ? 'active' : ''} ${wrongHit === index ? 'wrong' : ''}`}
                onClick={() => handleMoleClick(index)}
              >
                <div className="mole" />
                {wrongHit === index && <div className="wrong-mark" />}
              </div>
            ))}
          </div>

          {/* 休息時間或遊戲結束的遮罩層 */}
          {(isResting || gameOver) && (
            <div className={`rest-overlay ${isFadingOut && !gameOver ? 'fade-out' : ''}`}>
              <div className="rest-content">
                {gameOver ? (
                  // 遊戲結束畫面
                  <div className="game-over">
                    <h2>遊戲結束！</h2>
                    <p>恭喜完成所有關卡！</p>
                    <div className="score-summary">
                      <p>第一輪得分：{roundScores[0]} 分</p>
                      <p>第二輪得分：{roundScores[1]} 分</p>
                      <p>第三輪得分：{roundScores[2]} 分</p>
                      <p className="final-score">總得分：{totalScore} 分</p>
                    </div>
                    <button onClick={handleRestart} className="restart-button">
                      重新開始
                    </button>
                  </div>
                ) : (
                  // 休息時間畫面
                  <>
                    <h3>第 {round} 輪結束！</h3>
                    <p className="round-score">得分：{score} 分</p>
                    <div className="rest-timer">
                      <div className="timer-circle">
                        <span className="timer-number" key={restTime}>
                          {restTime}
                        </span>
                      </div>
                    </div>
                    <p className="next-round-text">
                      {restTime === 0 ? '開始！' : `準備開始第 ${round + 1} 輪`}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// 導出 App 元件
export default App
