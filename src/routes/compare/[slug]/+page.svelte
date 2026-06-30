<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();
  const A = data.regionA;
  const B = data.regionB;

  // 평형별 비교: area_range 키로 양쪽 매칭
  const AREA_ORDER = ['소형', '중소형', '중형', '대형'];
  function areaMap(list: any[]) {
    const m: Record<string, any> = {};
    for (const it of (list || [])) if (it?.area_range) m[it.area_range] = it;
    return m;
  }
  const pbaA = $derived(areaMap(data.priceByAreaA));
  const pbaB = $derived(areaMap(data.priceByAreaB));
  const areaRanges = $derived(AREA_ORDER.filter((r) => pbaA[r]?.avg_price || pbaB[r]?.avg_price));

  function eok(v: number | undefined) {
    return v ? (v / 10000).toFixed(1) + '억' : '-';
  }
  // 두 값 중 큰 쪽 표시용 (가격이 높다 ≠ 좋다 — 중립 라벨)
  function higher(a: number | undefined, b: number | undefined): 'a' | 'b' | null {
    if (!a || !b) return null;
    if (a === b) return null;
    return a > b ? 'a' : 'b';
  }
  const winAvg = $derived(higher(data.rankA?.avgPriceRaw, data.rankB?.avgPriceRaw));
  const winPy = $derived(higher(data.rankA?.avgPricePerPyRaw, data.rankB?.avgPricePerPyRaw));
  // 두 값의 격차(%) — 작은 쪽 기준. anchor: "차이가 큰지" 체감용
  function gapPct(a: number | undefined, b: number | undefined): number | null {
    if (!a || !b || a === b) return null;
    return Math.round((Math.abs(a - b) / Math.min(a, b)) * 100);
  }
  const gapAvg = $derived(gapPct(data.rankA?.avgPriceRaw, data.rankB?.avgPriceRaw));
  const gapPy = $derived(gapPct(data.rankA?.avgPricePerPyRaw, data.rankB?.avgPricePerPyRaw));

  function ask(q: string) {
    goto(`/?q=${encodeURIComponent(q)}`);
  }
</script>

