// 경매 카드 화면 데이터 로드 — 경매 vs 실거래 시세 비교(할인율·유찰 신호)
export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

export async function load({ url, fetch }) {
  const sido = url.searchParams.get('sido') || '서울특별시';
  const sigungu = url.searchParams.get('sigungu') || '';

  let items: any[] = [];
  try {
    const u = new URL(`${API_BASE}/api/auction/compare`);
    u.searchParams.set('sido', sido);
    if (sigungu) u.searchParams.set('sigungu', sigungu);
    u.searchParams.set('usage_name', '아파트');
    u.searchParams.set('limit', '30');
    const res = await fetch(u.toString());
    if (res.ok) {
      const j = await res.json();
      const d = j?.data ?? {};
      items = d.comparisons ?? d?.data?.comparisons ?? [];
    }
  } catch {
    // graceful: items=[]
  }

  return { sido, sigungu, items };
}
