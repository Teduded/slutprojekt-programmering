

const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

const scrollSpeed = 1.5

// SPRITES
const idleSprite = new Image()
idleSprite.src = "playerassets/Cyborg/cyborg_idle.png"

const jumpSprite = new Image()
jumpSprite.src = "playerassets/Cyborg/cyborg_jump.png"

const runSprite = new Image()
runSprite.src = "playerassets/Cyborg/cyborg_run.png"

const doublejumpSprite = new Image()
doublejumpSprite.src = "playerassets/Cyborg/cyborg_doublejump.png"

const attackSprite = new Image()
attackSprite.src = "playerassets/Cyborg/cyborg_attack3.png"

const hurtSprite = new Image()
hurtSprite.src = "playerassets/Cyborg/cyborg_hurt.png"

const deathSprite = new Image()
deathSprite.src = "playerassets/Cyborg/cyborg_death.png"

// BACKGROUND
const bgLayers = []
for (let i = 1; i <= 4; i++) {
    const img = new Image()
    img.src = `backgrounds/city 2/${i}.png`
    bgLayers.push(img)
}

const bgSpeeds = [0.025, 0.05, 0.075, 0.1]
let bgOffset = 0


//  SPRITE DATA 
const spriteWidth = 48
const spriteHeight = 48
const scale = 2
let facingRight = true

const frameWidth = 48
const frameHeight = 48
const sheetOffsetX = -8
const sheetOffsetY = 0

let jumpCount = 0
const maxJumps = 2

//  PLAYER 
let playerX = 0
let playerY = canvas.height - spriteHeight
let velocityY = 0
const gravity = 0.5
let velocityX = 0
const moveSpeed = 5
let cameraX = playerX - ((canvas.width / 2) + (spriteWidth / 2))

//  GROUND 
const ground = canvas.height - (spriteHeight * scale)

//  ANIMATION 
let frameIndex = 0
let spriteIndex = 0
let totalFrames = 4

// STATE 
let currentSprite = idleSprite
let lastSprite = idleSprite
let gamePaused = false
let isAttacking = false
let attackFrames = 8

let health = 100;
let maxHealth = 100;
const healthFill = document.getElementById("healthFill");

//  FPS CONTROL (bara animation) 
let lastTimestamp = 0
const animationFPS = 15
const animationInterval = 1000 / animationFPS

const keys = {
    left: false,
    right: false
}

// MAIN MENU KNAPP
const startBtn = document.getElementById("startBtn")
const mainMenu = document.getElementById("mainMenu")

let gameStarted = false

//  SOUND
const startSound = new Audio("sounds/start.mp3")
const jumpSound = new Audio("sounds/jump.mp3")
const gameLoopMusic = new Audio("sounds/gameloop.mp3")
const punchSound = new Audio("sounds/punch.mp3")
gameLoopMusic.loop = true
gameLoopMusic.volume = 0.3

startBtn.addEventListener("click", () => {
    mainMenu.style.display = "none"
    gameStarted = true
    startSound.play()
    gameLoopMusic.currentTime = 0
    gameLoopMusic.play()
})

//  INPUT 
window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" || e.code === "KeyW") {
        if (jumpCount < maxJumps) {
            velocityY = -12
            jumpCount++
            const s = jumpSound.cloneNode()
            s.play()
        }
    }

    if (e.code === "ArrowDown" || e.code === "KeyS") {
        if ((jumpCount = maxJumps) && (playerY < (window.innerHeight * 0.45))) {
            velocityY = 15
        }
    }

    if (e.code === "ArrowRight" || e.code === "KeyD") {
        keys.right = true
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keys.left = true
    }

    if (e.code === "KeyF" && !isAttacking) {
        isAttacking = true;
        currentSprite = attackSprite;
        
        const s = punchSound.cloneNode();
        s.volume = 0.5;
        s.play();
    }
    
    if (e.code === "Escape") {
        gamePaused = !gamePaused

        menuPanel.classList.toggle("active", gamePaused)

        if (gamePaused) {
            gameLoopMusic.pause()
        } else if (gameStarted) {
            gameLoopMusic.play()
        }
    }

    // TEST FÖR DAMAGE
    if (e.code === "KeyH") {
        takeDamage(10);
    }
})

window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowRight" || e.code === "KeyD") {
        keys.right = false
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keys.left = false
    }
})

// ÖPPNA MENY
const menuBtn = document.getElementById("menuBtn")
const menuPanel = document.getElementById("menuPanel")

let menuOpen = false

