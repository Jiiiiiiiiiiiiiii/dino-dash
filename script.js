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

// ====== GAME VARIABLES ======
let score = 0;
let highScore = localStorage.getItem("dinoHighScore") || 0;
let level = 1;
let gameSpeed = 1;
let lives = 3;
let isJumping = false;
let isDoubleJumping = false;
let isPaused = false;
let isGameOver = false;
let autoJumpEnabled = false;
let gameInterval;
let obstacleInterval;
let scoreInterval;
let obstacles = [];
let lastObstacleTime = 0;
let obstacleSpawnDelay = 2000;
let minSpawnDelay = 800;
let obstacleGroupChance = 0.1;
let consecutiveObstacles = 0;
let lastJumpTime = 0;
let gameStarted = false;
let isInvincible = false;

// ====== OBSTACLE CONFIGURATION ======
const obstacleTypes = [
  { 
    type: 'tree', 
    width: 40, 
    height: 120, 
    weight: 30,
    difficulty: 1.0,
    description: "Jump over the tree"
  },
  { 
    type: 'rock', 
    width: 60, 
    height: 45, 
    weight: 35,
    difficulty: 1.1,
    description: "Jump over the rock"
  },
  { 
    type: 'river', 
    width: 140, 
    height: 40, 
    weight: 20,
    difficulty: 1.8,
    requiresDoubleJump: true,
    description: "Double jump over the river!"
  },
  { 
    type: 'other-dino', 
    width: 70, 
    height: 80, 
    weight: 15,
    difficulty: 1.3,
    description: "Jump over the other dinosaur"
  }
];

// ====== SPEED LEVELS ======
const speedLevels = [
  { level: 1, name: "Very Slow", multiplier: 1.0 },
  { level: 2, name: "Slow", multiplier: 1.2 },
  { level: 3, name: "Normal", multiplier: 1.5 },
  { level: 5, name: "Fast", multiplier: 1.8 },
  { level: 8, name: "Very Fast", multiplier: 2.2 },
  { level: 12, name: "Extreme", multiplier: 2.8 },
  { level: 15, name: "Lightning", multiplier: 3.5 }
];

// ====== GAME TIPS ======
const gameTips = [
  "The game starts slow - learn the timing!",
  "Rivers need quick double jumps",
  "Speed increases at higher levels",
  "You have 3 lives - be careful!",
  "Watch for patterns in obstacles",
  "Use Auto mode to practice timing",
  "Higher levels = faster gameplay",
  "Take your time, no need to rush!"
];

// ====== INITIALIZE GAME ======
function initGame() {
  score = 0;
  level = 1;
  gameSpeed = 1;
  lives = 3;
  obstacleSpawnDelay = 2000;
  obstacleGroupChance = 0.1;
  consecutiveObstacles = 0;
  isGameOver = false;
  isPaused = false;
  gameStarted = false;
  isInvincible = false;
  obstacles = [];
  lastObstacleTime = Date.now();
  
  // Clear all obstacles and clouds
  document.querySelectorAll('.obstacle, .cloud, .collision-debug').forEach(el => el.remove());
  
  // Update displays
  updateDisplays();
  
  // Hide all modals
  gameOverModal.style.display = 'none';
  pauseModal.style.display = 'none';
  lifeLostModal.style.display = 'none';
  
  // Reset dino position and state
  dino.style.bottom = '70px';
  dino.style.opacity = '1';
  dino.classList.remove('jumping', 'double-jumping', 'game-over-shake');
  
  // Create background clouds
  createClouds();
  
  // Show start message
  showGameMessage("Press SPACE or CLICK to Start!");
  
  console.log("✅ Game initialized - Ready to play!");
}

// ====== CREATE BACKGROUND CLOUDS ======
function createClouds() {
  for (let i = 0; i < 5; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    // Random cloud properties
    const size = 40 + Math.random() * 60;
    const top = 30 + Math.random() * 100;
    const left = Math.random() * 800;
    const speed = 40 + Math.random() * 40;
    const opacity = 0.3 + Math.random() * 0.4;
    
    cloud.style.width = `${size}px`;
    cloud.style.height = `${size / 2}px`;
    cloud.style.top = `${top}px`;
    cloud.style.left = `${left}px`;
    cloud.style.opacity = `${opacity}`;
    cloud.style.animationDuration = `${speed}s`;
    
    // Cloud details
    cloud.style.borderRadius = '50px';
    
    gameArea.appendChild(cloud);
  }
}

