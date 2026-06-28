<script lang="ts">
  import { goto } from '$app/navigation';

  let { data }: { data: { name: string; complex: any } } = $props();
  const c = data.complex;

  // 전용면적(㎡) → 분양 평수 (CLAUDE.md 도메인룰: 분양평 = 전용평 / 0.745)
  function supplyPyeong(m2: number): number {
    return Math.round((m2 / 3.305) / 0.745);
  }
  function eok(manwon: number | null | undefined): string {
    if (!manwon) return '-';
    return `${(manwon / 10000).toFixed(1)}억`;
  }

  const scores = c?.scores ?? {};
  const areas = (c?.prices_by_area ?? []).slice().sort((a: any, b: any) => (a.exclusive_area ?? 0) - (b.exclusive_area ?? 0));

  function ask(q: string) {
    goto(`/?q=${encodeURIComponent(q)}`);
  }
</script>

<svelte:head>
  <title>{data.name} 시세·실거래 분석 | Zippt AI 부동산</title>
  <meta name="description" content="{data.name} 아파트 평균 시세, 평형별 가격, 입지 점수(교통·학군·편의)를 실거래 데이터로 분석합니다." />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  <!-- 헤더 -->
  <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm">
    <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold">Z</div>
        <span class="font-bold text-orange-400">Zippt AI</span>
      </a>
      <span class="text-gray-500">/</span>
      <span class="text-gray-300 truncate">{data.name}</span>
    </div>
  </header>

  <div class="max-w-3xl mx-auto px-6 py-12">
  {#if c}
    <!-- 히어로 -->
    <div class="mb-10">
      <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-orange-400 text-xs font-medium mb-4">단지 분석</div>
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{c.complex_name}</h1>
      <p class="text-gray-400 text-sm">
        {c.district ?? ''}
        {#if c.construction_year}<span class="text-gray-600"> · {c.construction_year}년 준공</span>{/if}
      </p>
    </div>

    <!-- 요약 KPI -->
    <section class="grid grid-cols-3 gap-3 mb-10">
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
        <div class="text-2xl font-bold text-white">{eok(c.avg_price)}</div>
        <div class="text-xs text-gray-500 mt-1">평균 매매가</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
        <div class="text-2xl font-bold text-orange-400">{c.transaction_count?.toLocaleString() ?? '-'}</div>
        <div class="text-xs text-gray-500 mt-1">거래 건수</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
        <div class="text-2xl font-bold text-white">{scores.composite ?? '-'}</div>
        <div class="text-xs text-gray-500 mt-1">종합 점수</div>
      </div>
    </section>

    <!-- 평형별 시세 -->
    {#if areas.length > 0}
    <section class="mb-10">
      <h2 class="text-lg font-semibold mb-1 text-gray-200">평형별 시세</h2>
      <p class="text-xs text-gray-500 mb-4">전용면적 기준 · 괄호는 분양 평수(전용률 74.5%)</p>
      <div class="space-y-2">
        {#each areas as a}
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div class="text-sm text-gray-200">
              전용 {a.exclusive_area}㎡
              <span class="text-gray-500">(분양 약 {supplyPyeong(a.exclusive_area)}평)</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-white">{a.avg_price_display ?? eok(a.avg_price)}</div>
              {#if a.price_range_display}<div class="text-[11px] text-gray-600">{a.price_range_display}</div>{/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
    {/if}

    <!-- 입지 점수 -->
    <section class="mb-10">
      <h2 class="text-lg font-semibold mb-4 text-gray-200">입지 점수 <span class="text-xs text-gray-500 font-normal">(0~100)</span></h2>
      <div class="grid grid-cols-3 gap-3">
        {#each [['교통', scores.transit], ['학군', scores.school], ['편의', scores.convenience]] as [label, val]}
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-xl font-bold text-orange-400">{val ?? '-'}</div>
            <div class="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        {/each}
      </div>
      <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {#if c.nearest_station}<span>🚇 {c.nearest_station}</span>{/if}
        {#if c.nearest_bus_stop_m}<span>🚌 버스정류장 {c.nearest_bus_stop_m}m</span>{/if}
        {#if c.parking_per_household}<span>🅿️ 세대당 주차 {c.parking_per_household}</span>{/if}
      </div>
    </section>

    <!-- AI 추가 질문 -->
    <section class="border-t border-white/10 pt-8">
      <h2 class="text-sm font-semibold mb-3 text-gray-300">AI에게 더 물어보기</h2>
      <div class="flex flex-col gap-2">
        {#each [`${c.complex_name} 최근 실거래가 추세 분석해줘`, `${c.complex_name} 전세가율과 투자 전망은?`, `${c.complex_name} 84㎡(34평) 시세 알려줘`] as q}
          <button onclick={() => ask(q)} class="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-sm text-gray-300">
            {q} <span class="text-orange-400">→</span>
          </button>
        {/each}
      </div>
    </section>

    <p class="text-xs text-gray-600 mt-8 text-center">* 국토교통부 실거래가 기반 · 점수는 단지 편의시설 분석값</p>
  {:else}
    <!-- 단지 못 찾음 -->
    <div class="text-center py-20">
      <h1 class="text-2xl font-bold mb-3">"{data.name}" 단지를 찾지 못했어요</h1>
      <p class="text-gray-400 mb-8">정확한 단지명으로 다시 검색하거나, AI에게 직접 물어보세요.</p>
      <button onclick={() => ask(`${data.name} 시세 알려줘`)} class="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl px-6 py-3 transition-colors">
        AI에게 물어보기 →
      </button>
    </div>
  {/if}
  </div>
</main>
