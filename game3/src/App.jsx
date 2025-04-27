// 引入必要的 React Hooks
import { useState, useEffect, useCallback } from 'react'
// 引入樣式檔案
import './App.css'

// 音效檔案
/*const AUDIO = {
  HIT: new Audio('/sounds/hit.mp3'),
  MISS: new Audio('/sounds/miss.mp3'),
  GAME_START: new Audio('/sounds/game-start.mp3'),
  GAME_OVER: new Audio('/sounds/game-over.mp3'),
  LEVEL_UP: new Audio('/sounds/level-up.mp3'),
};*/
//
// 地鼠類型定義
const MOLE_TYPES = {
  NORMAL: 'normal',
  GOLDEN: 'golden',
  BOMB: 'bomb'
};

// 地鼠分數設定
const MOLE_SCORES = {
  NORMAL: 1,    // 普通地鼠 1分
  GOLDEN: 5,    // 金色地鼠 5分
  BOMB: -3     // 炸彈地鼠 -3分
};

// 地鼠出現機率設定
const MOLE_CHANCES = {
  GOLDEN: 0.15,   // 15% 機率出現金色地鼠
  BOMB: 0.1      // 10% 機率出現炸彈地鼠
};

// 難度設置
const DIFFICULTY_SETTINGS = {
  EASY: {
    name: '簡單',
    moleSpeed: 1000,
    timeBonus: 5,
    goldenChance: 0.1,
    bombChance: 0.05
  },
  NORMAL: {
    name: '中等',
    moleSpeed: 800,
    timeBonus: 0,
    goldenChance: 0.15,
    bombChance: 0.1
  },
  HARD: {
    name: '困難',
    moleSpeed: 600,
    timeBonus: -5,
    goldenChance: 0.2,
    bombChance: 0.15
  }
};