// ====== START GAME ======
function startGame() {
  if (gameStarted) return;
  
  gameStarted = true;
  showGameMessage("Go!");
  
  // Start game intervals immediately
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
  
  // Obstacle generation interval
  obstacleInterval = setInterval(() => {
    if (!isPaused && !isGameOver && gameStarted) {
      generateObstacleWithLogic();
    }
  }, 100);
  
  // Game loop for collision detection and auto-jump
  gameInterval = setInterval(gameLoop, 16);
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
  livesDisplay.textContent = lives;
  autoStatusDisplay.textContent = autoJumpEnabled ? 'ON' : 'OFF';
  
  // Update speed display based on current level
  const speedLevel = speedLevels.reduce((current, speed) => 
    level >= speed.level ? speed : current, speedLevels[0]
  );
  speedDisplay.textContent = speedLevel.name;
  speedDisplay.style.color = getSpeedColor(level);
  
  // Update auto button color
  autoBtn.style.background = autoJumpEnabled 
    ? 'linear-gradient(to right, #4CAF50, #2E7D32)' 
    : 'linear-gradient(to right, #e76f51, #f4a261)';
}

// ====== GET SPEED COLOR ======
function getSpeedColor(level) {
  if (level < 3) return '#4CAF50'; // Green for slow
  if (level < 6) return '#FFC107'; // Yellow for normal
  if (level < 10) return '#FF9800'; // Orange for fast
  return '#F44336'; // Red for very fast
}

// ====== UPDATE LEVEL & SPEED ======
function updateLevelAndSpeed() {
  const newLevel = Math.floor(score / 100) + 1;
  
  if (newLevel > level) {
    level = newLevel;
    
    // PROGRESSIVE DIFFICULTY: Game gets faster with higher levels
    const speedLevel = speedLevels.reduce((current, speed) => 
      level >= speed.level ? speed : current, speedLevels[0]
    );
    
    // Update game speed based on level
    gameSpeed = speedLevel.multiplier;
    
    // Gradually decrease spawn delay (makes obstacles come faster)
    obstacleSpawnDelay = Math.max(minSpawnDelay, 2000 - (level * 80));
    
    // Slightly increase chance for obstacle groups
    obstacleGroupChance = Math.min(0.4, 0.1 + (level * 0.02));
    
    showLevelUpMessage();
    updateDisplays();
  }
}

// ====== SHOW LEVEL UP MESSAGE ======
function showLevelUpMessage() {
  const speedLevel = speedLevels.reduce((current, speed) => 
    level >= speed.level ? speed : current, speedLevels[0]
  );
  
  showGameMessage(`Level ${level}! Speed: ${speedLevel.name}`);
  
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
  
  // Give breaks between obstacles (especially at early levels)
  consecutiveObstacles++;
  if (consecutiveObstacles >= (level < 5 ? 3 : 5)) {
    consecutiveObstacles = 0;
    lastObstacleTime = Date.now() + 1000; // Give a 1-second break
    return;
  }
  
  lastObstacleTime = currentTime;
  
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
  
  // Calculate safe distance - more space at lower levels
  const safeDistance = level < 5 ? 400 : 
                      level < 10 ? 350 : 
                      300 - (level * 5);
  
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
  
  createObstacle(selectedType);
}

// ====== SPAWN OBSTACLE GROUP ======
function spawnObstacleGroup() {
  // Only small groups at lower levels
  const groupSize = level < 8 ? 2 : 
                    level < 12 ? 3 : 4;
  
  const types = ['tree', 'rock']; // Only simple obstacles for groups
  
  for (let i = 0; i < groupSize; i++) {
    const typeName = types[Math.floor(Math.random() * types.length)];
    const obstacleType = obstacleTypes.find(t => t.type === typeName);
    
    if (obstacleType) {
      // Stagger obstacles in group
      setTimeout(() => {
        if (!isPaused && !isGameOver && gameStarted && hasSpaceForNewObstacle()) {
          createObstacle(obstacleType);
        }
      }, i * 300); // Small delay between obstacles in group
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
  obstacle.style.right = `${-obstacleType.width}px`;
  obstacle.style.bottom = '70px';
  
  // Add specific content based on obstacle type
  if (obstacleType.type === 'other-dino') {
    obstacle.innerHTML = `
      <div class="body"></div>
      <div class="head"></div>
      <div class="eye"></div>
    `;
  }
  
  // Add to game area and obstacles array
  gameArea.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    type: obstacleType.type,
    width: obstacleType.width,
    height: obstacleType.height,
    right: -obstacleType.width,
    speed: obstacleType.difficulty * gameSpeed * 3,
    requiresDoubleJump: obstacleType.requiresDoubleJump || false
  });
}

