// --- Configuration & State ---
let targetSize, outlineSize;
let baseSpeed = 5;
let speed;
let score = 0;
let highScore = 0;
let combo = 1;
let gameState = "START"; // START, PLAY, GAMEOVER

// --- Juice & Polish Variables ---
let screenShake = 0;
let particles = [];
let feedbackText = "";
let feedbackTimer = 0;
let feedbackColor;
let ghostSquare = { size: 0, alpha: 0 };
let pulseTarget = 0;

// --- Starfield Variables ---
let stars = [];
let numStars = 200; // Number of stars
let starSpeed = 0.5; // Speed of star movement

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  feedbackColor = color(255);
  
  // Load High Score
  let saved = localStorage.getItem("snapSyncHighScore");
  if (saved) highScore = parseInt(saved);
  
  resetGame();
  
  // Initialize stars
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(-width / 2, width / 2),
      y: random(-height / 2, height / 2),
      z: random(0, width), // For parallax effect
      size: random(1, 3)
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Re-initialize stars if window changes drastically
  stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: random(-width / 2, width / 2),
      y: random(-height / 2, height / 2),
      z: random(0, width),
      size: random(1, 3)
    });
  }
}

function draw() {
  background(10, 10, 25);
  
  // Draw and update stars BEFORE screen shake
  drawStars();

  // 1. Apply Screen Shake
  if (screenShake > 0) {
    translate(random(-screenShake, screenShake), random(-screenShake, screenShake));
    screenShake *= 0.9; 
  }
  
  translate(width / 2, height / 2);

  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAY") {
    drawGameLoop();
  } else if (gameState === "GAMEOVER") {
    drawGameOver();
  }

  updateParticles();
}

// --- Core Game Logic ---

function drawGameLoop() {
  let displayTarget = min(width, height) * 0.15;
  
  // Background Score
  fill(255, 255, 255, 20);
  textSize(min(width, height) * 0.4);
  text(score, 0, 0);

  // Draw Central "Sun" or core
  fill(255, 150, 0, 150); // Orange glow
  noStroke();
  ellipse(0, 0, displayTarget * 0.5);

  // Draw Target Square
  pulseTarget = lerp(pulseTarget, displayTarget, 0.1);
  noFill();
  stroke(255, 0, 255);
  strokeWeight(map(sin(frameCount * 0.2), -1, 1, 4, 8));
  rect(0, 0, pulseTarget, pulseTarget, 5);

  // Draw Ghost Square
  if (ghostSquare.alpha > 0) {
    stroke(255, 255, 255, ghostSquare.alpha);
    rect(0, 0, ghostSquare.size, ghostSquare.size, 5);
    ghostSquare.alpha -= 10;
  }

  // Update Outline
  outlineSize -= speed;
  stroke(0, 255, 255);
  strokeWeight(3);
  rect(0, 0, outlineSize, outlineSize, 5);

  // UI Feedback
  if (feedbackTimer > 0) {
    fill(feedbackColor);
    textSize(30);
    text(feedbackText, 0, height * 0.2);
    feedbackTimer--;
  }

  // Fail Condition
  if (outlineSize < displayTarget * 0.8) {
    triggerGameOver();
  }
}

function mousePressed() {
  if (gameState === "START") {
    gameState = "PLAY";
    return;
  }
  if (gameState === "GAMEOVER") {
    resetGame();
    gameState = "PLAY";
    return;
  }

  handleHit();
}

function handleHit() {
  let displayTarget = min(width, height) * 0.15;
  let diff = abs(outlineSize - displayTarget);
  let perfectZone = 15; 
  let hitZone = 40;     

  ghostSquare = { size: outlineSize, alpha: 200 };

  if (diff < hitZone) {
    if (diff < perfectZone) {
      combo++;
      score += (10 * combo);
      showFeedback("PERFECT! x" + combo, color(255, 255, 0));
      screenShake = 15;
      spawnParticles(20, color(255, 255, 0));
    } else {
      combo = 1;
      score += 5;
      showFeedback("SYNC", color(0, 255, 255));
      screenShake = 5;
      spawnParticles(10, color(0, 255, 255));
    }
    speed *= 1.02;
    outlineSize = max(width, height) * 0.7; 
    pulseTarget = displayTarget * 1.4;
  } else {
    triggerGameOver();
  }
}

// --- UI & Effects ---

function drawStartScreen() {
  fill(0, 255, 255);
  textSize(min(width * 0.1, 80));
  text("SNAPSYNC", 0, -40);
  fill(255, 0, 255);
  textSize(20);
  text("TAP TO START", 0, 40);
}

function drawGameOver() {
  fill(255, 50, 50);
  textSize(50);
  text("FAILURE", 0, -50);
  fill(255);
  textSize(24);
  text("SCORE: " + score, 0, 10);
  text("BEST: " + highScore, 0, 45);
  fill(255, 100);
  textSize(16);
  text("TAP TO RESTART", 0, 120);
}

function showFeedback(txt, clr) {
  feedbackText = txt;
  feedbackColor = clr;
  feedbackTimer = 30;
}

function spawnParticles(n, clr) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x: 0, y: 0,
      vx: random(-7, 7), vy: random(-7, 7),
      life: 255,
      c: clr
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 10;
    fill(red(p.c), green(p.c), blue(p.c), p.life);
    noStroke();
    ellipse(p.x, p.y, 5);
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function triggerGameOver() {
  gameState = "GAMEOVER";
  screenShake = 20;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("snapSyncHighScore", highScore);
  }
}

function resetGame() {
  score = 0;
  combo = 1;
  speed = baseSpeed;
  outlineSize = max(width, height) * 0.7;
  // Make sure gameState starts at START for the initial screen
  gameState = "START"; 
  particles = [];
}

// --- Starfield Logic ---
function drawStars() {
  push(); // Isolate star translation
  translate(width / 2, height / 2); // Center stars as well
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];

    // Update star position
    star.z -= starSpeed;
    if (star.z < 1) { // Reset star if it goes past the "camera"
      star.z = width;
      star.x = random(-width / 2, width / 2);
      star.y = random(-height / 2, height / 2);
    }

    // Calculate parallax effect (closer stars move faster)
    let sx = map(star.x / star.z, 0, 1, 0, width);
    let sy = map(star.y / star.z, 0, 1, 0, height);
    let r = map(star.z, 0, width, star.size, 0); // Size changes with distance

    fill(255, map(star.z, 0, width, 255, 50)); // Fade with distance
    noStroke();
    ellipse(sx, sy, r);
  }
  pop(); // Restore original translation
}