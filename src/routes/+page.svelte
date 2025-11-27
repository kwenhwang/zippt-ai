<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Send,
		Home,
		Menu,
		Plus,
		Copy,
		Check,
		Trash2,
		MessageSquare,
		RefreshCw
	} from 'lucide-svelte';
	import { WidgetRenderer } from '$lib/components/widgets';
	import type { WidgetData } from '$lib/types/widgets';

	interface ChatHistory {
		id: string;
		title: string;
		messages: any[];
		createdAt: string;
	}

	// Chat 인스턴스 생성으로 스트리밍 채팅 기능 활성화
	const chat = new Chat({
		api: '/api/chat'
	});

	// 입력 상태 관리
	let input = $state('');

	// 상태 관리
	let chatContainer: HTMLElement | null = null;
	let sheetOpen = $state(false);
	let chatHistory = $state<ChatHistory[]>([]);
	let currentChatId = $state<string | null>(null);
	let copiedMessageId = $state<string | null>(null);
	let isBrowser = $state(false);

	// 예시 질문
	const exampleQuestions = [
		'강남구 아파트 실거래가 알려줘',
		'래미안 퍼스티지 시세가 어떻게 돼?',
		'서초구 최근 거래 현황',
		'헬리오시티 아파트 정보 알려줘'
	];

	// 마크다운 렌더링 함수
	function renderMarkdown(text: string): string {
		if (!isBrowser) return text;
		const rawHtml = marked.parse(text);
		return DOMPurify.sanitize(rawHtml);
	}

	// 위젯 파싱 함수
	function parseWidgetFromMessage(content: string): { text: string; widget: WidgetData | null } {
		const widgetMatch = content.match(/```widget\n([\s\S]*?)\n```/);

		if (widgetMatch) {
			try {
				const widget = JSON.parse(widgetMatch[1]) as WidgetData;
				const text = content.replace(/```widget\n[\s\S]*?\n```/, '').trim();
				return { text, widget };
			} catch (e) {
				console.error('Failed to parse widget:', e);
				return { text: content, widget: null };
			}
		}

		return { text: content, widget: null };
	}

	// 자동 스크롤 효과
	$effect(() => {
		if (chat.messages.length > 0 && chatContainer) {
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
			if (chat.messages.length > 0) {
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
		if (!currentChatId || chat.messages.length === 0) return;

		const chatIndex = chatHistory.findIndex((c) => c.id === currentChatId);
		if (chatIndex !== -1) {
			chatHistory[chatIndex].messages = [...chat.messages];
			saveChatHistory();
		}
	}

	// 대화 제목 생성 (첫 메시지 기반)
	function generateChatTitle(messages: any[]): string {
		const firstUserMessage = messages.find((m) => m.role === 'user');
		if (firstUserMessage) {
			const text = firstUserMessage.content;
			return text.length > 50 ? text.substring(0, 50) + '...' : text;
		}
		return '새 대화';
	}

	// 새 대화 시작
	function startNewChat() {
		// 현재 대화 저장
		if (currentChatId && chat.messages.length > 0) {
			saveCurrentChat();
		}

		// 상태 초기화
		chat.messages = [];
		currentChatId = crypto.randomUUID();
		sheetOpen = false;
	}

	// 현재 대화 저장
	function saveCurrentChat() {
		if (chat.messages.length === 0) return;

		const chatId = currentChatId || crypto.randomUUID();
		const existingIndex = chatHistory.findIndex((c) => c.id === chatId);

		const chatData: ChatHistory = {
			id: chatId,
			title: generateChatTitle(chat.messages),
			messages: [...chat.messages],
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
	function loadChat(chatHistory: ChatHistory) {
		// 현재 대화 저장
		if (currentChatId && chat.messages.length > 0) {
			saveCurrentChat();
		}

		chat.messages = chatHistory.messages;
		currentChatId = chatHistory.id;
		sheetOpen = false;
	}

	// 대화 삭제
	function deleteChat(chatId: string, event: Event) {
		event.stopPropagation();
		chatHistory = chatHistory.filter((c) => c.id !== chatId);
		saveChatHistory();

		// 현재 대화를 삭제한 경우 초기화
		if (currentChatId === chatId) {
			chat.messages = [];
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
	function askExample(question: string) {
		input = question;
	}

	// 폼 제출 시 대화 저장
	async function handleFormSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!input.trim()) return;

		// 첫 메시지인 경우 새 대화 ID 생성
		if (!currentChatId) {
			currentChatId = crypto.randomUUID();
		}

		const message = input;
		input = ''; // 입력 필드 초기화

		// 메시지 전송
		await chat.sendMessage({ text: message });
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

<div class="flex flex-col h-screen bg-zinc-950 text-zinc-100">
	<!-- 헤더 -->
	<header
		class="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm"
	>
		<div class="flex items-center gap-3">
			<!-- 사이드바 토글 버튼 -->
			<Sheet.Root bind:open={sheetOpen}>
				<Sheet.Trigger asChild let:builder>
					<Button builders={[builder]} variant="ghost" size="icon" class="lg:hidden">
						<Menu class="w-5 h-5" />
					</Button>
				</Sheet.Trigger>
				<Sheet.Content side="left" class="w-80 bg-zinc-900 border-zinc-800">
					<Sheet.Header>
						<Sheet.Title class="text-zinc-100">대화 기록</Sheet.Title>
					</Sheet.Header>

					<div class="mt-6 space-y-2">
						<Button
							onclick={startNewChat}
							class="w-full justify-start gap-2 bg-orange-600 hover:bg-orange-700"
						>
							<Plus class="w-4 h-4" />
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
									>
										<div class="flex items-center gap-2 flex-1 min-w-0">
											<MessageSquare class="w-4 h-4 text-zinc-400 flex-shrink-0" />
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
										>
											<Trash2 class="w-4 h-4 text-red-400" />
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

			<Home class="w-6 h-6 text-orange-500" />
			<h1 class="text-xl font-bold">집피티</h1>
			<span class="text-xs text-zinc-500 hidden sm:inline">부동산 AI</span>
		</div>

		<!-- 새 대화 버튼 (데스크톱) -->
		<Button
			onclick={startNewChat}
			variant="outline"
			size="sm"
			class="hidden lg:flex gap-2 border-zinc-700"
		>
			<Plus class="w-4 h-4" />
			새 대화
		</Button>
	</header>

	<!-- 채팅 영역 -->
	<ScrollArea class="flex-1" bind:this={chatContainer}>
		<div class="p-4 pb-24">
			{#if chat.messages.length === 0}
				<!-- 온보딩 화면 -->
				<div class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] gap-8">
					<div class="text-center">
						<Home class="w-16 h-16 mx-auto text-orange-500 mb-4" />
						<h2 class="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent">
							안녕하세요, 집피티입니다!
						</h2>
						<p class="text-zinc-400 text-lg">부동산에 대해 무엇이든 물어보세요</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
						{#each exampleQuestions as question}
							<Button
								variant="outline"
								class="justify-start text-left h-auto py-4 px-5 border-zinc-700 hover:border-orange-500 hover:bg-zinc-800/50 transition-all"
								onclick={() => askExample(question)}
							>
								<MessageSquare class="w-4 h-4 mr-2 text-orange-500 flex-shrink-0" />
								<span class="text-sm">{question}</span>
							</Button>
						{/each}
					</div>
				</div>
			{:else}
				<!-- 메시지 목록 -->
				<div class="space-y-6 max-w-3xl mx-auto">
					{#each chat.messages as message (message.id)}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							{#if message.role === 'user'}
								<!-- 사용자 메시지 -->
								<Card
									class="max-w-[85%] md:max-w-[75%] p-4 bg-orange-600 border-orange-600 shadow-lg"
								>
									<div class="whitespace-pre-wrap text-white">{message.content}</div>
								</Card>
							{:else}
								<!-- AI 메시지 -->
								{@const parsed = parseWidgetFromMessage(message.content)}
								<div class="max-w-[90%] md:max-w-[85%] space-y-3">
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
											>
												{#if copiedMessageId === message.id}
													<Check class="w-4 h-4 text-green-400" />
													<span class="text-xs text-green-400">복사됨</span>
												{:else}
													<Copy class="w-4 h-4" />
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
							{/if}
						</div>
					{/each}

					<!-- 로딩 스켈레톤 -->
					{#if chat.status === 'submitted' || chat.status === 'streaming'}
						<div class="flex justify-start">
							<div class="max-w-[90%] md:max-w-[85%]">
								<Card class="p-5 bg-zinc-800/50 border-zinc-700">
									<div class="space-y-3">
										<Skeleton class="h-4 w-full bg-zinc-700" />
										<Skeleton class="h-4 w-[90%] bg-zinc-700" />
										<Skeleton class="h-4 w-[80%] bg-zinc-700" />
									</div>
								</Card>
							</div>
						</div>
					{/if}

					<!-- 에러 표시 -->
					{#if chat.error}
						<div class="flex justify-center">
							<Card class="p-4 bg-red-900/30 border-red-800 max-w-md">
								<div class="flex items-center gap-3">
									<p class="text-red-200 flex-1">
										오류가 발생했습니다. 잠시 후 다시 시도해주세요.
									</p>
									<Button variant="ghost" size="sm" onclick={() => chat.regenerate()}>
										<RefreshCw class="w-4 h-4" />
									</Button>
								</div>
							</Card>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</ScrollArea>

	<!-- 입력 영역 -->
	<div class="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 p-4">
		<form onsubmit={handleFormSubmit} class="max-w-3xl mx-auto">
			<div class="flex gap-2">
				<Input
					bind:value={input}
					placeholder="부동산에 대해 물어보세요..."
					class="flex-1 bg-zinc-800 border-zinc-700 focus:border-orange-500 focus:ring-orange-500/20 text-base py-6"
					disabled={chat.status === 'submitted' || chat.status === 'streaming'}
				/>
				<Button
					type="submit"
					disabled={chat.status === 'submitted' || chat.status === 'streaming' || !input.trim()}
					class="bg-orange-600 hover:bg-orange-700 px-6"
					size="lg"
				>
					<Send class="w-5 h-5" />
				</Button>
			</div>
			<p class="text-xs text-zinc-500 text-center mt-2">
				집피티는 실수할 수 있습니다. 중요한 정보는 반드시 확인하세요.
			</p>
		</form>
	</div>
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
