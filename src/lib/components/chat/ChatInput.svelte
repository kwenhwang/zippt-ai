<script lang="ts">
	import { ArrowUp, StopCircle, Mic } from 'lucide-svelte';
	import { Textarea } from '$lib/components/ui/textarea';

	interface Props {
		input: string;
		isLoading: boolean;
		isStreaming: boolean;
		onInput: (value: string) => void;
		onSubmit: () => void;
		onStop: () => void;
	}

	let { input, isLoading, isStreaming, onInput, onSubmit, onStop }: Props = $props();
	
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	function adjustHeight() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
		}
	}

	$effect(() => {
		// When input changes externally (e.g. cleared), adjust height
		if (textareaRef && input === '') {
			adjustHeight();
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
			e.preventDefault();
			onSubmit();
		}
	}
</script>

<div class="max-w-3xl mx-auto">
	<div 
		class="relative glass rounded-[28px] shadow-[var(--shadow-md)] transition-all duration-500 focus-within:shadow-[var(--shadow-lg)] focus-within:border-[var(--accent-primary)]/30 focus-within:ring-8 focus-within:ring-[var(--accent-primary)]/5 bg-[var(--bg-card)] backdrop-blur-2xl"
	>
		<Textarea
			bind:ref={textareaRef}
			value={input}
			oninput={(e) => {
				onInput(e.currentTarget.value);
				adjustHeight();
			}}
			onkeydown={handleKeydown}
			placeholder="메시지를 입력하세요..."
			class="w-full bg-transparent border-none focus-visible:ring-0 resize-none py-4 pl-14 pr-16 min-h-[60px] max-h-[200px] text-[16px] leading-[1.6] placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)] transition-all"
			rows={1}
			disabled={isLoading || isStreaming}
			aria-label="메시지 입력"
		/>

		<div class="absolute left-2 bottom-2">
			<button
				type="button"
				class="w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-all duration-300 active:scale-90"
				aria-label="음성 입력"
				onclick={() => {}}
			>
				<Mic size={20} strokeWidth={2} />
			</button>
		</div>
		
		<div class="absolute right-2 bottom-2">
			{#if isStreaming}
				<button
					onclick={onStop}
					class="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 transition-all shadow-sm active:scale-90"
					aria-label="중지"
				>
					<StopCircle size={18} fill="currentColor" />
				</button>
			{:else}
				<button
					onclick={onSubmit}
					disabled={!input.trim() || isLoading}
					class="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-highlight)] text-white disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed hover:shadow-lg hover:shadow-orange-500/20 hover:scale-105 transition-all shadow-md active:scale-90"
					aria-label="전송"
				>
					<ArrowUp size={20} strokeWidth={3} />
				</button>
			{/if}
		</div>
	</div>
	
	<div class="text-center mt-3 text-[11px] text-[var(--text-tertiary)] font-medium">
		AI는 부정확할 수 있습니다. 중요한 결정 시 전문가와 상담하세요.
	</div>
</div>
