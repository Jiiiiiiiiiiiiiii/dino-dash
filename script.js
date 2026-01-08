// Game elements
const dino = document.getElementById("dino");
const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const levelDisplay = document.getElementById("level");
const speedDisplay = document.getElementById("speed");
const autoStatusDisplay = document.getElementById("auto-status");
const autoBtn = document.getElementById("auto-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const gameOverModal = document.getElementById("game-over");
const pauseModal = document.getElementById("pause-modal");
const finalScoreDisplay = document.getElementById("final-score");
const finalLevelDisplay = document.getElementById("final-level");
const pausedScoreDisplay = document.getElementById("paused-score");
const pausedLevelDisplay = document.getElementById("paused-level");
const playAgainBtn = document.getElementById("play-again-btn");
const resumeBtn = document.getElementById("resume-btn");

// Game variables
let score = 0;
let highScore = localStorage.getItem("dinoHighScore") || 0;
let level = 1;
let gameSpeed = 1;
let isJumping = false;
let isDoubleJumping = false;
let isPaused = false;
let isGameOver = false;
let autoJumpEnabled = false;
let gameInterval;
let obstacleInterval;
let scoreInterval;
let obstacles = [];
let jumpHeight = 120; // Normal jump height
let riverJumpHeight = 70; // Lower jump for rivers (requires double jump)

// Obstacle types
const obstacleTypes = [
  { type: 'cactus', width: 25, height: 60, color: '#8B4513', speed: 1 },
  { type: 'rock', width: 50, height: 40, color: '#808080', speed: 1 },
  { type: 'river', width: 120, height: 30, color: '#1e90ff', speed: 1 },
  { type: 'other-dino', width: 50, height: 60, color: '#FF5722', speed: 1 }
];

// Initialize game
function initGame() {
  score = 0;
  level = 1;
  gameSpeed = 1;
  isGameOver = false;
  isPaused = false;
  obstacles = [];
  
  // Clear all obstacles
  const existingObstacles = document.querySelectorAll('.obstacle');
  existingObstacles.forEach(obstacle => obstacle.remove());
  
  // Update displays
  updateDisplays();
  
  // Hide modals
  gameOverModal.style.display = 'none';
  pauseModal.style.display = 'none';
  
  // Reset dino position
  dino.style.bottom = '0px';
  
  // Start game intervals
  startGameIntervals();
  
  console.log("Game started!");
}

// Start game intervals
function startGameIntervals() {
  // Clear existing intervals
  clearIntervals();
  
  // Score interval
  scoreInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      score += level; // Higher levels give more points
      updateDisplays();
      updateLevel();
    }
  }, 200);
  
  // Obstacle generation interval
  obstacleInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      generateObstacle();
    }
  }, 1500 / gameSpeed);
  
  // Game loop for collision detection and auto-jump
  gameInterval = setInterval(gameLoop, 16); // ~60fps
}

// Clear all intervals
function clearIntervals() {
  clearInterval(scoreInterval);
  clearInterval(obstacleInterval);
  clearInterval(gameInterval);
}

// Update displays
function updateDisplays() {
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
  levelDisplay.textContent = level;
  speedDisplay.textContent = gameSpeed.toFixed(1) + 'x';
  autoStatusDisplay.textContent = autoJumpEnabled ? 'ON' : 'OFF';
  autoBtn.style.background = autoJumpEnabled 
    ? 'linear-gradient(to right, #4CAF50, #2E7D32)' 
    : 'linear-gradient(to right, #ff7e5f, #feb47b)';
}

// Update level based on score
function updateLevel() {
  const newLevel = Math.floor(score / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    gameSpeed = 1 + (level * 0.2);
    showLevelUpMessage();
  }
}

