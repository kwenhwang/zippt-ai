// 단지 분석 화면 데이터 로드.
// 단지명(slug)으로 /api/complexes?query= 검색 → 첫 매칭 단지.
// 임의 단지명이라 prerender 불가(동적).
export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

export async function load({ params, fetch }) {
  const name = decodeURIComponent(params.slug);

  try {
    const res = await fetch(
      `${API_BASE}/api/complexes?query=${encodeURIComponent(name)}&limit=1`
    );
    if (res.ok) {
      const json = await res.json();
      const complex = (json?.data ?? [])[0] ?? null;
      return { name, complex };
    }
  } catch {
    // 폴백: 아래에서 complex=null 처리
  }
  return { name, complex: null };
}
