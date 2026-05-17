<script lang="ts">
	import { Sparkles } from 'lucide-svelte';
</script>

<div class="flex flex-col gap-2 mb-3" role="status" aria-live="polite">
	<div class="flex items-center gap-2.5 text-[13px] font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/55 px-3.5 py-2.5 rounded-[18px] animate-in fade-in slide-in-from-left-2 duration-300 w-fit">
		<div class="relative flex items-center justify-center w-[18px] h-[18px]">
			<span class="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-highlight)] opacity-20 animate-ping"></span>
			<Sparkles class="w-[13px] h-[13px] text-[var(--accent-primary)] relative z-10" />
		</div>
		<span class="bg-gradient-to-r from-[var(--accent-primary)] to-amber-400 bg-clip-text text-transparent tracking-[-0.005em]">
			분석중입니다...
		</span>
	</div>
</div>
