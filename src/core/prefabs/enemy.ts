import Phaser from 'phaser';
import { StateMachine, State, StateStore } from '../utils/fsm';
import { useStore } from 'stores/app';
import { AnimState } from './player';
import { EnemyInput } from '../utils/inputs';
import { Play } from '../scenes/play';

const store = useStore();

class EnemyState extends State {
	controls: EnemyInput;
	constructor(sprite: Enemy, name: string, controls: EnemyInput) {
		super(sprite, name);
		this.controls = controls;
	}
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
	health: number;
	scene: Play;
	animData!: AnimState<typeof EnemyState>[];
	controls: EnemyInput;
	fsm!: StateMachine;
	name: string;
	damage!: number;
	follow: boolean;
	offsetX: number;
	offsetY: number;
	distX!: number;
	distY!: number;
	collider!: Phaser.Physics.Arcade.Collider;

	constructor(scene: Play, x: number, y: number, name: string) {
		super(scene, x, y, name);
		this.scene = scene;
		this.name = name;
		scene.add.existing(this);
		scene.physics.add.existing(this);
		this.controls = new EnemyInput(scene, this);
		this.follow = false;

		this.health = 100;
		this.offsetX = 50;
		this.offsetY = 50;
	}

	getAnims(val: AnimState<typeof EnemyState>[]) {
		this.animData = val;
	}

	create() {
		let start = -1,
			end = 0;
		const states: StateStore = {};
		for (const obj of this.animData) {
			end = start + obj.length;
			start++;
			this.anims.create({
				key: obj.name,
				frames: this.anims.generateFrameNumbers(this.name, {
					start,
					end,
				}),
				frameRate: obj?.rate ? obj.rate : 10,
				repeat: obj?.repeat ? -1 : 0,
			});
			start = end;
			if (obj?.state)
				states[obj.name] = new obj.state(this, obj.name, this.controls);
		}
		this.fsm = new StateMachine('idle', states);

		this.collider = this.scene.physics.add.overlap(
			this.scene.hero,
			this,
			() => {
				if (store.damage > 0 && this.scene.hero.flipX != this.flipX) {
					this.health -= store.damage;
					this.collider.active = false;
					this.scene.hero.on(
						'animationcomplete',
						() => (this.collider.active = true)
					);
					if (this.health <= 0) {
						this.controls.DEAD = true;
						this.removeAllListeners();
						this.fsm.transition('death');
					} else {
						this.controls.HURT = true;
						this.fsm.transition('hurt');
					}
				}
			}
		);
	}

	preUpdate(time: number, delta: number) {
		if (!store.paused) {
			super.preUpdate(time, delta);

			this.controls.getActions();

			if (!this.controls.DEAD) this.fsm.step();
		} else this.setVelocity(0);
	}
}

export const bossAnims: AnimState<typeof EnemyState>[] = [
	{
		name: 'idle',
		length: 8,
		repeat: true,
		state: class IdleState extends EnemyState {
			found!: boolean;

			enter() {
				this.sprite.play(this.name);
				this.found = false;
			}
			execute() {
				if (this.controls.MOVING) this.machine.transition('run');

				if (
					this.sprite.distX <= this.sprite.offsetX &&
					this.sprite.distY <= this.sprite.offsetY &&
					store.health > 0 &&
					!this.found
				) {
					this.found = true;
					setTimeout(() => {
						this.found = false;
						if (!this.controls.DEAD)
							this.machine.transition('attack');
					}, 1000);
				}
			}
		},
	},
	{
		name: 'run',
		length: 8,
		repeat: true,
		state: class RunState extends EnemyState {
			enter() {
				this.sprite.play(this.name);
			}
			execute() {
				if (!this.controls.MOVING) this.machine.transition('idle');
			}
			exit() {
				this.sprite.setVelocity(0);
			}
		},
	},
	{
		name: 'attack',
		length: 5,
		state: class AttackState extends EnemyState {
			hitting!: boolean;

			enter() {
				this.hitting = true;
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					if (
						this.sprite.distX <= this.sprite.offsetX &&
						this.sprite.distY <= this.sprite.offsetY &&
						this.hitting &&
						this.machine.state == 'attack'
					) {
						store.takeHit(this.sprite.damage);
					}
					this.machine.transition('idle');
				});

				this.sprite.body.setSize(47, 38);
				this.sprite.body.setOffset(this.sprite.flipX ? 2 : 14, 27);
			}
			execute() {
				this.sprite.setVelocity(0);

				if (this.controls.DEAD || this.controls.HURT)
					this.hitting = false;
			}
			exit() {
				this.sprite.body.setSize(35, 38);
				this.sprite.body.setOffset(14, 27);
			}
		},
	},
	{
		name: 'hurt',
		length: 4,
		state: class HurtState extends EnemyState {
			enter() {
				this.sprite.setVelocity(0);
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					this.machine.transition('idle');
				});
			}
			exit() {
				this.controls.HURT = false;
			}
		},
	},
	{
		name: 'death',
		length: 6,
		state: class DeathState extends EnemyState {
			enter() {
				this.sprite.setVelocity(0);
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					store.gameWon = true;
					if (store.specialCount < 3) store.specialCount += 1;
					if (store.specialCount > 3) store.specialCount = 3;
					if (store.health < 100) store.health += 5;
					if (store.health > 100) store.health = 100;
					this.sprite.active = false;
					this.sprite.visible = false;
					this.sprite.destroy(true);
				});
			}
		},
	},
];

