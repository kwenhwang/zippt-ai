<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import InfoTip from '$lib/components/InfoTip.svelte';

  let { data }: { data: PageData } = $props();
  const region = data.region;

  const AREA_ORDER = ['소형', '중소형', '중형', '대형'];
  const rows = $derived(
    (data.byArea || [])
      .filter((r: any) => r?.avg_price)
      .sort((a: any, b: any) => AREA_ORDER.indexOf(a.area_range) - AREA_ORDER.indexOf(b.area_range))
  );
  const totalTx = $derived(rows.reduce((s: number, r: any) => s + (r.transaction_count || 0), 0));
  const maxPerPy = $derived(Math.max(1, ...rows.map((r: any) => r.avg_price_per_py || 0)));
  const mostTraded = $derived(rows.slice().sort((a: any, b: any) => b.transaction_count - a.transaction_count)[0]);
  const highestPy = $derived(rows.slice().sort((a: any, b: any) => (b.avg_price_per_py || 0) - (a.avg_price_per_py || 0))[0]);

  function eok(v: number | undefined) {
    return v ? (v / 10000).toFixed(1) + '억' : '-';
  }
  function pct(n: number) {
    return totalTx > 0 ? Math.round((n / totalTx) * 100) : 0;
  }
  // 중위가-평균가 괴리: 평균이 중위보다 크게 높으면 고가 거래에 쏠림(우편향)
  function skew(avg: number, median: number): string | null {
    if (!avg || !median) return null;
    const gap = ((avg - median) / median) * 100;
    if (gap >= 8) return '고가거래 쏠림';
    if (gap <= -8) return '저가거래 쏠림';
    return null;
  }

  function ask(q: string) {
    goto(`/?q=${encodeURIComponent(q)}`);
  }
</script>

