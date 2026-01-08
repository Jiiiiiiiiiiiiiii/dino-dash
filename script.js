// ====== GAME ELEMENTS ======
const dino = document.getElementById("dino");
const gameArea = document.getElementById("game-area");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const levelDisplay = document.getElementById("level");
const speedDisplay = document.getElementById("speed");
const difficultyText = document.getElementById("difficulty-text");
const autoStatusDisplay = document.getElementById("auto-status");
const autoBtn = document.getElementById("auto-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const gameOverModal = document.getElementById("game-over");
const pauseModal = document.getElementById("pause-modal");
const finalScoreDisplay = document.getElementById("final-score");
const finalLevelDisplay = document.getElementById("final-level");
const finalHighScoreDisplay = document.getElementById("final-high-score");
const pausedScoreDisplay = document.getElementById("paused-score");
const pausedLevelDisplay = document.getElementById("paused-level");
const pausedSpeedDisplay = document.getElementById("paused-speed");
const gameOverTip = document.getElementById("game-over-tip");
const playAgainBtn = document.getElementById("play-again-btn");
const resumeBtn = document.getElementById("resume-btn");
const gameStateIndicator = document.getElementById("game-state");

// ====== GAME VARIABLES ======
let score = 0;
let highScore = localStorage.getItem("dinoHighScore") || 0;
let level = 1;
let gameSpeed = 1;
let difficulty = "Normal";
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
let obstacleSpawnDelay = 1800; // Initial spawn delay (ms)
let minSpawnDelay = 900; // Minimum spawn delay at high levels
let obstacleGroupChance = 0.2; // Initial chance for grouped obstacles
let obstacleGroupSize = 2; // Default group size
let consecutiveObstacles = 0; // Track consecutive obstacles
let lastDoubleJumpTime = 0;

// ====== OBSTACLE CONFIGURATION ======
const obstacleTypes = [
  { 
    type: 'cactus', 
    width: 25, 
    height: 60, 
    color: '#8B4513', 
    weight: 40, // Higher weight = more common
    difficulty: 1,
    description: "Single jump"
  },
  { 
    type: 'rock', 
    width: 50, 
    height: 40, 
    color: '#808080', 
    weight: 35,
    difficulty: 1.1,
    description: "Single jump"
  },
  { 
    type: 'river', 
    width: 120, 
    height: 30, 
    color: '#1e90ff', 
    weight: 15,
    difficulty: 1.8,
    requiresDoubleJump: true,
    description: "Double jump required!"
  },
  { 
    type: 'other-dino', 
    width: 50, 
    height: 60, 
    color: '#FF5722', 
    weight: 10,
    difficulty: 1.3,
    description: "Single jump"
  }
];

// ====== GAME TIPS ======
const gameTips = [
  "Tip: Rivers require quick double jumps!",
  "Tip: Watch for obstacle patterns and rhythm",
  "Tip: Use Auto-Jump mode to learn timing",
  "Tip: Higher levels give more points per second",
  "Tip: Take breaks with the pause feature",
  "Tip: Practice makes perfect!",
  "Tip: Obstacles come in predictable patterns",
  "Tip: Don't panic at obstacle groups - keep rhythm"
];

// ====== DIFFICULTY LEVELS ======
const difficultyLevels = [
  { level: 1, name: "Very Easy", color: "#4CAF50" },
  { level: 3, name: "Easy", color: "#8BC34A" },
  { level: 5, name: "Normal", color: "#FFC107" },
  { level: 8, name: "Hard", color: "#FF9800" },
  { level: 12, name: "Very Hard", color: "#F44336" },
  { level: 15, name: "Expert", color: "#9C27B0" }
];

// ====== INITIALIZE GAME ======
function initGame() {
  score = 0;
  level = 1;
  gameSpeed = 1;
  difficulty = "Normal";
  obstacleSpawnDelay = 1800;
  obstacleGroupChance = 0.2;
  obstacleGroupSize = 2;
  consecutiveObstacles = 0;
  isGameOver = false;
  isPaused = false;
  obstacles = [];
  lastObstacleTime = Date.now();
  
  // Clear all obstacles
  const existingObstacles = document.querySelectorAll('.obstacle');
  existingObstacles.forEach(obstacle => obstacle.remove());
  
  // Update displays
  updateDisplays();
  
  // Hide modals
  gameOverModal.style.display = 'none';
  pauseModal.style.display = 'none';
  
  // Reset dino position
  dino.style.bottom = '5px';
  dino.classList.remove('jumping', 'double-jumping');
  
  // Show start message
  showGameMessage("Ready? Go!");
  
  // Start game intervals
  setTimeout(() => {
    startGameIntervals();
  }, 1500);
  
  console.log("Game initialized with balanced difficulty!");
}

// ====== START GAME INTERVALS ======
function startGameIntervals() {
  // Clear existing intervals
  clearIntervals();
  
  // Score interval
  scoreInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      score += Math.floor(level / 2) + 1; // Higher levels give more points
      updateDisplays();
      updateLevelAndDifficulty();
    }
  }, 200);
  
  // Obstacle generation interval (checks every 100ms)
  obstacleInterval = setInterval(() => {
    if (!isPaused && !isGameOver) {
      generateObstacleWithLogic();
    }
  }, 100);
  
  // Game loop for collision detection and auto-jump
  gameInterval = setInterval(gameLoop, 16); // ~60fps
}

