<script lang="ts">
	import { Home, ArrowUp } from 'lucide-svelte';

	interface SuggestedAction {
		title: string;
		label: string;
		action: string;
		icon: string;
		category: '실거래가' | '지역 비교' | '시세 분석' | '단지 정보';
	}

	interface Props {
		onAction: (action: string) => void;
	}
	let { onAction }: Props = $props();

	const suggestedActions: SuggestedAction[] = [
		{
			title: '강남구 아파트',
			label: '최근 3개월 실거래가',
			action: '강남구 아파트 최근 3개월 실거래가 알려줘',
			icon: '📊',
			category: '실거래가'
		},
		{
			title: '래미안 퍼스티지',
			label: '최근 거래 내역',
			action: '래미안 퍼스티지 최근 거래 내역 알려줘',
			icon: '🏢',
			category: '실거래가'
		},
		{
			title: '서울 vs 경기',
			label: '아파트 가격 비교',
			action: '서울과 경기도 아파트 가격을 비교해줘',
			icon: '🏙️',
			category: '지역 비교'
		},
		{
			title: '강남 vs 마포',
			label: '전세가율 비교',
			action: '강남구와 마포구 아파트 전세가율을 비교해줘',
			icon: '⚖️',
			category: '지역 비교'
		},
		{
			title: '서울 전세가율',
			label: '매매 vs 전세 비율',
			action: '서울 아파트 매매가 대비 전세가 비율 알려줘',
			icon: '📈',
			category: '시세 분석'
		},
		{
			title: '상승 지역 TOP5',
			label: '2024 가격 상승 순위',
			action: '2024년 서울 아파트 가격이 많이 오른 지역 TOP5 알려줘',
			icon: '🔥',
			category: '시세 분석'
		},
		{
			title: '잠실 엘스',
			label: '최근 시세 조회',
			action: '잠실 엘스 아파트 최근 시세 알려줘',
			icon: '🏘️',
			category: '단지 정보'
		},
		{
			title: '판교 알파리움',
			label: '최근 거래가',
			action: '판교 알파리움 최근 거래가 알려줘',
			icon: '💎',
			category: '단지 정보'
		}
	];

	function shuffle<T>(arr: T[]): T[] {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	const categoryColors: Record<SuggestedAction['category'], string> = {
		'실거래가': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
		'지역 비교': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
		'시세 분석': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
		'단지 정보': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
	};

	let displayedActions = $state<SuggestedAction[]>(shuffle(suggestedActions).slice(0, 4));

	const hour = new Date().getHours();
	const greeting = hour < 12 ? '좋은 아침입니다!' : hour < 18 ? '즐거운 오후네요!' : '편안한 저녁 되세요!';
	const subGreeting = hour < 12 ? '출근길 부동산 소식, 무엇이 궁금하신가요?' : '오늘의 투자 인사이트를 확인해보세요.';
</script>

<!-- Hero Section -->
<div class="flex flex-col items-center justify-center -mt-20 flex-1 space-y-8 animate-[fade-in_0.6s_ease-out]">
	<div class="relative mb-4">
		<!-- Improved Gradient -->
		<div class="absolute inset-0 bg-gradient-to-tr from-orange-400/30 to-rose-400/30 blur-[40px] rounded-full animate-pulse-slow"></div>
		<div class="glass-card p-6 rounded-3xl shadow-2xl border border-white/50 relative bg-white/40 dark:bg-black/20 backdrop-blur-xl">
			<Home class="w-12 h-12 text-[var(--accent-primary)] drop-shadow-sm" strokeWidth={1.5} />
		</div>
	</div>

	<div class="text-center space-y-3 max-w-md px-4">
		<div class="text-xs font-bold text-[var(--accent-primary)] tracking-widest uppercase opacity-80 mb-1">{greeting}</div>
		<h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] bg-clip-text text-transparent bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-secondary)]">
			무엇을 도와드릴까요?
		</h1>
		<p class="text-[var(--text-secondary)] text-lg leading-relaxed font-light">
			{subGreeting}<br/>
			<span class="font-medium text-[var(--accent-primary)]">ZIPPT AI</span>가 함께합니다.
		</p>
	</div>

	<div class="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 pt-6 max-w-2xl px-4">
		{#each displayedActions as action, idx}
			<button
				onclick={() => onAction(action.action)}
				class="relative glass-card p-5 rounded-2xl text-left hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-[var(--border-light)] hover:border-[var(--accent-primary)] hover:shadow-2xl group bg-white/60 dark:bg-slate-900/40 overflow-hidden"
				style="animation: slide-up 0.5s ease-out {0.1 + idx * 0.1}s backwards;"
			>
				<div class="absolute top-0 right-0">
					<div class="text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm {categoryColors[action.category]}">
						{action.category}
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="text-2xl bg-white/50 dark:bg-white/5 p-2.5 rounded-xl group-hover:bg-orange-500/10 transition-colors">
						{action.icon}
					</div>
					<div class="flex-1 min-w-0">
						<div class="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors flex items-center gap-2 text-lg">
							{action.title}
							<ArrowUp class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all rotate-45 transform translate-y-1 group-hover:translate-y-0 duration-300" />
						</div>
						<div class="text-sm text-[var(--text-tertiary)] mt-0.5 font-medium">{action.label}</div>
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>
