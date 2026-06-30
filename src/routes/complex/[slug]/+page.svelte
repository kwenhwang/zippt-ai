<script lang="ts">
  import { goto } from '$app/navigation';
  import InfoTip from '$lib/components/InfoTip.svelte';

  let { data }: {
    data: { name: string; complex: any; transactions: any[]; jeonse: any[]; jeonseMeta: any; auctions: any[]; region: { name: string; slugEn: string } | null; regionAvgPrice: number | null };
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
  // 직거래(가족간 등 시세 괴리)는 평균에서 제외 — 13.6억 같은 이상치 방지. (취소거래는 백엔드서 이미 제외)
  const monthly = $derived.by(() => {
    const m = new Map<string, { ym: string; sum: number; n: number }>();
    for (const t of filteredTxs) {
      if (t.is_direct) continue;
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
  function fmtDate(d: string): string {
    return d && d.length >= 10 ? `${d.slice(2, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)}` : '';
  }
  const recent = $derived(
    filteredTxs.slice(0, 8).map((t: any) => ({
      date: t.contract_date ? fmtDate(t.contract_date) : fmtMonth(String(t.contract_year_month)),
      py: supplyPyeong(t.exclusive_area),
      floor: t.floor,
      eok: t.transaction_amount_krw / 1e8,
      direct: t.is_direct
    }))
  );

  // ── 경매 (해당 단지 물건) ───────────────────────────────────
  const auctions = (data.auctions ?? []).map((a: any) => ({
    case_no: a.case_no,
    appraisal: a.appraisal_price_10k ? a.appraisal_price_10k / 10000 : null,
    minBid: a.min_bid_price_10k ? a.min_bid_price_10k / 10000 : null,
    bidCount: a.bid_count,
    date: a.auction_date,
    status: a.bid_status
  }));

  // ── 전세 (평형별 중앙값, 백엔드 /v1/rental/jeonse-by-pyeong) ──
  // supply_pyeong → 전세 중앙값(만원). 전세가율 = 전세 / 매매.
  const jeonseByPy = new Map<number, any>(
    (data.jeonse ?? []).map((j: any) => [j.supply_pyeong, j])
  );
  const jeonseRange = data.jeonseMeta?.date_range ?? null;
  const hasJeonse = (data.jeonse ?? []).length > 0;
  const households = data.jeonseMeta?.total_households ?? null;

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

  // ── 매매가 anchor: 이 단지 평균 vs 구 전체 평균 ───────────────
  const priceAnchor = $derived.by(() => {
    const ca = c?.avg_price;
    const ra = data.regionAvgPrice;
    if (!ca || !ra) return null;
    const pct = Math.round(((ca - ra) / ra) * 100);
    return { pct, regionAvg: ra, regionName: data.region?.name ?? '구' };
  });

  // ── 투자 판단 신호 ─────────────────────────────────────────
  // 대표 전세가율 = 전세 거래가 가장 많은(유동성 높은) 평형 기준
  const repGroup = groups.filter((g) => g.ratio).sort((a, b) => b.jeonseCount - a.jeonseCount)[0];
  const repRatio = repGroup?.ratio ?? null;
  // 거래 활성도(회전율): 분석기간 내 누적거래 / 세대수
  const velocity =
    households && c?.transaction_count ? Math.round((c.transaction_count / households) * 100) : null;
  // 깡통전세 주의: 대표 평형 전세가율 80%+ (또는 거래 많은 평형 중 80%+ 존재)
  const gakRisk =
    (repRatio != null && repRatio >= 80) ||
    groups.some((g) => g.ratio && g.ratio >= 80 && g.jeonseCount >= 3);

  const scoreItems = [
    { label: '교통', val: scores.transit, note: false },
    { label: '학군', val: scores.school, note: true },
    { label: '편의', val: scores.convenience, note: false }
  ];

  // ── "데이터로 본 한 줄 해석" — 단정 아닌 가이드. 기준점 명확한 신호(구평균 위치·전세가율)만 사용 ──
  const summaryPoints = $derived.by(() => {
    const pts: string[] = [];
    if (priceAnchor) {
      if (priceAnchor.pct >= 10) pts.push(`${priceAnchor.regionName}에서 가격대가 높은 편이에요(평균 +${priceAnchor.pct}%). 상급 단지로 볼 수 있어요.`);
      else if (priceAnchor.pct <= -10) pts.push(`${priceAnchor.regionName} 평균보다 ${Math.abs(priceAnchor.pct)}% 저렴해 진입 부담이 상대적으로 낮은 편이에요.`);
      else pts.push(`${priceAnchor.regionName} 평균과 비슷한 가격대예요.`);
    }
    if (repRatio != null) {
      if (repRatio >= 80) pts.push(`전세가율이 ${repRatio}%로 매우 높아요. 전세 끼고 사는 갭은 적지만, 전세금 회수 위험(깡통전세)을 꼭 점검하세요.`);
      else if (repRatio >= 70) pts.push(`전세가율 ${repRatio}% — 전세를 끼면 필요한 목돈(갭)이 적은 편이라 투자 접근이 비교적 쉬워요.`);
      else if (repRatio <= 50) pts.push(`전세가율 ${repRatio}%로 낮아요. 전세를 껴도 목돈이 많이 필요해, 투자보다 실거주에 가까운 단지예요.`);
      else pts.push(`전세가율 ${repRatio}% — 실거주·갭투자 모두 무난한 편이에요.`);
    }
    return pts;
  });

  // ── 관점별 체크포인트: 목적이 다르면 봐야 할 지표가 다르다 ──
  const perspectives = $derived.by(() => {
    const list = [
      {
        icon: '🏠', label: '실거주',
        items: [
          `입지 — 교통 ${scores.transit ?? '-'} · 학군 ${scores.school != null ? Math.round(scores.school) : '-'} · 편의 ${scores.convenience ?? '-'}`,
          groups.length > 1 ? `평형 선택지 ${groups.length}종` : null
        ]
      },
      {
        icon: '💰', label: '투자',
        items: [
          repRatio != null ? `전세가율 ${repRatio}% — 갭 ${repRatio >= 70 ? '적어 접근 쉬움' : repRatio <= 50 ? '커서 목돈 필요' : '보통'}` : null,
          velocity != null ? `거래 활성도 ${velocity}% (환금성 참고)` : null
        ]
      },
      {
        icon: '🎓', label: '학군',
        items: [
          `학군 점수 ${scores.school != null ? Math.round(scores.school) : '-'} (전국 상대·추정)`
        ]
      }
    ];
    return list.map((p) => ({ ...p, items: p.items.filter(Boolean) as string[] })).filter((p) => p.items.length);
  });

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

    <!-- 매매가 anchor: 구 평균 대비 -->
    {#if priceAnchor}
    <div class="-mt-5 mb-8 text-sm text-gray-400">
      이 단지 평균은 <span class="text-gray-200 font-medium">{priceAnchor.regionName} 평균 {eok(priceAnchor.regionAvg)}</span> 대비
      {#if priceAnchor.pct > 0}
        <span class="text-orange-400 font-semibold">{priceAnchor.pct}% 높습니다</span>
      {:else if priceAnchor.pct < 0}
        <span class="text-sky-400 font-semibold">{Math.abs(priceAnchor.pct)}% 낮습니다</span>
      {:else}
        <span class="text-gray-200 font-semibold">평균 수준</span>
      {/if}
      <span class="text-gray-600 text-xs block mt-0.5">* {priceAnchor.regionName} 전체 아파트 평균가(최근 3개월) 기준</span>
    </div>
    {/if}

    <!-- 데이터로 본 한 줄 해석 -->
    {#if summaryPoints.length > 0}
    <section class="mb-8 rounded-2xl bg-orange-500/5 border border-orange-500/15 p-4">
      <h2 class="text-sm font-semibold text-gray-200 mb-2">💡 데이터로 보면</h2>
      <ul class="space-y-1.5">
        {#each summaryPoints as p}
          <li class="text-sm text-gray-300 leading-relaxed flex gap-2"><span class="text-orange-400">·</span><span>{p}</span></li>
        {/each}
      </ul>
      <p class="text-[11px] text-gray-600 mt-2.5">* 데이터가 보여주는 특징일 뿐 매수/매도 권유가 아닙니다. 실제 판단은 직접 확인하세요.</p>
    </section>
    {/if}

    <!-- 관점별 체크포인트 -->
    {#if perspectives.length > 0}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-1 text-gray-200">관점별로 보면</h2>
      <p class="text-xs text-gray-500 mb-3">목적이 다르면 봐야 할 지표가 다릅니다.</p>
      <div class="grid sm:grid-cols-3 gap-3">
        {#each perspectives as p}
          <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div class="text-sm font-semibold text-gray-200 mb-2">{p.icon} {p.label}</div>
            <ul class="space-y-1">
              {#each p.items as it}
                <li class="text-[11px] text-gray-400 leading-relaxed">{it}</li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </section>
    {/if}

    <!-- 투자 판단 신호 (전세가율·거래활성도·깡통전세) -->
    {#if repRatio != null || velocity != null}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-3 text-gray-200">투자 판단 신호</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {#if repRatio != null}
          <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div class="text-xs text-gray-500 mb-1">대표 전세가율{#if repGroup} · {repGroup.py}평{/if}<InfoTip text="전세 보증금 중앙값 ÷ 매매 평균가. 높을수록(70%↑) 전세 끼고 살 때 필요한 목돈(갭)이 적고 전세 수요가 강합니다. 80%를 넘으면 전세금 회수가 어려운 깡통전세 위험이 커집니다." /></div>
            <div class="text-2xl font-bold {repRatio >= 80 ? 'text-red-400' : repRatio >= 70 ? 'text-amber-400' : 'text-emerald-400'}">{repRatio}%</div>
            <div class="text-[10px] text-gray-600 mt-1">{repRatio >= 80 ? '갭 매우 적음' : repRatio >= 70 ? '갭 적음' : '매매-전세 갭 여유'}</div>
          </div>
        {/if}
        {#if velocity != null}
          <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div class="text-xs text-gray-500 mb-1">거래 활성도<InfoTip text="분석 기간 누적 거래건수 ÷ 총 세대수. 단지가 얼마나 자주 거래되는지(환금성)를 가늠합니다. 분석 기간이 길수록 값이 커지므로 절대 수치보다 참고용입니다." /></div>
            <div class="text-2xl font-bold text-white">{velocity}<span class="text-base text-gray-500">%</span></div>
            <div class="text-[10px] text-gray-600 mt-1">세대 {households?.toLocaleString()} 대비 거래{#if periodStart} ({fmtMonth(periodStart).slice(0,4)}~){/if}</div>
          </div>
        {/if}
        {#if gakRisk}
          <div class="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
            <div class="text-xs text-red-300 mb-1">⚠️ 깡통전세 주의</div>
            <div class="text-sm font-bold text-red-400 leading-tight mt-1">전세가율 80%+</div>
            <div class="text-[10px] text-gray-500 mt-1">전세금 회수 위험 점검 권장</div>
          </div>
        {/if}
      </div>
    </section>
    {/if}

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
              <th class="text-left font-medium px-3 py-2">계약일</th>
              <th class="text-left font-medium px-3 py-2">평형</th>
              <th class="text-left font-medium px-3 py-2">층</th>
              <th class="text-right font-medium px-3 py-2">거래가</th>
            </tr>
          </thead>
          <tbody>
            {#each recent as r}
              <tr class="border-t border-white/5">
                <td class="px-3 py-2 text-gray-300">{r.date}</td>
                <td class="px-3 py-2 text-gray-300">{r.py}평</td>
                <td class="px-3 py-2 text-gray-500">{r.floor ?? '-'}층</td>
                <td class="px-3 py-2 text-right font-bold text-white">
                  {r.eok.toFixed(1)}억{#if r.direct}<span class="ml-1.5 text-[10px] font-medium text-amber-400/90 align-middle">직거래</span>{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="text-[11px] text-gray-600 mt-2">계약 해제(취소)로 신고된 거래는 제외했습니다(단, 실거래 신고는 계약 기준이며 등기 완료를 뜻하지 않습니다). <span class="text-amber-400/90">직거래</span>는 중개 없이 당사자끼리 신고한 거래로 시세와 다를 수 있어 월별 평균에서 뺐습니다(특수관계 여부는 알 수 없음).</p>
    </section>
    {/if}

    <!-- 해당 단지 경매 물건 -->
    {#if auctions.length > 0}
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-3 text-gray-200">진행 중 경매 <span class="text-xs text-gray-500 font-normal">{auctions.length}건</span></h2>
      <div class="space-y-2">
        {#each auctions as a}
          <div class="rounded-xl bg-white/5 border border-white/10 p-3.5 flex items-center justify-between">
            <div>
              <div class="text-sm text-gray-200">{a.case_no}<span class="text-gray-600 text-xs"> · {a.bidCount}회 유찰</span></div>
              <div class="text-xs text-gray-500 mt-0.5">감정 {a.appraisal ? a.appraisal.toFixed(1) + '억' : '-'}{#if a.date} · 매각 {String(a.date).slice(4,6)}/{String(a.date).slice(6,8)}{/if}</div>
            </div>
            <div class="text-right">
              <div class="text-base font-bold text-orange-400">{a.minBid ? a.minBid.toFixed(1) + '억' : '-'}</div>
              <div class="text-[10px] text-gray-500">최저가</div>
            </div>
          </div>
        {/each}
      </div>
      <p class="text-[11px] text-gray-600 mt-2">법원 경매 진행 물건입니다. 자세한 시세 대비 할인율·낙찰가율은 경매 분석에서 확인하세요. <a href="/auction" class="text-orange-400 hover:underline">경매 분석 →</a></p>
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
      <h2 class="text-lg font-semibold mb-4 text-gray-200">입지 점수 <span class="text-xs text-gray-500 font-normal">(전국 상대 0~100)</span><InfoTip text="교통·학군·편의 시설을 전국 단지와 비교해 0~100으로 환산한 추정값입니다. 절대 등급이 아니라 상대 비교용입니다. 학군은 반경 1km 중학교의 특목고 진학률(절대+전국상대 혼합)과 반경 1km 입시·외국어 학원 밀도를 합산한 추정치로, 실제 배정 고교·학군 명성과 다를 수 있습니다." /></h2>
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
      <p class="text-[11px] text-gray-600 mt-3 leading-relaxed">* 학군: 반경 1km 중학교의 특목고 진학률 + 반경 1km 입시·외국어 학원 밀도를 합산한 추정치(기준 2026-01)입니다. 배정 고교·실제 학군 명성을 직접 반영하지 않으므로 참고용입니다.</p>
    </section>

    <!-- 이 지역 더 보기 -->
    {#if data.region}
    <section class="border-t border-white/10 pt-7">
      <h2 class="text-sm font-semibold mb-3 text-gray-300">{data.region.name} 더 보기</h2>
      <div class="grid grid-cols-2 gap-2">
        <a href="/area/{data.region.slugEn}" class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-sm text-gray-300">
          {data.region.name} 종합 분석 <span class="text-orange-400">→</span>
          <div class="text-[11px] text-gray-600 mt-0.5">시세·주요단지·순위</div>
        </a>
        <a href="/pyeong/{data.region.slugEn}" class="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-sm text-gray-300">
          {data.region.name} 평형분석 <span class="text-orange-400">→</span>
          <div class="text-[11px] text-gray-600 mt-0.5">소형~대형 평형별 시세</div>
        </a>
      </div>
    </section>
    {/if}

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
