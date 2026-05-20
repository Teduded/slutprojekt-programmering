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
let gameover = false

// BAKGRUND
const bgLayers = []
for (let i = 1; i <= 4; i++) {
    const img = new Image()
    img.src = `backgrounds/city 5/${i}.png`
    bgLayers.push(img)
}
const bgSpeeds = [0.025, 0.05, 0.075, 0.1]
let bgOffset = 0

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
const doublejumpSound = new Audio("sounds/doublejump.mp3");
const punchSound = new Audio("sounds/punch.mp3");
const laserSound = new Audio("sounds/laser.mp3");
const deathSound = new Audio("sounds/death.mp3");
const gameOverMusic = new Audio("sounds/gameOverMusic.mp3");
// Ska fixa en gameloop fil senare
const gameLoop = new Audio("sounds/gameloop.mp3");
gameLoop.loop = true;

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

    if (char.isDead) {
        char.currentSprite = char.deathSprite;
        char.totalFrames = 6;
    } else if (char.isHurt) {
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
            char.totalFrames = 6;
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

// Spelare tar damage
function takeDamage(char, amount) {
    if (char.isDead) return;

    char.health -= amount;
    char.isHurt = true;
    char.isAttacking = false;

    if (char.health <= 0) {
        char.health = 0;
        char.isHurt = false;
        char.isDead = true;
        char.frameIndex = 0;
        deathSound.cloneNode().play()
        setTimeout(() => {gameOverMusic.cloneNode().play()}, 500)
    } else {
        setTimeout(() => {
            char.isHurt = false;
        }, 500);
    }
}

// När rundan är över
function gameOver() {
    gameover = true
    if (!gamePaused) {
        setTimeout(() => {
            gamePaused = true;
            menuPanel.classList.add("active"); 
            document.querySelector("#menuPanel h2").innerText = "Game Over!";
            document.querySelector("#menuPanel p").innerText = "";
        }, 200);
    }
}

// HITBOXES FÖR ATTACK
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function checkAttackHit(attacker, defender) {
    // Om anfallaren inte (slår/redan har träffat/är på frame 2) så gör den inget
    if (!attacker.isAttacking || attacker.hasHitThisAttack) return;
    if (attacker.frameIndex !== 2) return;

    // Definitierar träffyta
    const defenderBox = {
        x: defender.playerX,
        y: defender.playerY,
        width: spriteWidth * scale,
        height: spriteHeight * scale
    };

    // Slagets range
    const attackRange = 30 * scale; 
    const attackHeight = 20 * scale;

    // Räknar ut slagets position baserat på anfallarens position och riktning
    let attackX;
    if (attacker.facingRight) {
        // Startar inuti spelaren och sträcker sig ut till höger
        attackX = attacker.playerX + (spriteWidth * scale) / 2;
    } else {
        // Startar inuti spelaren och sträcker sig ut till vänster
        attackX = attacker.playerX + (spriteWidth * scale) / 2 - attackRange;
    }

    const attackBox = {
        x: attackX,
        y: attacker.playerY + (spriteHeight * scale) / 3, // Slag i brösthöjd
        width: attackRange,
        height: attackHeight
    };

    // Kolla om de krockar
    if (checkCollision(attackBox, defenderBox)) {
        takeDamage(defender, 10);
        attacker.hasHitThisAttack = true; // Hindrar att man tar skada varje frame under samma slag
    }
}

function performAttack(char, soundEffect) {
    // Om spelaren redan anfaller, är skadad eller har en aktiv cooldown -> tillåter inte attack
    if (char.isAttacking || char.isHurt || char.isDead || char.attackCooldown) return;

    // Starta attacken
    char.isAttacking = true;
    char.hasHitThisAttack = false;
    soundEffect.cloneNode().play();

    // Sätt cooldown till true
    char.attackCooldown = true;

    // Tar bort cooldownen efter 1 sek så man kan slå igen
    setTimeout(() => {
        char.attackCooldown = false;
    }, 1000); 
}

// BAKGRUND
function drawBackground() {
    for (let i = 0; i < bgLayers.length; i++) {
        const img = bgLayers[i]
        const speed = bgSpeeds[i]

        const offset = (cameraX * speed) % canvas.width
        const fixedOffset = ((offset % canvas.width) + canvas.width) % canvas.width

        ctx.drawImage(img, -fixedOffset, 0, canvas.width, canvas.height)
        ctx.drawImage(img, -fixedOffset + canvas.width, 0, canvas.width, canvas.height)
    }
}

// Ritar spelaren
function drawPlayer(char) {
    ctx.save();
    
    const screenX = char.playerX - cameraX;
    const screenY = char.playerY;

    const anchorOffset = 14 * scale; 

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
            spriteWidth - 1, spriteHeight,
            screenX, screenY,
            spriteWidth * scale, spriteHeight * scale
        );
    }
    ctx.restore();
}

