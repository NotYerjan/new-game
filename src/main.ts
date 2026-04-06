import Phaser from "phaser";
import "./styles.css";

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const WORLD_SIZE = 2200;
const PLAYER_SPEED = 260;
const PLAYER_MAX_HP = 100;
const BULLET_SPEED = 460;
const BULLET_LIFETIME = 900;
const SHOOT_INTERVAL = 280;
const ENEMY_SPEED = 78;
const ENEMY_SPAWN_INTERVAL = 650;

type BulletSprite = Phaser.Physics.Arcade.Image & {
  bornAt: number;
};

type EnemySprite = Phaser.Physics.Arcade.Sprite & {
  hp: number;
};

class SurvivorTestScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private player!: Phaser.Physics.Arcade.Sprite;
  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hud!: Phaser.GameObjects.Text;
  private score = 0;
  private playerHp = PLAYER_MAX_HP;
  private lastShotAt = 0;
  private gameOver = false;

  constructor() {
    super("survivor-test");
  }

  create() {
    this.cameras.main.setBackgroundColor("#08141d");
    this.physics.world.setBounds(
      -WORLD_SIZE / 2,
      -WORLD_SIZE / 2,
      WORLD_SIZE,
      WORLD_SIZE,
    );

    this.createArena();

    this.player = this.physics.add
      .sprite(0, 0, "player")
      .setCollideWorldBounds(true)
      .setDrag(900, 900)
      .setMaxVelocity(PLAYER_SPEED, PLAYER_SPEED);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.1);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as Record<
      string,
      Phaser.Input.Keyboard.Key
    >;

    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 80,
      runChildUpdate: false,
    });

    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 80,
      runChildUpdate: false,
    });

    this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, undefined, this);

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerHit,
      undefined,
      this,
    );

    this.time.addEvent({
      delay: ENEMY_SPAWN_INTERVAL,
      loop: true,
      callback: this.spawnEnemy,
      callbackScope: this,
    });

    this.hud = this.add
      .text(16, 16, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#f4f1de",
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.add
      .text(16, GAME_HEIGHT - 24, "Move: WASD / Arrows  |  Auto-fire nearest enemy", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#9fb3c8",
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.updateHud();
  }

  update(time: number) {
    if (this.gameOver) {
      this.player.setVelocity(0, 0);
      return;
    }

    this.handleMovement();
    this.rotatePlayerToPointer();
    this.tryShoot(time);
    this.updateBullets(time);
    this.updateEnemies();
  }

  preload() {
    this.createTexture("player", 28, 28, 0x6fffe9);
    this.createTexture("enemy", 24, 24, 0xff6b6b);
    this.createTexture("bullet", 10, 10, 0xffd166);
  }

  private createArena() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x10212d, 1);
    graphics.fillRect(-WORLD_SIZE / 2, -WORLD_SIZE / 2, WORLD_SIZE, WORLD_SIZE);

    graphics.lineStyle(2, 0x193549, 0.8);
    for (let x = -WORLD_SIZE / 2; x <= WORLD_SIZE / 2; x += 80) {
      graphics.lineBetween(x, -WORLD_SIZE / 2, x, WORLD_SIZE / 2);
    }

    for (let y = -WORLD_SIZE / 2; y <= WORLD_SIZE / 2; y += 80) {
      graphics.lineBetween(-WORLD_SIZE / 2, y, WORLD_SIZE / 2, y);
    }

    graphics.lineStyle(8, 0x22475f, 1);
    graphics.strokeRect(-WORLD_SIZE / 2, -WORLD_SIZE / 2, WORLD_SIZE, WORLD_SIZE);
  }

  private createTexture(key: string, width: number, height: number, color: number) {
    const graphics = this.add.graphics({ x: 0, y: 0 });
    graphics.setVisible(false);
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(0, 0, width, height, Math.min(width, height) / 4);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private handleMovement() {
    let velocityX = 0;
    let velocityY = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX -= 1;
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX += 1;
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY -= 1;
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY += 1;
    }

    const direction = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
    this.player.setVelocity(direction.x * PLAYER_SPEED, direction.y * PLAYER_SPEED);
  }

  private rotatePlayerToPointer() {
    const pointer = this.input.activePointer;
    const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    this.player.setRotation(
      Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        worldPoint.x,
        worldPoint.y,
      ),
    );
  }

  private tryShoot(time: number) {
    if (time - this.lastShotAt < SHOOT_INTERVAL) {
      return;
    }

    const target = this.findNearestEnemy();
    if (!target) {
      return;
    }

    const bullet = this.bullets.get(
      this.player.x,
      this.player.y,
      "bullet",
    ) as BulletSprite | null;

    if (!bullet) {
      return;
    }

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setPosition(this.player.x, this.player.y);
    bullet.setDepth(5);
    bullet.bornAt = time;
    bullet.body?.reset(this.player.x, this.player.y);

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
    );

    this.physics.velocityFromRotation(angle, BULLET_SPEED, bullet.body!.velocity);
    this.lastShotAt = time;
  }

  private updateBullets(time: number) {
    for (const child of this.bullets.getChildren()) {
      const bullet = child as BulletSprite;
      if (!bullet.active) {
        continue;
      }

      if (time - bullet.bornAt > BULLET_LIFETIME) {
        this.recycleBullet(bullet);
      }
    }
  }

  private updateEnemies() {
    for (const child of this.enemies.getChildren()) {
      const enemy = child as EnemySprite;
      if (!enemy.active) {
        continue;
      }

      this.physics.moveToObject(enemy, this.player, ENEMY_SPEED);
      enemy.setRotation(
        Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y),
      );
    }
  }

  private spawnEnemy() {
    if (this.gameOver) {
      return;
    }

    const distance = Phaser.Math.Between(300, 460);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = this.player.x + Math.cos(angle) * distance;
    const y = this.player.y + Math.sin(angle) * distance;

    const enemy = this.enemies.get(x, y, "enemy") as EnemySprite | null;
    if (!enemy) {
      return;
    }

    enemy.setActive(true);
    enemy.setVisible(true);
    enemy.setPosition(x, y);
    enemy.setDepth(4);
    enemy.hp = 3;
    enemy.setTint(0xff6b6b);
    enemy.body?.reset(x, y);
  }

  private handleBulletHit(
    bulletGameObject:
      | Phaser.Tilemaps.Tile
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody,
    enemyGameObject:
      | Phaser.Tilemaps.Tile
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody,
  ) {
    const bullet = bulletGameObject as BulletSprite;
    const enemy = enemyGameObject as EnemySprite;

    this.recycleBullet(bullet);

    enemy.hp -= 1;
    enemy.setTint(enemy.hp === 2 ? 0xff8e72 : 0xffb4a2);

    if (enemy.hp <= 0) {
      enemy.disableBody(true, true);
      this.score += 1;
      this.updateHud();
    }
  }

  private handlePlayerHit() {
    if (this.gameOver) {
      return;
    }

    this.playerHp = Math.max(0, this.playerHp - 8);
    this.updateHud();

    this.cameras.main.shake(80, 0.005);

    if (this.playerHp <= 0) {
      this.gameOver = true;
      this.physics.pause();

      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "GAME OVER\nRefresh to restart", {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffffff",
          align: "center",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(30);
    }
  }

  private recycleBullet(bullet: BulletSprite) {
    bullet.disableBody(true, true);
  }

  private findNearestEnemy() {
    let nearest: EnemySprite | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const child of this.enemies.getChildren()) {
      const enemy = child as EnemySprite;
      if (!enemy.active) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y,
      );

      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  private updateHud() {
    this.hud.setText([
      `HP ${this.playerHp}/${PLAYER_MAX_HP}`,
      `Score ${this.score}`,
      `Enemies ${this.enemies.countActive(true)}`,
    ]);
  }
}

const gameRoot = document.querySelector<HTMLDivElement>("#game");
if (!gameRoot) {
  throw new Error("Missing #game root element");
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: gameRoot,
  backgroundColor: "#08141d",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [SurvivorTestScene],
});