// ====== CLEAR INTERVALS ======
function clearIntervals() {
  if (scoreInterval) clearInterval(scoreInterval);
  if (obstacleInterval) clearInterval(obstacleInterval);
  if (gameInterval) clearInterval(gameInterval);
}

// ====== UPDATE DISPLAYS ======
function updateDisplays() {
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
  levelDisplay.textContent = level;
  speedDisplay.textContent = gameSpeed.toFixed(1) + 'x';
  difficultyText.textContent = difficulty;
  difficultyText.style.color = getDifficultyColor();
  autoStatusDisplay.textContent = autoJumpEnabled ? 'ON' : 'OFF';
  autoBtn.style.background = autoJumpEnabled 
    ? 'linear-gradient(to right, #4CAF50, #2E7D32)' 
    : 'linear-gradient(to right, #ff7e5f, #feb47b)';
}

// ====== GET DIFFICULTY COLOR ======
function getDifficultyColor() {
  for (let i = difficultyLevels.length - 1; i >= 0; i--) {
    if (level >= difficultyLevels[i].level) {
      return difficultyLevels[i].color;
    }
  }
  return "#FFC107"; // Default to Normal color
}

// ====== UPDATE LEVEL & DIFFICULTY ======
function updateLevelAndDifficulty() {
  const newLevel = Math.floor(score / 100) + 1;
  if (newLevel > level) {
    level = newLevel;
    
    // Progressive difficulty scaling
    gameSpeed = 1 + (level * 0.12); // Gradual speed increase
    obstacleSpawnDelay = Math.max(minSpawnDelay, 1800 - (level * 40)); // Gradual spawn delay decrease
    obstacleGroupChance = Math.min(0.5, 0.2 + (level * 0.02)); // Increase group chance
    obstacleGroupSize = Math.min(4, 2 + Math.floor(level / 6)); // Increase max group size
    
    // Update difficulty name
    difficulty = difficultyLevels.reduce((current, diff) => 
      level >= diff.level ? diff.name : current, "Normal"
    );
    
    showLevelUpMessage();
    updateDisplays();
  }
}

// ====== SHOW LEVEL UP MESSAGE ======
function showLevelUpMessage() {
  showGameMessage(`Level ${level}! ${difficulty}`);
  
  // Create score popup
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = `+100!`;
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

// ====== SMART OBSTACLE GENERATION ======
function generateObstacleWithLogic() {
  const currentTime = Date.now();
  
  // Check if enough time has passed since last obstacle
  if (currentTime - lastObstacleTime < obstacleSpawnDelay) {
    return;
  }
  
  // Check if there's space on the screen (prevent overcrowding)
  if (!hasSpaceForNewObstacle()) {
    return;
  }
  
  lastObstacleTime = currentTime;
  consecutiveObstacles++;
  
  // Every 5 obstacles, give a break
  if (consecutiveObstacles >= 5) {
    consecutiveObstacles = 0;
    setTimeout(() => {
      if (!isPaused && !isGameOver) {
        lastObstacleTime = Date.now() + 1000; // Extra break
      }
    }, 0);
    return;
  }
  
  // Decide if we should spawn a group or single obstacle
  const shouldSpawnGroup = Math.random() < obstacleGroupChance && level > 3;
  
  if (shouldSpawnGroup) {
    spawnObstacleGroup();
  } else {
    spawnSingleObstacle();
  }
}

// ====== CHECK FOR SPACE ======
function hasSpaceForNewObstacle() {
  if (obstacles.length === 0) return true;
  
  const lastObstacle = obstacles[obstacles.length - 1];
  const lastObstacleRight = lastObstacle.right;
  const lastObstacleWidth = lastObstacle.width;
  
  // Calculate safe distance based on level and game speed
  const safeDistance = 350 - (level * 15) + (gameSpeed * 40);
  
  // Only spawn new obstacle if last one is far enough
  return lastObstacleRight > safeDistance;
}

// ====== SPAWN SINGLE OBSTACLE ======
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
  
  // Avoid rivers if we just had one
  if (selectedType.type === 'river' && Date.now() - lastDoubleJumpTime < 5000) {
    // Pick a different obstacle
    selectedType = obstacleTypes.find(t => t.type !== 'river') || obstacleTypes[0];
  }
  
  createObstacle(selectedType);
}

