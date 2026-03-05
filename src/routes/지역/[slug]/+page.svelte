<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();
  const { region } = data;

  function askQuestion(question: string) {
    // 메인 페이지로 이동하며 질문 전달
    goto(`/?q=${encodeURIComponent(question)}`);
  }
</script>

<svelte:head>
  <title>{region.name} 아파트 시세 | Zippt AI 부동산</title>
  <meta name="description" content={region.description} />
  <meta name="keywords" content={region.keywords.join(', ')} />
  <meta property="og:title" content="{region.name} 아파트 시세 | Zippt AI" />
  <meta property="og:description" content={region.description} />
  <meta property="og:url" content="https://zippt-ai.vercel.app/지역/{region.slug}" />
  <link rel="canonical" href="https://zippt-ai.vercel.app/지역/{region.slug}" />
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
        <span>🏠</span>
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
</main>
