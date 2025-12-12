<script lang="ts">
	import type { Chat } from '@ai-sdk/svelte';
	import { Button } from './ui/button';
	import { fly } from 'svelte/transition';
	import { replaceState } from '$app/navigation';
	import type { User } from '$lib/server/db/schema';

	let { user, chatClient }: { user: User | undefined; chatClient: Chat } = $props();

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
			title: '2024년 부동산',
			label: '전망이 어떻게 되나요?',
			action: '2024년 부동산 시장 전망이 어떻게 되나요?'
		},
		{
			title: '전세 vs 월세',
			label: '어떤게 더 유리할까요?',
			action: '전세와 월세 중 어떤게 더 유리할까요?'
		}
	];
</script>

<div class="grid w-full gap-2 sm:grid-cols-2">
	{#each suggestedActions as suggestedAction, i (suggestedAction.title)}
		<div
			in:fly|global={{ opacity: 0, y: 20, delay: 50 * i, duration: 400 }}
			class={i > 1 ? 'hidden sm:block' : 'block'}
		>
			<Button
				variant="ghost"
				onclick={async () => {
					if (user) {
						replaceState(`/chat/${chatClient.id}`, {});
					}
					await chatClient.sendMessage({
						text: suggestedAction.action
					});
				}}
				class="h-auto w-full flex-1 items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
			>
				<span class="font-medium">{suggestedAction.title}</span>
				<span class="text-muted-foreground">
					{suggestedAction.label}
				</span>
			</Button>
		</div>
	{/each}
</div>