<svelte:head>
  {#if A && B}
    <title>{A.name} vs {B.name} 아파트 시세 비교 | Zippt AI</title>
    <meta name="description" content="{A.name}와(과) {B.name} 아파트 평균가·평당가·평형별 시세를 실거래 데이터로 나란히 비교합니다." />
    <link rel="canonical" href="https://zippt-ai.vercel.app/compare/{A.slugEn}-vs-{B.slugEn}" />
  {/if}
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  {#if A && B}
    <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
        <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold">Z</div>
          <span class="font-bold text-orange-400">Zippt AI</span>
        </a>
        <span class="text-gray-500">/</span>
        <span class="text-gray-300">지역 비교</span>
      </div>
    </header>

    <div class="max-w-3xl mx-auto px-6 py-12">
      <!-- 히어로 -->
      <div class="text-center mb-10">
        <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-5">
          지역 시세 비교
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-3 flex-wrap">
          <span class="text-white">{A.name}</span>
          <span class="text-gray-600 text-2xl font-normal">vs</span>
          <span class="text-orange-400">{B.name}</span>
        </h1>
        <p class="text-gray-500 text-sm mt-4">국토교통부 실거래가 최근 3개월 기준 · 평균가·평당가·평형별 비교</p>
      </div>

      <!-- A. 핵심 지표 비교 -->
      <section class="mb-10">
        <div class="grid grid-cols-2 gap-3">
          <!-- 헤더 행 -->
          <div class="text-center py-2 rounded-lg bg-white/5 border border-white/10 font-semibold text-gray-200">{A.name}</div>
          <div class="text-center py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 font-semibold text-orange-300">{B.name}</div>
        </div>

        <!-- 평균 매매가 -->
        <div class="mt-3">
          <div class="text-center text-xs text-gray-500 mb-1">평균 매매가</div>
          {#if data.rankA || data.rankB}
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white/5 border rounded-2xl p-4 text-center {winAvg === 'a' ? 'border-orange-500/40' : 'border-white/10'}">
                <div class="text-2xl font-bold text-white">{data.rankA?.avgPrice ?? '-'}</div>
                {#if winAvg === 'a'}<div class="text-[10px] text-orange-400 mt-1">더 높음{#if gapAvg} · +{gapAvg}%{/if}</div>{/if}
              </div>
              <div class="bg-white/5 border rounded-2xl p-4 text-center {winAvg === 'b' ? 'border-orange-500/40' : 'border-white/10'}">
                <div class="text-2xl font-bold text-white">{data.rankB?.avgPrice ?? '-'}</div>
                {#if winAvg === 'b'}<div class="text-[10px] text-orange-400 mt-1">더 높음{#if gapAvg} · +{gapAvg}%{/if}</div>{/if}
              </div>
            </div>
          {/if}
        </div>

        <!-- 평당 거래가 -->
        <div class="mt-3">
          <div class="text-center text-xs text-gray-500 mb-1">평당 거래가</div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-white/5 border rounded-2xl p-4 text-center {winPy === 'a' ? 'border-orange-500/40' : 'border-white/10'}">
              <div class="text-xl font-bold text-orange-400">{data.rankA?.avgPricePerPy ?? '-'}</div>
              {#if winPy === 'a'}<div class="text-[10px] text-orange-400 mt-1">더 높음{#if gapPy} · +{gapPy}%{/if}</div>{/if}
            </div>
            <div class="bg-white/5 border rounded-2xl p-4 text-center {winPy === 'b' ? 'border-orange-500/40' : 'border-white/10'}">
              <div class="text-xl font-bold text-orange-400">{data.rankB?.avgPricePerPy ?? '-'}</div>
              {#if winPy === 'b'}<div class="text-[10px] text-orange-400 mt-1">더 높음{#if gapPy} · +{gapPy}%{/if}</div>{/if}
            </div>
          </div>
        </div>

        <!-- 전국 순위 + 거래량 -->
        <div class="grid grid-cols-2 gap-3 mt-3">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-lg font-bold text-white">전국 {data.rankA?.rank ?? '-'}위</div>
            <div class="text-[11px] text-gray-500 mt-1">거래 {data.rankA?.transactionCount?.toLocaleString() ?? '-'}건</div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-lg font-bold text-white">전국 {data.rankB?.rank ?? '-'}위</div>
            <div class="text-[11px] text-gray-500 mt-1">거래 {data.rankB?.transactionCount?.toLocaleString() ?? '-'}건</div>
          </div>
        </div>
        <p class="text-[11px] text-gray-600 mt-2 text-center">* 가격이 높다고 더 좋은 지역이라는 의미는 아닙니다. 목적(실거주·투자·학군)에 따라 판단하세요.</p>
      </section>

      <!-- B. 평형별 시세 비교 -->
      {#if areaRanges.length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">평형별 시세 비교
          <span class="text-xs text-gray-500 font-normal ml-2">전용면적 기준 평균가</span>
        </h2>
        <div class="space-y-2">
          {#each areaRanges as range}
            {@const a = pbaA[range]}
            {@const b = pbaB[range]}
            {@const win = higher(a?.avg_price, b?.avg_price)}
            <div class="bg-white/5 border border-white/10 rounded-xl p-3">
              <div class="text-xs text-gray-400 text-center mb-2">{range} <span class="text-gray-600">{a?.label || b?.label || ''}</span></div>
              <div class="grid grid-cols-2 gap-3">
                <div class="text-center">
                  <div class="text-lg font-bold {win === 'a' ? 'text-orange-400' : 'text-white'}">{eok(a?.avg_price)}</div>
                  <div class="text-[10px] text-gray-600">{a?.avg_price_per_py ? a.avg_price_per_py.toLocaleString() + '만/평' : ''} {a?.transaction_count ? `· ${a.transaction_count}건` : ''}</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold {win === 'b' ? 'text-orange-400' : 'text-white'}">{eok(b?.avg_price)}</div>
                  <div class="text-[10px] text-gray-600">{b?.avg_price_per_py ? b.avg_price_per_py.toLocaleString() + '만/평' : ''} {b?.transaction_count ? `· ${b.transaction_count}건` : ''}</div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </section>
      {/if}

      <!-- C. 대표 단지 비교 -->
      {#if (data.complexesA?.length || 0) > 0 || (data.complexesB?.length || 0) > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">주요 단지
          <span class="text-xs text-gray-500 font-normal ml-2">교통·학군·편의 종합점수 순</span>
        </h2>
        <div class="grid grid-cols-2 gap-3">
          {#each [{ name: A.name, list: data.complexesA }, { name: B.name, list: data.complexesB }] as col}
            <div class="space-y-2">
              {#each (col.list || []) as c, i}
                <button
                  onclick={() => goto(`/complex/${encodeURIComponent(c.complex_name)}`)}
                  class="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-orange-400 w-3">{i + 1}</span>
                    <span class="text-xs font-medium text-gray-200 leading-tight">{c.complex_name}</span>
                  </div>
                  <div class="text-[10px] text-gray-600 mt-1 pl-5">
                    종합 {c.scores.composite}
                    {c.avg_price ? `· ${(c.avg_price / 10000).toFixed(1)}억` : ''}
                  </div>
                </button>
              {/each}
              {#if !(col.list || []).length}
                <div class="text-xs text-gray-600 text-center py-4">데이터 없음</div>
              {/if}
            </div>
          {/each}
        </div>
        <p class="text-[11px] text-gray-600 mt-3 text-center">클릭하면 단지 실거래 상세 분석으로 이동합니다 · 종합점수는 입지(교통·학군·편의) 추정값</p>
      </section>
      {/if}

      <!-- CTA -->
      <section class="text-center mt-12 space-y-3">
        <div class="flex gap-3 justify-center flex-wrap">
          <a href="/area/{A.slugEn}" class="text-sm text-gray-300 hover:text-orange-400 underline underline-offset-4">{A.name} 단독 분석</a>
          <span class="text-gray-700">·</span>
          <a href="/area/{B.slugEn}" class="text-sm text-gray-300 hover:text-orange-400 underline underline-offset-4">{B.name} 단독 분석</a>
        </div>
        <button
          onclick={() => ask(`${A.name}와 ${B.name} 중 어디가 투자하기 좋아?`)}
          class="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-6 py-3 rounded-2xl hover:scale-105 transition-all"
        >
          AI에게 더 물어보기 →
        </button>
      </section>
    </div>
  {:else}
    <div class="max-w-xl mx-auto px-6 py-32 text-center">
      <h1 class="text-2xl font-bold text-gray-200 mb-3">비교할 지역을 찾지 못했어요</h1>
      <p class="text-gray-500 text-sm mb-6">두 지역을 정확히 인식하지 못했습니다. 메인에서 다시 질문해주세요.</p>
      <a href="/" class="text-orange-400 underline underline-offset-4">메인으로</a>
    </div>
  {/if}
</main>
