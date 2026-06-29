<script lang="ts">
  import { goto } from '$app/navigation';

  let { data }: { data: { sido: string; sigungu: string; items: any[]; saleRate: any } } = $props();

  const SIDOS = ['서울특별시', '경기도', '인천광역시', '부산광역시', '대구광역시', '대전광역시'];

  function pickSido(s: string) {
    goto(`/auction?sido=${encodeURIComponent(s)}`);
  }

  function eok(manwon: number | null | undefined): string {
    if (manwon == null) return '-';
    return `${(manwon / 10000).toFixed(1)}억`;
  }

  // 관심(정상유찰+할인) 먼저, 주의(다회유찰) 뒤로 — 백엔드 정렬 유지하되 신호색
  function sigColor(sig: string) {
    return sig === '주의'
      ? 'text-red-400 bg-red-500/10 border-red-500/30'
      : sig === '관심'
        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        : 'text-gray-300 bg-white/5 border-white/10';
  }
</script>

<svelte:head>
  <title>경매 물건 분석 · 시세 대비 할인율 | Zippt AI</title>
  <meta name="description" content="법원 경매 아파트를 실거래 시세와 비교해 시세 대비 할인율과 유찰 위험을 보여줍니다." />
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
    <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold text-black">Z</div>
        <span class="font-bold text-orange-400">Zippt AI</span>
      </a>
      <span class="text-gray-600">/</span>
      <span class="text-gray-300">경매 분석</span>
    </div>
  </header>

  <div class="max-w-3xl mx-auto px-6 py-10">
    <div class="mb-6">
      <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-orange-400 text-xs font-medium mb-3">경매 × 실거래</div>
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-1">경매 물건 분석</h1>
      <p class="text-gray-400 text-sm">법원 경매 아파트를 <span class="text-gray-200">최근 실거래 시세</span>와 비교 · 시세 대비 할인율과 유찰 위험</p>
    </div>

    <!-- 지역 선택 -->
    <div class="flex flex-wrap gap-2 mb-6">
      {#each SIDOS as s}
        <button
          onclick={() => pickSido(s)}
          class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all {data.sido === s ? 'bg-orange-500 text-black border-orange-400' : 'bg-white/5 text-gray-300 border-white/10 hover:border-orange-500/40'}"
        >{s.replace('특별시', '').replace('광역시', '').replace('특별자치시', '')}</button>
      {/each}
    </div>

    <!-- 지역 낙찰가율 통계 (실제 매각결과 기반) -->
    {#if data.saleRate && data.saleRate.sample_count > 0}
      <div class="rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/5 border border-orange-500/30 p-5 mb-6">
        <div class="text-xs text-orange-300 mb-1">{data.sido} 아파트 실제 낙찰가율 <span class="text-gray-500">(최근 매각결과 {data.saleRate.sample_count}건)</span></div>
        <div class="flex items-baseline gap-2">
          <span class="text-4xl font-extrabold text-orange-400">{data.saleRate.median_sale_rate}%</span>
          <span class="text-sm text-gray-400">감정가 대비 중앙값</span>
        </div>
        <p class="text-[11px] text-gray-500 mt-2 leading-relaxed">
          보통 감정가의 <span class="text-gray-300">{data.saleRate.median_sale_rate}%</span> 선에서 낙찰됩니다 (평균 {data.saleRate.avg_sale_rate}%, 범위 {data.saleRate.min_sale_rate}~{data.saleRate.max_sale_rate}%).
          유찰이 많을수록 낙찰가율이 낮아지지만 권리 하자 가능성도 커집니다.
        </p>
      </div>
    {/if}

    {#if data.items.length > 0}
      <p class="text-xs text-gray-500 mb-4">{data.sido} 아파트 경매 {data.items.length}건 · 시세 대비 할인 높은 순(정상 유찰 우선)</p>
      <p class="text-[11px] text-gray-600 mb-4">💡 위 낙찰가율로 입찰가 가늠 — 예: 감정가 5억 × {data.saleRate?.median_sale_rate ?? 80}% ≈ {data.saleRate ? (5 * data.saleRate.median_sale_rate / 100).toFixed(1) : 4}억 부근 낙찰 예상</p>
      <div class="space-y-3">
        {#each data.items as it}
          {@const a = it.auction ?? {}}
          {@const mk = it.market ?? {}}
          {@const cp = it.comparison ?? {}}
          <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="min-w-0">
                <div class="font-semibold text-gray-100 truncate">{it.building_name}</div>
                <div class="text-xs text-gray-500 truncate">{it.location} · {a.bid_count}회 유찰{#if a.auction_date} · 매각 {String(a.auction_date).slice(4,6)}/{String(a.auction_date).slice(6,8)}{/if}</div>
              </div>
              <span class="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border {sigColor(cp.signal)}">{cp.signal}</span>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center mb-2">
              <div class="rounded-lg bg-black/20 py-2">
                <div class="text-[10px] text-gray-500">최저가</div>
                <div class="text-sm font-bold text-white">{eok(a.min_bid_price)}</div>
              </div>
              <div class="rounded-lg bg-black/20 py-2">
                <div class="text-[10px] text-gray-500">실거래 시세</div>
                <div class="text-sm font-bold text-gray-300">{eok(mk.avg_price)}</div>
              </div>
              <div class="rounded-lg bg-black/20 py-2">
                <div class="text-[10px] text-gray-500">시세 대비</div>
                <div class="text-sm font-bold {cp.discount_vs_market_pct >= 15 ? 'text-emerald-400' : 'text-gray-300'}">−{cp.discount_vs_market_pct}%</div>
              </div>
            </div>
            <p class="text-[11px] {cp.many_fail_risk ? 'text-red-300' : 'text-gray-500'}">
              {cp.many_fail_risk ? '⚠️ ' : ''}{cp.signal_note}{#if mk.tx_count} · 시세 {mk.tx_count}건 기준{/if}
            </p>
            {#if it.roi}
              <div class="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span class="text-gray-400">낙찰 후 월세 시 <span class="text-gray-200">{it.roi.monthly_rent_display}</span></span>
                <span class="text-emerald-400 font-semibold">표면 수익률 {it.roi.gross_yield_pct}%</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
      <p class="text-[11px] text-gray-600 mt-5 leading-relaxed">* 시세 대비 할인율 = (실거래 평균가 − 경매 최저가) / 실거래 평균가. 최저가는 감정가 기준(감정 시점이 과거일 수 있어 시세와 괴리). 실제 낙찰가는 경쟁으로 상승하며, 명도·수리·취득세·권리분석은 미반영입니다. 다회유찰(3회+)은 권리 하자 가능성이 높아 '주의'로 표시합니다. 표면 월세수익률 = (지역 단지 월세 중앙값×12)÷최저가로, 보증금·취득세·명도·공실은 미반영한 대략치입니다. 참고용.</p>
    {:else}
      <div class="text-center py-20">
        <p class="text-gray-400 mb-2">{data.sido}에 시세 비교 가능한 아파트 경매가 없습니다.</p>
        <p class="text-xs text-gray-600">전국 경매 데이터를 수집 중입니다. 다른 지역을 선택해 보세요.</p>
      </div>
    {/if}
  </div>
</main>
