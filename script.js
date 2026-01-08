// ====== GAME ELEMENTS ======
const dino = document.getElementById("dino");
const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const levelDisplay = document.getElementById("level");
const speedDisplay = document.getElementById("speed");
const livesDisplay = document.getElementById("lives");
const autoStatusDisplay = document.getElementById("auto-status");
const autoBtn = document.getElementById("auto-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const gameOverModal = document.getElementById("game-over");
const pauseModal = document.getElementById("pause-modal");
const lifeLostModal = document.getElementById("life-lost-modal");
const finalScoreDisplay = document.getElementById("final-score");
const finalLevelDisplay = document.getElementById("final-level");
const finalHighScoreDisplay = document.getElementById("final-high-score");
const pausedScoreDisplay = document.getElementById("paused-score");
const pausedLevelDisplay = document.getElementById("paused-level");
const pausedLivesDisplay = document.getElementById("paused-lives");
const remainingLivesDisplay = document.getElementById("remaining-lives");
const lifeLostScoreDisplay = document.getElementById("life-lost-score");
const gameOverTip = document.getElementById("game-over-tip");
const playAgainBtn = document.getElementById("play-again-btn");
const resumeBtn = document.getElementById("resume-btn");
const continueBtn = document.getElementById("continue-btn");
const gameStateIndicator = document.getElementById("game-state");
const groundLine = document.getElementById("ground-line");

// ====== GAME VARIABLES ======
let score = 0;
let highScore = localStorage.getItem("dinoHighScore") || 0;
let level = 1;
let gameSpeed = 3; // MAS MABAGAL SA START
let lives = 3;
let isJumping = false;
let isDoubleJumping = false;
let isPaused = false;
let isGameOver = false;
let autoJumpEnabled = false;
let gameStarted = false;
let isInvincible = false;
let obstacles = [];
let obstacleInterval;
let scoreInterval;
let gameLoopInterval;
let lastObstacleTime = 0;
let obstacleSpawnDelay = 2000; // MAS MALAYONG SPACING

// ====== FLOOR POSITION ======
const FLOOR_HEIGHT = 70; // All obstacles and dino are on floor
const DINO_LEFT = 80;
const DINO_WIDTH = 60;
const DINO_ON_FLOOR = 70;
const DINO_JUMP_HEIGHT = 190;
const DINO_DOUBLE_JUMP_HEIGHT = 260;

// ====== INITIALIZE GAME ======
function initGame() {
  score = 0;
  level = 1;
  gameSpeed = 3; // MAS MABAGAL
  lives = 3;
  obstacleSpawnDelay = 2000; // MAS MALAYO ANG SPACING
  isGameOver = false;
  isPaused = false;
  gameStarted = false;
  isInvincible = false;
  obstacles = [];
  lastObstacleTime = 0;
  
  // Clear all obstacles
  document.querySelectorAll('.obstacle').forEach(el => el.remove());
  
  // Update displays
  updateDisplays();
  
  // Hide all modals
  gameOverModal.style.display = 'none';
  pauseModal.style.display = 'none';
  lifeLostModal.style.display = 'none';
  
  // Reset dino position and state
  dino.style.bottom = FLOOR_HEIGHT + 'px';
  dino.style.opacity = '1';
  dino.classList.remove('jumping', 'double-jumping', 'game-over-shake');
  
  // Show start message
  showGameMessage("Press SPACE or CLICK to Start!");
  
  console.log("✅ Game initialized - MAS MADALING OBSTACLES!");
}

// ====== START GAME ======
function startGame() {
  if (gameStarted) return;
  
  gameStarted = true;
  showGameMessage("Go!");
  
  // Start game intervals
  startGameIntervals();
}

// ====== START GAME INTERVALS ======
function startGameIntervals() {
  // Clear existing intervals
  clearIntervals();
  
  // Score interval - increases every 200ms
  scoreInterval = setInterval(() => {
    if (!isPaused && !isGameOver && gameStarted) {
      score += 1;
      updateDisplays();
      updateLevelAndSpeed();
    }
  }, 200);
  
  // Obstacle generation interval - MAS MALAYO ANG SPACING
  obstacleInterval = setInterval(() => {
    if (!isPaused && !isGameOver && gameStarted) {
      const currentTime = Date.now();
      if (currentTime - lastObstacleTime > obstacleSpawnDelay) {
        createObstacle();
        lastObstacleTime = currentTime;
      }
    }
  }, 100);
  
  // Game loop for collision detection
  gameLoopInterval = setInterval(gameLoop, 20);
}

// ====== CLEAR INTERVALS ======
function clearIntervals() {
  if (scoreInterval) clearInterval(scoreInterval);
  if (obstacleInterval) clearInterval(obstacleInterval);
  if (gameLoopInterval) clearInterval(gameLoopInterval);
}

// ====== UPDATE DISPLAYS ======
function updateDisplays() {
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
  levelDisplay.textContent = level;
  livesDisplay.textContent = lives;
  autoStatusDisplay.textContent = autoJumpEnabled ? 'ON' : 'OFF';
  
  // Update speed display
  speedDisplay.textContent = getSpeedName();
  speedDisplay.style.color = getSpeedColor();
  
  // Update auto button color
  autoBtn.style.background = autoJumpEnabled 
    ? 'linear-gradient(to right, #4CAF50, #2E7D32)' 
    : 'linear-gradient(to right, #e76f51, #f4a261)';
}

// ====== GET SPEED NAME ======
function getSpeedName() {
  if (gameSpeed < 5) return "Very Slow";
  if (gameSpeed < 7) return "Slow";
  if (gameSpeed < 10) return "Normal";
  if (gameSpeed < 13) return "Fast";
  if (gameSpeed < 16) return "Very Fast";
  if (gameSpeed < 20) return "Extreme";
  return "Lightning";
}

// ====== GET SPEED COLOR ======
function getSpeedColor() {
  if (gameSpeed < 5) return '#4CAF50';
  if (gameSpeed < 7) return '#FFC107';
  if (gameSpeed < 10) return '#FF9800';
  if (gameSpeed < 13) return '#FF5722';
  return '#F44336';
}

// ====== UPDATE LEVEL & SPEED ======
function updateLevelAndSpeed() {
  const newLevel = Math.floor(score / 100) + 1;
  
  if (newLevel > level) {
    level = newLevel;
    gameSpeed += 0.3; // MAS MABAGAL ANG PAG-INCREASE
    obstacleSpawnDelay = Math.max(1200, 2000 - (level * 40)); // MAS MALAYO PA RIN
    
    showLevelUpMessage();
    updateDisplays();
  }
}

// ====== SHOW LEVEL UP MESSAGE ======
function showLevelUpMessage() {
  showGameMessage(`Level ${level}! Speed: ${getSpeedName()}`);
  
  // Create score popup
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = `Level Up!`;
  popup.style.left = '50%';
  popup.style.top = '50%';
  gameArea.appendChild(popup);
  
  setTimeout(() => popup.remove(), 1000);
}

// ====== SHOW GAME MESSAGE ======
function showGameMessage(message) {
  gameStateIndicator.textContent = message;
  gameStateIndicator.classList.add('show');
  
  setTimeout(() => {
    gameStateIndicator.classList.remove('show');
  }, 1500);
}

// ====== CREATE OBSTACLE WITH BETTER SPACING ======
function createObstacle() {
  // Simple obstacles muna sa start
  const obstacleTypes = level < 3 ? ['tree', 'rock'] : ['tree', 'rock', 'river', 'other-dino'];
  const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  
  const obstacle = document.createElement('div');
  obstacle.className = `obstacle ${type}`;
  
  // Set obstacle properties - MAS MALIIT PARA MAS MADALING TALUNDAN
  let width, height;
  
  switch(type) {
    case 'tree':
      width = 35; // MAS MALIIT
      height = 70; // MAS MAIKLI
      break;
    case 'rock':
      width = 50; // MAS MALIIT
      height = 30; // MAS MAIKLI
      break;
    case 'river':
      width = 120; // MAS MALIIT
      height = 25; // MAS MAIKLI
      break;
    case 'other-dino':
      width = 60; // MAS MALIIT
      height = 50; // MAS MAIKLI
      break;
    default:
      width = 35;
      height = 60;
  }
  
  // SET ALL POSITION PROPERTIES
  obstacle.style.position = 'absolute';
  obstacle.style.width = `${width}px`;
  obstacle.style.height = `${height}px`;
  obstacle.style.right = `${-width}px`;
  obstacle.style.bottom = `${FLOOR_HEIGHT}px`; // ON FLOOR
  obstacle.style.zIndex = '10';
  
  // Add specific content for other-dino
  if (type === 'other-dino') {
    obstacle.innerHTML = `
      <div class="body"></div>
      <div class="head"></div>
      <div class="eye"></div>
    `;
  }
  
  // Add visual indicator
  obstacle.style.border = '1px solid rgba(255,255,255,0.5)';
  
  // Add to game area
  gameArea.appendChild(obstacle);
  
  // Add to obstacles array with MAS MABAGAL NA SPEED
  obstacles.push({
    element: obstacle,
    type: type,
    width: width,
    height: height,
    right: -width,
    speed: gameSpeed * 0.8 // MAS MABAGAL
  });
  
  console.log(`🎯 Created ${type} obstacle - MAS MADALING TALUNDAN!`);
}

// ====== JUMP FUNCTION WITH BETTER TIMING ======
function jump(isDoubleJump = false) {
  // Start game on first jump if not started
  if (!gameStarted) {
    startGame();
    return;
  }
  
  if (isJumping && !isDoubleJump) return;
  
  if (!isJumping) {
    // First jump
    isJumping = true;
    dino.classList.add('jumping');
    
    // Reset after jump
    setTimeout(() => {
      dino.classList.remove('jumping');
      isJumping = false;
      isDoubleJumping = false;
    }, 500);
    
    // Add jump dust effect
    addJumpEffect();
  } else if (isJumping && !isDoubleJumping && isDoubleJump) {
    // Double jump
    isDoubleJumping = true;
    dino.classList.remove('jumping');
    dino.classList.add('double-jumping');
    
    // Reset after double jump
    setTimeout(() => {
      dino.classList.remove('double-jumping');
      setTimeout(() => {
        isJumping = false;
        isDoubleJumping = false;
      }, 300);
    }, 600);
  }
}

// ====== ADD JUMP EFFECT ======
function addJumpEffect() {
  const effect = document.createElement('div');
  effect.className = 'jump-dust';
  effect.style.left = '75px';
  effect.style.bottom = '65px';
  
  gameArea.appendChild(effect);
  setTimeout(() => effect.remove(), 500);
}

// ====== GAME LOOP ======
function gameLoop() {
  if (isPaused || isGameOver || !gameStarted) return;
  
  // Move obstacles MAS MABAGAL
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.right += obstacle.speed;
    obstacle.element.style.right = `${obstacle.right}px`;
    
    // Remove obstacle if it's off screen
    if (obstacle.right > 850) {
      obstacle.element.remove();
      obstacles.splice(i, 1);
      continue;
    }
    
    // Auto-jump logic
    if (autoJumpEnabled) {
      autoJumpLogic(obstacle);
    }
    
    // SIMPLE COLLISION DETECTION
    if (!isInvincible && checkCollision(obstacle)) {
      handleCollision();
      return;
    }
  }
}

