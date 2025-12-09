<script lang="ts">
	import { Home } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
</script>

<div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-8" transition:scale={{ opacity: 0, start: 0.98 }}>
	<div class="text-center">
		<Home class="w-16 h-16 mx-auto text-orange-500 mb-4" aria-hidden="true" />
		<h2 class="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
			안녕하세요, 집피티입니다!
		</h2>
		<p class="text-zinc-400 text-lg">부동산에 대해 무엇이든 물어보세요</p>
	</div>
</div>