// ====== SPAWN OBSTACLE GROUP ======
function spawnObstacleGroup() {
  const groupSize = Math.min(obstacleGroupSize, Math.floor(Math.random() * 3) + 2);
  const types = ['cactus', 'rock']; // Simpler obstacles for groups
  
  for (let i = 0; i < groupSize; i++) {
    const typeName = types[Math.floor(Math.random() * types.length)];
    const obstacleType = obstacleTypes.find(t => t.type === typeName);
    
    if (obstacleType) {
      // Stagger obstacles in group
      setTimeout(() => {
        if (!isPaused && !isGameOver && hasSpaceForNewObstacle()) {
          createObstacle(obstacleType);
        }
      }, i * 250); // Small delay between obstacles in group
    }
  }
}

// ====== CREATE OBSTACLE ======
function createObstacle(obstacleType) {
  const obstacle = document.createElement('div');
  obstacle.className = `obstacle ${obstacleType.type}`;
  obstacle.title = obstacleType.description;
  
  // Set obstacle properties
  obstacle.style.width = `${obstacleType.width}px`;
  obstacle.style.height = `${obstacleType.height}px`;
  obstacle.style.backgroundColor = obstacleType.color;
  obstacle.style.right = `${-obstacleType.width}px`;
  obstacle.style.bottom = '5px';
  
  // Add to game area and obstacles array
  gameArea.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    type: obstacleType.type,
    width: obstacleType.width,
    height: obstacleType.height,
    right: -obstacleType.width,
    speed: obstacleType.difficulty * gameSpeed * 4.5,
    requiresDoubleJump: obstacleType.requiresDoubleJump || false
  });
  
  // Add warning for rivers
  if (obstacleType.type === 'river') {
    addRiverWarning(obstacle);
  }
}

// ====== ADD RIVER WARNING ======
function addRiverWarning(obstacle) {
  const warning = document.createElement('div');
  warning.className = 'obstacle-warning';
  warning.textContent = '⚠️';
  warning.style.right = '0px';
  warning.style.top = '50%';
  obstacle.appendChild(warning);
}

