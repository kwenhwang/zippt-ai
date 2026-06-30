import { getRegion, getRegionEntries, regionQuery } from '$lib/data/regions';

export const prerender = true;

export function entries() {
  return getRegionEntries();
}

export async function load({ params }) {
  const region = getRegion(params.slug);
  if (!region) return { region: null, complexes: [], rankInfo: null, priceByArea: [], valueRanking: [], complexesAll: [] };

  const API_BASE = 'https://korean-api-platform.vercel.app';
  const q = regionQuery(region); // 충돌 방지 풀네임(예: '부산광역시 남구')

  const [complexesRes, rankingsRes, priceByAreaRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/complexes?district=${encodeURIComponent(q)}&limit=30&period_months=3`),
    fetch(`${API_BASE}/api/stats/rankings?sort_by=price&order=desc&limit=50`),
    fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(q)}`)
  ]);

  let complexes: any[] = [];
  let rankInfo = null;
  let priceByArea: any[] = [];
  let valueRanking: any[] = [];
  let complexesAll: any[] = [];

  if (complexesRes.status === 'fulfilled' && complexesRes.value.ok) {
    const data = await complexesRes.value.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    const seen = new Set<string>();
    const unique = list.filter((c: any) => {
      if (seen.has(c.complex_name)) return false;
      seen.add(c.complex_name);
      return true;
    });
    complexes = unique
      .filter((c: any) => c.scores?.composite)
      .sort((a: any, b: any) => b.scores.composite - a.scores.composite)
      .slice(0, 8);

    // 가성비 꿀단지: 억당 입지점수(composite / 매매가억) 높은 순 — 가격 대비 입지 우수
    valueRanking = unique
      .filter((c: any) => c.scores?.composite && c.avg_price > 0)
      .map((c: any) => ({
        complex_name: c.complex_name,
        avg_price: c.avg_price,
        scores: c.scores,
        nearest_station: c.nearest_station,
        construction_year: c.construction_year,
        value_score: Math.round((c.scores.composite / (c.avg_price / 10000)) * 10) / 10
      }))
      .sort((a: any, b: any) => b.value_score - a.value_score)
      .slice(0, 6);

    // 관점별 재정렬용 단지 풀 (실거주/학군/가성비 토글) — 클라에서 정렬
    complexesAll = unique
      .filter((c: any) => c.scores?.composite && c.avg_price > 0)
      .map((c: any) => ({
        complex_name: c.complex_name,
        avg_price: c.avg_price,
        scores: c.scores,
        nearest_station: c.nearest_station,
        construction_year: c.construction_year,
        value_score: Math.round((c.scores.composite / (c.avg_price / 10000)) * 10) / 10
      }))
      .sort((a: any, b: any) => b.scores.composite - a.scores.composite)
      .slice(0, 20);
  }

  if (rankingsRes.status === 'fulfilled' && rankingsRes.value.ok) {
    const data = await rankingsRes.value.json();
    const rankings = data?.data?.rankings || [];
    const match = rankings.find((r: any) => r.region_name?.includes(q));
    if (match) {
      rankInfo = {
        rank: match.rank,
        total: rankings.length,
        avgPrice: match.avg_price_display,
        avgPricePerPy: match.avg_price_per_py_display,
        transactionCount: match.transaction_count
      };
    }
  }

  if (priceByAreaRes.status === 'fulfilled' && priceByAreaRes.value.ok) {
    const data = await priceByAreaRes.value.json();
    priceByArea = data?.data?.by_area || [];
  }

  return { region, complexes, rankInfo, priceByArea, valueRanking, complexesAll };
}
