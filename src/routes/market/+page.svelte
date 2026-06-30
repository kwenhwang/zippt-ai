<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import InfoTip from '$lib/components/InfoTip.svelte';

  let { data }: { data: PageData } = $props();

  const AGG = ['전국', '수도권', '비수도권'];
  // 시도만 (집계 제외) — 랭킹용
  const sidos = $derived(
    data.regions
      .filter((r) => !AGG.includes(r.name) && r.latest != null)
      .sort((a, b) => (b.latest ?? 0) - (a.latest ?? 0))
  );
  const find = (name: string) => data.regions.find((r) => r.name === name) ?? null;
  const national = $derived(find('전국'));
  const capital = $derived(find('수도권'));
  const nonCapital = $derived(find('비수도권'));

  // 선택 지역 (기본 전국)
  let selected = $state('전국');
  const sel = $derived(find(selected));

  // 전국 전년 동월 대비(anchor): series는 최근 ~25개월(월별)
  const natYoY = $derived.by(() => {
    const s = national?.series ?? [];
    if (s.length < 13) return null;
    const latest = s[s.length - 1].index;
    const yearAgo = s[s.length - 13].index;
    return Math.round((latest - yearAgo) * 10) / 10;
  });

  // 부동산원 소비심리지수 공식 국면: <95 하강 / 95~115 보합 / 115+ 상승
  function phase(v: number | null): { label: string; cls: string } {
    if (v == null) return { label: '-', cls: 'text-gray-400' };
    if (v >= 115) return { label: '상승 국면', cls: 'text-orange-400' };
    if (v >= 95) return { label: '보합 국면', cls: 'text-gray-200' };
    return { label: '하강 국면', cls: 'text-sky-400' };
  }
  // 국면 평이한 해석 (단정/예측 아님 — 심리 상태 설명)
  function interp(v: number | null): string {
    if (v == null) return '';
    if (v >= 115) return '지금은 사려는 심리가 팔려는 심리보다 강한 국면이에요. 다만 심리 지표일 뿐, 가격 상승을 보장하지는 않습니다.';
    if (v >= 95) return '매수·매도 심리가 비슷하게 맞선 관망 국면이에요. 뚜렷한 방향성은 약합니다.';
    return '팔려는 심리가 더 우세한 국면이에요. 급한 거래일수록 신중하게 보세요.';
  }
  function fmtMonth(p: string) {
    const [y, m] = (p || '').split('-');
    return y && m ? `${y}.${m}` : p;
  }
  function deltaStr(d: number | null) {
    if (d == null) return '';
    if (d > 0) return `▲ ${d.toFixed(1)}`;
    if (d < 0) return `▼ ${Math.abs(d).toFixed(1)}`;
    return '— 0';
  }
  function deltaCls(d: number | null) {
    if (d == null) return 'text-gray-500';
    if (d > 0) return 'text-orange-400';
    if (d < 0) return 'text-sky-400';
    return 'text-gray-500';
  }

  // SVG 라인 (최근 36개월 + 95/100/115 기준선)
  const W = 320, H = 110, PAD = 8;
  const line = $derived.by(() => {
    const pts = (sel?.series ?? []).slice(-36);
    if (pts.length < 2) return null;
    const vals = pts.map((p) => p.index);
    const lo = Math.min(...vals, 92);
    const hi = Math.max(...vals, 118);
    const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (pts.length - 1);
    const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - 2 * PAD);
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.index).toFixed(1)}`).join(' ');
    const area = `${d} L${x(pts.length - 1).toFixed(1)},${(H - PAD).toFixed(1)} L${x(0).toFixed(1)},${(H - PAD).toFixed(1)} Z`;
    return {
      d, area,
      y95: y(95), y100: y(100), y115: y(115),
      first: fmtMonth(pts[0].period), last: fmtMonth(pts[pts.length - 1].period),
      lastX: x(pts.length - 1), lastY: y(pts[pts.length - 1].index)
    };
  });

  function ask(q: string) { goto(`/?q=${encodeURIComponent(q)}`); }
</script>

<svelte:head>
  <title>부동산 시장 심리·타이밍 | Zippt AI</title>
  <meta name="description" content="부동산 시장 소비심리지수로 보는 지금의 매수·매도 심리. 전국·지역별 상승/보합/하강 국면을 실데이터로 확인하세요." />
  <link rel="canonical" href="https://zippt-ai.vercel.app/market" />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm">
    <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold">Z</div>
        <span class="font-bold text-orange-400">Zippt AI</span>
      </a>
      <span class="text-gray-500">/</span>
      <span class="text-gray-300">시장 심리</span>
    </div>
  </header>

  <div class="max-w-3xl mx-auto px-6 py-12">
    {#if national}
      <!-- 히어로: 전국 현재 국면 -->
      <div class="text-center mb-10">
        <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-5">
          부동산 소비심리지수<InfoTip text="설문 기반의 부동산 매수·매도 심리 지표입니다(0~200, 100=중립). 95 미만 하강 · 95~115 보합 · 115 이상 상승 국면. 심리 지표라 실제 가격·거래량과 다를 수 있습니다." /> · {fmtMonth(data.latestPeriod)} 기준
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-4">지금 부동산 시장 심리는?</h1>
        <div class="flex items-end justify-center gap-3">
          <span class="text-6xl font-bold {phase(national.latest).cls}">{national.latest?.toFixed(1)}</span>
          <span class="text-lg {deltaCls(national.delta)} mb-2">{deltaStr(national.delta)}</span>
        </div>
        <div class="mt-2 text-lg font-semibold {phase(national.latest).cls}">전국 {phase(national.latest).label}</div>
        <p class="text-gray-500 text-sm mt-1">
          전월 대비 {deltaStr(national.delta)}
          {#if natYoY != null} · 1년 전 대비 <span class={deltaCls(natYoY)}>{deltaStr(natYoY)}</span>{/if}
          · 100 = 중립
        </p>
        <p class="text-sm text-gray-300 mt-4 max-w-md mx-auto leading-relaxed bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          💡 {interp(national.latest)}
        </p>
      </div>

      <!-- 지역 선택 + 추이 차트 -->
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-200">심리지수 추이</h2>
          <select bind:value={selected} class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:border-orange-500/40 focus:outline-none">
            {#each [...AGG, ...sidos.map((s) => s.name)] as name}
              <option value={name}>{name}</option>
            {/each}
          </select>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
          {#if line}
            <svg viewBox="0 0 {W} {H}" class="w-full" style="height:140px">
              <!-- 기준 밴드선 -->
              <line x1={PAD} x2={W - PAD} y1={line.y115} y2={line.y115} stroke="rgba(251,146,60,0.25)" stroke-width="1" stroke-dasharray="3 3" />
              <line x1={PAD} x2={W - PAD} y1={line.y100} y2={line.y100} stroke="rgba(255,255,255,0.18)" stroke-width="1" />
              <line x1={PAD} x2={W - PAD} y1={line.y95} y2={line.y95} stroke="rgba(56,189,248,0.25)" stroke-width="1" stroke-dasharray="3 3" />
              <!-- 영역+라인 -->
              <path d={line.area} fill="rgba(251,146,60,0.10)" />
              <path d={line.d} fill="none" stroke="rgb(251,146,60)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
              <circle cx={line.lastX} cy={line.lastY} r="3" fill="rgb(251,146,60)" />
            </svg>
            <div class="flex justify-between text-[10px] text-gray-600 mt-1 px-1">
              <span>{line.first}</span>
              <span class="text-orange-400/70">┈ 115 상승 · — 100 · ┈ 95 하강</span>
              <span>{line.last}</span>
            </div>
          {:else}
            <div class="text-center text-gray-600 text-sm py-8">{selected} 추이 데이터 없음</div>
          {/if}
        </div>
        {#if sel}
          <p class="text-sm text-gray-400 mt-3 text-center">
            <span class="font-semibold text-gray-200">{sel.name}</span>
            현재 <span class="{phase(sel.latest).cls} font-semibold">{sel.latest?.toFixed(1)} ({phase(sel.latest).label})</span>
            <span class="{deltaCls(sel.delta)}">{deltaStr(sel.delta)}</span>
          </p>
        {/if}
      </section>

      <!-- 수도권 vs 비수도권 -->
      {#if capital && nonCapital}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">수도권 vs 비수도권</h2>
        <div class="grid grid-cols-2 gap-3">
          {#each [capital, nonCapital] as r}
            <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div class="text-sm text-gray-400 mb-1">{r.name}</div>
              <div class="text-3xl font-bold {phase(r.latest).cls}">{r.latest?.toFixed(1)}</div>
              <div class="text-xs {deltaCls(r.delta)} mt-1">{deltaStr(r.delta)}</div>
              <div class="text-xs {phase(r.latest).cls} mt-1">{phase(r.latest).label}</div>
            </div>
          {/each}
        </div>
      </section>
      {/if}

      <!-- 시도별 랭킹 -->
      {#if sidos.length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">
          지역별 시장 심리
          <span class="text-xs text-gray-500 font-normal ml-2">뜨거운 곳 ↔ 차가운 곳</span>
        </h2>
        <div class="space-y-1.5">
          {#each sidos as r, i}
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span class="text-xs font-bold text-gray-500 w-5 text-right">{i + 1}</span>
              <span class="text-sm text-gray-200 w-28 truncate">{r.name}</span>
              <div class="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full rounded-full {(r.latest ?? 0) >= 115 ? 'bg-orange-400' : (r.latest ?? 0) >= 95 ? 'bg-gray-400' : 'bg-sky-400'}"
                     style="width: {Math.max(2, Math.min(100, (((r.latest ?? 0) - 70) / (140 - 70)) * 100))}%"></div>
              </div>
              <span class="text-sm font-semibold {phase(r.latest).cls} w-12 text-right">{r.latest?.toFixed(0)}</span>
              <span class="text-[11px] {deltaCls(r.delta)} w-12 text-right">{deltaStr(r.delta)}</span>
            </div>
          {/each}
        </div>
      </section>
      {/if}

      <!-- 캐비엇 -->
      <p class="text-[11px] text-gray-600 leading-relaxed mb-10">
        * 국토연구원·한국부동산원 <strong>부동산시장 소비심리지수</strong> 계열입니다(0~200, 100=중립). 공식 기준: <span class="text-sky-400/80">95 미만 하강</span> · 보합 95~115 · <span class="text-orange-400/80">115 이상 상승</span> 국면.
        설문 기반 <strong>심리</strong> 지표로 실제 가격·거래량과 다를 수 있고, 매수/매도 타이밍을 보장하지 않습니다. 최신치는 {fmtMonth(data.latestPeriod)} 기준이며 월별 공개는 통상 수개월 지연됩니다.
      </p>

      <!-- CTA -->
      <section class="text-center">
        <button onclick={() => ask('지금 집 사도 되는 시점이야? 시장 심리 기준으로 알려줘')}
          class="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-all">
          AI에게 타이밍 물어보기 →
        </button>
      </section>
    {:else}
      <div class="text-center py-24 text-gray-500 text-sm">시장 심리 데이터를 불러오지 못했습니다.</div>
    {/if}
  </div>
</main>