// ====== JUMP FUNCTION ======
function jump(isDoubleJump = false) {
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
  } else if (isJumping && !isDoubleJumping && isDoubleJump) {
    // Double jump (for rivers)
    isDoubleJumping = true;
    lastDoubleJumpTime = Date.now();
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

// ====== GAME LOOP ======
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

// ====== AUTO JUMP LOGIC ======
function autoJumpLogic(obstacle) {
  const dinoLeft = 80;
  const dinoWidth = 60;
  const obstacleRight = obstacle.right;
  const obstacleWidth = obstacle.width;
  const obstacleType = obstacle.type;
  
  // Calculate distance to obstacle
  const distanceToObstacle = 800 - obstacleRight - obstacleWidth - dinoLeft;
  
  // Jump based on obstacle type and distance
  if (distanceToObstacle > 0 && distanceToObstacle < 130) {
    if (obstacleType === 'river' && distanceToObstacle < 90 && !isDoubleJumping) {
      // Double jump for rivers
      setTimeout(() => {
        if (!isDoubleJumping) {
          jump(true);
        }
      }, 50);
    } else if (obstacleType !== 'river' && distanceToObstacle < 100 && !isJumping) {
      // Single jump for other obstacles
      setTimeout(() => {
        if (!isJumping) {
          jump();
        }
      }, 50);
    }
  }
}

// ====== COLLISION DETECTION ======
function checkCollision(obstacle) {
  const dinoRect = {
    left: 80,
    right: 80 + 60,
    bottom: dino.classList.contains('jumping') ? 125 : 
            dino.classList.contains('double-jumping') ? 195 : 5,
    top: (dino.classList.contains('jumping') ? 125 : 
          dino.classList.contains('double-jumping') ? 195 : 5) + 70
  };
  
  const obstacleRect = {
    left: 800 - obstacle.right - obstacle.width,
    right: 800 - obstacle.right,
    bottom: 5,
    top: obstacle.height + 5
  };
  
  // More forgiving collision for rivers (only if dino is too low)
  if (obstacle.type === 'river') {
    return dinoRect.bottom < 40 && dinoRect.left < obstacleRect.right && dinoRect.right > obstacleRect.left;
  }
  
  // Standard collision for other obstacles
  return !(
    dinoRect.left > obstacleRect.right ||
    dinoRect.right < obstacleRect.left ||
    dinoRect.bottom > obstacleRect.top ||
    dinoRect.top < obstacleRect.bottom
  );
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
  gameOverTip.textContent = gameTips[Math.floor(Math.random() * gameTips.length)];
  
  // Show game over modal
  setTimeout(() => {
    gameOverModal.style.display = 'flex';
  }, 500);
  
  // Add shake animation to game area
  gameArea.classList.add('game-over');
  setTimeout(() => gameArea.classList.remove('game-over'), 500);
}

// ====== PAUSE GAME ======
function pauseGame() {
  isPaused = true;
  clearIntervals();
  pauseModal.style.display = 'flex';
  pausedScoreDisplay.textContent = score;
  pausedLevelDisplay.textContent = level;
  pausedSpeedDisplay.textContent = gameSpeed.toFixed(1) + 'x';
  pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
  showGameMessage("Game Paused");
}

// ====== RESUME GAME ======
function resumeGame() {
  isPaused = false;
  pauseModal.style.display = 'none';
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  showGameMessage("Get Ready!");
  setTimeout(() => {
    startGameIntervals();
  }, 1000);
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
    showGameMessage("AI Auto-Jump Enabled");
  }
  
  updateDisplays();
}

// ====== EVENT LISTENERS ======

// Keyboard controls
document.addEventListener("keydown", function (e) {
  switch (e.code) {
    case "Space":
      e.preventDefault();
      if (isGameOver) return;
      if (isPaused) {
        resumeGame();
      } else {
        jump();
      }
      break;
      
    case "KeyP":
      e.preventDefault();
      if (isGameOver) return;
      if (isPaused) {
        resumeGame();
      } else {
        pauseGame();
      }
      break;
      
    case "KeyR":
      e.preventDefault();
      initGame();
      break;
      
    case "KeyA":
      e.preventDefault();
      toggleAutoJump();
      break;
  }
  
  // Quick double jump for rivers (press space twice quickly)
  if (e.code === "Space" && isJumping && !isDoubleJumping) {
    const now = Date.now();
    if (now - lastDoubleJumpTime < 300) { // Within 300ms
      jump(true);
    }
    lastDoubleJumpTime = now;
  }
});

// Click controls
gameArea.addEventListener("click", function(e) {
  if (isGameOver || isPaused) return;
  
  const currentTime = Date.now();
  
  // Check for double click (within 300ms)
  if (currentTime - lastDoubleJumpTime < 300 && isJumping) {
    jump(true); // Double jump
  } else {
    jump(); // Single jump
  }
  
  lastDoubleJumpTime = currentTime;
});

// Control buttons
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

// ====== INITIALIZE GAME ON LOAD ======
window.addEventListener('load', () => {
  initGame();
  updateDisplays();
  
  // Add dino legs
  const frontLeg = document.createElement('div');
  frontLeg.className = 'leg front';
  dino.appendChild(frontLeg);
  
  const backLeg = document.createElement('div');
  backLeg.className = 'leg back';
  dino.appendChild(backLeg);
});

// ====== ADD VISUAL FEEDBACK FOR JUMPS ======
function addJumpEffect() {
  const effect = document.createElement('div');
  effect.style.cssText = `
    position: absolute;
    width: 60px;
    height: 20px;
    background: rgba(0,0,0,0.1);
    border-radius: 50%;
    bottom: 0;
    left: 80px;
    animation: jumpDust 0.5s forwards;
    z-index: 5;
  `;
  
  document.styleSheets[0].insertRule(`
    @keyframes jumpDust {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
  `, 0);
  
  gameArea.appendChild(effect);
  setTimeout(() => effect.remove(), 500);
}

// Add jump effect when jumping
const originalJump = jump;
jump = function(isDoubleJump) {
  originalJump.call(this, isDoubleJump);
  if (!isDoubleJump) {
    addJumpEffect();
  }
};
