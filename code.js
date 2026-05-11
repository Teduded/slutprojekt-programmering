// CANVAS
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// GLOBALA INSTÄLLNINGAR
const gravity = 0.5;
const moveSpeed = 5;
const maxJumps = 2;
const scale = 2.5;
const spriteWidth = 48;
const spriteHeight = 48;

// HITTAR MARKEN
const getGroundY = () => canvas.height - (spriteHeight * scale);

// SKAPA SPELARE
const p1 = new Cyborg(100, canvas.height, spriteHeight, scale);
const p2 = new Biker(canvas.width - 200, canvas.height, spriteHeight, scale);

// TILLSTÅND
let gameStarted = false;
let gamePaused = false;
let cameraX = 0;
let lastTimestamp = 0;

const keys = {
    // Player 1 (WASD)
    w: false, a: false, s: false, d: false, f: false,
    // Player 2 (Pilar)
    up: false, down: false, left: false, right: false, l: false
};

// UI & LJUD
const startBtn = document.getElementById("startBtn");
const mainMenu = document.getElementById("mainMenu");
const menuPanel = document.getElementById("menuPanel");
const menuBtn = document.getElementById("menuBtn");

const jumpSound = new Audio("sounds/jump.mp3");
const punchSound = new Audio("sounds/punch.mp3");
const gameLoopMusic = new Audio("sounds/gameloop.mp3");
gameLoopMusic.loop = true;

// FUNKTIONER

function updatePhysics(char, kLeft, kRight) {
    // Gravitation
    char.velocityY += gravity;
    char.playerY += char.velocityY;

    // Horisontell rörelse
    if (kRight && !kLeft) {
        char.velocityX = moveSpeed;
        char.facingRight = true;
    } else if (kLeft && !kRight) {
        char.velocityX = -moveSpeed;
        char.facingRight = false;
    } else {
        char.velocityX = 0;
    }
    char.playerX += char.velocityX;

    // Ground collision
    if (char.playerY >= getGroundY()) {
        char.playerY = getGroundY();
        char.velocityY = 0;
        char.jumpCount = 0;
    }
}

function updateAnimation(char) {
    const isOnGround = char.playerY >= getGroundY();

    if (char.isHurt) {
        char.currentSprite = char.hurtSprite;
        char.totalFrames = 2;
    } else if (char.isAttacking) {
        char.currentSprite = char.attackSprite;
        char.totalFrames = 8;
    } else {
        char.totalFrames = 4;
        if (!isOnGround && char.jumpCount === 2) {
            char.currentSprite = char.doublejumpSprite;
        } else if (!isOnGround) {
            char.currentSprite = char.jumpSprite;
        } else if (char.velocityX !== 0) {
            char.currentSprite = char.runSprite;
            char.totalFrames = 6; // Run har ofta fler frames
        } else {
            char.currentSprite = char.idleSprite;
        }
    }

    // Reset om sprite byts
    if (char.currentSprite !== char.lastSprite) {
        char.frameIndex = 0;
        char.lastSprite = char.currentSprite;
    }
}

function takeDamage(char, amount) {
    char.health -= amount;
    char.isHurt = true;

    if (char.health < 0) char.health = 0;

    setTimeout(() => {
        char.isHurt = false;
    }, 500);
}

function drawPlayer(char) {
    ctx.save();
    
    const screenX = char.playerX - cameraX;
    const screenY = char.playerY;

    const anchorOffset = 18 * scale; 

    if (!char.facingRight) {
        ctx.translate(screenX + anchorOffset, screenY);
        ctx.scale(-1, 1);
        
        ctx.drawImage(
            char.currentSprite,
            char.frameIndex * spriteWidth, 0,
            spriteWidth, spriteHeight,
            -anchorOffset, 0,
            spriteWidth * scale, spriteHeight * scale
        );
    } else {
        ctx.drawImage(
            char.currentSprite,
            char.frameIndex * spriteWidth, 0,
            spriteWidth, spriteHeight,
            screenX, screenY, // Rita normalt
            spriteWidth * scale, spriteHeight * scale
        );
    }
    ctx.restore();
}

