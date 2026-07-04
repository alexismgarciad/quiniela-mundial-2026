<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Quiniela Mundial 2026</title>
	<meta
		name="description"
		content="Crea tu quiniela del Mundial 2026, invita a tus amigos y sigue los resultados en vivo."
	/>
</svelte:head>

{@render children()}
