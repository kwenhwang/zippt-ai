<script lang="ts">
	// Premium UI/UX Redesign - Google/Apple Style
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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
		Trash2,
		Sparkles,
		ArrowUp,
		ArrowDown,
		StopCircle,
		Check
	} from 'lucide-svelte';
	import { WidgetRenderer } from '$lib/components/widgets';
	import { parseWidgetFromContent } from '$lib/utils/widget-mapper';
	import MessageToolbar from '$lib/components/chat/MessageToolbar.svelte';
	import CitationsBar from '$lib/components/chat/CitationsBar.svelte';
	import type { Message, ChatHistory, Citation } from '$lib/types/chat';
	import { toast } from 'svelte-sonner';

	// State
	let chatContainer: HTMLElement | null = $state(null);
	let sheetOpen = $state(false);
	let chatHistory = $state<ChatHistory[]>([]);
	let currentChatId = $state<string | null>(null);
	let isBrowser = $state(false);

	// Chat State
	let messages = $state<Message[]>([]);
	let isLoading = $state(false);
	let isStreaming = $state(false);
	let chatError = $state<string | null>(null);
	let abortController = $state<AbortController | null>(null);
	let thinkingStatus = $state<string | null>(null);

	// Edit State
	let editingMessageId = $state<string | null>(null);
	let editContent = $state('');

	// Input State
	let input = $state('');
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	// ---- Logic Section ----

	function stopStreaming() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		isLoading = false;
		isStreaming = false;
		thinkingStatus = null;
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
		thinkingStatus = null;
		abortController = new AbortController();

		// Check if we are retrying or sending new
		// Logic: If last message is user, we are likely regenerating or editing
		// But here we construct a new user message if needed.
		// However, standard flow is: Add User Msg -> Add Assistant Placeholder -> Stream
		
		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: userContent
		};
		messages = [...messages, userMessage];

		await processAssistantResponse();
	}

	async function processAssistantResponse() {
        const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            citations: [] // Initialize citations
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

                            // Initialize message structure if needed
                            if (!messages[messages.length - 1].processSteps) {
                                messages[messages.length - 1].processSteps = [];
                            }
                            const currentMessage = messages[messages.length - 1];

                            if (parsed.type === 'tool-input-start') {
                                const toolName = parsed.toolName || '도구';
                                const stepContent = `${getToolDisplayName(toolName)} 확인 중...`;
                                
                                // Add new step
                                currentMessage.processSteps = [
                                    ...(currentMessage.processSteps || []),
                                    { type: 'tool', content: stepContent, status: 'pending' }
                                ];
                            } else if (parsed.type === 'tool-output-available') {
                                // Mark last step as done
                                if (currentMessage.processSteps && currentMessage.processSteps.length > 0) {
                                    const steps = [...currentMessage.processSteps];
                                    steps[steps.length - 1].status = 'done';
                                    currentMessage.processSteps = steps;
                                }
                            } else if (parsed.type === 'citation') {
                                // Handle citation
                                currentMessage.citations = [
                                    ...(currentMessage.citations || []),
                                    parsed.citation
                                ];
                            } else if (parsed.type === 'text-delta' && parsed.delta) {
                                assistantContent += parsed.delta;
                                currentMessage.content = assistantContent;
                            }
                        } catch {}
                    }
                }
            }
			// Flush buffer
			if (buffer.startsWith('data: ')) {
				const data = buffer.slice(6);
				if (data && data !== '[DONE]') {
					try {
						const parsed = JSON.parse(data);
						if (parsed.type === 'text-delta' && parsed.delta) {
							assistantContent += parsed.delta;
							messages[messages.length - 1].content = assistantContent;
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
            thinkingStatus = null;
            abortController = null;
        }
	}

	async function regenerate(messageId: string) {
		if (isLoading) return;
		
		// Find the message index
		const msgIndex = messages.findIndex(m => m.id === messageId);
		if (msgIndex === -1) return;

		// If it's an assistant message, we regenerate the response to the PREVIOUS user message
		// If it's a user message, we assume the user wants to retry THAT prompt (not implemented in toolbar, but logic holds)
		
		let targetUserIndex = -1;
		if (messages[msgIndex].role === 'assistant') {
			targetUserIndex = msgIndex - 1;
		} else {
			// Regenerating a user message doesn't make sense unless we resend it.
			// The toolbar typically calls this on assistant message.
			return; 
		}

		if (targetUserIndex < 0) return;

		// Splice everything after the user message
		messages = messages.slice(0, targetUserIndex + 1);
		
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
		if (!editContent.trim()) return;
		
		const msgIndex = messages.findIndex(m => m.id === messageId);
		if (msgIndex === -1) return;

		// Update content
		messages[msgIndex].content = editContent;
		editingMessageId = null;

		// Remove all subsequent messages and re-process
		messages = messages.slice(0, msgIndex + 1);
		await processAssistantResponse();
	}


	const suggestedActions = [
		{ title: '강남구 아파트', label: '최근 시세 동향', action: '강남구 아파트 최근 시세가 어떻게 되나요?' },
		{ title: '서울 vs 경기', label: '가격 비교 분석', action: '서울과 경기도 아파트 가격을 비교해줘' },
		{ title: '래미안 퍼스티지', label: '상세 정보 조회', action: '래미안 퍼스티지 시세 정보 알려줘' },
		{ title: '투자 가이드', label: '저평가 지역 추천', action: '서울에서 저평가된 아파트 지역 추천해줘' }
	];

	function adjustTextareaHeight() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
		}
	}

	function setInput(value: string) {
		input = value;
		adjustTextareaHeight();
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

	function renderMarkdown(text: string): string {
		if (!isBrowser) return text;
		const rawHtml = marked.parse(text) as string;
		return DOMPurify.sanitize(rawHtml);
	}

	$effect(() => {
		if (messages.length > 0 && chatContainer) {
			// Auto-scroll only if we were already near bottom or it's a new message
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
		return () => clearInterval(interval);
	});

	function loadChatHistory() {
		try {
			const stored = localStorage.getItem('chatHistory');
			if (stored) chatHistory = JSON.parse(stored);
		} catch (e) { console.error(e); }
	}

	function saveChatHistory() {
		try { localStorage.setItem('chatHistory', JSON.stringify(chatHistory)); }
		catch (e) { console.error(e); }
	}

	function autoSaveCurrentChat() {
		if (!currentChatId || messages.length === 0) return;
		const chatIndex = chatHistory.findIndex((c) => c.id === currentChatId);
		if (chatIndex !== -1) {
			chatHistory[chatIndex].messages = [...messages];
			saveChatHistory();
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
		if (textareaRef) textareaRef.style.height = 'auto';
		await sendChatMessage(message);
	}

	async function handleFeedback(messageId: string, feedback: 'like' | 'dislike' | null) {
		const idx = messages.findIndex(m => m.id === messageId);
		if (idx !== -1) {
			messages[idx].feedback = feedback;
			
			// Optimistic UI update, then send to server
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

	// Pseudo citation extraction (if backend doesn't send explicit)
    // We rely on backend sending 'citation' events, but we initialized it in processAssistantResponse

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
		<div class="max-w-3xl mx-auto px-4 pt-24 pb-48 min-h-full flex flex-col justify-end min-h-[calc(100vh-120px)]">
			{#if messages.length === 0}
				<!-- Hero Section -->
				<div class="flex flex-col items-center justify-center -mt-20 flex-1 space-y-8 animate-[fade-in_0.6s_ease-out]">
					<div class="relative mb-4">
						<div class="absolute inset-0 bg-orange-400 blur-[30px] opacity-20 rounded-full animate-pulse-slow"></div>
						<div class="glass-card p-5 rounded-2xl shadow-xl border border-white/50 relative">
							<Home class="w-10 h-10 text-[var(--accent-primary)]" strokeWidth={2} />
						</div>
					</div>
					
					<div class="text-center space-y-2 max-w-sm">
						<h1 class="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
							무엇을 도와드릴까요?
						</h1>
						<p class="text-[var(--text-secondary)] text-lg leading-relaxed">
							부동산 시세부터 투자 분석까지,<br/>AI 파트너가 함께합니다.
						</p>
					</div>

					<div class="grid w-full gap-3 sm:grid-cols-2 pt-4">
						{#each suggestedActions as action, idx}
							<button
								onclick={() => setInput(action.action)}
								class="glass-card p-4 rounded-xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all border border-[var(--border-light)] hover:border-[var(--accent-primary)] group"
								style="animation: slide-up 0.5s ease-out {0.1 + idx * 0.1}s backwards;"
							>
								<div class="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2">
									{action.title}
									<ArrowUp class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity rotate-45" />
								</div>
								<div class="text-sm text-[var(--text-tertiary)] mt-1">{action.label}</div>
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Messages List -->
				<div class="space-y-6">
					{#each messages as message, idx (message.id)}
						<div 
							class="flex w-full {message.role === 'user' ? 'justify-end' : 'justify-start'} group/message"
							in:fly={{ y: 20, duration: 400, easing: cubicOut }}
						>
							<div class="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
								{#if message.role === 'assistant'}
									<div class="flex items-center gap-2 mb-1 px-1">
										<div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-white shadow-sm">
											<Sparkles size={14} />
										</div>
										<span class="text-xs font-semibold text-[var(--text-secondary)]">ZIPPT AI</span>
									</div>
								{/if}

								<div class="
									relative px-5 py-3.5 shadow-sm text-base leading-relaxed
									{message.role === 'user' 
										? 'bg-[var(--accent-primary)] text-white rounded-[20px] rounded-tr-md' 
										: 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-light)] rounded-[20px] rounded-tl-md'}
								">
									{#if editingMessageId === message.id}
                                        <!-- Edit Mode -->
                                        <div class="flex flex-col gap-2">
                                            <Textarea 
                                                bind:value={editContent} 
                                                class="min-h-[100px] bg-background text-foreground"
                                            />
                                            <div class="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onclick={cancelEdit}>취소</Button>
                                                <Button size="sm" onclick={() => saveEdit(message.id)}>저장</Button>
                                            </div>
                                        </div>
                                    {:else}
                                        {#if message.role === 'assistant' && message.processSteps}
                                            <div class="flex flex-col gap-2 mb-3">
                                                {#each message.processSteps as step}
                                                    <div class="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg animate-in fade-in slide-in-from-left-2 duration-300">
                                                        {#if step.status === 'pending'}
                                                            <div class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        {:else}
                                                            <Check class="w-3 h-3 text-green-500" />
                                                        {/if}
                                                        <span>{step.content}</span>
                                                    </div>
                                                {/each}
                                            </div>
                                        {/if}

                                        {#if message.role === 'user'}
                                            <div class="whitespace-pre-wrap">{message.content}</div>
                                        {:else}
                                            {#if !message.content && (!message.processSteps || message.processSteps.length === 0)}
                                                 <!-- Initial loading state if no content and no steps yet -->
                                                <div class="flex items-center gap-2 text-muted-foreground text-sm">
                                                    <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                    <span>생각하는 중...</span>
                                                </div>
                                            {/if}
                                            {@const parsed = parseWidgetFromContent(message.content)}
                                            <div class="prose prose-sm max-w-none dark:prose-invert">
                                                {@html renderMarkdown(parsed.text)}
                                            </div>
                                            {#if parsed.widget}
                                                <div class="mt-4 -mx-2 sm:-mx-3">
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
                                            onCopy={handleCopy}
                                            onFeedback={handleFeedback}
                                            onRegenerate={regenerate}
                                            onEdit={startEdit}
                                        />
                                    </div>
                                {/if}
							</div>
						</div>
					{/each}

					<!-- Loading State (only initial connection before stream) -->
					{#if isLoading && !isStreaming && messages[messages.length-1]?.role === 'user'}
						<div class="flex justify-start w-full" in:fade>
							<div class="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-[20px] rounded-tl-md px-5 py-4 shadow-sm">
								<div class="flex items-center gap-2 text-muted-foreground text-sm">
                                    <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span>연결 중...</span>
                                </div>
							</div>
						</div>
					{/if}

					{#if chatError}
						<div class="flex justify-center py-4" in:fade>
							<div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
								<span>⚠️ {chatError}</span>
								<button onclick={() => regenerate(messages[messages.length-1]?.id)} class="underline hover:no-underline font-medium ml-1">다시 시도</button>
							</div>
						</div>
					{/if}
				</div>
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
		<div class="max-w-3xl mx-auto">
			<div class="relative glass-card rounded-[26px] shadow-lg border border-[var(--border-light)] transition-shadow duration-300 focus-within:shadow-xl focus-within:border-[var(--accent-primary)]/50 focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/10">
				<Textarea
					bind:ref={textareaRef}
					bind:value={input}
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
							e.preventDefault();
							handleSubmit();
						}
					}}
					oninput={adjustTextareaHeight}
					placeholder="메시지를 입력하세요..."
					class="w-full bg-transparent border-none focus-visible:ring-0 resize-none py-4 pl-5 pr-14 min-h-[56px] max-h-[200px] text-[16px] leading-[1.6] placeholder:text-[var(--text-tertiary)] text-[var(--text-primary)]"
					rows={1}
					disabled={isLoading || isStreaming}
					aria-label="메시지 입력"
				/>
				
				<div class="absolute right-2 bottom-2">
					{#if isStreaming}
						<button
							onclick={stopStreaming}
							class="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-all shadow-md active:scale-95"
							aria-label="중지"
						>
							<StopCircle size={20} fill="currentColor" />
						</button>
					{:else}
						<button
							onclick={handleSubmit}
							disabled={!input.trim() || isLoading}
							class="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--accent-secondary)] transition-all shadow-md active:scale-95"
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
	</footer>
</div>

<style>
	/* Global overrides for specific components */
	:global(.prose strong) { color: var(--text-primary); font-weight: 600; }
	:global(.prose p) { color: var(--text-secondary); margin-bottom: 0.75em; }
	:global(.prose ul) { margin-top: 0.5em; margin-bottom: 0.5em; }
	
	/* Mobile Optimizations */
	@media (max-width: 640px) {
		.glass-card {
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
		}
	}
</style>