// App 主元件
function App() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [gameStarted, setGameStarted] = useState(false)
  const [activeMole, setActiveMole] = useState(null)
  const [activeMoleType, setActiveMoleType] = useState(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [showFinalScore, setShowFinalScore] = useState(false)
  const [round, setRound] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [wrongHit, setWrongHit] = useState(null)
  const [missedMole, setMissedMole] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)  // 新增主題狀態

  // 地鼠類型及其分數
  const moleTypes = {
    normal: { score: 1, probability: 0.7 },
    golden: { score: 5, probability: 0.2 },
    bomb: { score: -3, probability: 0.1 }
  }

  // 根據回合取得地鼠出現速度
  const getMoleSpeed = () => {
    switch (round) {
      case 1: return 2000;  // 第一輪：2秒
      case 2: return 1500;  // 第二輪：1.5秒
      case 3: return 1000;  // 第三輪：1秒
      default: return 2000;
    }
  }

  // 隨機選擇地鼠類型
  const getRandomMoleType = () => {
    const rand = Math.random()
    if (rand < moleTypes.normal.probability) return 'normal'
    if (rand < moleTypes.normal.probability + moleTypes.golden.probability) return 'golden'
    return 'bomb'
  }

  // 隨機選擇洞穴
  const getRandomHole = () => {
    const holes = Array.from({ length: 9 }, (_, i) => i)
    return holes[Math.floor(Math.random() * holes.length)]
  }

  // 顯示地鼠
  const showMole = useCallback(() => {
    if (!gameStarted || isGameOver || isResting) return
    const newHole = getRandomHole()
    const newType = getRandomMoleType()
    setActiveMole(newHole)
    setActiveMoleType(newType)

    // 根據地鼠類型設置不同的消失時間
    const timeout = newType === 'golden' ? getMoleSpeed() * 0.7 : getMoleSpeed()
    setTimeout(() => {
      if (activeMole === newHole) {
        // 只有普通地鼠和金色地鼠沒打中時才扣分和顯示叉叉
        if (activeMoleType !== 'bomb') {
          setScore(prev => prev - 1)
          setMissedMole(newHole)
          // 1秒後清除叉叉
          setTimeout(() => {
            setMissedMole(null)
          }, 1000)
        }
        setActiveMole(null)
        setActiveMoleType(null)
      }
    }, timeout)
  }, [gameStarted, isGameOver, isResting, activeMole, activeMoleType])

  // 開始遊戲
  const startGame = () => {
    setScore(0)
    setTimeLeft(15)
    setGameStarted(true)
    setIsGameOver(false)
    setActiveMole(null)
    setActiveMoleType(null)
    setRound(1)
    setIsResting(false)
    setFinalScore(0)
    setShowFinalScore(false)
  }

  // 遊戲計時器
  useEffect(() => {
    if (!gameStarted || isGameOver || isResting) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          if (round < 2) {  // 修改為2回合
            setIsResting(true);
            setTimeout(() => {
              setRound(prevRound => prevRound + 1);
              setTimeLeft(15);
              setIsResting(false);
            }, 3000);
          } else {
            setIsGameOver(true);
            setGameStarted(false);
            setFinalScore(score);
            setShowFinalScore(true);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, isGameOver, round, isResting]);

  // 點擊地鼠
  const handleMoleClick = (index) => {
    if (!gameStarted || isGameOver || isResting) {
      return;
    }

    if (index === activeMole) {
      const moleScore = moleTypes[activeMoleType].score;
      setScore(prevScore => {
        const newScore = prevScore + moleScore;
        return Math.max(0, newScore); // 確保分數不會小於0
      });
      setActiveMole(null);
      setActiveMoleType(null);
    } else {
      setWrongHit(index);
      setTimeout(() => setWrongHit(null), 1000);
      // 點錯時扣1分
      setScore(prevScore => Math.max(0, prevScore - 1));
    }
  };

  // 地鼠出現邏輯
  useEffect(() => {
    if (!gameStarted || isGameOver || isResting) {
      return;
    }

    const moleTimer = setInterval(() => {
      const newHole = getRandomHole();
      const newType = getRandomMoleType();
      
      // 如果有之前的地鼠沒打到（不是炸彈），扣分
      if (activeMole !== null && activeMoleType !== 'bomb') {
        setScore(prevScore => Math.max(0, prevScore - 1));
        setMissedMole(activeMole);
        setTimeout(() => setMissedMole(null), 1000);
      }
      
      setActiveMole(newHole);
      setActiveMoleType(newType);
    }, getMoleSpeed());

    return () => clearInterval(moleTimer);
  }, [gameStarted, isGameOver, isResting, round]);

  // 切換主題
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      document.body.className = newTheme ? 'bg-gray-800' : 'bg-gray-50';
      return newTheme;
    });
  };

  // 初始化主題
  useEffect(() => {
    document.body.className = isDarkMode ? 'bg-gray-800' : 'bg-gray-50';
  }, []);

  // 返回開始畫面
  const returnToStart = () => {
    setGameStarted(false);
    setIsGameOver(false);
    setShowFinalScore(false);
    setScore(0);
    setTimeLeft(15);
    setRound(1);
    setActiveMole(null);
    setActiveMoleType(null);
  };

  return (
    <div className={`game-container ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
      <button 
        className={`theme-toggle ${isDarkMode ? 'dark' : 'light'}`}
        onClick={toggleTheme}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      {!gameStarted && !isGameOver ? (
        <div className={`start-screen ${isDarkMode ? 'dark' : 'light'}`}>
          <h1>打地鼠遊戲</h1>
          <div className="game-rules">
            <h2>遊戲規則</h2>
            <div className="mole-types">
              <div className="mole-type">
                <div className="mole-preview normal"></div>
                <p>普通地鼠</p>
                <p className="score">+1 分</p>
              </div>
              <div className="mole-type">
                <div className="mole-preview golden"></div>
                <p>金色地鼠</p>
                <p className="score">+5 分</p>
              </div>
              <div className="mole-type">
                <div className="mole-preview bomb"></div>
                <p>炸彈地鼠</p>
                <p className="score">-3 分</p>
              </div>
            </div>
            <div className="rule-details">
              <p>遊戲時間：每輪 15 秒，共三輪</p>
              <p>目標：打中越多地鼠獲得越高分數</p>
              <p>注意：</p>
              <p>- 避開炸彈地鼠，否則會扣 3 分</p>
              <p>- 沒打中地鼠會扣 1 分</p>
              <p>- 每輪地鼠出現速度會越來越快</p>
            </div>
          </div>
          <button className="start-button" onClick={startGame}>開始遊戲</button>
        </div>
      ) : (
        <>
          <div className="game-info">
            <div className="info-item">第 {round} 輪</div>
            <div className="info-item">分數: {score}</div>
            <div className="info-item">時間: {timeLeft}秒</div>
          </div>
          <div className="mole-grid">
            {Array.from({ length: 9 }, (_, i) => (
              <div
                key={i}
                className={`mole-hole ${activeMole === i ? 'active' : ''} ${
                  activeMole === i ? activeMoleType : ''
                } ${wrongHit === i ? 'wrong' : ''} ${missedMole === i ? 'missed' : ''}`}
                onClick={() => handleMoleClick(i)}
              >
                {activeMole === i && <div className="mole"></div>}
                {(wrongHit === i || missedMole === i) && (
                  <div className={`wrong-mark ${wrongHit === i ? 'wrong' : 'missed'}`}>✕</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {isResting && (
        <div className="rest-overlay">
          <div className="rest-content">
            <h2>第 {round} 輪結束！</h2>
            <p>目前分數：{score}</p>
            <p>準備開始第 {round + 1} 輪...</p>
            <p className="speed-note">注意：地鼠會更快了！</p>
          </div>
        </div>
      )}
      {showFinalScore && (
        <div className="game-over">
          <h2>遊戲結束！</h2>
          <div className="final-score-container">
            <p className="score-label">最終得分</p>
            <p className="final-score">{finalScore}</p>
          </div>
          <button className="restart-button" onClick={startGame}>
            再玩一次
          </button>
          <button className="menu-button" onClick={returnToStart}>
            返回開始畫面
          </button>
        </div>
      )}
    </div>
  )
}

// 導出 App 元件
export default App
