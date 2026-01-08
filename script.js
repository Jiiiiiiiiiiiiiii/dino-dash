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
let jumpHeight = 120;
let riverJumpHeight = 70;
let lastObstacleTime = 0;
let obstacleSpawnDelay = 1500; // Initial spawn delay
let minSpawnDelay = 800; // Minimum spawn delay at high levels
let obstacleGroupChance = 0.3; // Chance for grouped obstacles
let obstacleGroupSize = 2; // Default group size

// Enhanced obstacle types with weights and difficulty factors
const obstacleTypes = [
  { 
    type: 'cactus', 
    width: 25, 
    height: 60, 
    color: '#8B4513', 
    weight: 40, // Higher weight = more common
    difficulty: 1 
  },
  { 
    type: 'rock', 
    width: 50, 
    height: 40, 
    color: '#808080', 
    weight: 30,
    difficulty: 1.2 
  },
  { 
    type: 'river', 
    width: 120, 
    height: 30, 
    color: '#1e90ff', 
    weight: 20,
    difficulty: 1.5,
    requiresDoubleJump: true 
  },
  { 
    type: 'other-dino', 
    width: 50, 
    height: 60, 
    color: '#FF5722', 
    weight: 10,
    difficulty: 1.3 
  }
];

// Initialize game
function initGame() {
  score = 0;
  level = 1;
  gameSpeed = 1;
  obstacleSpawnDelay = 1500;
  obstacleGroupChance = 0.3;
  obstacleGroupSize = 2;
  isGameOver = false;
  isPaused = false;
  obstacles = [];
  lastObstacleTime = 0;
  
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
  
  console.log("Game started with balanced difficulty!");
}

// Start game intervals
function startGameIntervals() {
  // Clear existing intervals
  clearIntervals();
  
  // Score interval
  scoreInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      score += level;
      updateDisplays();
      updateLevelAndDifficulty();
    }
  }, 200);
  
  // Obstacle generation interval
  obstacleInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      generateObstacleWithLogic();
    }
  }, 100); // Faster check for better timing
  
  // Game loop for collision detection and auto-jump
  gameInterval = setInterval(gameLoop, 16);
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

// Update level and adjust difficulty
function updateLevelAndDifficulty() {
  const newLevel = Math.floor(score / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    
    // Progressive difficulty scaling
    gameSpeed = 1 + (level * 0.15); // Slower speed increase
    obstacleSpawnDelay = Math.max(minSpawnDelay, 1500 - (level * 30)); // Gradually decrease spawn delay
    obstacleGroupChance = Math.min(0.6, 0.3 + (level * 0.03)); // Increase group chance
    obstacleGroupSize = Math.min(4, 2 + Math.floor(level / 5)); // Increase max group size at higher levels
    
    showLevelUpMessage();
    updateDisplays();
  }
}

// Show level up message
function showLevelUpMessage() {
  const message = document.createElement('div');
  message.textContent = `Level ${level}!`;
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

// Smart obstacle generation with timing logic
function generateObstacleWithLogic() {
  const currentTime = Date.now();
  
  // Check if enough time has passed since last obstacle
  if (currentTime - lastObstacleTime < obstacleSpawnDelay) {
    return;
  }
  
  // Check if there's space on the screen
  if (!hasSpaceForNewObstacle()) {
    return;
  }
  
  lastObstacleTime = currentTime;
  
  // Decide if we should spawn a group or single obstacle
  const shouldSpawnGroup = Math.random() < obstacleGroupChance && level > 2;
  
  if (shouldSpawnGroup) {
    spawnObstacleGroup();
  } else {
    spawnSingleObstacle();
  }
}

// Check if there's space for new obstacle
function hasSpaceForNewObstacle() {
  if (obstacles.length === 0) return true;
  
  const lastObstacle = obstacles[obstacles.length - 1];
  const lastObstacleRight = lastObstacle.right;
  const lastObstacleWidth = lastObstacle.width;
  
  // Calculate safe distance based on level and game speed
  const safeDistance = 300 - (level * 10) + (gameSpeed * 50);
  
  // Only spawn new obstacle if last one is far enough
  return lastObstacleRight > safeDistance;
}

// Spawn single obstacle with weighted random selection
function spawnSingleObstacle() {
  // Weighted random selection
  const totalWeight = obstacleTypes.reduce((sum, type) => sum + type.weight, 0);
  let random = Math.random() * totalWeight;
  
  let selectedType;
  for (const type of obstacleTypes) {
    random -= type.weight;
    if (random <= 0) {
      selectedType = type;
      break;
    }
  }
  
  createObstacle(selectedType);
}

// Spawn group of obstacles
function spawnObstacleGroup() {
  const groupSize = Math.floor(Math.random() * (obstacleGroupSize - 1)) + 2;
  const types = ['cactus', 'rock']; // Simpler obstacles for groups
  
  for (let i = 0; i < groupSize; i++) {
    const typeName = types[Math.floor(Math.random() * types.length)];
    const obstacleType = obstacleTypes.find(t => t.type === typeName);
    
    if (obstacleType) {
      // Stagger obstacles in group
      setTimeout(() => {
        if (!isPaused && !isGameOver) {
          createObstacle(obstacleType);
        }
      }, i * 200); // Small delay between obstacles in group
    }
  }
}

// Create obstacle element
function createObstacle(obstacleType) {
  const obstacle = document.createElement('div');
  obstacle.className = `obstacle ${obstacleType.type}`;
  
  // Set obstacle properties
  obstacle.style.width = `${obstacleType.width}px`;
  obstacle.style.height = `${obstacleType.height}px`;
  obstacle.style.backgroundColor = obstacleType.color;
  obstacle.style.right = `${-obstacleType.width}px`;
  obstacle.style.bottom = '0px';
  
  // Add obstacle class for styling
  if (obstacleType.type === 'river') {
    obstacle.classList.add('river-obstacle');
  }
  
  // Add to game area and obstacles array
  gameArea.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    type: obstacleType.type,
    width: obstacleType.width,
    height: obstacleType.height,
    right: -obstacleType.width,
    speed: obstacleType.difficulty * gameSpeed * 5,
    requiresDoubleJump: obstacleType.requiresDoubleJump || false
  });
}

