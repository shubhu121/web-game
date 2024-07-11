import Phaser from 'phaser';
import { Logo } from './scenes/logo';
import { Play } from './scenes/play';

function launch(root: HTMLDivElement) {
	return new Phaser.Game({
		type: Phaser.AUTO,
		parent: root,
		width: 1200,
		height: 720,
		scene: [Logo, Play],
		pixelArt: true,
		autoFocus: true,
		title: '🔥Flame N Foe☠',
		version: '1.0',
		url: 'https://flame-n-foe.vercel.app/',
		disableContextMenu: true,
		backgroundColor: 0x000000,
		powerPreference: 'high-performance',
		scale: {
			mode: Phaser.Scale.FIT,
			autoCenter: Phaser.Scale.CENTER_BOTH,
			fullscreenTarget: root,
		},
		physics: {
			default: 'arcade',
			arcade: {
				gravity: { y: 0 },
			},
		},
		banner: {
			text: '#ffffff',
			background: ['#fff200', '#38f0e8', '#00bff3', '#ec008c'],
			hidePhaser: true,
		},
	});
}

export { launch };
