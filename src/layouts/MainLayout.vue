<template>
	<q-layout>
		<q-page-container>
			<router-view />
		</q-page-container>
	</q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: 'MainLayout',
});
</script>

<style lang="sass">
*, *::before, *::after
  box-sizing: border-box

*
  margin: 0

html, body
  height: 100%
</style>