menuBtn.addEventListener("click", () => {
    gamePaused = !gamePaused

    menuPanel.classList.toggle("active", gamePaused)

    if (gamePaused) {
        gameLoopMusic.pause()
    } else if (gameStarted) {
        gameLoopMusic.play()
    }
})

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

let Name = "Player"
const playerName = document.getElementById("playerName")

// INFO BAR
function updateInfoBars() {
    playerName.textContent = Name;
    
    // Räkna ut procent
    const healthPercentage = (health / maxHealth) * 100;
    
    // Uppdatera bredden på diven
    healthFill.style.width = healthPercentage + "%";

    // Byter färg om låg hp
    if (healthPercentage < 30) {
        healthFill.style.background = "red";
    } else {
        healthFill.style.background = "linear-gradient(to right, #00ff0d, #91ff31)";
    }


}

// DAMAGE
let isHurt = false
function takeDamage(amount) {
    health -= amount;
    isHurt = true

    setTimeout(() => {
        isHurt = false
    }, 500)

    if (health < 0) health = 0;
    
    // Om du vill ha en "skaka-skärm" effekt eller döds-logik
    if (health === 0) {
        console.log("Game Over");
        // Här kan du lägga till logik för vad som händer när man dör
    }
}

let lookAhead = 0;

//  PHYSICS 
function updatePhysics() {
    velocityY += gravity
    playerY += velocityY

    const targetCameraX = (playerX + (spriteWidth * scale) / 2) - (canvas.width / 2)
    cameraX += (targetCameraX - cameraX) * 0.08

    if (keys.right && !keys.left) {
        velocityX = moveSpeed
        facingRight = true
    } 
    else if (keys.left && !keys.right) {
        velocityX = -moveSpeed
        facingRight = false
    } 
    else {
        velocityX = 0
    }

    playerX += velocityX

    // FIX: ground collision
    if (playerY >= ground) {
        playerY = ground
        velocityY = 0
        jumpCount = 0
    }
}

// MAIN LOOP 
function draw(timestamp) {
    if (!gameStarted) {
        requestAnimationFrame(draw)
        return
    }

    if (gamePaused) {
        requestAnimationFrame(draw)
        return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // BACKGROUND
    drawBackground()
    //  PHYSICS
    updatePhysics()
    // INFO BARS
    updateInfoBars()

    // CHOOSES ANIMATION
    const isOnGround = playerY >= ground;

    if (isHurt) {
        currentSprite = hurtSprite;
        totalFrames = 2;
    } else if (isAttacking) {
        currentSprite = attackSprite;
        totalFrames = 8;
    } else {
        totalFrames = 4;
        if ((!isOnGround) && (jumpCount === 2)) {
            currentSprite = doublejumpSprite;
        } else if (!isOnGround) {
            currentSprite = jumpSprite;
        } else if (velocityX !== 0) {
            currentSprite = runSprite;
        } else {
            currentSprite = idleSprite;
        }
    }

    //  RESET ANIMATION VID BYTE 
    if (currentSprite !== lastSprite) {
        frameIndex = 0
        spriteIndex = 0
        lastSprite = currentSprite
    }
    
    //  ANIMATION (15 FPS) 
    const currentInterval = isAttacking ? (animationInterval / 2) : animationInterval

    if (timestamp - lastTimestamp > currentInterval) {
        if (isAttacking && frameIndex >= totalFrames - 1) {
            // Attacken är klar!
            isAttacking = false;
            frameIndex = 0;
        } else {
            frameIndex = (frameIndex + 1) % totalFrames;
        }
        lastTimestamp = timestamp;
    }

    // RITA
    ctx.save()

    const screenX = playerX - cameraX
    const screenY = playerY

    if (!facingRight) {
        ctx.translate(screenX + spriteWidth * scale, screenY)
        ctx.scale(-1, 1)
        ctx.drawImage(
            currentSprite,
            sheetOffsetX + frameIndex * frameWidth,
            sheetOffsetY,
            spriteWidth,
            spriteHeight,
            0,
            0,
            spriteWidth * scale,
            spriteHeight * scale
        )
    } else {
        ctx.translate(screenX, screenY)
        ctx.drawImage(
            currentSprite,
            sheetOffsetX + frameIndex * frameWidth,
            sheetOffsetY,
            spriteWidth,
            spriteHeight,
            0,
            0,
            spriteWidth * scale,
            spriteHeight * scale
        )
    }

    ctx.restore()

    requestAnimationFrame(draw)
}

//  START 
idleSprite.onload = () => {
    requestAnimationFrame(draw)
}