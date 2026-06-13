import { error } from '@sveltejs/kit';
import { API_BASE } from '$lib/config';

// 매일 새 글이 재배포 없이 노출되도록 SSR (프리렌더 X)
export const prerender = false;

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_html: string;
  tags: string[] | null;
  topic_query: string | null;
  created_at: string | null;
}

export async function load({ params, fetch }) {
  try {
    const res = await fetch(`${API_BASE}/api/blog/${encodeURIComponent(params.slug)}`);
    if (!res.ok) throw error(404, '글을 찾을 수 없습니다.');
    const data = await res.json();
    if (!data.post) throw error(404, '글을 찾을 수 없습니다.');
    return { post: data.post as BlogPost };
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) throw e;
    throw error(404, '글을 찾을 수 없습니다.');
  }
}
