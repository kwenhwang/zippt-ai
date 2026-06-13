import { REGIONS } from '$lib/data/regions';
import { SITE_URL, API_BASE } from '$lib/config';

// 블로그 글이 매일 늘어나므로 동적 생성 (프리렌더 X)
export const prerender = false;

interface BlogListItem {
  slug: string;
  created_at: string | null;
}

function urlEntry(loc: string, opts: { lastmod?: string; changefreq?: string; priority?: string } = {}): string {
  const parts = [`    <loc>${loc}</loc>`];
  if (opts.lastmod) parts.push(`    <lastmod>${opts.lastmod}</lastmod>`);
  if (opts.changefreq) parts.push(`    <changefreq>${opts.changefreq}</changefreq>`);
  if (opts.priority) parts.push(`    <priority>${opts.priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

export async function GET({ fetch }) {
  const today = new Date().toISOString().slice(0, 10);

  const entries: string[] = [];

  // 정적 핵심 페이지
  entries.push(urlEntry(`${SITE_URL}/`, { lastmod: today, changefreq: 'weekly', priority: '1.0' }));
  entries.push(urlEntry(`${SITE_URL}/faq`, { lastmod: today, changefreq: 'monthly', priority: '0.7' }));
  entries.push(urlEntry(`${SITE_URL}/blog`, { lastmod: today, changefreq: 'daily', priority: '0.8' }));

  // 지역 페이지
  for (const r of REGIONS) {
    entries.push(urlEntry(`${SITE_URL}/area/${r.slugEn}`, { lastmod: today, changefreq: 'monthly', priority: '0.8' }));
  }

  // 블로그 글 (백엔드에서 fetch, 실패해도 나머지는 출력)
  try {
    const res = await fetch(`${API_BASE}/api/blog`);
    if (res.ok) {
      const data = await res.json();
      const posts: BlogListItem[] = data.posts ?? [];
      for (const p of posts) {
        entries.push(
          urlEntry(`${SITE_URL}/blog/${p.slug}`, {
            lastmod: (p.created_at ?? today).slice(0, 10),
            changefreq: 'monthly',
            priority: '0.7'
          })
        );
      }
    }
  } catch {
    // 블로그 fetch 실패 시 무시
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
