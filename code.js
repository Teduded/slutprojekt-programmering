const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

canvas.width = window.innerWidth
canvas.height = window.innerHeight

// --- SPRITES ---
const idleSprite = new Image()
idleSprite.src = "playerassets/cyborg_idle.png"

const jumpSprite = new Image()
jumpSprite.src = "playerassets/cyborg_jump.png"

const runSprite = new Image()
runSprite.src = "playerassets/cyborg_run.png"

//  SPRITE DATA 
const spriteWidth = 48
const spriteHeight = 48
const scale = 2

const frameWidth = 48
const frameHeight = 48
const sheetOffsetX = -8
const sheetOffsetY = 0

//  PLAYER 
let playerX = window.innerWidth / 2
let playerY = window.innerHeight - spriteHeight
let velocityY = 0
const gravity = 0.5
let velocityX = 0
const moveSpeed = 5
let facingRight = true

//  GROUND 
const ground = canvas.height - (spriteHeight * scale)

//  ANIMATION 
let frameIndex = 0
let spriteIndex = 0
const totalFrames = 4

// STATE 
let currentSprite = idleSprite
let lastSprite = idleSprite

//  FPS CONTROL (bara animation) 
let lastTimestamp = 0
const animationFPS = 15
const animationInterval = 1000 / animationFPS

const keys = {
    left: false,
    right: false
}

//  INPUT 
window.addEventListener("keydown", (e) => {
    const isOnGround = playerY >= ground

    if ((e.code === "ArrowUp" || e.code === "Space" || e.code === "KeyW") && isOnGround) {
        velocityY = -12
    }

    if (e.code === "ArrowRight" || e.code === "KeyD") {
        keys.right = true
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") {
        keys.left = true
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

//  PHYSICS 
function updatePhysics() {
    velocityY += gravity
    playerY += velocityY

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

    if (playerY > ground) {
        playerY = ground
        velocityY = 0
    }
}

// MAIN LOOP 
function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    //  PHYSICS 
    updatePhysics()

    //  STATE CHECK 
    const isOnGround = playerY >= ground

    if (!isOnGround) {
        currentSprite = jumpSprite
    } else if (velocityX !== 0) {
        currentSprite = runSprite
    } else {
        currentSprite = idleSprite
    }

    //  RESET ANIMATION VID BYTE 
    if (currentSprite !== lastSprite) {
        frameIndex = 0
        spriteIndex = 0
        lastSprite = currentSprite
    }

    //  ANIMATION (15 FPS) 
    if (timestamp - lastTimestamp > animationInterval) {
        frameIndex = (frameIndex + 1) % totalFrames
        lastTimestamp = timestamp
    }

    // RITA
    ctx.save()

    if (!facingRight) {
        ctx.translate(playerX + spriteWidth * scale, playerY)
        ctx.scale(-1, 1)
    } else {
        ctx.translate(playerX, playerY)
    }

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

    ctx.restore()

    requestAnimationFrame(draw)
}

//  START 
idleSprite.onload = () => {requestAnimationFrame(draw)}