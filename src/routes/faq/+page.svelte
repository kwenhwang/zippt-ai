<script lang="ts">
  import { FAQS } from '$lib/data/faqs';
  import type { FaqItem } from '$lib/data/faqs';

  type Category = '전체' | '시세' | '전세' | '투자' | '대출' | '청약';

  const categories: Category[] = ['전체', '시세', '전세', '투자', '대출', '청약'];

  let selectedCategory = $state<Category>('전체');
  let openIds = $state<Set<string>>(new Set());

  const filteredFaqs = $derived<FaqItem[]>(
    selectedCategory === '전체'
      ? FAQS
      : FAQS.filter((f) => f.category === selectedCategory)
  );

  function toggleFaq(id: string) {
    const next = new Set(openIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    openIds = next;
  }

  // JSON-LD FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
</script>

<svelte:head>
  <title>부동산 FAQ | 자주 묻는 질문 | Zippt AI</title>
  <meta
    name="description"
    content="강남구 아파트 시세, 전세 사기 예방, DSR 대출 한도, 청약 가점 등 부동산 자주 묻는 질문을 Zippt AI가 실거래 데이터 기반으로 답변합니다."
  />
  <meta name="keywords" content="부동산 FAQ, 아파트 시세, 전세 사기, DSR, 청약 가점, 갭투자, 전세자금대출" />
  <meta property="og:title" content="부동산 FAQ | 자주 묻는 질문 | Zippt AI" />
  <meta
    property="og:description"
    content="강남구 아파트 시세, 전세 사기 예방, DSR 대출 한도, 청약 가점 등 부동산 자주 묻는 질문을 실거래 데이터 기반으로 답변합니다."
  />
  <meta property="og:url" content="https://zippt-ai.vercel.app/faq" />
  <link rel="canonical" href="https://zippt-ai.vercel.app/faq" />
  {@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>`}
</svelte:head>

<main class="min-h-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white">
  <!-- 헤더 -->
  <header class="border-b border-white/10 bg-black/30 backdrop-blur-sm">
    <div class="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
      <a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-sm font-bold text-gray-900">Z</div>
        <span class="font-bold text-orange-400">Zippt AI</span>
      </a>
      <span class="text-gray-500">/</span>
      <span class="text-gray-300">자주 묻는 질문</span>
    </div>
  </header>

  <!-- 메인 콘텐츠 -->
  <div class="max-w-3xl mx-auto px-6 py-16">
    <!-- 히어로 -->
    <div class="text-center mb-16">
      <div class="inline-block bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-orange-400 text-sm font-medium mb-6">
        부동산 FAQ
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
        부동산 자주 묻는 질문<br />
        <span class="text-orange-400">한 번에 정리했습니다</span>
      </h1>
      <p class="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
        시세, 전세, 투자, 대출, 청약까지<br />
        실거래 데이터 기반으로 정확하게 답변합니다.
      </p>
    </div>

    <!-- 카테고리 필터 탭 -->
    <div class="flex flex-wrap gap-2 mb-10 justify-center">
      {#each categories as category}
        <button
          onclick={() => { selectedCategory = category; }}
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 {selectedCategory === category
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
            : 'bg-white/5 border border-white/10 text-gray-400 hover:border-orange-500/40 hover:text-white'}"
        >
          {category}
        </button>
      {/each}
    </div>

    <!-- FAQ 아코디언 -->
    <section class="mb-16 space-y-3">
      {#each filteredFaqs as faq (faq.id)}
        <div class="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-200 hover:border-orange-500/20">
          <button
            onclick={() => toggleFaq(faq.id)}
            class="w-full text-left px-6 py-5 flex items-center justify-between gap-4 group"
            aria-expanded={openIds.has(faq.id)}
          >
            <div class="flex items-start gap-3">
              <span class="mt-0.5 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                {faq.category}
              </span>
              <span class="text-gray-200 group-hover:text-white transition-colors font-medium leading-snug">
                {faq.question}
              </span>
            </div>
            <span
              class="shrink-0 text-orange-400 text-xl transition-transform duration-200 {openIds.has(faq.id) ? 'rotate-45' : ''}"
            >+</span>
          </button>

          {#if openIds.has(faq.id)}
            <div class="px-6 pb-5">
              <div class="border-t border-white/10 pt-4">
                <p class="text-gray-400 leading-relaxed text-sm">{faq.answer}</p>
                <button
                  onclick={() => {
                    window.location.href = `/?q=${encodeURIComponent(faq.question)}`;
                  }}
                  class="mt-4 inline-flex items-center gap-2 text-orange-400 text-sm hover:text-orange-300 transition-colors"
                >
                  <span>AI에게 더 자세히 물어보기</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </section>

    <!-- CTA -->
    <section class="text-center">
      <p class="text-gray-400 mb-6 text-base">더 자세히 알고 싶으면 AI에게 물어보세요</p>
      <a
        href="/"
        class="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-8 py-4 rounded-2xl hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 text-lg"
      >
        <span>AI에게 직접 질문하기</span>
        <span>→</span>
      </a>
      <p class="text-gray-500 text-sm mt-4">무료 · 즉시 답변 · 실거래가 기반</p>
    </section>

    <!-- SEO 텍스트 -->
    <section class="mt-20 pt-12 border-t border-white/10">
      <h2 class="text-lg font-semibold text-gray-300 mb-4">부동산 FAQ 안내</h2>
      <p class="text-gray-500 text-sm leading-relaxed">
        Zippt AI는 국토교통부 실거래가 데이터 10,700,000건을 기반으로
        아파트 시세, 전세 정보, 대출 한도, 청약 가점 등
        부동산 자주 묻는 질문에 실시간으로 답변합니다.
        더 구체적인 질문은 AI 챗봇에 직접 입력해 보세요.
      </p>
    </section>
  </div>
</main>