// ====== JUMP FUNCTION ======
function jump(isDoubleJump = false) {
  // Start game on first jump if not started
  if (!gameStarted) {
    startGame();
    // Allow the first jump to happen
  }
  
  if (isJumping && !isDoubleJump) return;
  
  const currentTime = Date.now();
  
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
    
    lastJumpTime = currentTime;
    addJumpEffect();
  } else if (isJumping && !isDoubleJumping && isDoubleJump) {
    // Check if it's quick enough for a double jump
    if (currentTime - lastJumpTime < 300) {
      // Double jump (for rivers)
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
    
    // Collision detection (skip if invincible)
    if (!isInvincible && checkCollision(obstacle)) {
      handleCollision();
      return;
    }
  }
}

// ====== FIXED COLLISION DETECTION ======
function checkCollision(obstacle) {
  // Get dino position
  let dinoBottom;
  if (dino.classList.contains('double-jumping')) {
    dinoBottom = 260; // Double jump height
  } else if (dino.classList.contains('jumping')) {
    dinoBottom = 190; // Normal jump height
  } else {
    dinoBottom = 70; // On ground
  }
  
  // DINO HITBOX - SMALLER and MORE ACCURATE
  const dinoHitbox = {
    left: 95,        // 15px from left edge of visual dino
    right: 125,      // 15px from right edge of visual dino
    bottom: dinoBottom + 25, // Start 25px above feet
    top: dinoBottom + 65     // End 25px below head
  };
  
  // OBSTACLE HITBOX - EXACT obstacle position
  const obstacleHitbox = {
    left: 800 - obstacle.right - obstacle.width,
    right: 800 - obstacle.right,
    bottom: 70,
    top: 70 + obstacle.height
  };
  
  // DEBUG: Show hitboxes (press H to toggle)
  if (window.showHitboxes) {
    drawHitbox(dinoHitbox, 'dino');
    drawHitbox(obstacleHitbox, 'obstacle');
  }
  
  // SPECIAL CASE FOR RIVERS
  if (obstacle.type === 'river') {
    // For rivers, only collide if dino is TOO LOW (not jumping enough)
    // River needs double jump, so dino must be above 150px to clear it
    const isInRiverHorizontally = (
      dinoHitbox.left < obstacleHitbox.right - 10 &&  // 10px buffer
      dinoHitbox.right > obstacleHitbox.left + 10     // 10px buffer
    );
    
    const isTooLowForRiver = dinoBottom < 150; // Must be above 150px to clear river
    
    if (isInRiverHorizontally && isTooLowForRiver) {
      console.log("💧 River hit - Dino too low! Height:", dinoBottom);
      return true;
    }
    return false;
  }
  
  // REGULAR OBSTACLES (Trees, Rocks, Other Dinos)
  // Check for ACTUAL COLLISION with generous buffers
  const horizontalCollision = (
    dinoHitbox.left < obstacleHitbox.right - 15 &&  // 15px buffer on right
    dinoHitbox.right > obstacleHitbox.left + 15     // 15px buffer on left
  );
  
  const verticalCollision = (
    dinoHitbox.bottom < obstacleHitbox.top - 10 &&  // 10px buffer on top
    dinoHitbox.top > obstacleHitbox.bottom + 10     // 10px buffer on bottom
  );
  
  // Must have BOTH horizontal and vertical collision
  const isColliding = horizontalCollision && verticalCollision;
  
  if (isColliding) {
    console.log("💥 COLLISION! Type:", obstacle.type);
    console.log("Dino height:", dinoBottom);
    console.log("Dino hitbox:", dinoHitbox);
    console.log("Obstacle hitbox:", obstacleHitbox);
  }
  
  return isColliding;
}

