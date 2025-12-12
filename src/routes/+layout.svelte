<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import InstallPrompt from '$lib/components/pwa/install-prompt.svelte';
	import OfflineBanner from '$lib/components/pwa/offline-banner.svelte';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher defaultMode="dark" />
<OfflineBanner />
<InstallPrompt />
{@render children()}
