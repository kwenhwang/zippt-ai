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
	let focused = $state(false);
	let phIndex = $state(0);

	const PLACEHOLDERS = [
		'강남구 아파트 평균가는?',
		'래미안 퍼스티지 최근 거래는?',
		'서울 전세가율 비교해줘',
		'판교 알파리움 분석'
	];

	function adjustHeight() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
		}
	}

	$effect(() => {
		if (textareaRef && input === '') {
			adjustHeight();
		}
	});

	$effect(() => {
		if (focused || input) return;
		const t = setInterval(() => {
			phIndex = (phIndex + 1) % PLACEHOLDERS.length;
		}, 2800);
		return () => clearInterval(t);
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
		class="relative rounded-[var(--radius-3xl)] backdrop-blur-2xl backdrop-saturate-180 transition-all duration-300 ease-out border-[1.5px]"
		class:focused
		style="
			background: var(--bg-card);
			border-color: {focused ? 'rgba(234,88,12,0.45)' : 'var(--border-light)'};
			box-shadow: {focused
				? '0 0 0 6px rgba(234,88,12,0.08), 0 12px 24px -8px rgba(0,0,0,0.10)'
				: 'var(--shadow-md)'};
			min-height: 56px;
		"
	>
		<Textarea
			bind:ref={textareaRef}
			value={input}
			oninput={(e) => {
				onInput(e.currentTarget.value);
				adjustHeight();
			}}
			onfocus={() => (focused = true)}
			onblur={() => (focused = false)}
			onkeydown={handleKeydown}
			placeholder=""
			class="w-full bg-transparent border-none focus-visible:ring-0 resize-none py-4 pl-14 pr-16 min-h-[56px] max-h-[200px] text-[16px] leading-[1.4] tracking-[-0.01em] text-[var(--text-primary)] transition-all"
			rows={1}
			disabled={isLoading || isStreaming}
			aria-label="메시지 입력"
		/>

		<!-- Animated placeholder cycling -->
		{#if !input}
			<div
				class="pointer-events-none absolute left-14 right-16 top-0 bottom-0 flex items-center text-[16px] tracking-[-0.01em] text-[var(--text-quaternary)] overflow-hidden"
			>
				{#key phIndex}
					<span
						class="truncate animate-[fadeInUp_400ms_cubic-bezier(0.16,1,0.3,1)]"
					>
						{PLACEHOLDERS[phIndex]}
					</span>
				{/key}
			</div>
		{/if}

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