// Show level up message
function showLevelUpMessage() {
  const message = document.createElement('div');
  message.textContent = `Level ${level}! Speed: ${gameSpeed.toFixed(1)}x`;
  message.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(26, 41, 128, 0.9);
    color: white;
    padding: 15px 30px;
    border-radius: 10px;
    font-size: 1.5rem;
    font-weight: bold;
    z-index: 1000;
    animation: fadeOut 2s forwards;
  `;
  
  document.styleSheets[0].insertRule(`
    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `, 0);
  
  gameArea.appendChild(message);
  setTimeout(() => message.remove(), 2000);
}

// Generate random obstacle
function generateObstacle() {
  const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const obstacle = document.createElement('div');
  obstacle.className = `obstacle ${obstacleType.type}`;
  
  // Set obstacle properties
  obstacle.style.width = `${obstacleType.width}px`;
  obstacle.style.height = `${obstacleType.height}px`;
  obstacle.style.backgroundColor = obstacleType.color;
  obstacle.style.right = `${-obstacleType.width}px`;
  obstacle.style.bottom = '0px';
  
  // Add to game area and obstacles array
  gameArea.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    type: obstacleType.type,
    width: obstacleType.width,
    height: obstacleType.height,
    right: -obstacleType.width,
    speed: obstacleType.speed * gameSpeed
  });
}

// Jump function
function jump(isDoubleJump = false) {
  if (isJumping && !isDoubleJump) return;
  
  if (!isJumping) {
    // First jump
    isJumping = true;
    dino.style.bottom = `${jumpHeight}px`;
    
    // Reset after jump
    setTimeout(() => {
      dino.style.bottom = '0px';
      isJumping = false;
      isDoubleJumping = false;
    }, 500);
  } else if (isJumping && !isDoubleJumping && isDoubleJump) {
    // Double jump (for rivers)
    isDoubleJumping = true;
    dino.style.bottom = `${jumpHeight + riverJumpHeight}px`;
    
    // Reset after double jump
    setTimeout(() => {
      dino.style.bottom = `${jumpHeight}px`;
      setTimeout(() => {
        dino.style.bottom = '0px';
        isJumping = false;
        isDoubleJumping = false;
      }, 300);
    }, 300);
  }
}

// Game loop for collision detection and auto-jump
function gameLoop() {
  if (isPaused || isGameOver) return;
  
  // Move obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.right += obstacle.speed;
    obstacle.element.style.right = `${obstacle.right}px`;
    
    // Remove obstacle if it's off screen
    if (obstacle.right > 800) {
      obstacle.element.remove();
      obstacles.splice(i, 1);
    }
    
    // Auto-jump logic
    if (autoJumpEnabled) {
      autoJumpLogic(obstacle);
    }
    
    // Collision detection
    if (checkCollision(obstacle)) {
      gameOver();
      return;
    }
  }
}

// Auto-jump logic
function autoJumpLogic(obstacle) {
  const dinoLeft = 80;
  const dinoWidth = 60;
  const obstacleRight = obstacle.right;
  const obstacleWidth = obstacle.width;
  const obstacleType = obstacle.type;
  
  // Calculate distance to obstacle
  const distanceToObstacle = 800 - obstacleRight - obstacleWidth - dinoLeft;
  
  // Jump based on obstacle type and distance
  if (distanceToObstacle > 0 && distanceToObstacle < 100) {
    if (obstacleType === 'river' && distanceToObstacle < 50) {
      // Double jump for rivers
      if (!isDoubleJumping) {
        jump(true);
      }
    } else if (obstacleType !== 'river' && distanceToObstacle < 70) {
      // Single jump for other obstacles
      if (!isJumping) {
        jump();
      }
    }
  }
}

// Check collision between dino and obstacle
function checkCollision(obstacle) {
  const dinoRect = {
    left: 80,
    right: 80 + 60,
    bottom: parseInt(dino.style.bottom) || 0,
    top: (parseInt(dino.style.bottom) || 0) + 70
  };
  
  const obstacleRect = {
    left: 800 - obstacle.right - obstacle.width,
    right: 800 - obstacle.right,
    bottom: 0,
    top: obstacle.height
  };
  
  // Check for overlap
  return !(
    dinoRect.left > obstacleRect.right ||
    dinoRect.right < obstacleRect.left ||
    dinoRect.bottom > obstacleRect.top ||
    dinoRect.top < obstacleRect.bottom
  );
}

// Game over function
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
  
  // Show game over modal
  gameOverModal.style.display = 'flex';
  
  // Add shake animation to game area
  gameArea.classList.add('game-over');
  setTimeout(() => gameArea.classList.remove('game-over'), 500);
}

// Pause game
function pauseGame() {
  isPaused = true;
  pauseModal.style.display = 'flex';
  pausedScoreDisplay.textContent = score;
  pausedLevelDisplay.textContent = level;
  pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
}

// Resume game
function resumeGame() {
  isPaused = false;
  pauseModal.style.display = 'none';
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  startGameIntervals();
}

// Toggle auto-jump
function toggleAutoJump() {
  autoJumpEnabled = !autoJumpEnabled;
  updateDisplays();
}

// Event listeners
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !isGameOver) {
    e.preventDefault();
    if (isPaused) {
      resumeGame();
    } else {
      jump();
    }
  }
  
  if (e.code === "KeyP") {
    e.preventDefault();
    if (isGameOver) return;
    if (isPaused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
});

document.addEventListener("click", function(e) {
  if (e.target !== autoBtn && e.target !== pauseBtn && e.target !== restartBtn && !isGameOver && !isPaused) {
    jump();
  }
});

autoBtn.addEventListener("click", toggleAutoJump);
pauseBtn.addEventListener("click", function() {
  if (isGameOver) return;
  if (isPaused) {
    resumeGame();
  } else {
    pauseGame();
  }
});
restartBtn.addEventListener("click", initGame);
playAgainBtn.addEventListener("click", initGame);
resumeBtn.addEventListener("click", resumeGame);

// Initialize game
initGame();
updateDisplays();
