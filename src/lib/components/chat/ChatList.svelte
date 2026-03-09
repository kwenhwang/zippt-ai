<script lang="ts">
	/*
	  @file ChatList.svelte - 채팅 메시지 목록 렌더러
	  @status PRODUCTION - 정상 동작 중

	  ## ✅ 이미 구현된 기능 (중복 구현 금지)
	  - processSteps 진행 단계 표시 (spinner/checkmark)
	  - 15초 이상 대기 시 순환 메시지 자동 교체 (WAIT_MESSAGES, 15초 간격)
	  - 마크다운 렌더링 (marked + DOMPurify)
	  - 위젯 파싱 및 렌더링 (parseWidgetFromContent)
	  - 메시지 편집 모드 (editingMessageId)
	  - 인용 표시 (CitationsBar)

	  ## ⚠️ streamStartTime prop 필수
	  - page.svelte에서 반드시 전달받아야 함
	  - 이 값이 0이면 순환 메시지 기능이 동작하지 않음

	  ## ⚠️ waitTimer 메모리 누수 주의
	  - $effect 클린업에서 clearInterval 호출 중
	  - 컴포넌트 수정 시 타이머 정리 로직 유지 필수
	*/
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Sparkles, Check } from 'lucide-svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import MessageToolbar from '$lib/components/chat/MessageToolbar.svelte';
	import CitationsBar from '$lib/components/chat/CitationsBar.svelte';
	import ThinkingIndicator from '$lib/components/chat/ThinkingIndicator.svelte';
	import { WidgetRenderer } from '$lib/components/widgets';
	import { parseWidgetFromContent, parseWidgetFromToolResult } from '$lib/utils/widget-mapper';
	import type { Message } from '$lib/types/chat';

	interface Props {
		messages: Message[];
		isLoading: boolean;
		isStreaming: boolean;
		chatError: string | null;
		editingMessageId: string | null;
		editContent: string;
		isBrowser: boolean;
		streamStartTime: number;
		onRegenerate: (id: string) => void;
		onEditStart: (id: string) => void;
		onEditCancel: () => void;
		onEditSave: (id: string) => void;
		onCopy: (content: string) => void;
		onFeedback: (id: string, type: 'like' | 'dislike' | null) => void;
		onShareImage: (id: string) => void;
		onKakaoShare: (id: string) => void;
		bindEditContent: (val: string) => void;
	}

	let {
		messages,
		isLoading,
		isStreaming,
		chatError,
		editingMessageId,
		editContent,
		isBrowser,
		streamStartTime,
		onRegenerate,
		onEditStart,
		onEditCancel,
		onEditSave,
		onCopy,
		onFeedback,
		onShareImage,
		onKakaoShare,
		bindEditContent
	}: Props = $props();

	// ✅ 순환 대기 메시지: 15초 이상 pending 상태 시 자동 교체 (15초 간격)
	// Backend Queue COMPLEX 질문(60~90초) 대기 UX 개선용
	const WAIT_MESSAGES = [
		'AI 분석 중...',
		'부동산 데이터 10.7M건 분석 중...',
		'최적의 답변을 생성하고 있습니다...',
		'거의 완성됐습니다! 잠시만 기다려주세요...',
		'복잡한 분석입니다. 최대 2분 소요됩니다.'
	];

	let waitMsgIdx = $state(0);
	let waitTimer = $state<ReturnType<typeof setInterval> | null>(null);

	// ⚠️ 타이머 생명주기 관리: pending 감지 → 타이머 시작, 완료 → 타이머 정리
	// clearInterval 제거 시 메모리 누수 발생
	$effect(() => {
		const lastMsg = messages[messages.length - 1];
		const hasPending = lastMsg?.processSteps?.some((s: { status: string }) => s.status === 'pending');

		if (hasPending && streamStartTime > 0) {
			const elapsed = (Date.now() - streamStartTime) / 1000;
			if (elapsed > 15 && !waitTimer) {
				waitMsgIdx = Math.min(
					Math.floor((elapsed - 15) / 15),
					WAIT_MESSAGES.length - 1
				);
				waitTimer = setInterval(() => {
					waitMsgIdx = Math.min(waitMsgIdx + 1, WAIT_MESSAGES.length - 1);
				}, 15000);
			}
		} else {
			if (waitTimer) {
				clearInterval(waitTimer);
				waitTimer = null;
				waitMsgIdx = 0;
			}
		}
	});

	function renderMarkdown(text: string): string {
		if (!isBrowser) return text;
		const rawHtml = marked.parse(text) as string;
		return DOMPurify.sanitize(rawHtml);
	}
</script>

