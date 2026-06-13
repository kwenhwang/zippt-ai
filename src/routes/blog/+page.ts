import { API_BASE } from '$lib/config';

// 매일 새 글이 재배포 없이 노출되도록 SSR (프리렌더 X)
export const prerender = false;

interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[] | null;
  created_at: string | null;
}

export async function load({ fetch }) {
  try {
    const res = await fetch(`${API_BASE}/api/blog`);
    if (!res.ok) return { posts: [] as BlogListItem[] };
    const data = await res.json();
    return { posts: (data.posts ?? []) as BlogListItem[] };
  } catch {
    return { posts: [] as BlogListItem[] };
  }
}
