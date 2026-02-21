<script lang="ts">
	// Premium UI/UX Redesign - Refactored
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Sheet from '$lib/components/ui/sheet';
	import { ThemeToggle } from '$lib/components/ui/theme-toggle';
	import {
		Home,
		Menu,
		Plus,
		Trash2,
		ArrowDown,
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	// Components
	import WelcomeHero from '$lib/components/chat/WelcomeHero.svelte';
	import ChatList from '$lib/components/chat/ChatList.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	
	import type { Message, ChatHistory } from '$lib/types/chat';

	// State
	let chatContainer: HTMLElement | null = $state(null);
	
	// History State Management
	let sheetOpen = $state(false);
	
	function handlePopState(event: PopStateEvent) {
		if (sheetOpen) {
			sheetOpen = false;
		}
	}

	$effect(() => {
		if (sheetOpen) {
			if (window.location.hash !== '#menu') {
				const url = new URL(window.location.href);
				url.hash = 'menu';
				window.history.pushState({ menuOpen: true }, '', url);
			}
		} else {
			if (window.location.hash === '#menu') {
				window.history.back();
			}
		}
	});

	let chatHistory = $state<ChatHistory[]>([]);
	let currentChatId = $state<string | null>(null);
	let isBrowser = $state(false);

	// Chat State
	let messages = $state<Message[]>([]);
	let isLoading = $state(false);
	let isStreaming = $state(false);
	let chatError = $state<string | null>(null);
	let abortController = $state<AbortController | null>(null);

	// Edit State
	let editingMessageId = $state<string | null>(null);
	let editContent = $state('');

	// Input State
	let input = $state('');

	// ---- Logic Section ----

	function stopStreaming() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		isLoading = false;
		isStreaming = false;
	}

	function getToolDisplayName(toolName: string): string {
		const toolNames: Record<string, string> = {
			'get_price_stats': '시세 분석',
			'search_complexes': '단지 검색',
			'get_complex_info': '단지 세부정보',
			'get_recent_trades': '실거래가 조회',
			'search_api': '데이터 검색',
			'compare_prices': '비교 분석'
		};
		return toolNames[toolName] || toolName;
	}

	async function sendChatMessage(userContent: string) {
		if (!userContent.trim() || isLoading) return;

		isLoading = true;
		isStreaming = false;
		chatError = null;
		abortController = new AbortController();

		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: userContent
		};
		messages = [...messages, userMessage];

		saveCurrentChat();  // ← 사용자 메시지 추가 직후 즉시 저장

		await processAssistantResponse();
	}

	async function processAssistantResponse() {
        const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            citations: []
        };
        messages = [...messages, assistantMessage];

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
                }),
                signal: abortController!.signal
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
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const lastIdx = messages.length - 1;

                            if (parsed.type === 'tool-input-start') {
                                const toolName = parsed.toolName || '도구';
                                const stepContent = `${getToolDisplayName(toolName)} 확인 중...`;
                                messages[lastIdx] = {
                                    ...messages[lastIdx],
                                    processSteps: [
                                        ...(messages[lastIdx].processSteps || []),
                                        { type: 'tool', content: stepContent, status: 'pending' }
                                    ]
                                };
                            } else if (parsed.type === 'tool-output-available') {
                                const currentSteps = messages[lastIdx].processSteps || [];
                                const firstPendingIdx = currentSteps.findIndex(s => s.status === 'pending');
                                if (firstPendingIdx !== -1) {
                                    const updatedSteps = currentSteps.map((s, i) =>
                                        i === firstPendingIdx ? { ...s, status: 'done' } : s
                                    );
                                    messages[lastIdx] = { ...messages[lastIdx], processSteps: updatedSteps };
                                }
                            } else if (parsed.type === 'citation') {
                                messages[lastIdx] = {
                                    ...messages[lastIdx],
                                    citations: [
                                        ...(messages[lastIdx].citations || []),
                                        parsed.citation
                                    ]
                                };
                            } else if (parsed.type === 'text-delta' && parsed.delta) {
                                assistantContent += parsed.delta;
                                messages[lastIdx] = { ...messages[lastIdx], content: assistantContent };
                            }
                        } catch {}
                    }
                }
            }
			
			if (buffer.startsWith('data: ')) {
				const data = buffer.slice(6);
				if (data && data !== '[DONE]') {
					try {
						const parsed = JSON.parse(data);
						if (parsed.type === 'text-delta' && parsed.delta) {
							assistantContent += parsed.delta;
							const lastIdx = messages.length - 1;
							messages[lastIdx] = { ...messages[lastIdx], content: assistantContent };
						}
					} catch {}
				}
			}

            saveCurrentChat();

        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
                console.log('Streaming stopped');
            } else {
                chatError = e instanceof Error ? e.message : String(e);
                if (messages.length > 0 && messages[messages.length - 1].content === '') {
                    messages = messages.slice(0, -1);
                }
            }
        } finally {
            isLoading = false;
            isStreaming = false;
            abortController = null;

            // Final cleanup of process steps for the last assistant message
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.role === 'assistant' && lastMsg.processSteps) {
                    const hasPending = lastMsg.processSteps.some(s => s.status === 'pending');
                    if (hasPending) {
                        const lastMsgIdx = messages.length - 1;
                        messages[lastMsgIdx] = {
                            ...messages[lastMsgIdx],
                            processSteps: messages[lastMsgIdx].processSteps!.map(s => ({
                                ...s,
                                status: 'done' as const
                            }))
                        };
                    }
                }
                // 스트리밍 완료/중단 시 항상 저장 (탭 이탈 후 복귀 지원)
                const lastMsg2 = messages[messages.length - 1];
                if (lastMsg2.role === 'assistant' && lastMsg2.content) {
                    saveCurrentChat();
                }
            }
        }
	}

	async function regenerate(messageId: string) {
		if (isLoading || isStreaming) return;
		const msgIndex = messages.findIndex(m => m.id === messageId);
		if (msgIndex === -1) return;
		
		let targetUserIndex = -1;
		if (messages[msgIndex].role === 'assistant') {
			targetUserIndex = msgIndex - 1;
		} else if (messages[msgIndex].role === 'user') {
			targetUserIndex = msgIndex;
		}

		if (targetUserIndex < 0) return;

		// Truncate messages and regenerate from that user message
		messages = messages.slice(0, targetUserIndex + 1);
		
		isLoading = true;
		chatError = null;
		abortController = new AbortController();

		await processAssistantResponse();
	}

	function startEdit(messageId: string) {
		const msg = messages.find(m => m.id === messageId);
		if (msg) {
			editingMessageId = messageId;
			editContent = msg.content;
		}
	}

	function cancelEdit() {
		editingMessageId = null;
		editContent = '';
	}

	async function saveEdit(messageId: string) {
		if (!editContent.trim() || isLoading || isStreaming) return;
		
		const msgIndex = messages.findIndex(m => m.id === messageId);
		if (msgIndex === -1) return;

		// Update content and trim everything AFTER this message
		messages[msgIndex].content = editContent;
		messages = messages.slice(0, msgIndex + 1);
		
		editingMessageId = null;
		editContent = '';

		isLoading = true;
		chatError = null;
		abortController = new AbortController();

		await processAssistantResponse();
	}

	// Scroll State
	let showScrollButton = $state(false);

	function handleScroll() {
		if (!chatContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = chatContainer;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
		showScrollButton = !isNearBottom;
	}

	function scrollToBottom() {
		chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
	}

	$effect(() => {
		if (messages.length > 0 && chatContainer) {
			const { scrollTop, scrollHeight, clientHeight } = chatContainer;
			const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
			
			if (isNearBottom || messages[messages.length - 1].role === 'user') {
				setTimeout(() => {
					chatContainer?.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
				}, 100);
			}
		}
	});

	onMount(() => {
		isBrowser = true;
		loadChatHistory();
		const interval = setInterval(() => {
			if (messages.length > 0) autoSaveCurrentChat();
		}, 5000);

		// 탭 이탈/숨김 시 즉시 저장
		const handleHide = () => {
			if (messages.length > 0) saveCurrentChat();
		};
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') handleHide();
		});
		window.addEventListener('pagehide', handleHide);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', handleHide);
			window.removeEventListener('pagehide', handleHide);
		};
	});

	function loadChatHistory() {
		try {
			const stored = localStorage.getItem('chatHistory');
			if (stored) chatHistory = JSON.parse(stored);
		} catch (e) { console.error(e); }

		// 마지막 대화 자동 복원 (탭 이탈 후 복귀 지원)
		if (chatHistory.length > 0) {
			const lastChat = chatHistory[0]; // 가장 최근 대화
			if (lastChat.messages && lastChat.messages.length > 0) {
				// 마지막 메시지가 완성된 답변인 경우만 복원
				const lastMsg = lastChat.messages[lastChat.messages.length - 1];
				if (lastMsg.role === 'assistant' && lastMsg.content) {
					currentChatId = lastChat.id;
					messages = lastChat.messages;
				}
			}
		}
	}

	function saveChatHistory() {
		try { localStorage.setItem('chatHistory', JSON.stringify(chatHistory)); }
		catch (e) { console.error(e); }
	}

	function autoSaveCurrentChat() {
		if (messages.length === 0) return;
		if (!currentChatId) {
			saveCurrentChat();
			return;
		}
		const chatIndex = chatHistory.findIndex((c) => c.id === currentChatId);
		if (chatIndex !== -1) {
			chatHistory[chatIndex].messages = [...messages];
			saveChatHistory();
		} else {
			// chatHistory에 없는 새 채팅 - 전체 저장
			saveCurrentChat();
		}
	}

	function startNewChat() {
		if (currentChatId && messages.length > 0) saveCurrentChat();
		messages = [];
		chatError = null;
		currentChatId = crypto.randomUUID();
		sheetOpen = false;
	}

	function saveCurrentChat() {
		if (messages.length === 0) return;
		const chatId = currentChatId || crypto.randomUUID();
		const existingIndex = chatHistory.findIndex((c) => c.id === chatId);
		const firstUserMessage = messages.find(m => m.role === 'user');
		const title = firstUserMessage ? (firstUserMessage.content.length > 30 ? firstUserMessage.content.substring(0, 30) + '...' : firstUserMessage.content) : '새 대화';
		
		const chatData: ChatHistory = {
			id: chatId,
			title,
			messages: [...messages],
			createdAt: new Date().toISOString()
		};

		if (existingIndex !== -1) chatHistory[existingIndex] = chatData;
		else chatHistory = [chatData, ...chatHistory];

		if (chatHistory.length > 50) chatHistory = chatHistory.slice(0, 50);
		currentChatId = chatId;
		saveChatHistory();
	}

	function loadChat(chat: ChatHistory) {
		if (currentChatId && messages.length > 0) saveCurrentChat();
		currentChatId = chat.id;
		messages = chat.messages;
		chatError = null;
		sheetOpen = false;
	}

	function deleteChat(chatId: string, event: Event) {
		event.stopPropagation();
		chatHistory = chatHistory.filter((c) => c.id !== chatId);
		saveChatHistory();
		if (currentChatId === chatId) {
			messages = [];
			chatError = null;
			currentChatId = null;
		}
	}

	async function handleSubmit() {
		if (!input.trim() || isLoading || isStreaming) return;
		if (!currentChatId) currentChatId = crypto.randomUUID();
		const message = input;
		input = '';
		await sendChatMessage(message);
	}

	async function handleFeedback(messageId: string, feedback: 'like' | 'dislike' | null) {
		const idx = messages.findIndex(m => m.id === messageId);
		if (idx !== -1) {
			messages[idx].feedback = feedback;
			try {
				await fetch('/api/feedback', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ messageId, feedback })
				});
				if (feedback) toast.success('피드백이 반영되었습니다.');
			} catch (e) {
				console.error('Failed to send feedback', e);
				toast.error('피드백 전송에 실패했습니다.');
			}
		}
	}

	function handleCopy(content: string) {
		toast.success('메시지가 복사되었습니다.');
	}

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
	<title>집피티 - 부동산 AI 파트너</title>
	<meta name="theme-color" content="#ffffff" />
