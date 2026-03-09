import { getRegion, getRegionEntries } from '$lib/data/regions';

export const prerender = true;

export function entries() {
  return getRegionEntries();
}

export async function load({ params }: { params: { slug: string } }) {
  const region = getRegion(params.slug);
  if (!region) return { region: null, complexes: [], rankInfo: null, priceByArea: [] };

  const API_BASE = 'https://korean-api-platform.vercel.app';

  const [complexesRes, rankingsRes, priceByAreaRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/complexes?district=${encodeURIComponent(region.name)}&limit=30`),
    fetch(`${API_BASE}/api/stats/rankings?sort_by=price&order=desc&limit=50`),
    fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(region.name)}`)
  ]);

  let complexes: Array<{
    complex_name: string;
    district: string;
    avg_price: number;
    transaction_count: number;
    construction_year: number | null;
    nearest_station: string | null;
    scores: {
      composite: number;
      transit: number;
      school: number;
      convenience: number;
    };
  }> = [];

  let rankInfo: {
    rank: number;
    total: number;
    avgPrice: string;
    avgPricePerPy: string;
    transactionCount: number;
  } | null = null;

  let priceByArea: any[] = [];

  let valueCoplexes: any[] = [];

  if (complexesRes.status === 'fulfilled' && complexesRes.value.ok) {
    const data = await complexesRes.value.json();
    const list = Array.isArray(data) ? data : (data.data || []);

    // 중복 단지명 제거 (같은 complex_name의 첫 번째만)
    const seen = new Set<string>();
    const unique = list.filter((c: any) => {
      if (seen.has(c.complex_name)) return false;
      seen.add(c.complex_name);
      return true;
    });

    // 종합점수 상위 8개
    complexes = unique
      .filter((c: any) => c.scores?.composite)
      .sort((a: any, b: any) => b.scores.composite - a.scores.composite)
      .slice(0, 8);

    // 가성비 TOP 3 (점수 / 가격 비율이 높은 것)
    // avg_price가 0이면 제외
    valueCoplexes = unique
      .filter((c: any) => c.scores?.composite && c.avg_price > 0)
      .map((c: any) => ({
        ...c,
        valueScore: (c.scores.composite / (c.avg_price / 10000)) // 점수/억원
      }))
      .sort((a: any, b: any) => b.valueScore - a.valueScore)
      .slice(0, 3);
  }

  if (rankingsRes.status === 'fulfilled' && rankingsRes.value.ok) {
    const data = await rankingsRes.value.json();
    const rankings: Array<{
      rank: number;
      region_name: string;
      avg_price_display: string;
      avg_price_per_py_display: string;
      transaction_count: number;
    }> = data?.data?.rankings || [];
    const match = rankings.find((r) => r.region_name?.includes(region.name));
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

  return { region, complexes, rankInfo, priceByArea, valueCoplexes };
}
