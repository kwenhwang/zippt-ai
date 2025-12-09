<script lang="ts">
	import SparklesIcon from '../icons/sparkles.svelte';
	import { fly } from 'svelte/transition';
	import { TypingIndicator } from '../ui/typing-indicator';
	import { Card } from '../ui/card';
</script>

<div
	class="group/message mx-auto w-full max-w-3xl px-4"
	data-role="assistant"
	in:fly|global={{ opacity: 0, y: 5 }}
>
	<div class="flex gap-4 w-full">
		<div class="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border bg-background">
			<SparklesIcon size={14} />
		</div>

		<div class="flex-1">
			<Card class="p-5 bg-zinc-800/50 border-zinc-700 shadow-xl">
				<TypingIndicator message="답변을 생성하고 있습니다..." />
			</Card>
		</div>
	</div>
</div>
