// 단지 분석 화면 데이터 로드.
// 1) /api/complexes?query= → 단지 요약(시세·평형별·점수)
// 2) /api/transactions?complex_name= → 실거래 내역(분석기간·월별추세·최근거래용)
export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

export async function load({ params, fetch }) {
  const name = decodeURIComponent(params.slug);

  let complex: any = null;
  try {
    const res = await fetch(`${API_BASE}/api/complexes?query=${encodeURIComponent(name)}&limit=1`);
    if (res.ok) {
      const json = await res.json();
      complex = (json?.data ?? [])[0] ?? null;
    }
  } catch {
    // graceful: 아래에서 complex=null 처리
  }

  let transactions: any[] = [];
  let jeonse: any[] = [];
  let jeonseMeta: any = null;
  let auctions: any[] = [];
  if (complex) {
    const cname = complex.complex_name || name;
    const ckey = complex.complex_key;
    // 실거래(매매) + 전세 + 경매를 병렬 로드
    const [txRes, jRes, auRes] = await Promise.allSettled([
      fetch(
        `${API_BASE}/api/transactions?complex_name=${encodeURIComponent(cname)}&limit=100&order_by=contract_year_month&order=desc`
      ),
      fetch(
        `${API_BASE}/api/rental/jeonse?` +
          (ckey ? `complex_key=${encodeURIComponent(ckey)}` : `complex_name=${encodeURIComponent(cname)}`)
      ),
      // district("서울특별시 마포구 아현동")에서 시도·시군구 추출해 경매 조회
      (() => {
        const parts = (complex.district || '').split(' ');
        const u = new URL(`${API_BASE}/api/auction/items`);
        if (parts[0]) u.searchParams.set('sido', parts[0]);
        if (parts[1]) u.searchParams.set('sigungu', parts[1]);
        u.searchParams.set('limit', '100');
        return fetch(u.toString());
      })()
    ]);
    if (txRes.status === 'fulfilled' && txRes.value.ok) {
      try { transactions = (await txRes.value.json())?.data ?? []; } catch { /* graceful */ }
    }
    if (jRes.status === 'fulfilled' && jRes.value.ok) {
      try {
        const jj = await jRes.value.json();
        jeonse = jj?.data ?? [];
        jeonseMeta = jj?.metadata ?? null;
      } catch { /* graceful */ }
    }
    if (auRes.status === 'fulfilled' && auRes.value.ok) {
      try {
        const aj = await auRes.value.json();
        auctions = (aj?.data?.items ?? aj?.data ?? []).filter(
          (x: any) => (x.building_name || '').includes(cname) || cname.includes(x.building_name || '')
        );
      } catch { /* graceful */ }
    }
  }

  return { name, complex, transactions, jeonse, jeonseMeta, auctions };
}