<div class="space-y-6">
	{#each messages as message, idx (message.id)}
		<div 
			class="flex w-full {message.role === 'user' ? 'justify-end' : 'justify-start'} group/message animate-slide-up"
			style="animation-delay: {idx * 0.05}s"
		>
			<div class="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%]">
				{#if message.role === 'assistant'}
					<div class="flex items-center gap-2 mb-0.5 px-1">
						<div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
							<Sparkles size={13} />
						</div>
						<span class="text-[11px] font-bold tracking-tight text-[var(--text-tertiary)] uppercase">{message.model || 'ZIPPT AI'}</span>
					</div>
				{/if}

				<div class="
					relative px-5 py-3.5 shadow-sm text-[15px] leading-[1.6] transition-all duration-300
					{message.role === 'user' 
						? 'bg-[var(--accent-primary)] text-white rounded-[var(--radius-msg-user)] shadow-orange-500/10' 
						: 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-[var(--radius-msg-bot)] backdrop-blur-md'}
					hover:shadow-md
				">
					{#if editingMessageId === message.id}
						<!-- Edit Mode -->
						<div class="flex flex-col gap-3 min-w-[280px] sm:min-w-[400px]">
							<Textarea 
								value={editContent}
								oninput={(e) => bindEditContent(e.currentTarget.value)}
								class="min-h-[120px] bg-[var(--bg-secondary)] border-[var(--border-medium)] rounded-xl focus:ring-[var(--accent-primary)]"
							/>
							<div class="flex gap-2 justify-end">
								<Button size="sm" variant="ghost" onclick={onEditCancel} class="text-[var(--text-secondary)]">취소</Button>
								<Button size="sm" onclick={() => onEditSave(message.id)} class="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-4">수정 완료</Button>
							</div>
						</div>
					{:else}
						{#if message.role === 'assistant' && message.processSteps}
							<div class="flex flex-col gap-1.5 mb-3">
								{#each message.processSteps as step, stepIdx}
									<!-- ⚠️ stepIdx 필수: 마지막 pending step에만 순환 메시지 적용 -->
								{@const isLastPending = step.status === 'pending' && stepIdx === message.processSteps!.length - 1}
									<div class="flex items-center gap-2 text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--bg-secondary)]/50 px-3 py-1.5 rounded-full w-fit">
										{#if step.status === 'pending'}
											<div class="w-2.5 h-2.5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
										{:else}
											<Check class="w-2.5 h-2.5 text-green-500" />
										{/if}
										<span>
											{#if isLastPending && waitMsgIdx > 0}
												{WAIT_MESSAGES[waitMsgIdx]}
											{:else}
												{step.content}
											{/if}
										</span>
									</div>
									{#if step.type === 'tool' && step.status === 'done' && step.toolResult}
										{@const toolWidget = parseWidgetFromToolResult(step.toolResult)}
										{#if toolWidget}
											<div class="mt-2">
												<WidgetRenderer widget={toolWidget} />
											</div>
										{/if}
									{/if}
								{/each}
							</div>
						{/if}

						{#if message.role === 'user'}
							<div class="whitespace-pre-wrap">{message.content}</div>
						{:else}
							{#if !message.content && (!message.processSteps || message.processSteps.length === 0)}
								<!-- Initial loading state -->
								<ThinkingIndicator />
							{/if}
							{@const parsed = parseWidgetFromContent(message.content)}
							<div class="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-[var(--bg-tertiary)]">
								{@html renderMarkdown(parsed.text)}
							</div>
							{#if parsed.widget}
								<div class="mt-4 -mx-1 sm:-mx-2">
									<WidgetRenderer widget={parsed.widget} />
								</div>
							{/if}
						{/if}
					{/if}

					<!-- Citations -->
					{#if message.citations && message.citations.length > 0}
						<CitationsBar citations={message.citations} />
					{/if}
				</div>

				<!-- Toolbar -->
				{#if !editingMessageId || editingMessageId !== message.id}
					<div class="mt-1 px-1">
						<MessageToolbar 
							{message}
							onCopy={onCopy}
							onFeedback={onFeedback}
							onRegenerate={onRegenerate}
							onEdit={onEditStart}
							{onShareImage}
							{onKakaoShare}
						/>
					</div>
				{/if}
			</div>
		</div>
	{/each}

	<!-- Loading State (only initial connection before stream) -->
	{#if isLoading && !isStreaming && messages[messages.length-1]?.role === 'user'}
		<div class="flex justify-start w-full" in:fade>
			<ThinkingIndicator />
		</div>
	{/if}

	{#if chatError}
		<div class="flex justify-center py-4" in:fade>
			<div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
				<span>⚠️ {chatError}</span>
				<button onclick={() => onRegenerate(messages[messages.length-1]?.id)} class="underline hover:no-underline font-medium ml-1">다시 시도</button>
			</div>
		</div>
	{/if}
</div>
