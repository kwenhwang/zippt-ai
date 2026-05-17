<script lang="ts">
	import { ArrowUp } from 'lucide-svelte';
	import { onMount } from 'svelte';

	interface SuggestedAction {
		title: string;
		label: string;
		action: string;
		icon: string;
		category: '실거래가' | '지역 비교' | '시세 분석' | '단지 정보' | '가격 예측' | '전월세';
	}

	interface Props {
		onAction: (action: string) => void;
	}
	let { onAction }: Props = $props();

	const suggestedActions: SuggestedAction[] = [
		{ title: '강남구 아파트', label: '최근 3개월 실거래가', action: '강남구 아파트 최근 3개월 실거래가 알려줘', icon: '📊', category: '실거래가' },
		{ title: '래미안 퍼스티지', label: '최근 거래 내역', action: '래미안 퍼스티지 최근 거래 내역 알려줘', icon: '🏢', category: '실거래가' },
		{ title: '강남 vs 마포', label: '학군·교통 비교', action: '강남구와 마포구 학군 점수와 교통 점수를 비교해줘', icon: '🏫', category: '지역 비교' },
		{ title: '서울 전세 시장', label: '전세가율 분석', action: '서울 아파트 매매가 대비 전세가 비율 알려줘', icon: '📈', category: '시세 분석' },
		{ title: '잠실 엘스', label: '가격 예측', action: '잠실 엘스 아파트 향후 가격 전망 알려줘', icon: '🔮', category: '가격 예측' },
		{ title: '2024 상승 TOP5', label: '서울 상승률 랭킹', action: '2024년 서울 아파트 가격 상승률 상위 5개 지역 알려줘', icon: '🔥', category: '시세 분석' },
		{ title: '마포구 월세', label: '최근 전월세 시세', action: '마포구 아파트 최근 전월세 시세 알려줘', icon: '🏠', category: '전월세' },
		{ title: '판교 알파리움', label: '단지 종합 분석', action: '판교 알파리움 단지 정보와 교통·편의 점수 알려줘', icon: '💎', category: '단지 정보' }
	];

	const catTints: Record<SuggestedAction['category'], { bg: string; fg: string }> = {
		'실거래가': { bg: 'var(--cat-trades-bg)',   fg: 'var(--cat-trades-fg)' },
		'지역 비교': { bg: 'var(--cat-compare-bg)',  fg: 'var(--cat-compare-fg)' },
		'시세 분석': { bg: 'var(--cat-analysis-bg)', fg: 'var(--cat-analysis-fg)' },
		'단지 정보': { bg: 'var(--cat-complex-bg)',  fg: 'var(--cat-complex-fg)' },
		'가격 예측': { bg: 'var(--cat-forecast-bg)', fg: 'var(--cat-forecast-fg)' },
		'전월세':   { bg: 'var(--cat-rental-bg)',   fg: 'var(--cat-rental-fg)' }
	};

	function shuffle<T>(arr: T[]): T[] {
		const copy = [...arr];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		return copy;
	}

	const sample = shuffle(suggestedActions).slice(0, 5);
	const featured = sample[0];
	const rest = sample.slice(1, 5);

	const hour = new Date().getHours();
	const greeting = hour < 12 ? '좋은 아침입니다' : hour < 18 ? '즐거운 오후네요' : '편안한 저녁 되세요';

	// Count-up animation for stat pills
	let stat1 = $state('0');
	let stat2 = $state('0');
	let stat3 = $state('0');

	function countUp(target: number, suffix: string, decimals: number, delay: number, set: (v: string) => void) {
		const start = performance.now();
		const dur = 1100;
		let raf = 0;
		const tick = (t: number) => {
			const elapsed = t - start - delay;
			if (elapsed < 0) {
				raf = requestAnimationFrame(tick);
				return;
			}
			const p = Math.min(1, elapsed / dur);
			const eased = 1 - Math.pow(1 - p, 3);
			const v = target * eased;
			set((decimals === 0 ? Math.round(v) : v.toFixed(decimals)) + suffix);
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}

	onMount(() => {
		const cancels = [
			countUp(10.7, 'M', 1, 100, (v) => (stat1 = v)),
			countUp(46, 'K', 0, 250, (v) => (stat2 = v)),
			countUp(19, '년', 0, 400, (v) => (stat3 = v))
		];
		return () => cancels.forEach((c) => c());
	});
</script>

<div class="px-4 pt-2 pb-4 flex flex-col gap-6 max-w-2xl mx-auto w-full animate-[fade-in_0.6s_ease-out]">
	<!-- Eyebrow greeting -->
	<div class="flex items-center gap-2.5 px-1 pt-2">
		<span class="block w-6 h-px bg-[var(--accent-primary)] opacity-50"></span>
		<span class="text-[11px] font-bold text-[var(--accent-primary)] tracking-[0.18em] uppercase whitespace-nowrap">
			{greeting}
		</span>
	</div>

	<!-- Headline — mixed weight -->
	<h1
		class="m-0 font-extrabold leading-[1.08] tracking-[-0.035em] text-[var(--text-primary)]"
		style="font-size: clamp(28px, 8vw, 40px);"
	>
		대한민국 부동산,<br />
		<span class="font-medium text-[var(--text-tertiary)]">모든 답을 한 번에.</span>
	</h1>

	<!-- Stat pills — 3-col with count-up -->
	<div
		class="grid grid-cols-3 rounded-[18px] border border-[var(--border-light)] py-3.5 px-2"
		style="background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 1px 2px rgba(0,0,0,0.04);"
	>
		<div class="flex flex-col items-center gap-0.5 px-1 min-w-0">
			<div class="text-[22px] font-extrabold text-[var(--accent-primary)] tracking-[-0.04em] leading-none whitespace-nowrap tabular-nums">
				{stat1}
			</div>
			<div class="text-[11px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">실거래가</div>
		</div>
		<div class="flex flex-col items-center gap-0.5 px-1 min-w-0 border-l border-[var(--border-light)]">
			<div class="text-[22px] font-extrabold text-[var(--accent-primary)] tracking-[-0.04em] leading-none whitespace-nowrap tabular-nums">
				{stat2}
			</div>
			<div class="text-[11px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">아파트 단지</div>
		</div>
		<div class="flex flex-col items-center gap-0.5 px-1 min-w-0 border-l border-[var(--border-light)]">
			<div class="text-[22px] font-extrabold text-[var(--accent-primary)] tracking-[-0.04em] leading-none whitespace-nowrap tabular-nums">
				{stat3}
			</div>
			<div class="text-[11px] font-medium text-[var(--text-tertiary)] whitespace-nowrap">시세 이력</div>
		</div>
	</div>

	<!-- Featured + suggested -->
	<div class="flex flex-col gap-2.5">
		<div class="text-[12px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.12em] px-1">
			지금 인기 질문
		</div>

		<!-- Featured action — large hero card -->
		<button
			onclick={() => onAction(featured.action)}
			class="featured-action group relative overflow-hidden flex items-center gap-3.5 p-4 rounded-[22px] text-left"
			style="animation: slide-up 500ms cubic-bezier(0.16,1,0.3,1) 50ms backwards;"
		>
			<div
				class="flex-shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl"
				style="background: linear-gradient(135deg, var(--accent-highlight), var(--accent-primary)); box-shadow: 0 8px 16px -6px rgba(234,88,12,0.40);"
			>
				{featured.icon}
			</div>
			<div class="flex-1 min-w-0">
				<div class="text-[11px] font-extrabold text-[var(--accent-secondary)] uppercase tracking-[0.06em] mb-0.5">
					{featured.category}
				</div>
				<div class="text-[16px] font-bold text-[var(--text-primary)] tracking-[-0.02em] leading-[1.25]">
					{featured.title} · {featured.label}
				</div>
			</div>
			<div
				class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5"
				style="background: var(--accent-primary);"
			>
				<ArrowUp class="w-3.5 h-3.5 text-white" strokeWidth={3} />
			</div>
		</button>

		<!-- Suggested actions — 2-col grid -->
		<div class="grid grid-cols-2 gap-2">
			{#each rest as action, i}
				{@const tint = catTints[action.category]}
				<button
					onclick={() => onAction(action.action)}
					class="suggested-action group relative overflow-hidden p-3 rounded-2xl text-left"
					style="animation: slide-up 500ms cubic-bezier(0.16,1,0.3,1) {i * 60}ms backwards;"
				>
					<div class="flex items-center gap-2 mb-1.5">
						<span class="text-[16px] leading-none">{action.icon}</span>
						<span
							class="text-[9px] font-extrabold uppercase tracking-[0.06em] whitespace-nowrap"
							style="color: {tint.fg};"
						>
							{action.category}
						</span>
					</div>
					<div class="text-[13.5px] font-bold leading-[1.3] tracking-[-0.015em] text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors mb-0.5">
						{action.title}
					</div>
					<div class="text-[11.5px] font-medium leading-[1.35] tracking-[-0.005em] text-[var(--text-tertiary)]">
						{action.label}
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.featured-action {
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		border: 1px solid #fed7aa;
		box-shadow: 0 4px 10px -2px rgba(234, 88, 12, 0.1);
		transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 250ms, border-color 250ms;
	}
	.featured-action:hover {
		transform: translateY(-2px);
		border-color: var(--accent-primary);
		box-shadow: 0 20px 35px -12px rgba(234, 88, 12, 0.30);
	}
	.featured-action:active {
		transform: scale(0.98);
	}

	.suggested-action {
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid var(--border-light);
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
		transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms, box-shadow 200ms, background 200ms;
	}
	.suggested-action:hover {
		background: #ffffff;
		border-color: rgba(234, 88, 12, 0.35);
		transform: translateY(-1px);
		box-shadow: 0 8px 16px -6px rgba(234, 88, 12, 0.15);
	}
	.suggested-action:active {
		transform: scale(0.97);
	}

	:global(.dark) .featured-action {
		background: linear-gradient(135deg, rgba(234, 88, 12, 0.18), rgba(252, 211, 77, 0.08));
		border-color: rgba(252, 211, 77, 0.18);
	}
	:global(.dark) .suggested-action {
		background: rgba(255, 250, 240, 0.035);
		border-color: rgba(255, 250, 240, 0.07);
	}
	:global(.dark) .suggested-action:hover {
		background: rgba(255, 250, 240, 0.07);
	}
</style>
