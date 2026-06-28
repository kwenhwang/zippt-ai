<script lang="ts">
  import { goto } from '$app/navigation';

  let { data }: {
    data: { name: string; complex: any; transactions: any[]; jeonse: any[]; jeonseMeta: any };
  } = $props();
  const c = data.complex;

  // 전용면적(㎡) → 분양 평수 (CLAUDE.md 도메인룰: 분양평 = 전용평 / 0.745)
  function supplyPyeong(m2: number): number {
    return Math.round((m2 / 3.305) / 0.745);
  }
  function eok(manwon: number | null | undefined): string {
    if (!manwon) return '-';
    return `${(manwon / 10000).toFixed(1)}억`;
  }
  function eokFromKrw(krw: number): string {
    return `${(krw / 1e8).toFixed(1)}억`;
  }
  function fmtMonth(ym: string): string {
    return ym && ym.length >= 6 ? `${ym.slice(0, 4)}.${ym.slice(4, 6)}` : ym ?? '';
  }

  const scores = c?.scores ?? {};

  // ── 실거래 ───────────────────────────────────────────────
  const txs = (data.transactions ?? []).filter(
    (t: any) => t?.transaction_amount_krw && t?.contract_year_month
  );
  const monthsSorted = txs.map((t: any) => String(t.contract_year_month)).sort();
  const periodStart = monthsSorted[0];
  const periodEnd = monthsSorted[monthsSorted.length - 1];

  // 평형 선택 (클릭 인터랙션): null=전체. 거래에 존재하는 분양평 버킷.
  const pyBuckets = [...new Set(txs.map((t: any) => supplyPyeong(t.exclusive_area)))].sort(
    (a, b) => a - b
  );
  let selectedPy = $state<number | null>(null);
  const filteredTxs = $derived(
    selectedPy == null ? txs : txs.filter((t: any) => supplyPyeong(t.exclusive_area) === selectedPy)
  );

  // 월별 평균가 추세 (선택 평형 반영, 최근 12개월)
  const monthly = $derived.by(() => {
    const m = new Map<string, { ym: string; sum: number; n: number }>();
    for (const t of filteredTxs) {
      const ym = String(t.contract_year_month);
      if (!m.has(ym)) m.set(ym, { ym, sum: 0, n: 0 });
      const g = m.get(ym)!;
      g.sum += t.transaction_amount_krw;
      g.n++;
    }
    return [...m.values()]
      .map((g) => ({ ym: g.ym, avg: g.sum / g.n / 1e8, n: g.n }))
      .sort((a, b) => a.ym.localeCompare(b.ym))
      .slice(-12);
  });
  // 변별력: 절대 0~max 스케일이면 월별 차이가 안 보임(예: 20~23억 → 막대 다 90%+).
  // min~max 구간을 18%~100% 높이로 매핑해 월별 등락을 부각.
  const trendMax = $derived(Math.max(...monthly.map((m) => m.avg), 0));
  const trendMin = $derived(Math.min(...monthly.map((m) => m.avg), trendMax));
  function barH(avg: number): number {
    const span = trendMax - trendMin;
    if (span <= 0) return 60; // 단일/동일값
    return 18 + 82 * ((avg - trendMin) / span);
  }

  // 최근 실거래 (선택 평형 반영, 상위 8건; txs는 desc 정렬)
  const recent = $derived(
    filteredTxs.slice(0, 8).map((t: any) => ({
      ym: String(t.contract_year_month),
      py: supplyPyeong(t.exclusive_area),
      floor: t.floor,
      eok: t.transaction_amount_krw / 1e8
    }))
  );

  // ── 전세 (평형별 중앙값, 백엔드 /v1/rental/jeonse-by-pyeong) ──
  // supply_pyeong → 전세 중앙값(만원). 전세가율 = 전세 / 매매.
  const jeonseByPy = new Map<number, any>(
    (data.jeonse ?? []).map((j: any) => [j.supply_pyeong, j])
  );
  const jeonseRange = data.jeonseMeta?.date_range ?? null;
  const hasJeonse = (data.jeonse ?? []).length > 0;

  // ── 평형별 (요약 prices_by_area를 분양평 그룹핑) ───────────
  const groups = (() => {
    const m = new Map<number, { py: number; areas: number[]; sumAvg: number; n: number; min: number; max: number; cnt: number }>();
    for (const a of (c?.prices_by_area ?? [])) {
      if (!a?.exclusive_area) continue;
      const py = supplyPyeong(a.exclusive_area);
      if (!m.has(py)) m.set(py, { py, areas: [], sumAvg: 0, n: 0, min: Infinity, max: 0, cnt: 0 });
      const g = m.get(py)!;
      g.areas.push(a.exclusive_area);
      if (a.avg_price) { g.sumAvg += a.avg_price; g.n++; }
      if (a.min_price) g.min = Math.min(g.min, a.min_price);
      if (a.max_price) g.max = Math.max(g.max, a.max_price);
      g.cnt += a.transaction_count ?? 0;
    }
    return [...m.values()]
      .map((g) => {
        const avg = g.n ? g.sumAvg / g.n : 0;
        const j = jeonseByPy.get(g.py);
        // 전세가율 = 전세 중앙값 / 매매 평균 (둘 다 만원). 0~100%.
        const jeonse10k = j?.jeonse_median_10k ?? null;
        const ratio = jeonse10k && avg ? Math.round((jeonse10k / avg) * 100) : null;
        return {
          py: g.py,
          m2: Math.round(g.areas.reduce((s, x) => s + x, 0) / g.areas.length),
          avg,
          cnt: g.cnt,
          min: g.min === Infinity ? 0 : g.min,
          max: g.max,
          jeonse: jeonse10k,
          jeonseCount: j?.jeonse_count ?? 0,
          ratio,
          // 월세: 보증금(만원) + 월세(만원) 중앙값
          wolseDeposit: j?.wolse_deposit_10k ?? null,
          wolseRent: j?.wolse_rent_10k ?? null,
          wolseCount: j?.wolse_count ?? 0
        };
      })
      .filter((g) => g.avg > 0)
      .sort((a, b) => a.py - b.py);
  })();
  const maxAvg = Math.max(1, ...groups.map((g) => g.avg));

  // 상단 핵심 수치: 평형 선택 시 해당 평형 평균가·누적거래로 교체
  const headline = $derived.by(() => {
    if (selectedPy != null) {
      const g = groups.find((x) => x.py === selectedPy);
      if (g) return { avg: g.avg, count: g.cnt, py: selectedPy };
    }
    return { avg: c?.avg_price ?? 0, count: c?.transaction_count ?? 0, py: null as number | null };
  });

  const scoreItems = [
    { label: '교통', val: scores.transit, note: false },
    { label: '학군', val: scores.school, note: true },
    { label: '편의', val: scores.convenience, note: false }
  ];

  function ask(q: string) {
    goto(`/?q=${encodeURIComponent(q)}`);
  }
