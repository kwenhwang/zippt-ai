<script lang="ts">
	// AI SDK 제거 - 직접 fetch 구현 (모바일 스트리밍 호환성)
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card } from '$lib/components/ui/card';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Separator } from '$lib/components/ui/separator';
	import { TypingIndicator } from '$lib/components/ui/typing-indicator';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import {
		Home,
		Menu,
		Plus,
		Copy,
		Check,
		Trash2,
		MessageSquare,
		RefreshCw
	} from 'lucide-svelte';
	import SparklesIcon from '$lib/components/icons/sparkles.svelte';
	import ArrowUpIcon from '$lib/components/icons/arrow-up.svelte';
	import StopIcon from '$lib/components/icons/stop.svelte';
	import { WidgetRenderer } from '$lib/components/widgets';
	import { parseWidgetFromContent } from '$lib/utils/widget-mapper';

	// 메시지 타입 정의 (AI SDK UIMessage 호환)
	interface Message {
		id: string;
		role: 'user' | 'assistant';
		content: string;
	}

	interface ChatHistory {
		id: string;
		title: string;
		messages: Message[];
		createdAt: string;
	}

	// 상태 관리
	let chatContainer: HTMLElement | null = $state(null);
	let sheetOpen = $state(false);
	let chatHistory = $state<ChatHistory[]>([]);
	let currentChatId = $state<string | null>(null);
	let copiedMessageId = $state<string | null>(null);
	let isBrowser = $state(false);

	// 메시지 및 스트리밍 상태 (AI SDK 대체)
	let messages = $state<Message[]>([]);
	let isLoading = $state(false);
	let isStreaming = $state(false);
	let chatError = $state<string | null>(null);
	let abortController = $state<AbortController | null>(null);
	let thinkingStatus = $state<string | null>(null); // 도구 호출 상태 표시

	// 입력 상태 관리
	let input = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	// 스트리밍 중지
	function stopStreaming() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		isLoading = false;
		isStreaming = false;
		thinkingStatus = null;
	}

	// 도구 이름을 한글 표시 이름으로 변환
	function getToolDisplayName(toolName: string): string {
		const toolNames: Record<string, string> = {
			'get_price_stats': '시세 정보',
			'search_complexes': '아파트 단지',
			'get_complex_info': '단지 정보',
			'get_recent_trades': '실거래 내역',
			'search_api': 'API 정보',
			'compare_prices': '가격 비교'
		};
		return toolNames[toolName] || toolName;
	}

	// 메시지 전송 (직접 fetch 구현)
	async function sendChatMessage(userContent: string) {
		if (!userContent.trim() || isLoading) return;

		// 상태 초기화
		isLoading = true;
		isStreaming = false;
		chatError = null;
		thinkingStatus = null;
		abortController = new AbortController();

		// 사용자 메시지 추가
		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: userContent
		};
		messages = [...messages, userMessage];

		// 빈 어시스턴트 메시지 추가 (스트리밍용)
		const assistantMessage: Message = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: ''
		};
		messages = [...messages, assistantMessage];

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
				}),
				signal: abortController.signal
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`HTTP ${response.status}: ${errorText}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('스트림을 읽을 수 없습니다');

			isStreaming = true;
			const decoder = new TextDecoder();
			let assistantContent = '';
			let buffer = ''; // 불완전한 라인 버퍼링

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || ''; // 마지막 불완전 라인 유지

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') continue;

						try {
							const parsed = JSON.parse(data);

							// 도구 호출 이벤트 처리
							if (parsed.type === 'tool-input-start') {
								const toolName = parsed.toolName || '도구';
								thinkingStatus = `${getToolDisplayName(toolName)} 조회 중...`;
							} else if (parsed.type === 'tool-input-available') {
								// 도구 입력 준비됨 - 상태 유지
							} else if (parsed.type === 'tool-output-available') {
								// 도구 출력 완료 - 상태 초기화
								thinkingStatus = null;
							} else if (parsed.type === 'text-delta' && parsed.delta) {
								// 텍스트 응답이 시작되면 thinking 상태 해제
								thinkingStatus = null;
								assistantContent += parsed.delta;
								// 마지막 메시지 업데이트
								messages = [
									...messages.slice(0, -1),
									{ ...assistantMessage, content: assistantContent }
								];
							}
						} catch {
							// JSON 파싱 실패는 무시 (불완전한 청크)
						}
					}
				}
			}

			// 남은 버퍼 처리
			if (buffer.startsWith('data: ')) {
				const data = buffer.slice(6);
				if (data && data !== '[DONE]') {
					try {
						const parsed = JSON.parse(data);
						if (parsed.type === 'text-delta' && parsed.delta) {
							assistantContent += parsed.delta;
							messages = [
								...messages.slice(0, -1),
								{ ...assistantMessage, content: assistantContent }
							];
						}
					} catch {}
				}
			}

			// 대화 저장
			saveCurrentChat();

		} catch (e) {
			if (e instanceof Error && e.name === 'AbortError') {
				// 사용자가 중지함
				console.log('Streaming stopped by user');
			} else {
				chatError = e instanceof Error ? e.message : String(e);
				console.error('Chat error:', chatError);
				// 빈 어시스턴트 메시지 제거
				if (messages.length > 0 && messages[messages.length - 1].content === '') {
					messages = messages.slice(0, -1);
				}
			}
		} finally {
			isLoading = false;
			isStreaming = false;
			thinkingStatus = null;
			abortController = null;
		}
	}

	// Regenerate last message
	async function regenerate() {
		if (messages.length < 2) return;

		// 마지막 어시스턴트 메시지 제거
		const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
		if (lastUserMessage) {
			// 마지막 어시스턴트 메시지까지 제거
			const lastAssistantIdx = messages.findLastIndex(m => m.role === 'assistant');
			if (lastAssistantIdx !== -1) {
				messages = messages.slice(0, lastAssistantIdx);
			}
			await sendChatMessage(lastUserMessage.content);
		}
	}

	// 예시 질문 (suggested actions 스타일)
	const suggestedActions = [
		{
			title: '강남구 아파트',
			label: '최근 시세가 어떻게 되나요?',
			action: '강남구 아파트 최근 시세가 어떻게 되나요?'
		},
		{
			title: '서울 vs 경기',
			label: '아파트 가격 비교해줘',
			action: '서울과 경기도 아파트 가격을 비교해줘'
		},
		{
			title: '래미안 퍼스티지',
			label: '시세 정보 알려줘',
			action: '래미안 퍼스티지 시세 정보 알려줘'
		},
		{
			title: '헬리오시티',
			label: '아파트 정보 알려줘',
			action: '헬리오시티 아파트 정보 알려줘'
		}
	];

	// Textarea auto-resize
	function adjustTextareaHeight() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = `${textareaRef.scrollHeight + 2}px`;
		}
	}

	// Set input and adjust height
	function setInput(value: string) {
		input = value;
		adjustTextareaHeight();
	}

	// 메시지 텍스트 추출 (단순화 - content 직접 반환)
	function getMessageText(message: Message): string {
		return message.content || '';
	}

	// 마크다운 렌더링 함수
	function renderMarkdown(text: string): string {
		if (!isBrowser) return text;
		const rawHtml = marked.parse(text) as string;
		return DOMPurify.sanitize(rawHtml);
	}

	// 위젯 파싱은 widget-mapper에서 import한 parseWidgetFromContent 사용
	// parseWidgetFromMessage 함수는 제거되고 parseWidgetFromContent로 대체됨

	// 자동 스크롤 효과
	$effect(() => {
		if (messages.length > 0 && chatContainer) {
			setTimeout(() => {
				chatContainer?.scrollTo({
					top: chatContainer.scrollHeight,
					behavior: 'smooth'
				});
			}, 100);
		}
	});

	// 브라우저 환경 체크 및 localStorage 로드
	onMount(() => {
		isBrowser = true;
		loadChatHistory();

		// 현재 대화가 있고 저장되지 않은 경우 자동 저장
		const interval = setInterval(() => {
			if (messages.length > 0) {
				autoSaveCurrentChat();
			}
		}, 5000); // 5초마다 자동 저장

		return () => clearInterval(interval);
	});

	// localStorage에서 대화 기록 로드
	function loadChatHistory() {
		if (!isBrowser) return;
		try {
			const stored = localStorage.getItem('chatHistory');
			if (stored) {
				chatHistory = JSON.parse(stored);
			}
		} catch (e) {
			console.error('Failed to load chat history:', e);
		}
	}

	// localStorage에 대화 기록 저장
	function saveChatHistory() {
		if (!isBrowser) return;
		try {
			localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
		} catch (e) {
			console.error('Failed to save chat history:', e);
		}
	}

	// 현재 대화 자동 저장
	function autoSaveCurrentChat() {
		if (!currentChatId || messages.length === 0) return;

		const chatIndex = chatHistory.findIndex((c) => c.id === currentChatId);
		if (chatIndex !== -1) {
			chatHistory[chatIndex].messages = [...messages];
			saveChatHistory();
		}
	}

	// 대화 제목 생성 (첫 메시지 기반)
	function generateChatTitle(msgs: Message[]): string {
		const firstUserMessage = msgs.find((m) => m.role === 'user');
		if (firstUserMessage) {
			const text = getMessageText(firstUserMessage);
			return text.length > 50 ? text.substring(0, 50) + '...' : text;
		}
		return '새 대화';
	}

	// 새 대화 시작
	function startNewChat() {
		// 현재 대화 저장
		if (currentChatId && messages.length > 0) {
			saveCurrentChat();
		}

		// 상태 초기화
		messages = [];
		chatError = null;
		currentChatId = crypto.randomUUID();
		sheetOpen = false;
	}

	// 현재 대화 저장
	function saveCurrentChat() {
		if (messages.length === 0) return;

		const chatId = currentChatId || crypto.randomUUID();
		const existingIndex = chatHistory.findIndex((c) => c.id === chatId);

		const chatData: ChatHistory = {
			id: chatId,
			title: generateChatTitle(messages),
			messages: [...messages],
			createdAt: new Date().toISOString()
		};

		if (existingIndex !== -1) {
			chatHistory[existingIndex] = chatData;
		} else {
			chatHistory = [chatData, ...chatHistory];
		}

		// 최대 50개 대화만 유지
		if (chatHistory.length > 50) {
			chatHistory = chatHistory.slice(0, 50);
		}

		currentChatId = chatId;
		saveChatHistory();
	}

	// 저장된 대화 불러오기
	function loadChat(chat: ChatHistory) {
		// 현재 대화 저장
		if (currentChatId && messages.length > 0) {
			saveCurrentChat();
		}

		currentChatId = chat.id;
		messages = chat.messages;
		chatError = null;
		sheetOpen = false;
	}

	// 대화 삭제
	function deleteChat(chatId: string, event: Event) {
		event.stopPropagation();
		chatHistory = chatHistory.filter((c) => c.id !== chatId);
		saveChatHistory();

		// 현재 대화를 삭제한 경우 초기화
		if (currentChatId === chatId) {
			messages = [];
			chatError = null;
			currentChatId = null;
		}
	}

	// 메시지 복사
	async function copyMessage(text: string, messageId: string) {
		try {
			await navigator.clipboard.writeText(text);
			copiedMessageId = messageId;
			setTimeout(() => {
				copiedMessageId = null;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy:', e);
		}
	}

	// 예시 질문 클릭
	async function handleSuggestedAction(action: string) {
		if (!currentChatId) {
			currentChatId = crypto.randomUUID();
		}

		await sendChatMessage(action);
	}

	// 폼 제출 처리
	async function handleSubmit() {
		if (!input.trim() || isLoading || isStreaming) return;

		if (!currentChatId) {
			currentChatId = crypto.randomUUID();
		}

		const message = input;
		input = '';

		// Reset textarea height
		if (textareaRef) {
			textareaRef.style.height = 'auto';
		}

		await sendChatMessage(message);
	}

	// 날짜 포맷팅
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return '오늘';
		if (days === 1) return '어제';
		if (days < 7) return `${days}일 전`;
		return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head>
	<title>집피티 - 부동산 AI 챗봇</title>
	<meta name="description" content="부동산 전문 AI 챗봇 - 실거래가, 시세, 단지 정보 조회" />
</svelte:head>

<div class="flex flex-col h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
	<!-- 헤더 -->
	<header
		class="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm"
	>
		<div class="flex items-center gap-3">
			<!-- 사이드바 토글 버튼 -->
			<Sheet.Root bind:open={sheetOpen}>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon" class="lg:hidden" aria-label="대화 기록 열기">
							<Menu class="w-5 h-5" />
						</Button>
					{/snippet}
				</Sheet.Trigger>
				<Sheet.Content side="left" class="w-80 bg-zinc-900 border-zinc-800">
					<Sheet.Header>
						<Sheet.Title class="text-zinc-100">대화 기록</Sheet.Title>
					</Sheet.Header>

					<div class="mt-6 space-y-2">
						<Button
							onclick={startNewChat}
							class="w-full justify-start gap-2 bg-orange-600 hover:bg-orange-700"
							aria-label="새 대화 시작"
						>
							<Plus class="w-4 h-4" aria-hidden="true" />
							새 대화
						</Button>

						<Separator class="my-4 bg-zinc-800" />

						<ScrollArea class="h-[calc(100vh-180px)]">
							<div class="space-y-1 pr-4">
								{#each chatHistory as historyItem (historyItem.id)}
									<button
										onclick={() => loadChat(historyItem)}
										class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800 transition-colors group text-left {currentChatId ===
										historyItem.id
											? 'bg-zinc-800'
											: ''}"
										aria-label="{historyItem.title} 대화 불러오기"
									>
										<div class="flex items-center gap-2 flex-1 min-w-0">
											<MessageSquare class="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
											<div class="flex-1 min-w-0">
												<p class="text-sm text-zinc-200 truncate">{historyItem.title}</p>
												<p class="text-xs text-zinc-500">{formatDate(historyItem.createdAt)}</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="icon"
											class="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
											onclick={(e) => deleteChat(historyItem.id, e)}
											aria-label="{historyItem.title} 대화 삭제"
										>
											<Trash2 class="w-4 h-4 text-red-400" aria-hidden="true" />
										</Button>
									</button>
								{/each}

								{#if chatHistory.length === 0}
									<div class="text-center py-8 text-zinc-500 text-sm">
										저장된 대화가 없습니다
									</div>
								{/if}
							</div>
						</ScrollArea>
					</div>
				</Sheet.Content>
			</Sheet.Root>

			<Home class="w-6 h-6 text-orange-500" aria-hidden="true" />
			<h1 class="text-xl font-bold">집피티</h1>
			<span class="text-xs text-zinc-500 hidden sm:inline" aria-label="부동산 AI 챗봇">부동산 AI</span>
		</div>

		<!-- 우측 버튼 그룹 -->
		<div class="flex items-center gap-2">
			<!-- 테마 토글 -->
			<ThemeToggle />

			<!-- 새 대화 버튼 (데스크톱) -->
			<Button
				onclick={startNewChat}
				variant="outline"
				size="sm"
				class="hidden lg:flex gap-2 border-zinc-700"
				aria-label="새 대화 시작"
			>
				<Plus class="w-4 h-4" aria-hidden="true" />
				새 대화
			</Button>
		</div>
	</header>

	<!-- 채팅 영역 -->
	<main role="main" aria-label="채팅 메시지" class="flex-1 overflow-y-auto" bind:this={chatContainer}>
		<div class="p-4 pb-24" aria-live="polite">
			{#if messages.length === 0}
				<!-- 온보딩 화면 -->
				<div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-8">
					<div class="text-center">
						<Home class="w-16 h-16 mx-auto text-orange-500 mb-4" aria-hidden="true" />
						<h2 class="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
							안녕하세요, 집피티입니다!
						</h2>
						<p class="text-zinc-400 text-lg">부동산에 대해 무엇이든 물어보세요</p>
					</div>
				</div>
			{:else}
				<!-- 메시지 목록 -->
				<div class="space-y-6 max-w-3xl mx-auto">
					{#each messages as message, idx (message.id)}
						<div
							class="group/message mx-auto w-full px-4"
							data-role={message.role}
							in:fly|global={{ opacity: 0, y: 10, delay: idx * 50, duration: 300 }}
						>
							{#if message.role === 'user'}
								<!-- 사용자 메시지 (우측 정렬) -->
								<div class="flex justify-end">
									<Card
										class="max-w-[85%] md:max-w-[75%] p-4 bg-orange-600 border-orange-600 shadow-lg"
									>
										<div class="whitespace-pre-wrap text-white">{message.content}</div>
									</Card>
								</div>
							{:else}
								<!-- AI 메시지 (좌측, 아이콘 포함) -->
								{@const parsed = parseWidgetFromContent(message.content)}
								<div class="flex gap-4 w-full">
									<!-- AI 아이콘 -->
									<div class="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border bg-background">
										<SparklesIcon size={14} />
									</div>

									<div class="flex-1 space-y-3">
										<!-- 텍스트 응답 -->
										<Card class="p-5 bg-zinc-800/50 border-zinc-700 shadow-xl">
											<div
												class="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-200 prose-a:text-orange-400 prose-strong:text-zinc-100 prose-code:text-orange-300 prose-pre:bg-zinc-900"
											>
												{@html renderMarkdown(parsed.text)}
											</div>

											<!-- 복사 버튼 -->
											<div class="flex items-center justify-end mt-3 pt-3 border-t border-zinc-700">
												<Button
													variant="ghost"
													size="sm"
													class="gap-2 text-zinc-400 hover:text-zinc-200"
													onclick={() => copyMessage(message.content, message.id)}
													aria-label="메시지 복사"
												>
													{#if copiedMessageId === message.id}
														<Check class="w-4 h-4 text-green-400" aria-hidden="true" />
														<span class="text-xs text-green-400">복사됨</span>
													{:else}
														<Copy class="w-4 h-4" aria-hidden="true" />
														<span class="text-xs">복사</span>
													{/if}
												</Button>
											</div>
										</Card>

										<!-- 위젯 (있는 경우) -->
										{#if parsed.widget}
											<div class="widget-container">
												<WidgetRenderer widget={parsed.widget} />
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					{/each}

					<!-- 로딩/사고과정 인디케이터 -->
					{#if thinkingStatus}
						<div class="flex gap-4 w-full px-4">
							<div class="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border bg-background">
								<SparklesIcon size={14} />
							</div>
							<Card class="bg-zinc-800/50 border-zinc-700 flex-1">
								<TypingIndicator message={thinkingStatus} />
							</Card>
						</div>
					{:else if isLoading && !isStreaming}
						<div class="flex gap-4 w-full px-4">
							<div class="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border bg-background">
								<SparklesIcon size={14} />
							</div>
							<Card class="bg-zinc-800/50 border-zinc-700 flex-1">
								<TypingIndicator message="생각하고 있습니다..." />
							</Card>
						</div>
					{/if}

					<!-- 에러 표시 -->
					{#if chatError}
						<div class="flex justify-center">
							<Card class="p-4 bg-red-900/30 border-red-800 max-w-md">
								<div class="flex items-center gap-3">
									<p class="text-red-200 flex-1">
										오류가 발생했습니다. 잠시 후 다시 시도해주세요.
									</p>
									<Button variant="ghost" size="sm" onclick={() => regenerate()} aria-label="다시 시도">
										<RefreshCw class="w-4 h-4" aria-hidden="true" />
									</Button>
								</div>
							</Card>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>

	<!-- 입력 영역 (템플릿 스타일) -->
	<footer role="contentinfo" class="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-4 safe-area-bottom">
		<div class="max-w-3xl mx-auto relative flex w-full flex-col gap-4">
			<!-- Suggested Actions (메시지 없을 때만) -->
			{#if messages.length === 0}
				<div class="grid w-full gap-2 sm:grid-cols-2">
					{#each suggestedActions as suggestedAction, i (suggestedAction.title)}
						<div
							in:fly|global={{ opacity: 0, y: 20, delay: 50 * i, duration: 400 }}
							class={i > 1 ? 'hidden sm:block' : 'block'}
						>
							<Button
								variant="ghost"
								onclick={() => handleSuggestedAction(suggestedAction.action)}
								class="h-auto w-full flex-1 items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col border-zinc-700 hover:border-orange-500 hover:bg-zinc-800/50 transition-all"
								aria-label="예시 질문: {suggestedAction.title} - {suggestedAction.label}"
							>
								<span class="font-medium">{suggestedAction.title}</span>
								<span class="text-muted-foreground">
									{suggestedAction.label}
								</span>
							</Button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Textarea -->
			<div class="relative">
				<Textarea
					bind:ref={textareaRef}
					bind:value={input}
					placeholder="부동산에 대해 물어보세요..."
					class="bg-muted max-h-[calc(75dvh)] min-h-[24px] resize-none overflow-hidden rounded-2xl pb-10 !text-base dark:border-zinc-700"
					rows={2}
					oninput={adjustTextareaHeight}
					onkeydown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
							event.preventDefault();
							handleSubmit();
						}
					}}
					disabled={isLoading || isStreaming}
					aria-label="메시지 입력"
				/>

				<!-- 전송/정지 버튼 -->
				<div class="absolute right-0 bottom-0 flex w-fit flex-row justify-end p-2">
					{#if isStreaming}
						<Button
							class="rounded-full border min-w-11 min-h-11 p-2.5 dark:border-zinc-600"
							onclick={stopStreaming}
							aria-label="스트리밍 중지"
						>
							<StopIcon size={14} />
						</Button>
					{:else}
						<Button
							class="rounded-full border min-w-11 min-h-11 p-2.5 dark:border-zinc-600 bg-orange-600 hover:bg-orange-700 border-orange-600"
							onclick={handleSubmit}
							disabled={!input.trim() || isLoading}
							aria-label="메시지 전송"
						>
							<ArrowUpIcon size={14} />
						</Button>
					{/if}
				</div>
			</div>

			<p class="text-xs text-zinc-500 text-center">
				집피티는 실수할 수 있습니다. 중요한 정보는 반드시 확인하세요.
			</p>
		</div>
	</footer>
</div>

<style>
	/* 마크다운 스타일 커스터마이징 - Tailwind 4 호환 */
	:global(.prose table) {
		font-size: 0.875rem;
		line-height: 1.25rem;
	}

	:global(.prose th) {
		background-color: rgb(63 63 70);
		color: rgb(244 244 245);
	}

	:global(.prose td) {
		border-color: rgb(63 63 70);
	}

	:global(.prose code) {
		background-color: rgb(24 24 27);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		color: rgb(253 186 116);
	}

	:global(.prose pre) {
		background-color: rgb(24 24 27);
		border: 1px solid rgb(63 63 70);
	}

	:global(.prose ul),
	:global(.prose ol) {
		color: rgb(228 228 231);
	}
</style>
