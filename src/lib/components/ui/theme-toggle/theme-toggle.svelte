<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import { Button } from "$lib/components/ui/button";
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';

	// mode는 store가 아니라 reactive 객체이므로 .current를 사용
	let isDark = $derived(mode.current === 'dark');
</script>

<Button
	onclick={toggleMode}
	variant="ghost"
	size="icon"
	class="rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
	aria-label="테마 전환"
>
	{#if isDark}
		<Sun class="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
	{:else}
		<Moon class="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
	{/if}
</Button>