</script>

<svelte:head>
  <title>{data.name} 시세·실거래 분석 | Zippt AI 부동산</title>
  <meta name="description" content="{data.name} 아파트 평균 시세, 최근 실거래, 월별 추세, 평형별 가격을 실거래 데이터로 분석합니다." />
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
    <div class="mb-6">
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
      {#if periodStart}
        <p class="text-xs text-gray-500 mt-3">📅 분석 기간 <span class="text-gray-300">{fmtMonth(periodStart)} ~ {fmtMonth(periodEnd)}</span> · 최근 실거래 {txs.length}건{#if c.transaction_count} · 누적 {c.transaction_count.toLocaleString()}건{/if}</p>
      {/if}
    </div>

    <!-- 핵심 수치 (평형 선택 시 해당 평형 기준) -->
    <section class="grid grid-cols-2 gap-3 mb-8">
      <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div class="text-xs text-gray-500 mb-1">평균 매매가{#if headline.py}<span class="text-orange-400"> · {headline.py}평</span>{/if}</div>
        <div class="text-3xl font-bold text-white">{eok(headline.avg)}</div>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div class="text-xs text-gray-500 mb-1">누적 거래{#if headline.py}<span class="text-orange-400"> · {headline.py}평</span>{/if}</div>
        <div class="text-3xl font-bold text-white">{headline.count?.toLocaleString() ?? '-'}<span class="text-base font-medium text-gray-500"> 건</span></div>
      </div>
    </section>

    <!-- 평형 선택 (클릭 → 추세·최근거래 필터) -->
    {#if pyBuckets.length > 1}
    <section class="mb-5">
      <div class="flex flex-wrap gap-2">
        <button
          onclick={() => (selectedPy = null)}
          class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all {selectedPy == null ? 'bg-orange-500 text-black border-orange-400' : 'bg-white/5 text-gray-300 border-white/10 hover:border-orange-500/40'}"
        >전체</button>
        {#each pyBuckets as py}
          <button
            onclick={() => (selectedPy = py)}
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all {selectedPy === py ? 'bg-orange-500 text-black border-orange-400' : 'bg-white/5 text-gray-300 border-white/10 hover:border-orange-500/40'}"
          >{py}평</button>
        {/each}
      </div>
    </section>
    {/if}

    <!-- 월별 가격 추세 (실거래 기반, 선택 평형 반영) -->
    {#if monthly.length > 1}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-1 text-gray-200">월별 실거래 평균가{#if selectedPy} · {selectedPy}평{/if}</h2>
      <p class="text-xs text-gray-500 mb-4">최근 {monthly.length}개월 · {trendMin.toFixed(1)}~{trendMax.toFixed(1)}억 구간 확대{#if selectedPy == null} · 평형칩으로 필터{/if}</p>
      <div class="flex items-end gap-1.5 h-32">
        {#each monthly as m}
          <div class="flex-1 flex flex-col items-center justify-end h-full group">
            <div class="text-[9px] text-gray-300 mb-1 whitespace-nowrap">{m.avg.toFixed(1)}</div>
            <div class="w-full rounded-t bg-gradient-to-t from-orange-500/70 to-amber-400 transition-all hover:from-orange-400 hover:to-amber-300" style="height: {barH(m.avg)}%" title="{fmtMonth(m.ym)} · 평균 {m.avg.toFixed(1)}억 · {m.n}건"></div>
          </div>
        {/each}
      </div>
      <div class="flex justify-between text-[10px] text-gray-600 mt-1.5">
        <span>{fmtMonth(monthly[0].ym)}</span>
        <span>{fmtMonth(monthly[monthly.length - 1].ym)}</span>
      </div>
    </section>
    {/if}

    <!-- 최근 실거래 -->
    {#if recent.length > 0}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-3 text-gray-200">최근 실거래{#if selectedPy} · {selectedPy}평{/if}</h2>
      <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-white/5 text-gray-500 text-xs">
              <th class="text-left font-medium px-3 py-2">계약월</th>
              <th class="text-left font-medium px-3 py-2">평형</th>
              <th class="text-left font-medium px-3 py-2">층</th>
              <th class="text-right font-medium px-3 py-2">거래가</th>
            </tr>
          </thead>
          <tbody>
            {#each recent as r}
              <tr class="border-t border-white/5">
                <td class="px-3 py-2 text-gray-300">{fmtMonth(r.ym)}</td>
                <td class="px-3 py-2 text-gray-300">{r.py}평</td>
                <td class="px-3 py-2 text-gray-500">{r.floor ?? '-'}층</td>
                <td class="px-3 py-2 text-right font-bold text-white">{r.eok.toFixed(1)}억</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
    {/if}

    <!-- 평형별 시세 + 전세가율 -->
    {#if groups.length > 0}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-1 text-gray-200">평형별 시세{#if hasJeonse} · 전세·월세{/if}</h2>
      <p class="text-xs text-gray-500 mb-4">분양 평형 기준 · 막대는 매매 평균가 비례{#if hasJeonse} · <span class="text-emerald-400">전세가율 = 전세 중앙값 ÷ 매매 평균</span>{/if}</p>
      <div class="space-y-2.5">
        {#each groups as g}
          <div class="rounded-xl bg-white/5 border border-white/10 p-3.5">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-medium text-gray-100">{g.py}평<span class="text-gray-500 font-normal text-xs"> · 전용 {g.m2}㎡</span></div>
              <div class="text-right">
                <span class="text-base font-bold text-white">{eok(g.avg)}</span>
                {#if g.min && g.max}<span class="text-[11px] text-gray-600 ml-1">{eok(g.min)}~{eok(g.max)}</span>{/if}
              </div>
            </div>
            <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" style="width: {Math.max(8, (g.avg / maxAvg) * 100)}%"></div>
            </div>
            {#if g.jeonse || g.wolseRent}
              <div class="mt-2.5 pt-2.5 border-t border-white/5 space-y-1.5 text-xs">
                {#if g.jeonse}
                  <div class="flex items-center justify-between">
                    <span class="text-gray-400">전세 <span class="text-gray-200 font-medium">{eok(g.jeonse)}</span><span class="text-gray-600"> · {g.jeonseCount}건</span></span>
                    {#if g.ratio}
                      <span class="font-semibold {g.ratio >= 70 ? 'text-red-400' : g.ratio >= 55 ? 'text-amber-400' : 'text-emerald-400'}">전세가율 {g.ratio}%</span>
                    {/if}
                  </div>
                {/if}
                {#if g.wolseRent}
                  <div class="flex items-center justify-between">
                    <span class="text-gray-400">월세 <span class="text-gray-200 font-medium">보증 {eok(g.wolseDeposit)} / 월 {g.wolseRent}만</span><span class="text-gray-600"> · {g.wolseCount}건</span></span>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      {#if hasJeonse && jeonseRange}
        <p class="text-[11px] text-gray-600 mt-3 leading-relaxed">* 전세가율은 전세 보증금 중앙값 ÷ 매매 평균가입니다. 전세 거래 기준 {jeonseRange.min} ~ {jeonseRange.max}. 높을수록(70%↑) 갭이 적고 전세 수요가 강한 편, 낮을수록 매매 대비 전세가 저렴함을 뜻합니다.</p>
      {/if}
    </section>
    {/if}

    <!-- 입지 점수 -->
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4 text-gray-200">입지 점수 <span class="text-xs text-gray-500 font-normal">(전국 상대 0~100)</span></h2>
      <div class="space-y-3">
        {#each scoreItems as s}
          <div class="flex items-center gap-3">
            <div class="w-12 text-xs text-gray-400 shrink-0">{s.label}{#if s.note}<span class="text-gray-600">*</span>{/if}</div>
            <div class="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full rounded-full bg-orange-400/80" style="width: {s.val ?? 0}%"></div>
            </div>
            <div class="w-9 text-right text-sm font-bold text-orange-400 shrink-0">{s.val ?? '-'}</div>
          </div>
        {/each}
      </div>
      <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {#if c.nearest_station}<span>🚇 {c.nearest_station}역 인근</span>{/if}
        {#if c.nearest_bus_stop_m}<span>🚌 버스 {Math.round(c.nearest_bus_stop_m)}m</span>{/if}
        {#if c.parking_per_household}<span>🅿️ 세대당 주차 {c.parking_per_household}</span>{/if}
      </div>
      <p class="text-[11px] text-gray-600 mt-3 leading-relaxed">* 학군: 근접 중학교 기반 전국 백분위 추정치(기준 2026-01)로, 명문학군 명성을 직접 반영하지 않습니다. 참고용.</p>
    </section>

    <!-- AI 추가 질문 -->
    <section class="border-t border-white/10 pt-7">
      <h2 class="text-sm font-semibold mb-3 text-gray-300">AI에게 더 물어보기</h2>
      <div class="flex flex-col gap-2">
        {#each [`${c.complex_name} 전세가율과 투자 전망은?`, `${c.complex_name} 84㎡(34평) 시세 알려줘`, `${c.complex_name} 주변 비슷한 단지 추천해줘`] as q}
          <button onclick={() => ask(q)} class="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-sm text-gray-300">
            {q} <span class="text-orange-400">→</span>
          </button>
        {/each}
      </div>
    </section>

    <p class="text-xs text-gray-600 mt-8 text-center">* 국토교통부 실거래가 기반 · 입지 점수는 단지 편의시설 분석 추정값</p>
  {:else}
    <div class="text-center py-24">
      <h1 class="text-2xl font-bold mb-3">"{data.name}" 단지를 찾지 못했어요</h1>
      <p class="text-gray-400 mb-8">정확한 단지명으로 다시 검색하거나, AI에게 직접 물어보세요.</p>
      <button onclick={() => ask(`${data.name} 시세 알려줘`)} class="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-xl px-6 py-3 transition-colors">AI에게 물어보기 →</button>
    </div>
  {/if}
  </div>
</main>