// ====== SIMPLE COLLISION DETECTION ======
function checkCollision(obstacle) {
  // Get dino's current state
  const isDinoJumping = dino.classList.contains('jumping') || dino.classList.contains('double-jumping');
  
  // Dino's horizontal position
  const dinoLeft = DINO_LEFT;
  const dinoRight = dinoLeft + DINO_WIDTH;
  
  // Obstacle's horizontal position
  const obstacleLeft = 800 - obstacle.right - obstacle.width;
  const obstacleRight = 800 - obstacle.right;
  
  // Check for horizontal overlap - MAS MALAPIT NA DETECTION
  const horizontalOverlap = (
    dinoRight > obstacleLeft + 5 && // MAS MALAPIT
    dinoLeft < obstacleRight - 5    // MAS MALAPIT
  );
  
  if (!horizontalOverlap) {
    return false; // No horizontal overlap, no collision
  }
  
  // SIMPLE LOGIC: If dino is NOT jumping, collision occurs
  if (obstacle.type === 'river') {
    // River needs double jump
    if (!dino.classList.contains('double-jumping')) {
      console.log("💧 River collision - need double jump!");
      return true;
    }
    return false;
  } else {
    // Other obstacles - MAS MADALING JUMP
    if (!isDinoJumping) {
      console.log(`💥 Collision with ${obstacle.type}!`);
      return true;
    }
  }
  
  return false; // Dino is jumping, no collision
}

