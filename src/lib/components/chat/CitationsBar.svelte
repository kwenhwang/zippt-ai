<script lang="ts">
	import type { Citation } from '$lib/types/chat';
	import { ExternalLink } from 'lucide-svelte';

	export let citations: Citation[] = [];
</script>

{#if citations && citations.length > 0}
	<div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
		<span class="text-xs font-semibold text-muted-foreground mr-1 self-center">출처</span>
		{#each citations as citation}
			<a
				href={citation.url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border/50"
				aria-label={`출처 ${citation.index}: ${citation.title}`}
			>
				<span class="font-bold text-accent-primary">[{citation.index}]</span>
				<span class="truncate max-w-[150px]">{citation.title}</span>
				<ExternalLink class="h-3 w-3 opacity-50" />
			</a>
		{/each}
	</div>
{/if}
