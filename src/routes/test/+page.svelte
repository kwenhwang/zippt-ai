<script lang="ts">
	let messages: string[] = $state([]);
	let input = $state('');
	let loading = $state(false);
	let error = $state('');

	async function sendMessage() {
		if (!input.trim() || loading) return;

		const userMessage = input;
		input = '';
		messages = [...messages, `You: ${userMessage}`];
		loading = true;
		error = '';

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messages: [{ role: 'user', content: userMessage }]
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${await response.text()}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error('No reader');

			const decoder = new TextDecoder();
			let assistantMessage = '';
			messages = [...messages, 'AI: '];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') continue;

						try {
							const parsed = JSON.parse(data);
							if (parsed.type === 'text-delta' && parsed.delta) {
								assistantMessage += parsed.delta;
								messages = [...messages.slice(0, -1), `AI: ${assistantMessage}`];
							}
						} catch {}
					}
				}
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			alert(`Error: ${error}`);
		} finally {
			loading = false;
		}
	}
</script>

<div class="p-4 max-w-lg mx-auto">
	<h1 class="text-xl font-bold mb-4">Chat Test (No AI SDK)</h1>

	<div class="space-y-2 mb-4 min-h-[200px] bg-gray-100 p-4 rounded">
		{#each messages as msg}
			<p class="text-sm">{msg}</p>
		{/each}
		{#if loading}
			<p class="text-gray-500">Loading...</p>
		{/if}
		{#if error}
			<p class="text-red-500">{error}</p>
		{/if}
	</div>

	<div class="flex gap-2">
		<input
			type="text"
			bind:value={input}
			onkeydown={(e) => e.key === 'Enter' && sendMessage()}
			placeholder="Type a message..."
			class="flex-1 border rounded px-3 py-2"
		/>
		<button
			onclick={sendMessage}
			disabled={loading}
			class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
		>
			Send
		</button>
	</div>
</div>
