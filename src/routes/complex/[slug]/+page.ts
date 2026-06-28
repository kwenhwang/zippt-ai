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
  if (complex) {
    try {
      const cname = complex.complex_name || name;
      const tx = await fetch(
        `${API_BASE}/api/transactions?complex_name=${encodeURIComponent(cname)}&limit=100&order_by=contract_year_month&order=desc`
      );
      if (tx.ok) {
        const tj = await tx.json();
        transactions = tj?.data ?? [];
      }
    } catch {
      // 실거래 실패해도 요약으로 화면 동작
    }
  }

  return { name, complex, transactions };
}