// Jump function
function jump(isDoubleJump = false) {
  if (isJumping && !isDoubleJump) return;
  
  if (!isJumping) {
    // First jump
    isJumping = true;
    dino.style.bottom = `${jumpHeight}px`;
    dino.classList.add('jumping');
    
    // Reset after jump
    setTimeout(() => {
      dino.style.bottom = '0px';
      isJumping = false;
      isDoubleJumping = false;
      dino.classList.remove('jumping');
    }, 500);
  } else if (isJumping && !isDoubleJumping && isDoubleJump) {
    // Double jump (for rivers)
    isDoubleJumping = true;
    dino.style.bottom = `${jumpHeight + riverJumpHeight}px`;
    dino.classList.add('double-jumping');
    
    // Reset after double jump
    setTimeout(() => {
      dino.style.bottom = `${jumpHeight}px`;
      dino.classList.remove('double-jumping');
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
    if (obstacle.right > 850) {
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

// Enhanced auto-jump logic
function autoJumpLogic(obstacle) {
  const dinoLeft = 80;
  const dinoWidth = 60;
  const obstacleRight = obstacle.right;
  const obstacleWidth = obstacle.width;
  const obstacleType = obstacle.type;
  
  // Calculate distance to obstacle
  const distanceToObstacle = 800 - obstacleRight - obstacleWidth - dinoLeft;
  
  // Jump based on obstacle type and distance
  if (distanceToObstacle > 0 && distanceToObstacle < 120) {
    if (obstacleType === 'river' && distanceToObstacle < 80) {
      // Double jump for rivers
      if (!isDoubleJumping) {
        jump(true);
      }
    } else if (obstacleType !== 'river' && distanceToObstacle < 90) {
      // Single jump for other obstacles
      if (!isJumping) {
        jump();
      }
    }
  }
}

// Improved collision detection
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
  
  // More forgiving collision for rivers (only if dino is too low)
  if (obstacle.type === 'river') {
    return dinoRect.bottom < 30 && dinoRect.left < obstacleRect.right && dinoRect.right > obstacleRect.left;
  }
  
  // Standard collision for other obstacles
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
  
  // Show tips based on performance
  showGameOverTips();
}

// Show tips after game over
function showGameOverTips() {
  const tips = [
    "Tip: Rivers require double jumps!",
    "Tip: Press 'P' to pause anytime",
    "Tip: Enable Auto-Jump to learn timing",
    "Tip: Higher levels = more points!",
    "Tip: Groups of obstacles need rhythm!"
  ];
  
  const tipElement = document.createElement('div');
  tipElement.textContent = tips[Math.floor(Math.random() * tips.length)];
  tipElement.style.cssText = `
    color: #26d0ce;
    font-size: 1.1rem;
    margin-top: 15px;
    font-weight: bold;
    animation: pulse 2s infinite;
  `;
  
  document.styleSheets[0].insertRule(`
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `, 0);
  
  const modalContent = document.querySelector('#game-over .modal-content');
  modalContent.appendChild(tipElement);
  
  // Remove tip when playing again
  playAgainBtn.addEventListener('click', () => {
    tipElement.remove();
  }, { once: true });
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
  
  // Show/hide auto-jump indicator
  const indicator = document.getElementById('auto-jump-indicator') || 
    (() => {
      const div = document.createElement('div');
      div.id = 'auto-jump-indicator';
      div.textContent = '🤖 AI';
      div.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(76, 175, 80, 0.9);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-weight: bold;
        display: none;
        z-index: 100;
      `;
      gameArea.appendChild(div);
      return div;
    })();
  
  indicator.style.display = autoJumpEnabled ? 'block' : 'none';
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
  
  // Quick double jump for rivers (press space twice quickly)
  if (e.code === "Space" && isJumping && !isDoubleJumping) {
    setTimeout(() => {
      jump(true);
    }, 50);
  }
});

document.addEventListener("click", function(e) {
  if (e.target !== autoBtn && e.target !== pauseBtn && e.target !== restartBtn && !isGameOver && !isPaused) {
    jump();
  }
});

// Double click for rivers
let lastClickTime = 0;
gameArea.addEventListener("click", function(e) {
  if (isGameOver || isPaused) return;
  
  const currentTime = new Date().getTime();
  const timeDiff = currentTime - lastClickTime;
  
  if (timeDiff < 300 && isJumping) { // Double click within 300ms
    jump(true); // Double jump
  }
  
  lastClickTime = currentTime;
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
