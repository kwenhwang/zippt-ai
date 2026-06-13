<script lang="ts">
  import type { PageData } from './$types';
  import { SITE_URL } from '$lib/config';

  let { data }: { data: PageData } = $props();
  const posts = data.posts;

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>부동산 시세 분석 블로그 | Zippt AI</title>
  <meta name="description" content="국토교통부 실거래가 데이터 기반 아파트 시세·투자 분석 글 모음. 강남·서초·송파 등 지역별 실거래가 분석을 매일 업데이트합니다." />
  <meta name="keywords" content="아파트 시세, 실거래가, 부동산 분석, 아파트 투자, 지역별 시세" />
  <meta property="og:title" content="부동산 시세 분석 블로그 | Zippt AI" />
  <meta property="og:description" content="국토교통부 실거래가 데이터 기반 아파트 시세·투자 분석 글 모음." />
  <meta property="og:url" content="{SITE_URL}/blog" />
  <link rel="canonical" href="{SITE_URL}/blog" />
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
      <span class="text-gray-300">블로그</span>
    </div>
  </header>

  <div class="max-w-3xl mx-auto px-6 py-12">
    <div class="text-center mb-12">
      <h1 class="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
        부동산 시세 분석 <span class="text-orange-400">블로그</span>
      </h1>
      <p class="text-gray-400 leading-relaxed">
        국토교통부 실거래가 데이터 기반 · 지역별 아파트 시세와 투자 인사이트
      </p>
    </div>

    {#if posts.length === 0}
      <div class="text-center py-20 text-gray-500">
        <p>아직 발행된 글이 없습니다. 곧 업데이트됩니다.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each posts as post}
          <a
            href="/blog/{post.slug}"
            class="block p-5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-200 group"
          >
            <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>{formatDate(post.created_at)}</span>
              {#if post.tags && post.tags.length > 0}
                <span>·</span>
                <span class="text-orange-400/80">{post.tags.slice(0, 3).join(' · ')}</span>
              {/if}
            </div>
            <h2 class="text-lg font-semibold text-gray-100 group-hover:text-orange-300 transition-colors">
              {post.title}
            </h2>
            {#if post.description}
              <p class="text-sm text-gray-400 mt-2 line-clamp-2">{post.description}</p>
            {/if}
          </a>
        {/each}
      </div>
    {/if}

    <!-- CTA -->
    <div class="mt-16 text-center">
      <a
        href="/"
        class="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
      >
        AI에게 직접 물어보기 →
      </a>
    </div>
  </div>
</main>
