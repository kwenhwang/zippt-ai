<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { REGIONS } from '$lib/data/regions';
  import InfoTip from '$lib/components/InfoTip.svelte';

  let { data }: { data: PageData } = $props();
  const region = data.region;

  // 미분양 스파크라인 최대값 (막대 높이 정규화)
  const unsoldMax = $derived(
    data.unsold ? Math.max(1, ...data.unsold.series.map((s: any) => s.units)) : 1
  );

  // 다른 지역과 비교 — 현재 지역 제외
  const otherRegions = $derived(REGIONS.filter((r) => r.slugEn !== region?.slugEn));
  let compareTarget = $state('');
  function goCompare() {
    if (!compareTarget || !region) return;
    goto(`/compare/${region.slugEn}-vs-${compareTarget}`);
  }

  // 관점별 단지 추천 — 같은 데이터, 목적이 바뀌면 순위가 바뀐다
  const PURPOSES = [
    { key: 'live', label: '실거주', desc: '교통·학군·편의가 고른 단지', metric: '종합', val: (c: any) => c.scores.composite },
    { key: 'school', label: '학군', desc: '학군 점수가 높은 단지', metric: '학군', val: (c: any) => c.scores?.school ?? 0 },
    { key: 'value', label: '가성비', desc: '가격 대비 입지가 좋은 단지(억당 입지점수)', metric: '억당', val: (c: any) => c.value_score }
  ];
  let purpose = $state('live');
  const purposeMeta = $derived(PURPOSES.find((p) => p.key === purpose) ?? PURPOSES[0]);
  const purposeList = $derived(
    [...(data.complexesAll ?? [])].sort((a, b) => purposeMeta.val(b) - purposeMeta.val(a)).slice(0, 6)
  );
  function metricVal(c: any) {
    if (purpose === 'school') return Math.round(c.scores?.school ?? 0);
    if (purpose === 'value') return c.value_score;
    return c.scores.composite;
  }

  let rankInfo = $state(data.rankInfo);
  let complexes = $state(data.complexes);
  let priceByArea = $state(data.priceByArea);

  onMount(async () => {
    if (!data.region) return;
    const API_BASE = 'https://korean-api-platform.vercel.app';
    const district = data.region.district ?? data.region.name;

    // rankInfo 없으면 rankings API 호출
    if (!rankInfo) {
      try {
        const res = await fetch(`${API_BASE}/api/stats/rankings?sort_by=price&order=desc&limit=50`);
        if (res.ok) {
          const json = await res.json();
          const rankings = json?.data?.rankings || [];
          const match = rankings.find((r: any) => r.region_name?.includes(district));
          if (match) {
            rankInfo = {
              rank: match.rank,
              total: rankings.length,
              avgPrice: match.avg_price_display,
              avgPricePerPy: match.avg_price_per_py_display,
              transactionCount: match.transaction_count
            };
          }
        }
      } catch {}
    }

    // complexes 없으면 complexes API 호출
    if (!complexes || complexes.length === 0) {
      try {
        const res = await fetch(`${API_BASE}/api/complexes?district=${encodeURIComponent(district)}&limit=30&period_months=3`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json.data || []);
          const seen = new Set<string>();
          const unique = list.filter((c: any) => {
            if (seen.has(c.complex_name)) return false;
            seen.add(c.complex_name);
            return true;
          });
          complexes = unique
            .filter((c: any) => c.scores?.composite)
            .sort((a: any, b: any) => b.scores.composite - a.scores.composite)
            .slice(0, 8);
        }
      } catch {}
    }

    // priceByArea 없으면 price-by-area API 호출
    if (!priceByArea || priceByArea.length === 0) {
      try {
        const res = await fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(district)}`);
        if (res.ok) {
          const json = await res.json();
          priceByArea = json?.data?.by_area || [];
        }
      } catch {}
    }
  });

  function askQuestion(question: string) {
    // 메인 페이지로 이동하며 질문 전달
    goto(`/?q=${encodeURIComponent(question)}`);
  }
</script>

<svelte:head>
  {#if region}
    <title>{region.name} 아파트 시세 | Zippt AI 부동산</title>
    <meta name="description" content={region.description} />
    <meta name="keywords" content={region.keywords.join(', ')} />
    <meta property="og:title" content="{region.name} 아파트 시세 | Zippt AI" />
    <meta property="og:description" content={region.description} />
    <meta property="og:url" content="https://zippt-ai.vercel.app/area/{region.slugEn}" />
    <link rel="canonical" href="https://zippt-ai.vercel.app/area/{region.slugEn}" />
  {/if}
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  {#if region}
    <!-- 헤더 -->
    <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
        <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold">Z</div>
          <span class="font-bold text-orange-400">Zippt AI</span>
        </a>
        <span class="text-gray-500">/</span>
        <span class="text-gray-300">{region.name} 부동산</span>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <div class="max-w-3xl mx-auto px-6 py-16">
      <!-- 히어로 -->
      <div class="text-center mb-16">
        <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-6">
          AI 부동산 전문가
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
          {region.name} 아파트 시세<br/>
          <span class="text-orange-400">AI에게 바로 물어보세요</span>
        </h1>
        <p class="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
          실거래가 10,700,000건 데이터를 기반으로<br/>
          {region.name} 부동산 정보를 즉시 답변해드립니다.
        </p>
      </div>

      <!-- 지역 전문가 맥락 -->
      {#if region.context}
      <div class="mb-8 p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
        <p class="text-sm text-gray-300 leading-relaxed">{region.context}</p>
      </div>
      {/if}

      <!-- A. 지역 시세 요약 카드 -->
      {#if rankInfo}
      <section class="mb-10">
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-2xl font-bold text-white">{rankInfo.avgPrice}</div>
            <div class="text-xs text-gray-500 mt-1">평균 매매가</div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-2xl font-bold text-orange-400">{rankInfo.avgPricePerPy}</div>
            <div class="text-xs text-gray-500 mt-1">평당 거래가<InfoTip text="1평(약 3.3㎡)당 가격입니다. 평형이 다른 단지·지역을 같은 기준으로 비교할 때 씁니다. 보통 소형일수록 평당가가 높습니다." /></div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-2xl font-bold text-white">전국 {rankInfo.rank}위</div>
            <div class="text-xs text-gray-500 mt-1">시세 순위</div>
          </div>
        </div>
        <p class="text-xs text-gray-600 mt-2 text-center">* 국토교통부 실거래가 최근 3개월 기준 · 거래 {rankInfo.transactionCount.toLocaleString()}건</p>
      </section>
      {/if}

      <!-- B. 관점별 단지 추천 (실거주/학군/가성비) -->
      {#if (data.complexesAll ?? []).length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-1 text-gray-200">{region.name} 목적별 추천 단지</h2>
        <p class="text-xs text-gray-500 mb-3">무엇을 가장 중요하게 보세요? 목적에 따라 추천이 달라집니다.</p>
        <!-- 관점 토글 -->
        <div class="flex gap-2 mb-2">
          {#each PURPOSES as p}
            <button
              onclick={() => (purpose = p.key)}
              class="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all {purpose === p.key ? 'bg-orange-500 text-black border-orange-400' : 'bg-white/5 text-gray-300 border-white/10 hover:border-orange-500/40'}"
            >{p.label}</button>
          {/each}
        </div>
        <p class="text-[11px] text-gray-500 mb-3">→ {purposeMeta.desc}</p>
        <div class="space-y-2">
          {#each purposeList as complex, i}
            <button
              onclick={() => goto(`/complex/${encodeURIComponent(complex.complex_name)}`)}
              class="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-200 group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-orange-400 w-5">{i + 1}</span>
                  <div>
                    <div class="font-medium text-gray-200 text-sm group-hover:text-white">{complex.complex_name}</div>
                    <div class="text-xs text-gray-500 mt-0.5">
                      {complex.nearest_station ? `${complex.nearest_station}역` : ''}
                      {complex.construction_year ? `· ${complex.construction_year}년` : ''}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-3 text-right">
                  {#if complex.avg_price}
                  <div class="text-right">
                    <div class="text-sm font-bold text-white">{(complex.avg_price / 10000).toFixed(1)}억</div>
                    <div class="text-xs text-gray-600">평균</div>
                  </div>
                  {/if}
                  <div class="bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1 text-center min-w-[52px]">
                    <div class="text-sm font-bold text-orange-400">{metricVal(complex)}</div>
                    <div class="text-[10px] text-gray-500">{purposeMeta.metric}</div>
                  </div>
                </div>
              </div>
              <!-- 세부 점수 바 -->
              <div class="mt-2 flex gap-2 text-[10px] text-gray-600">
                <span>교통 {complex.scores.transit}</span>
                <span>·</span>
                <span>학군 {complex.scores?.school?.toFixed(0)}</span>
                <span>·</span>
                <span>편의 {complex.scores.convenience}</span>
              </div>
            </button>
          {/each}
        </div>
        <p class="text-xs text-gray-600 mt-3 text-center">같은 지역도 목적(실거주·학군·가성비)에 따라 1순위가 달라집니다 · 점수는 추정 입지값</p>
      </section>
      {/if}

      <!-- C. 평형별 시세 -->
      {#if priceByArea && priceByArea.length > 0}
      <section class="mb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-200">
            {region.name} 평형별 시세
            <span class="text-xs text-gray-500 font-normal ml-2">최근 3개월 실거래 기준</span>
          </h2>
          <a href="/pyeong/{region.slugEn}" class="text-xs text-orange-400 hover:text-orange-300 whitespace-nowrap">평형분석 상세 →</a>
        </div>
        <div class="grid grid-cols-2 gap-3">
          {#each priceByArea as item}
            {#if item.avg_price}
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-semibold text-gray-200">{item.area_range}</span>
                <span class="text-xs text-gray-500">{item.label}</span>
              </div>
              <div class="text-xl font-bold text-white">{item.avg_price_display}</div>
              <div class="text-xs text-orange-400 mt-0.5">{item.avg_price_per_py?.toLocaleString()}만원/평</div>
              <div class="text-xs text-gray-600 mt-2">거래 {item.transaction_count}건 · 중위 {item.median_price_display}</div>
            </div>
            {/if}
          {/each}
        </div>
        <p class="text-xs text-gray-600 mt-3 text-center">* 전용면적 기준, 국토교통부 실거래 데이터</p>
      </section>
      {/if}

      <!-- D. 미분양 현황 (시장 공급 신호) -->
      {#if data.unsold}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-1 text-gray-200">{region.name} 미분양<InfoTip text="분양했지만 안 팔리고 남은 새 아파트 물량입니다. 숫자가 크고 늘어나면 공급과잉·매수세 약화(가격 하방 압력) 신호, 적고 줄면 수요가 탄탄하다는 뜻입니다. 단, 기존(구축) 매물은 포함하지 않으므로 0이어도 살 집이 없다는 의미는 아닙니다." /></h2>
        <p class="text-xs text-gray-500 mb-3">분양 후 안 팔린 새 아파트 · 국토교통부 {data.unsold.latestPeriod} 기준</p>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div class="flex items-end justify-between gap-4">
            <div>
              <div class="text-3xl font-bold {data.unsold.latest === 0 ? 'text-emerald-400' : data.unsold.latest >= 500 ? 'text-red-400' : 'text-white'}">
                {data.unsold.latest.toLocaleString()}<span class="text-base font-medium text-gray-500"> 호</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">{data.unsold.sigungu} 미분양</div>
            </div>
            {#if data.unsold.series.length > 1}
            <div class="flex items-end gap-0.5 h-12" title="최근 {data.unsold.series.length}개월 추세">
              {#each data.unsold.series as s}
                <div class="w-1.5 rounded-t bg-orange-500/50" style="height: {Math.max(6, (s.units / unsoldMax) * 100)}%" title="{s.period}: {s.units.toLocaleString()}호"></div>
              {/each}
            </div>
            {/if}
          </div>
          <div class="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {#if data.unsold.momChange !== null}
              <span class="text-gray-500">전월 대비
                <span class="{data.unsold.momChange > 0 ? 'text-red-400' : data.unsold.momChange < 0 ? 'text-emerald-400' : 'text-gray-400'} font-medium">
                  {data.unsold.momChange > 0 ? '+' : ''}{data.unsold.momChange.toLocaleString()}호
                </span>
              </span>
            {/if}
            {#if data.unsold.yoyChange !== null}
              <span class="text-gray-500">1년 전 대비
                <span class="{data.unsold.yoyChange > 0 ? 'text-red-400' : data.unsold.yoyChange < 0 ? 'text-emerald-400' : 'text-gray-400'} font-medium">
                  {data.unsold.yoyChange > 0 ? '+' : ''}{data.unsold.yoyChange.toLocaleString()}호
                </span>
              </span>
            {/if}
            {#if data.unsold.national}
              <span class="text-gray-500">전국 <span class="text-gray-300 font-medium">{data.unsold.national.unsold_units.toLocaleString()}호</span></span>
            {/if}
          </div>
        </div>
        <p class="text-[11px] text-gray-600 mt-2 leading-relaxed">* 미분양은 '안 팔린 신축 분양물량'입니다. 0이어도 기존(구축) 매물은 있을 수 있어요. 숫자가 크고 늘어나면 공급과잉·약세 신호로 참고하세요.</p>
      </section>
      {/if}

      <!-- E. 분양 공고 (신규 공급 · 청약) -->
      {#if (data.presale ?? []).length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-1 text-gray-200">{region.name} 분양·청약<InfoTip text="청약홈(한국부동산원)에 등록된 아파트 분양 공고입니다. 분양가는 주택형별 분양최고금액 기준이며, 옵션·확장 비용은 제외입니다. 공공분양·신혼희망타운 등은 시세보다 낮게 공급됩니다." /></h2>
        <p class="text-xs text-gray-500 mb-3">최근·예정 분양 공고 · 국토교통부 청약홈 기준</p>
        <div class="space-y-2">
          {#each data.presale as p}
            <div class="rounded-xl bg-white/5 border border-white/10 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    {#if p.upcoming}<span class="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">청약예정</span>{/if}
                    <span class="font-medium text-gray-100 text-sm truncate">{p.name}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {#if p.rceptBgn}청약접수 {p.rceptBgn}{#if p.rceptEnd && p.rceptEnd !== p.rceptBgn}~{p.rceptEnd.slice(5)}{/if}{/if}
                    {#if p.households}<span class="text-gray-600"> · {p.households.toLocaleString()}세대</span>{/if}
                    {#if p.rentType && p.rentType !== '분양주택'}<span class="text-amber-400/80"> · {p.rentType}</span>{/if}
                  </div>
                  {#if p.builder}<div class="text-[11px] text-gray-600 mt-0.5 truncate">{p.builder}</div>{/if}
                </div>
                <div class="text-right shrink-0">
                  {#if p.priceMin}
                    <div class="text-sm font-bold text-white">
                      {(p.priceMin / 10000).toFixed(1)}{#if p.priceMax && p.priceMax !== p.priceMin}~{(p.priceMax / 10000).toFixed(1)}{/if}<span class="text-xs font-medium text-gray-500">억</span>
                    </div>
                    <div class="text-[10px] text-gray-600">분양가</div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
        <p class="text-[11px] text-gray-600 mt-2 leading-relaxed">* 분양최고금액 기준(옵션·발코니 확장 별도). 공공분양·신혼희망타운은 시세보다 낮게 공급됩니다. 정확한 일정·자격은 청약홈에서 확인하세요.</p>
      </section>
      {/if}

      <!-- 다른 지역과 비교 -->
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">{region.name} 다른 지역과 비교</h2>
        <div class="flex gap-2">
          <select
            bind:value={compareTarget}
            class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:border-orange-500/40 focus:outline-none"
          >
            <option value="" disabled>비교할 지역 선택…</option>
            {#each otherRegions as r}
              <option value={r.slugEn}>{r.name}</option>
            {/each}
          </select>
          <button
            onclick={goCompare}
            disabled={!compareTarget}
            class="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all"
          >
            비교
          </button>
        </div>
        <p class="text-xs text-gray-600 mt-2">평균가·평당가·평형별 시세·대표단지를 나란히 비교합니다</p>
      </section>

      <!-- 대표 질문 카드 -->
      <section class="mb-16">
        <h2 class="text-xl font-semibold mb-6 text-gray-200">
          {region.name} 자주 묻는 질문
        </h2>
        <div class="space-y-3">
          {#each region.questions as question}
            <button
              onclick={() => askQuestion(question)}
              class="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-200 group"
            >
              <div class="flex items-center justify-between">
                <span class="text-gray-200 group-hover:text-white transition-colors">{question}</span>
                <span class="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg">→</span>
              </div>
            </button>
          {/each}
        </div>
      </section>

      <!-- CTA -->
      <section class="text-center">
        <a
          href="/"
          class="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 text-lg"
        >
          <span>{region.name} 부동산 AI에게 질문하기</span>
        </a>
        <p class="text-gray-500 text-sm mt-4">무료 · 즉시 답변 · 실거래가 기반</p>
      </section>

      <!-- SEO 텍스트 -->
      <section class="mt-20 pt-12 border-t border-white/10">
        <h2 class="text-lg font-semibold text-gray-300 mb-4">{region.name} 부동산 정보</h2>
        <p class="text-gray-500 text-sm leading-relaxed">
          Zippt AI는 국토교통부 실거래가 데이터 10,700,000건을 기반으로
          {region.name} 아파트 매매가, 전세가, 월세 정보를 실시간으로 제공합니다.
          {region.name} 아파트 시세 조회, 단지별 실거래가 확인, 투자 분석을
          AI 챗봇으로 간편하게 이용해보세요.
        </p>
      </section>
    </div>
  {/if}
</main>
