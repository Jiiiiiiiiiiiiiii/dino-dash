const dino = document.getElementById("dino");
const cactus = document.getElementById("cactus");
const scoreDisplay = document.getElementById("score");

let score = 0;
let isJumping = false;

/* Jump Function */
function jump() {
  if (isJumping) return;

  isJumping = true;
  dino.classList.add("jump");

  setTimeout(() => {
    dino.classList.remove("jump");
    isJumping = false;
  }, 500);
}

/* Controls */
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    jump();
  }
});

document.addEventListener("click", jump);

/* Score Counter */
setInterval(() => {
  score++;
  scoreDisplay.textContent = score;
}, 100);

/* Collision Detection */
setInterval(() => {
  const dinoBottom = parseInt(
    window.getComputedStyle(dino).getPropertyValue("bottom")
  );
  const cactusRight = parseInt(
    window.getComputedStyle(cactus).getPropertyValue("right")
  );

  if (cactusRight > 520 && cactusRight < 560 && dinoBottom < 40) {
    alert("💀 Game Over! Your score: " + score);
    score = 0;
    scoreDisplay.textContent = score;
  }
}, 10);
