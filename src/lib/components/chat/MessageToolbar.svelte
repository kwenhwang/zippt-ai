<script lang="ts">
	import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Edit2, Check, Bookmark, Share2, ImageDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { Message } from '$lib/types/chat';
	import { fade } from 'svelte/transition';

	interface Props {
		message: Message;
		onCopy: (content: string) => void;
		onFeedback: (id: string, feedback: 'like' | 'dislike' | null) => void;
		onRegenerate: (id: string) => void;
		onEdit: (id: string) => void;
		onShareImage: (id: string) => void;
	}

	let { message, onCopy, onFeedback, onRegenerate, onEdit, onShareImage }: Props = $props();

	let isCopied = $state(false);
	let isShared = $state(false);

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

	async function handleShare() {
		const shareText = message.content.slice(0, 100) + (message.content.length > 100 ? '...' : '');
		const shareData = {
			title: 'Zippt AI 부동산 답변',
			text: shareText,
			url: 'https://zippt-ai.vercel.app'
		};

		try {
			if (navigator.share && navigator.canShare?.(shareData)) {
				// 모바일 네이티브 공유 시트
				await navigator.share(shareData);
			} else {
				// 폴백: URL 클립보드 복사
				await navigator.clipboard.writeText('https://zippt-ai.vercel.app');
				isShared = true;
				setTimeout(() => { isShared = false; }, 2000);
			}
		} catch (e) {
			// 사용자가 공유 취소한 경우 무시
			if (e instanceof Error && e.name !== 'AbortError') {
				console.error('Share failed:', e);
			}
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
			class="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
			onclick={handleShare}
			aria-label="공유하기"
		>
			{#if isShared}
				<Check class="h-3.5 w-3.5 text-green-500" />
			{:else}
				<Share2 class="h-3.5 w-3.5" />
			{/if}
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
			class="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors"
			onclick={() => onShareImage(message.id)}
			aria-label="이미지로 공유"
			title="이미지 카드로 공유"
		>
			<ImageDown class="h-3.5 w-3.5" />
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
