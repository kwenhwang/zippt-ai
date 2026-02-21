<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
</script>

<div class="flex flex-col gap-2 mb-3" role="status" aria-live="polite">
	<div class="flex items-center gap-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/50 px-4 py-3 rounded-2xl animate-in fade-in slide-in-from-left-2 duration-300 w-fit">
		<div class="relative flex items-center justify-center w-5 h-5">
			<!-- AI Pulse Effect -->
			<span class="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-20 animate-ping"></span>
			<Sparkles class="w-4 h-4 text-orange-500 relative z-10 animate-pulse" />
		</div>
		<span class="font-medium bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
			분석중입니다...
		</span>
	</div>
</div>
