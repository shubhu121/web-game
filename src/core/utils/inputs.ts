import Phaser from 'phaser';
import { Player } from '../prefabs/player';
import { useStore } from 'src/stores/app';
import { Enemy } from '../prefabs/enemy';

const store = useStore();

export class PlayerInput {
	scene: Phaser.Scene;
	sprite: Player;
	up: Phaser.Input.Keyboard.Key;
	left: Phaser.Input.Keyboard.Key;
	down: Phaser.Input.Keyboard.Key;
	right: Phaser.Input.Keyboard.Key;
	space: Phaser.Input.Keyboard.Key;
	LEFT_CLICK: boolean;
	ROLLING: boolean;
	CASTING: boolean;
	HURT: boolean;
	MOVING: boolean;
	DEAD: boolean;
	speed: number;

	constructor(scene: Phaser.Scene, sprite: Player) {
		this.scene = scene;
		this.sprite = sprite;

		this.up = this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.W
		);
		this.left = this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.A
		);
		this.down = this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.S
		);
		this.right = this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.D
		);
		this.space = this.scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE
		);

		this.scene.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
			if (ptr.button == 0) this.LEFT_CLICK = true;
			if (ptr.button == 2 && store.specialCount > 0) this.ROLLING = true;
		});
		this.scene.input.on('pointerup', (ptr: Phaser.Input.Pointer) => {
			if (ptr.button == 0) this.LEFT_CLICK = false;
			if (ptr.button == 2) this.ROLLING = false;
		});
		this.space.on('down', () => {
			if (store.specialCount > 0) this.CASTING = true;
		});

		this.speed = 400;
		this.HURT = false;
		this.ROLLING = false;
		this.CASTING = false;
		this.MOVING = false;
		this.DEAD = false;
		this.LEFT_CLICK = false;
	}

	getActions() {
		if (this.sprite.health <= 0) {
			this.DEAD = true;
			this.LEFT_CLICK = false;
			this.MOVING = false;
		} else
			this.MOVING =
				this.up.isDown ||
				this.left.isDown ||
				this.down.isDown ||
				this.right.isDown;
	}

	movement() {
		if (!this.DEAD && !store.paused) {
			if (this.up.isDown) {
				this.sprite.setVelocityY(-this.speed);
			} else if (this.down.isDown) {
				this.sprite.setVelocityY(this.speed);
			}
			if (this.left.isDown) {
				this.sprite.flipX = true;
				this.sprite.body.setOffset(8, 8);
				this.sprite.setVelocityX(-this.speed);
			} else if (this.right.isDown) {
				this.sprite.flipX = false;
				this.sprite.body.setOffset(5, 8);
				this.sprite.setVelocityX(this.speed);
			}

			if (this.left.isDown && this.up.isDown) {
				this.sprite.setVelocityX(-this.speed / 1.44);
				this.sprite.setVelocityY(-this.speed / 1.44);
			}
			if (this.right.isDown && this.up.isDown) {
				this.sprite.setVelocityX(this.speed / 1.44);
				this.sprite.setVelocityY(-this.speed / 1.44);
			}
			if (this.right.isDown && this.down.isDown) {
				this.sprite.setVelocityX(this.speed / 1.44);
				this.sprite.setVelocityY(this.speed / 1.44);
			}
			if (this.left.isDown && this.down.isDown) {
				this.sprite.setVelocityX(-this.speed / 1.44);
				this.sprite.setVelocityY(this.speed / 1.44);
			}

			if (this.up.isUp && this.down.isUp) {
				this.sprite.setVelocityY(0);
			}
			if (this.left.isUp && this.right.isUp) {
				this.sprite.setVelocityX(0);
			}
		}
	}
}

export class EnemyInput {
	scene: Phaser.Scene;
	sprite: Enemy;
	HURT: boolean;
	DEAD: boolean;
	MOVING: boolean;
	speed: number;
	followDistance: number;

	constructor(scene: Phaser.Scene, sprite: Enemy) {
		this.scene = scene;
		this.sprite = sprite;
		this.HURT = false;
		this.DEAD = false;
		this.MOVING = false;
		this.speed = 100;
		this.followDistance = 100;
	}

	getActions() {
		if (!this.DEAD) {
			this.sprite.distX = Math.abs(store.playerX - this.sprite.x);
			this.sprite.distY = Math.abs(store.playerY - this.sprite.y);
			if (
				this.sprite.distX < this.followDistance ||
				this.sprite.distY < this.followDistance
			)
				this.sprite.follow = true;
			else {
				this.sprite.follow = false;
				this.sprite.setVelocity(0);
				this.MOVING = false;
			}

			if (this.sprite.follow) {
				if (
					(this.sprite.distX > this.sprite.offsetX ||
						this.sprite.distY > this.sprite.offsetY) &&
					this.sprite.distX < 700 &&
					this.sprite.distY < 700
				) {
					this.scene.physics.moveTo(
						this.sprite,
						store.playerX,
						store.playerY - this.sprite.height / 2,
						this.speed
					);
					this.MOVING = true;
				} else {
					this.sprite.setVelocity(0);
					this.MOVING = false;
				}
			}

			if (this.sprite.body.velocity.x < 0) this.sprite.flipX = true;
			else if (this.sprite.body.velocity.x > 0) this.sprite.flipX = false;
		}
	}
}