export const twigAnims: AnimState<typeof EnemyState>[] = [
	{
		name: 'idle',
		length: 4,
		repeat: true,
		state: class IdleState extends EnemyState {
			found!: boolean;
			enter() {
				this.sprite.play(this.name);
				this.found = false;
			}
			execute() {
				if (this.controls.MOVING) this.machine.transition('run');

				if (
					this.sprite.distX <= this.sprite.offsetX &&
					this.sprite.distY <= this.sprite.offsetY &&
					store.health > 0 &&
					!this.found
				) {
					this.found = true;
					setTimeout(() => {
						this.found = false;
						if (!this.controls.DEAD)
							this.machine.transition('attack');
					}, 1000);
				}
			}
		},
	},
	{
		name: 'run',
		length: 8,
		repeat: true,
		state: class RunState extends EnemyState {
			enter() {
				this.sprite.play(this.name);
			}
			execute() {
				if (!this.controls.MOVING) this.machine.transition('idle');
			}
			exit() {
				this.sprite.setVelocity(0);
			}
		},
	},
	{
		name: 'attack',
		length: 6,
		state: class AttackState extends EnemyState {
			hitting!: boolean;

			enter() {
				this.hitting = true;
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					if (
						this.sprite.distX <= this.sprite.offsetX &&
						this.sprite.distY <= this.sprite.offsetY &&
						this.hitting &&
						this.machine.state == 'attack'
					) {
						store.takeHit(this.sprite.damage);
					}
					this.machine.transition('idle');
				});
			}
			execute() {
				this.sprite.setVelocity(0);

				if (this.controls.DEAD || this.controls.HURT)
					this.hitting = false;
			}
		},
	},
	{
		name: 'hurt',
		length: 5,
		state: class HurtState extends EnemyState {
			enter() {
				this.sprite.setVelocity(0);
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					this.machine.transition('idle');
				});
			}
			exit() {
				this.controls.HURT = false;
			}
		},
	},
	{
		name: 'death',
		length: 5,
		state: class DeathState extends EnemyState {
			enter() {
				this.sprite.setVelocity(0);
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					if (store.specialCount < 3) store.specialCount += 1;
					if (store.specialCount > 3) store.specialCount = 3;
					if (store.health < 100) store.health += 5;
					if (store.health > 100) store.health = 100;
					this.sprite.active = false;
					this.sprite.visible = false;
					this.sprite.destroy(true);
				});
			}
		},
	},
];

export const leshyAnims: AnimState<typeof EnemyState>[] = [
	{
		name: 'idle',
		length: 8,
		repeat: true,
		state: class IdleState extends EnemyState {
			found!: boolean;
			enter() {
				this.sprite.play(this.name);
				this.found = false;
			}
			execute() {
				if (this.controls.MOVING) this.machine.transition('run');

				if (
					this.sprite.distX <= this.sprite.offsetX &&
					this.sprite.distY <= this.sprite.offsetY &&
					store.health > 0 &&
					!this.found
				) {
					this.found = true;
					setTimeout(() => {
						this.found = false;
						if (!this.controls.DEAD)
							this.machine.transition('attack');
					}, 1000);
				}
			}
		},
	},
	{
		name: 'run',
		length: 8,
		repeat: true,
		state: class RunState extends EnemyState {
			enter() {
				this.sprite.play(this.name);
			}
			execute() {
				if (!this.controls.MOVING) this.machine.transition('idle');
			}
			exit() {
				this.sprite.setVelocity(0);
			}
		},
	},
	{
		name: 'attack',
		length: 7,
		state: class AttackState extends EnemyState {
			hitting!: boolean;
			enter() {
				this.hitting = true;
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					if (
						this.sprite.distX <= this.sprite.offsetX &&
						this.sprite.distY <= this.sprite.offsetY &&
						this.hitting &&
						this.machine.state == 'attack'
					) {
						store.takeHit(this.sprite.damage);
					}
					this.machine.transition('idle');
				});
			}
			execute() {
				this.sprite.setVelocity(0);

				if (this.controls.DEAD || this.controls.HURT)
					this.hitting = false;
			}
		},
	},
	{
		name: 'hurt',
		length: 4,
		state: class HurtState extends EnemyState {
			enter() {
				this.sprite.setVelocity(0);
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					this.machine.transition('idle');
				});
			}
			exit() {
				this.controls.HURT = false;
			}
		},
	},
	{
		name: 'death',
		length: 5,
		state: class DeathState extends EnemyState {
			enter() {
				this.sprite.setVelocity(0);
				this.sprite.play(this.name);
				this.sprite.once('animationcomplete', () => {
					if (store.specialCount < 3) store.specialCount += 1;
					if (store.specialCount > 3) store.specialCount = 3;
					if (store.health < 100) store.health += 5;
					if (store.health > 100) store.health = 100;
					this.sprite.active = false;
					this.sprite.visible = false;
					this.sprite.destroy(true);
				});
			}
		},
	},
];