<svelte:head>
  {#if region}
    <title>{region.name} 평형별 시세 분석 | Zippt AI</title>
    <meta name="description" content="{region.name} 아파트를 소형·중소형·중형·대형 평형별로 평균가·평당가·중위가·거래량을 실거래 데이터로 분석합니다." />
    <link rel="canonical" href="https://zippt-ai.vercel.app/pyeong/{region.slugEn}" />
  {/if}
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  {#if region}
    <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
        <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold">Z</div>
          <span class="font-bold text-orange-400">Zippt AI</span>
        </a>
        <span class="text-gray-500">/</span>
        <a href="/area/{region.slugEn}" class="text-gray-300 hover:text-orange-400">{region.name}</a>
        <span class="text-gray-500">/</span>
        <span class="text-gray-300">평형분석</span>
      </div>
    </header>

    <div class="max-w-3xl mx-auto px-6 py-12">
      <!-- 히어로 -->
      <div class="text-center mb-10">
        <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-5">
          평형별 분석
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight">
          {region.name} <span class="text-orange-400">평형별 시세</span>
        </h1>
        <p class="text-gray-500 text-sm mt-4">국토교통부 실거래가 최근 3개월 · 전용면적 기준 · 총 {totalTx.toLocaleString()}건</p>
      </div>

      {#if rows.length > 0}
        <!-- A. 평형별 상세 카드 -->
        <section class="mb-10 space-y-3">
          {#each rows as r}
            {@const sk = skew(r.avg_price, r.median_price)}
            <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <span class="text-base font-semibold text-gray-100">{r.area_range}</span>
                  <span class="text-xs text-gray-500 ml-2">{r.label}</span>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-white">{r.avg_price_display}</div>
                  <div class="text-[11px] text-gray-500">평균 매매가</div>
                </div>
              </div>

              <!-- 지표 그리드 -->
              <div class="grid grid-cols-3 gap-2 text-center mb-3">
                <div class="bg-black/20 rounded-lg py-2">
                  <div class="text-sm font-bold text-orange-400">{r.avg_price_per_py?.toLocaleString()}<span class="text-[10px] font-normal text-gray-500">만/평</span></div>
                  <div class="text-[10px] text-gray-600 mt-0.5">평당가</div>
                </div>
                <div class="bg-black/20 rounded-lg py-2">
                  <div class="text-sm font-bold text-gray-200">{r.median_price_display}</div>
                  <div class="text-[10px] text-gray-600 mt-0.5">중위가</div>
                </div>
                <div class="bg-black/20 rounded-lg py-2">
                  <div class="text-sm font-bold text-gray-200">{eok(r.min_price)}~{eok(r.max_price)}</div>
                  <div class="text-[10px] text-gray-600 mt-0.5">최저~최고</div>
                </div>
              </div>

              <!-- 평당가 막대 (평형 간 상대 비교) -->
              <div class="flex items-center gap-2 mb-2">
                <span class="text-[10px] text-gray-600 w-10">평당가</span>
                <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style="width: {Math.round(((r.avg_price_per_py || 0) / maxPerPy) * 100)}%"></div>
                </div>
              </div>

              <!-- 거래 비중 -->
              <div class="flex items-center justify-between text-[11px] text-gray-500">
                <span>거래 {r.transaction_count}건 · 전체의 {pct(r.transaction_count)}%</span>
                {#if sk}<span class="text-amber-400/80">{sk}</span>{/if}
              </div>
            </div>
          {/each}
        </section>

        <!-- B. 요약 인사이트 -->
        <section class="mb-10 p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
          <h2 class="text-sm font-semibold text-gray-200 mb-2">한눈에 보기</h2>
          <ul class="text-xs text-gray-400 space-y-1 leading-relaxed">
            <li>· 거래가 가장 활발한 평형: <span class="text-gray-200 font-medium">{mostTraded?.area_range}</span> (전체의 {pct(mostTraded?.transaction_count || 0)}%)</li>
            <li>· 평당가<InfoTip text="1평(약 3.3㎡)당 가격입니다. 평형이 다른 구간을 같은 기준으로 비교할 때 씁니다. 보통 소형일수록 평당가가 높습니다." />가 가장 높은 평형: <span class="text-gray-200 font-medium">{highestPy?.area_range}</span> ({highestPy?.avg_price_per_py?.toLocaleString()}만/평)</li>
            <li class="text-gray-600">· 평당가는 보통 소형일수록 높습니다(소형 선호·희소성). 절대가격과 다르게 보세요.</li>
          </ul>
        </section>

        <!-- 캐비엇 -->
        <p class="text-[11px] text-gray-600 leading-relaxed mb-10">
          * 전용면적(실면적) 기준 구간입니다. 한국에서 흔히 말하는 "분양 34평"은 전용 약 84㎡(중형)에 해당합니다.
          평균가는 이상치(비정상 고·저가 거래)를 제외한 값이며, 일부 거래가 표본에서 제외됐을 수 있습니다.
          중위가와 평균가 차이가 크면 일부 고가/저가 거래에 평균이 끌린 것이니 중위가를 함께 보세요.
        </p>
      {:else}
        <div class="text-center py-16 text-gray-500 text-sm">
          {region.name} 평형별 데이터를 불러오지 못했습니다.
        </div>
      {/if}

      <!-- CTA -->
      <section class="text-center space-y-3">
        <a href="/area/{region.slugEn}" class="block text-sm text-gray-300 hover:text-orange-400 underline underline-offset-4">{region.name} 종합 분석 보기</a>
        <button
          onclick={() => ask(`${region.name} 어떤 평형이 투자하기 좋아?`)}
          class="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-all"
        >
          AI에게 더 물어보기 →
        </button>
      </section>
    </div>
  {:else}
    <div class="max-w-xl mx-auto px-6 py-32 text-center">
      <h1 class="text-2xl font-bold text-gray-200 mb-3">지역을 찾지 못했어요</h1>
      <a href="/" class="text-orange-400 underline underline-offset-4">메인으로</a>
    </div>
  {/if}
</main>