</svelte:head>

<svelte:window onpopstate={handlePopState} />

<div class="flex flex-col h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
	<!-- Gradient Background Mesh (Subtle) -->
	<div class="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40 dark:opacity-20">
		<div class="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-orange-200/50 blur-[100px] animate-pulse-slow"></div>
		<div class="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px] animate-pulse-slow" style="animation-delay: 1s;"></div>
	</div>

	<!-- Premium Floating Header -->
	<header class="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300">
		<div class="max-w-4xl mx-auto">
			<nav class="glass rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-sm border border-[var(--border-light)]">
				<div class="flex items-center gap-3">
					<Sheet.Root bind:open={sheetOpen}>
						<Sheet.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="ghost" size="icon" class="rounded-full hover:bg-[var(--bg-tertiary)] -ml-2 text-[var(--text-secondary)]" aria-label="메뉴 열기">
									<Menu class="w-5 h-5" />
								</Button>
							{/snippet}
						</Sheet.Trigger>
						<Sheet.Content side="left" class="w-[300px] p-0 border-none bg-[var(--bg-card)]">
							<div class="flex flex-col h-full bg-[var(--bg-secondary)]">
								<div class="p-6 pb-4">
									<h2 class="text-xl font-semibold tracking-tight text-[var(--text-primary)]">기록</h2>
								</div>
								
								<ScrollArea class="flex-1 px-4">
									<Button onclick={startNewChat} class="w-full justify-start gap-3 mb-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white shadow-md rounded-xl h-11 text-base font-medium transition-transform active:scale-[0.98]">
										<Plus class="w-5 h-5" /> 새 대화
									</Button>
									
									<div class="space-y-1 pb-4">
										{#each chatHistory as item (item.id)}
											<button 
												onclick={() => loadChat(item)}
												class="w-full p-3 rounded-xl flex items-center justify-between group transition-all duration-200 text-left hover:bg-[var(--bg-tertiary)] {currentChatId === item.id ? 'bg-[var(--bg-tertiary)] ring-1 ring-[var(--border-medium)]' : ''}"
											>
												<div class="flex-1 min-w-0 mr-3">
													<div class="font-medium text-sm truncate text-[var(--text-primary)]">{item.title}</div>
													<div class="text-xs text-[var(--text-tertiary)] mt-0.5">{formatDate(item.createdAt)}</div>
												</div>
												<div 
													role="button"
													tabindex="0"
													onkeydown={(e) => e.key === 'Enter' && deleteChat(item.id, e)}
													onclick={(e) => deleteChat(item.id, e)}
													class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-[var(--text-tertiary)] transition-all"
													aria-label="삭제"
												>
													<Trash2 class="w-4 h-4" />
												</div>
											</button>
										{/each}
										{#if chatHistory.length === 0}
											<div class="text-center py-10 text-[var(--text-tertiary)] text-sm">기록이 없습니다.</div>
										{/if}
									</div>
								</ScrollArea>
							</div>
						</Sheet.Content>
					</Sheet.Root>

					<div class="flex items-center gap-2 cursor-pointer" onclick={startNewChat} onkeydown={() => {}} role="button" tabindex="0">
						<div class="bg-gradient-to-tr from-orange-500 to-amber-400 text-white p-1.5 rounded-xl shadow-sm">
							<Home class="w-4 h-4" strokeWidth={2.5} />
						</div>
						<span class="font-bold text-lg tracking-tight text-[var(--text-primary)]">ZIPPT</span>
					</div>
				</div>

				<div class="flex items-center gap-1">
					<ThemeToggle />
					<Button onclick={startNewChat} variant="ghost" size="icon" class="rounded-full hover:bg-[var(--bg-tertiary)] hidden sm:flex" aria-label="새 대화">
						<Plus class="w-5 h-5 text-[var(--text-secondary)]" />
					</Button>
				</div>
			</nav>
		</div>
	</header>

	<!-- Main Chat Area -->
	<main 
		class="flex-1 overflow-y-auto relative z-10 scroll-smooth" 
		bind:this={chatContainer}
		onscroll={handleScroll}
	>
		<div 
			class="max-w-3xl mx-auto px-4 pt-24 pb-48 min-h-full flex flex-col justify-end min-h-[calc(100vh-120px)]"
			aria-live="polite"
			aria-atomic="false"
		>
			{#if messages.length === 0}
				<WelcomeHero onAction={(action) => {
					input = action;
					handleSubmit();
				}} />
			{:else}
				<ChatList 
					{messages}
					{isLoading}
					{isStreaming}
					{chatError}
					{editingMessageId}
					{editContent}
					{isBrowser}
					onRegenerate={regenerate}
					onEditStart={startEdit}
					onEditCancel={cancelEdit}
					onEditSave={saveEdit}
					onCopy={handleCopy}
					onFeedback={handleFeedback}
					bindEditContent={(val) => editContent = val}
				/>
			{/if}
		</div>
		
		<!-- Scroll to Bottom FAB -->
		{#if showScrollButton}
			<div class="fixed bottom-24 right-1/2 translate-x-1/2 z-50 pointer-events-none" transition:fly={{ y: 10, duration: 200 }}>
				<button 
					onclick={scrollToBottom}
					class="pointer-events-auto bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border-medium)] shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] transition-all active:scale-95"
				>
					<ArrowDown class="w-4 h-4 text-[var(--accent-primary)]" />
					<span class="text-xs">최신 메시지로</span>
				</button>
			</div>
		{/if}
	</main>

	<!-- Footer Input Area -->
	<footer class="fixed bottom-0 left-0 right-0 p-4 z-40">
		<ChatInput 
			{input}
			{isLoading}
			{isStreaming}
			onInput={(val) => input = val}
			onSubmit={handleSubmit}
			onStop={stopStreaming}
		/>
	</footer>
</div>
