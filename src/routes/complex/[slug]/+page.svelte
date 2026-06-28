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

  // 평형별 시세: raw 면적(수십 개 중복)을 분양평 기준으로 그룹핑해 대표 시세로 정리
  const groups = (() => {
    const m = new Map<number, { py: number; areas: number[]; sumAvg: number; n: number; min: number; max: number }>();
    for (const a of (c?.prices_by_area ?? [])) {
      if (!a?.exclusive_area) continue;
      const py = supplyPyeong(a.exclusive_area);
      if (!m.has(py)) m.set(py, { py, areas: [], sumAvg: 0, n: 0, min: Infinity, max: 0 });
      const g = m.get(py)!;
      g.areas.push(a.exclusive_area);
      if (a.avg_price) { g.sumAvg += a.avg_price; g.n++; }
      if (a.min_price) g.min = Math.min(g.min, a.min_price);
      if (a.max_price) g.max = Math.max(g.max, a.max_price);
    }
    return [...m.values()]
      .map((g) => ({
        py: g.py,
        m2: Math.round(g.areas.reduce((s, x) => s + x, 0) / g.areas.length),
        avg: g.n ? g.sumAvg / g.n : 0,
        min: g.min === Infinity ? 0 : g.min,
        max: g.max
      }))
      .filter((g) => g.avg > 0)
      .sort((a, b) => a.py - b.py);
  })();

  const maxAvg = Math.max(1, ...groups.map((g) => g.avg));
  const scoreItems = [
    { label: '교통', val: scores.transit },
    { label: '학군', val: scores.school },
    { label: '편의', val: scores.convenience }
  ];

  function ask(q: string) {
    goto(`/?q=${encodeURIComponent(q)}`);
  }
</script>

<svelte:head>
  <title>{data.name} 시세·실거래 분석 | Zippt AI 부동산</title>
  <meta name="description" content="{data.name} 아파트 평균 시세, 평형별 가격, 입지 점수(교통·학군·편의)를 실거래 데이터로 분석합니다." />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
    <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold text-black">Z</div>
        <span class="font-bold text-orange-400">Zippt AI</span>
      </a>
      <span class="text-gray-600">/</span>
      <span class="text-gray-300 truncate">{data.name}</span>
    </div>
  </header>

  <div class="max-w-3xl mx-auto px-6 py-10">
  {#if c}
    <!-- 히어로 -->
    <div class="mb-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-orange-400 text-xs font-medium mb-3">단지 분석</div>
          <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-1">{c.complex_name}</h1>
          <p class="text-gray-400 text-sm">
            {c.district ?? ''}{#if c.construction_year}<span class="text-gray-600"> · {c.construction_year}년 준공</span>{/if}
          </p>
        </div>
        {#if scores.composite}
        <div class="shrink-0 text-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/5 border border-orange-500/30 px-4 py-3">
          <div class="text-3xl font-extrabold text-orange-400 leading-none">{scores.composite}</div>
          <div class="text-[10px] text-gray-400 mt-1">종합점수</div>
        </div>
        {/if}
      </div>
    </div>

    <!-- 핵심 수치 -->
    <section class="grid grid-cols-2 gap-3 mb-10">
      <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div class="text-xs text-gray-500 mb-1">평균 매매가</div>
        <div class="text-3xl font-bold text-white">{eok(c.avg_price)}</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div class="text-xs text-gray-500 mb-1">누적 거래</div>
        <div class="text-3xl font-bold text-white">{c.transaction_count?.toLocaleString() ?? '-'}<span class="text-base font-medium text-gray-500"> 건</span></div>
      </div>
    </section>

    <!-- 평형별 시세 (분양평 그룹핑 + 막대) -->
    {#if groups.length > 0}
    <section class="mb-10">
      <h2 class="text-lg font-semibold mb-1 text-gray-200">평형별 시세</h2>
      <p class="text-xs text-gray-500 mb-4">분양 평형 기준 · 막대는 평균가 비례</p>
      <div class="space-y-2.5">
        {#each groups as g}
          <div class="rounded-xl bg-white/5 border border-white/10 p-3.5">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-100">
                {g.py}평<span class="text-gray-500 font-normal text-xs"> · 전용 {g.m2}㎡</span>
              </div>
              <div class="text-right">
                <span class="text-base font-bold text-white">{eok(g.avg)}</span>
                {#if g.min && g.max}<span class="text-[11px] text-gray-600 ml-1">{eok(g.min)}~{eok(g.max)}</span>{/if}
              </div>
            </div>
            <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style="width: {Math.max(8, (g.avg / maxAvg) * 100)}%"></div>
            </div>
          </div>
        {/each}
      </div>
    </section>
    {/if}

    <!-- 입지 점수 (막대) -->
    <section class="mb-10">
      <h2 class="text-lg font-semibold mb-4 text-gray-200">입지 점수 <span class="text-xs text-gray-500 font-normal">(0~100)</span></h2>
      <div class="space-y-3">
        {#each scoreItems as s}
          <div class="flex items-center gap-3">
            <div class="w-10 text-xs text-gray-400 shrink-0">{s.label}</div>
            <div class="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full rounded-full bg-orange-400/80" style="width: {s.val ?? 0}%"></div>
            </div>
            <div class="w-9 text-right text-sm font-bold text-orange-400 shrink-0">{s.val ?? '-'}</div>
          </div>
        {/each}
      </div>
      <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {#if c.nearest_station}<span>🚇 {c.nearest_station}역 인근</span>{/if}
        {#if c.nearest_bus_stop_m}<span>🚌 버스 {Math.round(c.nearest_bus_stop_m)}m</span>{/if}
        {#if c.parking_per_household}<span>🅿️ 세대당 주차 {c.parking_per_household}</span>{/if}
      </div>
    </section>

    <!-- AI 추가 질문 -->
    <section class="border-t border-white/10 pt-7">
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
    <div class="text-center py-24">
      <h1 class="text-2xl font-bold mb-3">"{data.name}" 단지를 찾지 못했어요</h1>
      <p class="text-gray-400 mb-8">정확한 단지명으로 다시 검색하거나, AI에게 직접 물어보세요.</p>
      <button onclick={() => ask(`${data.name} 시세 알려줘`)} class="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl px-6 py-3 transition-colors">
        AI에게 물어보기 →
      </button>
    </div>
  {/if}
  </div>
</main>