// Uppdaterar spelarnas HP
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
            p1Bar.style.background = "linear-gradient(to left, #ffffff, #bdbdbd)"
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
            p2Bar.style.background = "linear-gradient(to right, #ffffff, #bdbdbd)"
        }
    }
}

// MAIN LOOP
function draw(timestamp) {
    if (!gameStarted || gamePaused) {
        requestAnimationFrame(draw);
        return;
    }

    // Kolla om någon träffar någon
    checkAttackHit(p1, p2); // Kolla om P1 slår P2
    checkAttackHit(p2, p1); // Kolla om P2 slår P1

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Uppdaterar fysik för båda
    updatePhysics(p1, keys.a, keys.d);
    updatePhysics(p2, keys.left, keys.right);

    // Kamera
    const centerX = (p1.playerX + p2.playerX) / 2;
    const bikerCameraX = (centerX + (spriteWidth * scale) / 2) - (canvas.width / 2);
    cameraX += (bikerCameraX - cameraX) * 0.08;

    // Uppdaterar animationer & UI
    updateAnimation(p1);
    updateAnimation(p2);
    updateInfoBars();
    drawBackground();

    // Rita spelare
    drawPlayer(p1);
    drawPlayer(p2);

    // Hantera animation (15 FPS) inuti draw-loop
    if (timestamp - lastTimestamp > (1000 / 15)) {
        
        // P1
        if (p1.isDead) {
            if (p1.frameIndex < p1.totalFrames - 1) p1.frameIndex++;
            else gameOver();
        } else {
            p1.frameIndex = (p1.frameIndex + 1) % p1.totalFrames;
            
            // Om attack är över, återställer träff-spärren
            if (p1.isAttacking && p1.frameIndex >= p1.totalFrames - 1) {
                p1.isAttacking = false;
                p1.hasHitThisAttack = false;
            }
        }

        // P2
        if (p2.isDead) {
            if (p2.frameIndex < p2.totalFrames - 1) p2.frameIndex++;
            else gameOver();
        } else {
            p2.frameIndex = (p2.frameIndex + 1) % p2.totalFrames;
            
            // Om attack är över, återställer träff-spärren
            if (p2.isAttacking && p2.frameIndex >= p2.totalFrames - 1) {
                p2.isAttacking = false;
                p2.hasHitThisAttack = false;
            }
        }

        lastTimestamp = timestamp;
    }

    requestAnimationFrame(draw);
}

// INPUT

window.addEventListener("keydown", (e) => {
    // P1
    if (e.code === "KeyW" && p1.jumpCount < maxJumps) { p1.velocityY = -12; p1.jumpCount++; if (p1.jumpCount > 1) {doublejumpSound.cloneNode().play()} else {jumpSound.cloneNode().play()};}
    if (e.code === "KeyA") keys.a = true;
    if (e.code === "KeyD") keys.d = true;
    if (e.code === "KeyF" && !p1.isAttacking) {performAttack(p1, punchSound);}

    // P2
    if (e.code === "ArrowUp" && p2.jumpCount < maxJumps) { p2.velocityY = -12; p2.jumpCount++; if (p2.jumpCount > 1) {doublejumpSound.cloneNode().play()} else {jumpSound.cloneNode().play()};}
    if (e.code === "ArrowLeft") keys.left = true;
    if (e.code === "ArrowRight") keys.right = true;
    if (e.code === "Slash" && !p2.isAttacking) {performAttack(p2, laserSound);}

    if (e.code === "Escape" && !gameover) {
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