// ====== AUTO JUMP LOGIC ======
function autoJumpLogic(obstacle) {
  const dinoLeft = DINO_LEFT;
  const dinoWidth = DINO_WIDTH;
  const obstacleRight = obstacle.right;
  const obstacleWidth = obstacle.width;
  const obstacleType = obstacle.type;
  
  // Calculate distance to obstacle - MAS MALAPIT BAGO TUMAYON
  const distanceToObstacle = 800 - obstacleRight - obstacleWidth - dinoLeft;
  
  // Jump based on obstacle type and distance
  if (distanceToObstacle > 0 && distanceToObstacle < 180) { // MAS MALAPIT
    if (obstacleType === 'river' && distanceToObstacle < 130 && !isDoubleJumping) {
      // Double jump for rivers
      setTimeout(() => {
        if (!isDoubleJumping && isJumping) {
          jump(true);
        } else if (!isJumping) {
          jump();
          setTimeout(() => jump(true), 120);
        }
      }, 80);
    } else if (obstacleType !== 'river' && distanceToObstacle < 150 && !isJumping) {
      // Single jump for other obstacles - MAS AGANG JUMP
      setTimeout(() => {
        if (!isJumping) {
          jump();
        }
      }, 80);
    }
  }
}

// ====== HANDLE COLLISION ======
function handleCollision() {
  if (isInvincible) return;
  
  console.log("💥 COLLISION DETECTED! Lives left:", lives - 1);
  
  lives--;
  updateDisplays();
  
  // Shake animation
  gameArea.classList.add('game-over-shake');
  setTimeout(() => gameArea.classList.remove('game-over-shake'), 500);
  
  if (lives <= 0) {
    gameOver();
  } else {
    showLifeLostModal();
  }
}

