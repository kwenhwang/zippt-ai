<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();
  const region = data.region;

  let rankInfo = $state(data.rankInfo);
  let complexes = $state(data.complexes);
  let priceByArea = $state(data.priceByArea);

  onMount(async () => {
    if (!data.region) return;
    const API_BASE = 'https://korean-api-platform.vercel.app';
    const district = data.region.name;

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
            <div class="text-xs text-gray-500 mt-1">평당 거래가</div>
          </div>
          <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <div class="text-2xl font-bold text-white">전국 {rankInfo.rank}위</div>
            <div class="text-xs text-gray-500 mt-1">시세 순위</div>
          </div>
        </div>
        <p class="text-xs text-gray-600 mt-2 text-center">* 국토교통부 실거래가 최근 3개월 기준 · 거래 {rankInfo.transactionCount.toLocaleString()}건</p>
      </section>
      {/if}

      <!-- B. 단지 종합점수 TOP 섹션 -->
      {#if complexes.length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">
          {region.name} 주요 단지 분석
          <span class="text-xs text-gray-500 font-normal ml-2">교통·학군·편의 종합점수 순</span>
        </h2>
        <div class="space-y-2">
          {#each complexes as complex, i}
            <button
              onclick={() => askQuestion(`${complex.complex_name} 아파트 최근 실거래가와 시세 분석해줘`)}
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
                  <div class="bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1 text-center min-w-[52px]">
                    <div class="text-sm font-bold text-orange-400">{complex.scores.composite}</div>
                    <div class="text-[10px] text-gray-500">종합</div>
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
              <!-- 평형별 가격 (prices_by_area가 있을 때만) -->
              {#if complex.prices_by_area && complex.prices_by_area.length > 0}
              <div class="mt-2 pt-2 border-t border-white/5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                {#each complex.prices_by_area as pa}
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-gray-600">{pa.area_type} <span class="text-gray-700">({pa.area_range})</span></span>
                  <span class="text-gray-400 font-medium">{pa.avg_price_display}</span>
                </div>
                {/each}
              </div>
              {/if}
            </button>
          {/each}
        </div>
        <p class="text-xs text-gray-600 mt-3 text-center">클릭하면 AI가 해당 단지 실거래 상세 분석을 제공합니다</p>
      </section>
      {/if}

      <!-- 가성비 TOP 3 -->
      {#if data.valueCoplexes && data.valueCoplexes.length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">
          {region.name} 가성비 단지
          <span class="text-xs text-gray-500 font-normal ml-2">종합점수 대비 가격 효율 순</span>
        </h2>
        <div class="space-y-2">
          {#each data.valueCoplexes as complex, i}
            <button
              onclick={() => askQuestion(`${complex.complex_name} 아파트 투자 가치와 최근 시세 분석해줘`)}
              class="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-200 group"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold text-green-400 w-5">{i + 1}</span>
                  <div>
                    <div class="font-medium text-gray-200 text-sm group-hover:text-white">{complex.complex_name}</div>
                    <div class="text-xs text-gray-500 mt-0.5">
                      {complex.nearest_station ? `${complex.nearest_station}역` : ''}
                      {complex.construction_year ? `· ${complex.construction_year}년` : ''}
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-green-400">{(complex.avg_price / 10000).toFixed(1)}억</div>
                  <div class="text-xs text-gray-500">점수 {complex.scores.composite}</div>
                </div>
              </div>
            </button>
          {/each}
        </div>
        <p class="text-xs text-gray-600 mt-3 text-center">낮은 가격 대비 높은 점수 = 상대적 저평가 단지</p>
      </section>
      {/if}

      <!-- C. 평형별 시세 -->
      {#if priceByArea && priceByArea.length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">
          {region.name} 평형별 시세
          <span class="text-xs text-gray-500 font-normal ml-2">최근 3개월 실거래 기준</span>
        </h2>
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
