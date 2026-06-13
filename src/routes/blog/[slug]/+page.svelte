<script lang="ts">
  import type { PageData } from './$types';
  import { SITE_URL } from '$lib/config';

  let { data }: { data: PageData } = $props();
  const post = data.post;

  function formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<svelte:head>
  <title>{post.title} | Zippt AI 부동산</title>
  <meta name="description" content={post.description ?? post.title} />
  {#if post.tags && post.tags.length > 0}
    <meta name="keywords" content={post.tags.join(', ')} />
  {/if}
  <meta property="og:title" content="{post.title} | Zippt AI" />
  <meta property="og:description" content={post.description ?? post.title} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="{SITE_URL}/blog/{post.slug}" />
  <link rel="canonical" href="{SITE_URL}/blog/{post.slug}" />
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
      <a href="/blog" class="text-gray-300 hover:text-orange-400 transition-colors">블로그</a>
    </div>
  </header>

  <article class="max-w-3xl mx-auto px-6 py-12">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <span>{formatDate(post.created_at)}</span>
        {#if post.tags && post.tags.length > 0}
          <span>·</span>
          <span class="text-orange-400/80">{post.tags.slice(0, 4).join(' · ')}</span>
        {/if}
      </div>
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{post.title}</h1>
    </div>

    <!-- 본문 (서버 생성 HTML) -->
    <div class="blog-content bg-white rounded-2xl p-6 sm:p-8">
      {@html post.content_html}
    </div>

    <!-- 하단 CTA -->
    <div class="mt-12 text-center">
      <a
        href="/"
        class="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
      >
        내 단지 시세 AI에게 물어보기 →
      </a>
      <p class="mt-4">
        <a href="/blog" class="text-sm text-gray-400 hover:text-orange-400 transition-colors">← 다른 분석 글 보기</a>
      </p>
    </div>
  </article>
</main>

<style>
  /* 서버 생성 HTML이 흰 배경 카드 안에서 읽히도록 기본 타이포 보정 */
  :global(.blog-content) {
    color: #1a1a1a;
  }
</style>