function updateInfoBars() {

    // P1 Bar
    const p1Bar = document.getElementById("p1Bar")
    const p1Fill = document.getElementById
    ("p1healthFill");
    if (p1Fill) {
        const p1Pct = (p1.health / p1.maxHealth) * 100;
        p1Fill.style.width = p1Pct + "%";
        if (p1Pct < 30) {
            p1Fill.style.background = "red"
            p1Bar.style.background = "linear-gradient(to left, #ffffff, #ff0000)"
        } else {
            p1Fill.style.width = "linear-gradient(to right, #00ff0d, #aaff60)"
            p1Bar.style.background = "linear-gradient(to left, #ffffff, #929292)"
        }
    }

    // P2 Bar
    const p2Bar = document.getElementById("p2Bar")
    const p2Fill = document.getElementById("p2healthFill");
    if (p2Fill) {
        const p2Pct = (p2.health / p2.maxHealth) * 100;
        p2Fill.style.width = p2Pct + "%";
        if (p2Pct < 30) {
            p2Fill.style.background = "red"
            p2Bar.style.background = "linear-gradient(to right, #ffffff, #ff0000)"
        } else {
            p2Fill.style.width = "linear-gradient(to left, #00ff0d, #aaff60)"
            p2Bar.style.background = "linear-gradient(to right, #ffffff, #929292)"
        }
    }
}

// MAIN LOOP
function draw(timestamp) {
    if (!gameStarted || gamePaused) {
        requestAnimationFrame(draw);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Uppdaterar fysik för båda
    updatePhysics(p1, keys.a, keys.d);
    updatePhysics(p2, keys.left, keys.right);

    // Kamera
    const centerX = (p1.playerX + p2.playerX) / 2;
    const targetCameraX = (centerX + (spriteWidth * scale) / 2) - (canvas.width / 2);
    cameraX += (targetCameraX - cameraX) * 0.08;

    // Uppdaterar animationer & UI
    updateAnimation(p1);
    updateAnimation(p2);
    updateInfoBars();

    // Rita spelare
    drawPlayer(p1);
    drawPlayer(p2);

    // Hantera animation (15 FPS)
    if (timestamp - lastTimestamp > (1000 / 15)) {
        // P1
        p1.frameIndex = (p1.frameIndex + 1) % p1.totalFrames;
        if (p1.isAttacking && p1.frameIndex >= p1.totalFrames - 1) p1.isAttacking = false;

        // P2
        p2.frameIndex = (p2.frameIndex + 1) % p2.totalFrames;
        if (p2.isAttacking && p2.frameIndex >= p2.totalFrames - 1) p2.isAttacking = false;

        lastTimestamp = timestamp;
    }

    requestAnimationFrame(draw);
}

// INPUT

window.addEventListener("keydown", (e) => {
    // P1
    if (e.code === "KeyW" && p1.jumpCount < maxJumps) { p1.velocityY = -12; p1.jumpCount++; jumpSound.cloneNode().play(); }
    if (e.code === "KeyA") keys.a = true;
    if (e.code === "KeyD") keys.d = true;
    if (e.code === "KeyF" && !p1.isAttacking) { p1.isAttacking = true; punchSound.cloneNode().play(); }
    if (e.code === "KeyH") {takeDamage(p1, 10)};

    // P2
    if (e.code === "ArrowUp" && p2.jumpCount < maxJumps) { p2.velocityY = -12; p2.jumpCount++; jumpSound.cloneNode().play(); }
    if (e.code === "ArrowLeft") keys.left = true;
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "Slash" && !p2.isAttacking) { p2.isAttacking = true; punchSound.cloneNode().play(); }
    if (e.code === "KeyH") {takeDamage(p2, 10)};

    if (e.code === "Escape") {
        gamePaused = !gamePaused;
        menuPanel.classList.toggle("active", gamePaused);
    }
});

window.addEventListener("keyup", (e) => {
    if (e.code === "KeyA") keys.a = false;
    if (e.code === "KeyD") keys.d = false;
    if (e.code === "ArrowLeft") keys.left = false;
    if (e.code === "ArrowRight") keys.right = false;
});

// START
startBtn.addEventListener("click", () => {
    mainMenu.style.display = "none";
    gameStarted = true;
    gameLoopMusic.play();
});

menuBtn.addEventListener("click", () => {
    gamePaused = !gamePaused;
    menuPanel.classList.toggle("active", gamePaused);
});

// Start
requestAnimationFrame(draw);