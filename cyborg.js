// CYBORG CHARACTER

class Cyborg {
    constructor(startX, canvasHeight, spriteHeight, scale) {
        this.name = "Cyborg";
        this.defineSprites();

        // FLYTTADE VARIABLER FRÅN MAIN
        this.health = 100;
        this.maxHealth = 100;
        
        // Position
        this.playerX = startX;
        this.playerY = canvasHeight - (spriteHeight * scale);
        this.velocityY = 0;
        this.velocityX = 0;
        this.jumpCount = 0;
        this.facingRight = true;
        
        // Animation State
        this.frameIndex = 0;
        this.totalFrames = 4;
        this.isAttacking = false;
        this.isHurt = false;
        
        this.currentSprite = this.idleSprite;
        this.lastSprite = this.idleSprite;
    }

    defineSprites() {
        this.idleSprite = new Image();
        this.idleSprite.src = "playerassets/Cyborg/cyborg_idle.png";

        this.jumpSprite = new Image();
        this.jumpSprite.src = "playerassets/Cyborg/cyborg_jump.png";

        this.runSprite = new Image();
        this.runSprite.src = "playerassets/Cyborg/cyborg_run.png";

        this.doublejumpSprite = new Image();
        this.doublejumpSprite.src = "playerassets/Cyborg/cyborg_doublejump.png";

        this.attackSprite = new Image();
        this.attackSprite.src = "playerassets/Cyborg/cyborg_attack3.png";

        this.hurtSprite = new Image();
        this.hurtSprite.src = "playerassets/Cyborg/cyborg_hurt.png";

        this.deathSprite = new Image();
        this.deathSprite.src = "playerassets/Cyborg/cyborg_death.png";
    }
}