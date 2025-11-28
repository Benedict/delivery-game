<script>
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Dice of Debt</title>
</svelte:head>

{@render children()}
