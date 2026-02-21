<script lang="ts">
	import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Edit2, Check, Bookmark } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Message } from '$lib/types/chat';
	import { fade } from 'svelte/transition';

	interface Props {
		message: Message;
		onCopy: (content: string) => void;
		onFeedback: (id: string, feedback: 'like' | 'dislike' | null) => void;
		onRegenerate: (id: string) => void;
		onEdit: (id: string) => void;
	}

	let { message, onCopy, onFeedback, onRegenerate, onEdit }: Props = $props();

	let isCopied = $state(false);

	async function handleCopy() {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(message.content);
			} else {
				// Fallback for non-secure contexts
				const textArea = document.createElement("textarea");
				textArea.value = message.content;
				textArea.style.position = "fixed";
				textArea.style.left = "-9999px";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				try {
					document.execCommand('copy');
				} catch (err) {
					console.error('Fallback copy failed', err);
					throw err;
				}
				document.body.removeChild(textArea);
			}
			
			onCopy(message.content);
			isCopied = true;
			setTimeout(() => {
				isCopied = false;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy', e);
			alert('클립보드 복사에 실패했습니다.');
		}
	}
</script>

<div role="toolbar" aria-label="메시지 작업" class="flex items-center gap-0.5 transition-opacity duration-300" in:fade={{ duration: 200 }}>
	<Button
		variant="ghost"
		size="icon-sm"
		class="h-7 w-7 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
		onclick={handleCopy}
		aria-label="복사하기"
	>
		{#if isCopied}
			<Check class="h-3.5 w-3.5 text-green-500" />
		{:else}
			<Copy class="h-3.5 w-3.5" />
		{/if}
	</Button>

	{#if message.role === 'assistant'}
		<div class="h-3 w-[1px] bg-border mx-1"></div>

		<Button
			variant="ghost"
			size="icon-sm"
			class="h-7 w-7 {message.feedback === 'like' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
			onclick={() => onFeedback(message.id, message.feedback === 'like' ? null : 'like')}
			aria-pressed={message.feedback === 'like'}
			aria-label="좋아요"
		>
			<ThumbsUp class="h-3.5 w-3.5" />
		</Button>

		<Button
			variant="ghost"
			size="icon-sm"
			class="h-7 w-7 {message.feedback === 'dislike' ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}"
			onclick={() => onFeedback(message.id, message.feedback === 'dislike' ? null : 'dislike')}
			aria-pressed={message.feedback === 'dislike'}
			aria-label="싫어요"
		>
			<ThumbsDown class="h-3.5 w-3.5" />
		</Button>

		<Button
			variant="ghost"
			size="icon-sm"
			class="h-7 w-7 text-muted-foreground hover:text-foreground"
			onclick={() => {}}
			aria-label="북마크"
		>
			<Bookmark class="h-3.5 w-3.5" />
		</Button>

		<Button
			variant="ghost"
			size="icon-sm"
			class="h-7 w-7 text-muted-foreground hover:text-foreground"
			onclick={() => onRegenerate(message.id)}
			aria-label="다시 생성"
		>
			<RotateCcw class="h-3.5 w-3.5" />
		</Button>
	{/if}

	{#if message.role === 'user'}
		<Button
			variant="ghost"
			size="icon-sm"
			class="h-7 w-7 text-muted-foreground hover:text-foreground"
			onclick={() => onEdit(message.id)}
			aria-label="질문 수정"
		>
			<Edit2 class="h-3.5 w-3.5" />
		</Button>
	{/if}
</div>
