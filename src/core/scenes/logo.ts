import Phaser from 'phaser';
import phaserLogo from 'assets/phaser-logo.png';
import gsap from 'gsap';
import { eventsCenter } from '../utils/eventsCenter';

export class Logo extends Phaser.Scene {
	constructor() {
		super({
			key: 'Logo',
		});
	}

	preload() {
		this.load.image('phaser-logo', phaserLogo);
	}

	create() {
		const camera = this.cameras.main;
		const logo = this.add
			.image(camera.centerX, camera.centerY, 'phaser-logo')
			.setScale(2.5)
			.setAlpha(0);
		const duration = 1;
		const delay = 3;
		gsap.fromTo(
			logo,
			{
				alpha: 0,
			},
			{
				alpha: 1,
				duration,
				ease: 'linear',
				onComplete: () => {
					eventsCenter.emit('start-play');
				},
			}
		)
			.yoyo(true)
			.repeatDelay(delay)
			.repeat(1);
	}
}