// ====== SHOW LIFE LOST MODAL ======
function showLifeLostModal() {
  isPaused = true;
  clearIntervals();
  
  remainingLivesDisplay.textContent = lives;
  lifeLostScoreDisplay.textContent = score;
  
  lifeLostModal.style.display = 'flex';
}

// ====== CONTINUE AFTER LIFE LOST ======
function continueGame() {
  lifeLostModal.style.display = 'none';
  isPaused = false;
  
  // Clear current obstacles
  obstacles.forEach(obstacle => obstacle.element.remove());
  obstacles = [];
  
  // Set invincibility for 3 seconds
  isInvincible = true;
  dino.style.opacity = '0.6';
  showGameMessage("Continue! Invincible for 3 seconds!");
  
  // Restart game intervals
  startGameIntervals();
  
  // Remove invincibility after 3 seconds
  setTimeout(() => {
    isInvincible = false;
    dino.style.opacity = '1';
  }, 3000);
}

// ====== GAME OVER ======
function gameOver() {
  isGameOver = true;
  clearIntervals();
  
  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("dinoHighScore", highScore);
  }
  
  // Update final score display
  finalScoreDisplay.textContent = score;
  finalLevelDisplay.textContent = level;
  finalHighScoreDisplay.textContent = highScore;
  
  // Show random tip
  const gameTips = [
    "Jump when obstacle is near!",
    "Rivers need double jumps!",
    "Start slow - game gets faster later!",
    "Watch the spacing between obstacles!",
    "Practice makes perfect!"
  ];
  gameOverTip.textContent = gameTips[Math.floor(Math.random() * gameTips.length)];
  
  // Show game over modal
  setTimeout(() => {
    gameOverModal.style.display = 'flex';
  }, 500);
}