// ====== DRAW HITBOXES FOR DEBUGGING ======
function drawHitbox(hitbox, type) {
  // Remove existing debug box
  const existing = document.querySelector(`.collision-debug.${type}`);
  if (existing) existing.remove();
  
  const debugBox = document.createElement('div');
  debugBox.className = `collision-debug ${type}`;
  debugBox.style.cssText = `
    position: absolute;
    border: 2px solid ${type === 'dino' ? '#FF0000' : '#00FF00'};
    background: ${type === 'dino' ? 'rgba(255,0,0,0.2)' : 'rgba(0,255,0,0.2)'};
    left: ${hitbox.left}px;
    width: ${hitbox.right - hitbox.left}px;
    bottom: ${hitbox.bottom}px;
    height: ${hitbox.top - hitbox.bottom}px;
    pointer-events: none;
    z-index: 50;
  `;
  
  gameArea.appendChild(debugBox);
  
  // Remove after short time
  setTimeout(() => debugBox.remove(), 100);
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
  if (distanceToObstacle > 0 && distanceToObstacle < 150) {
    if (obstacleType === 'river' && distanceToObstacle < 100 && !isDoubleJumping) {
      // Double jump for rivers
      setTimeout(() => {
        if (!isDoubleJumping && isJumping) {
          jump(true);
        } else if (!isJumping) {
          jump();
          setTimeout(() => jump(true), 150);
        }
      }, 50);
    } else if (obstacleType !== 'river' && distanceToObstacle < 120 && !isJumping) {
      // Single jump for other obstacles
      setTimeout(() => {
        if (!isJumping) {
          jump();
        }
      }, 50);
    }
  }
}

// ====== HANDLE COLLISION ======
function handleCollision() {
  if (isInvincible) return; // Don't lose life if invincible
  
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
  
  // Set invincibility for 2 seconds
  isInvincible = true;
  dino.style.opacity = '0.6';
  showGameMessage("Continue! Invincible for 2 seconds!");
  
  // Restart game intervals
  startGameIntervals();
  
  // Remove invincibility after 2 seconds
  setTimeout(() => {
    isInvincible = false;
    dino.style.opacity = '1';
  }, 2000);
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
      
      const currentTime = Date.now();
      
      // Check for double space press for double jump
      if (isJumping && !isDoubleJumping && currentTime - lastJumpTime < 300) {
        jump(true); // Double jump
      } else {
        jump(); // Single jump or start game
      }
      
      lastJumpTime = currentTime;
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
      // Toggle hitbox visualization
      window.showHitboxes = !window.showHitboxes;
      showGameMessage(window.showHitboxes ? "Hitboxes ON" : "Hitboxes OFF");
      console.log("Hitbox visualization:", window.showHitboxes ? "ON" : "OFF");
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
  console.log("📱 Controls:");
  console.log("  SPACE - Jump / Start game");
  console.log("  Double SPACE - Double jump for rivers");
  console.log("  CLICK - Jump / Start game");
  console.log("  Double CLICK - Double jump for rivers");
  console.log("  P - Pause/Resume game");
  console.log("  R - Restart game");
  console.log("  A - Toggle Auto-Jump mode");
  console.log("  H - Toggle hitbox visualization (debug)");
  console.log("  Ctrl+D - Show game debug info");
  console.log("🎯 Game starts slow and gets faster at higher levels!");
});

// ====== DEBUG FUNCTION ======
function debugGame() {
  console.log("=== GAME DEBUG ===");
  console.log("Game Started:", gameStarted);
  console.log("Game Paused:", isPaused);
  console.log("Game Over:", isGameOver);
  console.log("Is Jumping:", isJumping);
  console.log("Is Double Jumping:", isDoubleJumping);
  console.log("Is Invincible:", isInvincible);
  console.log("Lives:", lives);
  console.log("Score:", score);
  console.log("Level:", level);
  console.log("Game Speed:", gameSpeed);
  console.log("Active Obstacles:", obstacles.length);
  console.log("Obstacle Spawn Delay:", obstacleSpawnDelay);
  console.log("==================");
}

// Add debug hotkey (Ctrl+D)
document.addEventListener("keydown", function(e) {
  if (e.code === "KeyD" && e.ctrlKey) {
    debugGame();
  }
});
