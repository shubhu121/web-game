<template>
	<q-page>
		<div id="game-container" ref="root" class="bg-black">
			<q-spinner-hourglass
				class="absolute-center"
				v-if="!downloaded"
				color="red"
				size="8em"
			/>
		</div>
		<q-dialog v-model="store.paused" :persistent="true">
			<q-card bordered>
				<q-card-section>
					<div class="text-h6 text-center">GAME PAUSED</div>
				</q-card-section>

				<q-card-section class="q-pt-none">
					Please click the button below to resume the game.
				</q-card-section>

				<q-card-section class="text-center">
					<q-btn color="blue" label="Play" push @click="store.togglePause()" />
				</q-card-section>
			</q-card>
		</q-dialog>
		<q-page-sticky position="bottom-right" :offset="[18, 18]">
			<q-btn
				v-if="!store.gameOver"
				color="blue"
				:icon="store.paused ? 'play_arrow' : 'pause'"
				push
				@click="store.togglePause()"
			/>
		</q-page-sticky>
		<q-page-sticky position="top-left" :offset="[18, 18]">
			<div class="relative-position">
				<q-img id="health-bg" :src="healthBarBg" />
				<div id="health-bar">
					<q-img id="health" :src="healthBar" />
				</div>
			</div>
			<div class="text-h6 text-white q-ml-lg">{{ store.health }}</div>
		</q-page-sticky>
		<q-page-sticky position="bottom-left" :offset="[18, 18]">
			<div class="text-center">
				<q-icon
					v-for="i in store.specialCount"
					:key="i"
					size="md"
					color="teal"
					name="star_rate"
				/>
			</div>
			<div class="text-h6 text-white">Special Ability</div>
		</q-page-sticky>
		<q-dialog v-model="store.gameOver" :persistent="true">
			<q-card bordered>
				<q-card-section>
					<div class="text-h6 text-center">GAME OVER</div>
				</q-card-section>

				<q-card-section class="q-pt-none">
					You Lost! Please restart the game to try again...
				</q-card-section>

				<q-card-section class="text-center">
					<q-btn color="blue" label="Restart" @click="restart" />
				</q-card-section>
			</q-card>
		</q-dialog>
		<q-page-sticky position="top-right" :offset="[18, 18]">
			<q-btn push color="blue" icon="info" @click="store.toggleInfo" />
		</q-page-sticky>
		<q-dialog v-model="store.info" :persistent="true">
			<q-card bordered>
				<q-card-section>
					<div class="text-h6 text-center">HOW TO PLAY</div>
				</q-card-section>

				<q-card-section class="q-pt-none">
					As the sun sets on the edge of the forest, you find yourself alone,
					lost in the darkness. But you are not alone for long. A floating flame
					suddenly appears, flickering and dancing in the air beside you. You
					feel a sense of comfort and safety from its warm glow, and you
					instinctively follow it deeper into the forest...
				</q-card-section>

				<q-card-section>
					<strong>Movement:</strong> Use the <strong>WASD</strong> keys to move
					the player character around the forest
				</q-card-section>

				<q-card-section>
					<strong>Attack:</strong> Press <strong>Left Click</strong> in
					succession to perform a quick attack or a 2-Hit or 3-Hit Combo that
					deal more damage to enemies. Combine these with movement to perform
					different attack strategies.
				</q-card-section>

				<q-card-section>
					<strong>Rolling Evade:</strong> To perform a roll evade, press
					<strong>Right Click</strong>, then deliver a quick attack that can
					catch enemies off guard.
				</q-card-section>

				<q-card-section>
					<strong>Illuminate:</strong> Enemies in the game only appear in the
					light cast by your companion. Use the illumination spell with
					<strong>Space</strong>
					key to reveal their presence all at once and take them down with your
					attacks
				</q-card-section>

				<q-card-section>
					<div class="text-h6 text-center text-yellow">WARNING</div>
					Using the <em>Rolling</em> or <em>Illuminate</em> ability consume
					special ability stars. Defeat enemies to replenish them, and a little
					bit of health.
				</q-card-section>

				<q-card-section class="text-center">
					<q-btn label="close" color="blue" @click="store.info = false" />
				</q-card-section>
			</q-card>
		</q-dialog>
		<q-dialog v-model="store.gameWon" :persistent="true">
			<q-card bordered>
				<q-card-section>
					<div class="text-h6 text-center">GAME WON</div>
				</q-card-section>

				<q-card-section class="q-pt-none">
					You Won! Please restart the game to explore again...
				</q-card-section>

				<q-card-section class="text-center">
					<q-btn color="blue" label="Restart" @click="restart" />
				</q-card-section>
			</q-card>
		</q-dialog>
	</q-page>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'stores/app';
import healthBarBg from 'assets/health-bar-bg.png';
import healthBar from 'assets/health-bar.png';

export default defineComponent({
	name: 'IndexPage',
	setup() {
		const store = useStore();
		const downloaded = ref(false);
		const root = ref<HTMLDivElement>();
		let gameInstance: Phaser.Game;

		const restart = () => {
			window.location.reload();
		};

		onMounted(async () => {
			const game = await import('../core/game');
			downloaded.value = true;
			nextTick(() => {
				if (typeof root.value !== 'undefined')
					gameInstance = game.launch(root.value);
			});
		});

		onUnmounted(() => {
			gameInstance?.destroy(false, false);
		});

		return {
			downloaded,
			root,
			store,
			healthBarBg,
			healthBar,
			restart,
		};
	},
});
</script>

<style lang="sass">
#game-container
  width: 100vw
  height: 100vh
  background: black
  position: fixed

#health-bg
  width: 256px
  height: 68px
  img
    image-rendering: pixelated

#health-bar
  width: 196px
  height: 68px
  position: absolute
  left: 58px
  top: 0
  overflow: hidden

#health
  width: 196px
  height: 68px
  max-width: 196px
  img
    image-rendering: pixelated
</style>
