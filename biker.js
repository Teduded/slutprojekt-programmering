// BIKER CHARACTER

class Biker {
    constructor(startX, canvasHeight, spriteHeight, scale) {
        this.name = "Cyborg";
        this.defineSprites();

        // FLYTTADE VARIABLER FRÅN code.js
        this.health = 100;
        this.maxHealth = 100;
        
        // Position & Rörelse
        this.playerX = startX;
        this.playerY = canvasHeight - (spriteHeight * scale);
        this.velocityY = 0;
        this.velocityX = 0;
        this.jumpCount = 0;
        this.facingRight = false;
        
        // Animation State
        this.frameIndex = 0;
        this.totalFrames = 4;
        this.isAttacking = false;
        this.isHurt = false;
        this.isDead = false;
        
        this.currentSprite = this.idleSprite;
        this.lastSprite = this.idleSprite;
    }

    defineSprites() {
        this.idleSprite = new Image();
        this.idleSprite.src = "playerassets/Biker/biker_idle.png";

        this.jumpSprite = new Image();
        this.jumpSprite.src = "playerassets/Biker/biker_jump.png";

        this.runSprite = new Image();
        this.runSprite.src = "playerassets/Biker/biker_run.png";

        this.doublejumpSprite = new Image();
        this.doublejumpSprite.src = "playerassets/Biker/biker_doublejump.png";

        this.attackSprite = new Image();
        this.attackSprite.src = "playerassets/Biker/biker_attack3.png";

        this.hurtSprite = new Image();
        this.hurtSprite.src = "playerassets/Biker/biker_hurt.png";

        this.deathSprite = new Image();
        this.deathSprite.src = "playerassets/Biker/biker_death.png";
    }
}