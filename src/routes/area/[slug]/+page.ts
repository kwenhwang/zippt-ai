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

  if (complexesRes.status === 'fulfilled' && complexesRes.value.ok) {
    const data = await complexesRes.value.json();
    const list = Array.isArray(data) ? data : (data.data || []);
    complexes = list
      .filter((c: any) => c.scores?.composite)
      .sort((a: any, b: any) => b.scores.composite - a.scores.composite)
      .slice(0, 8);
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

  return { region, complexes, rankInfo, priceByArea };
}
