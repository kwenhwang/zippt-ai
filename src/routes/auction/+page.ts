// 경매 카드 화면 데이터 로드 — 경매 vs 실거래 시세 비교(할인율·유찰 신호)
export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

export async function load({ url, fetch }) {
  const sido = url.searchParams.get('sido') || '서울특별시';
  const sigungu = url.searchParams.get('sigungu') || '';

  let items: any[] = [];
  let saleRate: any = null;
  const compareUrl = new URL(`${API_BASE}/api/auction/compare`);
  compareUrl.searchParams.set('sido', sido);
  if (sigungu) compareUrl.searchParams.set('sigungu', sigungu);
  compareUrl.searchParams.set('usage_name', '아파트');
  compareUrl.searchParams.set('limit', '30');

  const rateUrl = new URL(`${API_BASE}/api/auction/sale-rate`);
  rateUrl.searchParams.set('sido', sido);
  if (sigungu) rateUrl.searchParams.set('sigungu', sigungu);
  rateUrl.searchParams.set('usage_name', '아파트');

  const [cRes, rRes] = await Promise.allSettled([fetch(compareUrl.toString()), fetch(rateUrl.toString())]);
  if (cRes.status === 'fulfilled' && cRes.value.ok) {
    try {
      const d = (await cRes.value.json())?.data ?? {};
      items = d.comparisons ?? d?.data?.comparisons ?? [];
    } catch { /* graceful */ }
  }
  if (rRes.status === 'fulfilled' && rRes.value.ok) {
    try {
      saleRate = (await rRes.value.json())?.data?.summary ?? null;
    } catch { /* graceful */ }
  }

  return { sido, sigungu, items, saleRate };
}
