import Phaser from 'phaser';
import { eventsCenter } from '../utils/eventsCenter';
import gsap from 'gsap';
import heroSpriteSheet from 'assets/sprites/hero.png';
import wispSpriteSheet from 'assets/sprites/wisp.png';
import bossSpriteSheet from 'assets/sprites/boss.png';
import twigSpriteSheet from 'assets/sprites/twig.png';
import leshySpriteSheet from 'assets/sprites/leshy.png';
import fog from 'assets/sprites/fog.png';
import forestTiles from 'assets/tilemaps/forestTilesetExtruded.png';
import forestTilemap from 'assets/tilemaps/woodlands.json';
import { Player } from '../prefabs/player';
import { useStore } from 'stores/app';
import { Enemy, bossAnims, twigAnims, leshyAnims } from '../prefabs/enemy';

const store = useStore();

export class Play extends Phaser.Scene {
	hero!: Player;
	camera!: Phaser.Cameras.Scene2D.Camera;
	rt!: Phaser.GameObjects.RenderTexture;
	vision!: Phaser.GameObjects.Image;

	constructor() {
		super({
			key: 'Play',
			active: true,
		});
	}

	preload() {
		this.load.spritesheet('hero', heroSpriteSheet, {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.spritesheet('wisp', wispSpriteSheet, {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.spritesheet('boss', bossSpriteSheet, {
			frameWidth: 64,
			frameHeight: 64,
		});
		this.load.spritesheet('twig', twigSpriteSheet, {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.spritesheet('leshy', leshySpriteSheet, {
			frameWidth: 32,
			frameHeight: 32,
		});
		this.load.image('fog', fog);
		this.load.image('tileset', forestTiles);
		this.load.tilemapTiledJSON('tilemap', forestTilemap);
	}

	create() {
		this.scene.setVisible(false, 'Play');
		eventsCenter.on('start-play', () => {
			this.scene
				.setVisible(false, 'Logo')
				.setVisible(true, 'Play')
				.remove('Logo');
		});

		const map = this.make.tilemap({ key: 'tilemap' });
		const tileset = map.addTilesetImage('forestTilesetExtruded', 'tileset');
		const ground = map.createLayer('Ground', tileset).setDepth(0);
		const trees = map.createLayer('Trees', tileset).setDepth(1);
		ground.setCollisionByProperty({
			collides: true,
		});
		trees.setCollisionByProperty({
			collides: true,
		});

		const playerSpawn = map.findObject(
			'Spawns',
			(obj) => obj.name === 'Player'
		);
		this.hero = new Player(
			this,
			playerSpawn.x || 163,
			playerSpawn.y || 2840,
			'hero'
		).setDepth(5);
		this.physics.world.setBounds(
			0,
			0,
			map.widthInPixels,
			map.heightInPixels
		);
		this.hero.setCollideWorldBounds(true);
		this.physics.add.collider(this.hero, ground);
		this.physics.add.collider(this.hero, trees);
		this.hero.setTint(0x5aaafa);

		const bossSpawn = map.filterObjects(
			'Spawns',
			(obj) => obj.name === 'Boss'
		);
		const twigSpawn = map.filterObjects(
			'Spawns',
			(obj) => obj.name === 'Twig'
		);
		const leshySpawn = map.filterObjects(
			'Spawns',
			(obj) => obj.name === 'Leshy'
		);

		for (const obj of bossSpawn) {
			if (obj?.x && obj?.y) {
				const boss = new Enemy(this, obj.x, obj.y, 'boss')
					.setDepth(3)
					.setScale(4);
				boss.body.setSize(35, 38);
				boss.body.setOffset(14, 27);
				boss.getAnims(bossAnims);
				boss.damage = 15;
				boss.create();
			}
		}
		for (const obj of twigSpawn) {
			if (obj?.x && obj?.y) {
				const twig = new Enemy(this, obj.x, obj.y, 'twig')
					.setDepth(3)
					.setScale(3);
				twig.body.setSize(20, 16);
				twig.body.setOffset(6, 16);
				twig.getAnims(twigAnims);
				twig.damage = 8;
				twig.create();
			}
		}
		for (const obj of leshySpawn) {
			if (obj?.x && obj?.y) {
				const leshy = new Enemy(this, obj.x, obj.y, 'leshy')
					.setDepth(3)
					.setScale(3.5);
				leshy.body.setSize(20, 16);
				leshy.body.setOffset(6, 16);
				leshy.getAnims(leshyAnims);
				leshy.damage = 10;
				leshy.create();
			}
		}

		this.camera = this.cameras.main;
		this.camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
		this.camera.startFollow(this.hero);

		// const debugGraphics = this.add.graphics().setAlpha(0.75);
		// ground.renderDebug(debugGraphics, {
		// 	tileColor: null, // Color of non-colliding tiles
		// 	collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
		// });
		// trees.renderDebug(debugGraphics, {
		// 	tileColor: null, // Color of non-colliding tiles
		// 	collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
		// });
		// this.physics.world.createDebugGraphic();

		this.rt = this.make.renderTexture(
			{
				width: map.widthInPixels,
				height: map.heightInPixels,
			},
			true
		);
		this.rt.fill(0x000000, 1);
		this.rt.draw(ground);
		this.rt.draw(trees);
		this.rt.setTint(0x031526);
		this.rt.setDepth(4);
		this.vision = this.add
			.image(this.hero.x, this.hero.y, 'fog')
			.setDepth(3)
			.setScale(3) // Should scale to 10 on spell cast
			.setAlpha(0.2);
		this.rt.mask = new Phaser.Display.Masks.BitmapMask(this, this.vision);
		this.rt.mask.invertAlpha = true;

		eventsCenter.on('cast', () => {
			gsap.to(this.vision, {
				scale: 10,
				duration: 0.5,
				onComplete: () => {
					gsap.delayedCall(3, () => {
						eventsCenter.emit('cast-end');
						gsap.to(this.vision, {
							scale: 3,
							duration: 0.5,
						});
					});
				},
			});
		});
	}

	update() {
		if (!store.paused) {
			this.vision.x = this.hero.x;
			this.vision.y = this.hero.y;
		}

		if (store.gameOver) {
			this.hero.health = 0;
			store.health = 0;
		}
	}
}