// ====== PAUSE GAME ======
function pauseGame() {
  if (!gameStarted || isGameOver) return;
  
  isPaused = true;
  clearIntervals();
  pauseModal.style.display = 'flex';
  pausedScoreDisplay.textContent = score;
  pausedLevelDisplay.textContent = level;
  pausedLivesDisplay.textContent = lives;
  pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
  showGameMessage("Game Paused");
}

// ====== RESUME GAME ======
function resumeGame() {
  isPaused = false;
  pauseModal.style.display = 'none';
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  showGameMessage("Resuming...");
  setTimeout(() => {
    startGameIntervals();
  }, 500);
}

// ====== TOGGLE AUTO JUMP ======
function toggleAutoJump() {
  autoJumpEnabled = !autoJumpEnabled;
  
  // Show/hide auto-jump indicator
  let indicator = document.getElementById('auto-jump-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'auto-jump-indicator';
    indicator.className = 'auto-jump-indicator';
    indicator.textContent = '🤖 AI Mode';
    gameArea.appendChild(indicator);
  }
  
  indicator.style.display = autoJumpEnabled ? 'block' : 'none';
  
  if (autoJumpEnabled) {
    showGameMessage("AI Auto-Jump Enabled - Watch and Learn!");
  }
  
  updateDisplays();
}

// ====== TOGGLE FLOOR LINE ======
function toggleFloorLine() {
  gameArea.classList.toggle('show-floor-line');
  showGameMessage(gameArea.classList.contains('show-floor-line') ? "Floor line: ON" : "Floor line: OFF");
}

// ====== EVENT LISTENERS ======

// Keyboard controls
document.addEventListener("keydown", function (e) {
  // Prevent spacebar from scrolling page
  if (e.code === "Space") {
    e.preventDefault();
  }
  
  switch (e.code) {
    case "Space":
      if (isGameOver) return;
      
      // Check for double space press for double jump
      if (isJumping && !isDoubleJumping && e.repeat) {
        jump(true); // Double jump
      } else {
        jump(); // Single jump or start game
      }
      break;
      
    case "KeyP":
      if (isGameOver || !gameStarted) return;
      if (isPaused) {
        resumeGame();
      } else {
        pauseGame();
      }
      break;
      
    case "KeyR":
      initGame();
      break;
      
    case "KeyA":
      toggleAutoJump();
      break;
      
    case "KeyH":
      toggleFloorLine();
      break;
  }
});

// Click controls
let lastClickTime = 0;
gameArea.addEventListener("click", function(e) {
  // Don't jump when clicking buttons or modals
  if (e.target.closest('.control-btn') || e.target.closest('.modal')) {
    return;
  }
  
  if (isGameOver || isPaused) return;
  
  const currentTime = Date.now();
  
  // Check for double click (within 300ms)
  if (currentTime - lastClickTime < 300 && isJumping && !isDoubleJumping) {
    jump(true); // Double jump
  } else {
    jump(); // Single jump or start game
  }
  
  lastClickTime = currentTime;
});

// Control buttons
autoBtn.addEventListener("click", toggleAutoJump);
pauseBtn.addEventListener("click", function() {
  if (isGameOver || !gameStarted) return;
  if (isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
});
restartBtn.addEventListener("click", initGame);
playAgainBtn.addEventListener("click", initGame);
resumeBtn.addEventListener("click", resumeGame);
continueBtn.addEventListener("click", continueGame);

// ====== INITIALIZE GAME ON LOAD ======
window.addEventListener('load', () => {
  initGame();
  updateDisplays();
  
  console.log("🎮 Dino Dash: Jurassic Adventure Loaded!");
  console.log("✅ MAS MADALING OBSTACLES!");
  console.log("✅ MAS MALAYONG SPACING (2 seconds)");
  console.log("✅ MAS MABAGAL NA SPEED (3)");
  console.log("✅ MAS MALIIT NA OBSTACLES");
  console.log("✅ MAS MADALING TALUNDAN!");
});
