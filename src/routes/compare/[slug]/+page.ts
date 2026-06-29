import { getRegion } from '$lib/data/regions';

export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

interface RankInfo {
  rank: number;
  total: number;
  avgPrice: string;
  avgPricePerPy: string;
  avgPriceRaw: number;
  avgPricePerPyRaw: number;
  transactionCount: number;
}

function parseSlug(slug: string): [string, string] | null {
  const parts = (slug || '').split('-vs-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

async function fetchRankInfo(rankings: any[], regionName: string): Promise<RankInfo | null> {
  const match = rankings.find((r: any) => r.region_name?.includes(regionName));
  if (!match) return null;
  return {
    rank: match.rank,
    total: rankings.length,
    avgPrice: match.avg_price_display,
    avgPricePerPy: match.avg_price_per_py_display,
    avgPriceRaw: match.avg_price,
    avgPricePerPyRaw: match.avg_price_per_exclusive_py,
    transactionCount: match.transaction_count
  };
}

async function fetchPriceByArea(name: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(name)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.by_area || [];
  } catch {
    return [];
  }
}

async function fetchTopComplexes(name: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/complexes?district=${encodeURIComponent(name)}&limit=30&period_months=3`);
    if (!res.ok) return [];
    const json = await res.json();
    const list = Array.isArray(json) ? json : (json.data || []);
    const seen = new Set<string>();
    const unique = list.filter((c: any) => {
      if (seen.has(c.complex_name)) return false;
      seen.add(c.complex_name);
      return true;
    });
    return unique
      .filter((c: any) => c.scores?.composite)
      .sort((a: any, b: any) => b.scores.composite - a.scores.composite)
      .slice(0, 5);
  } catch {
    return [];
  }
}

export async function load({ params }) {
  const pair = parseSlug(params.slug);
  if (!pair) return { regionA: null, regionB: null };

  const regionA = getRegion(pair[0]);
  const regionB = getRegion(pair[1]);
  if (!regionA || !regionB) return { regionA: null, regionB: null };

  let rankings: any[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/stats/rankings?sort_by=price&order=desc&limit=60`);
    if (res.ok) {
      const json = await res.json();
      rankings = json?.data?.rankings || [];
    }
  } catch {}

  const [rankA, rankB, priceByAreaA, priceByAreaB, complexesA, complexesB] = await Promise.all([
    fetchRankInfo(rankings, regionA.name),
    fetchRankInfo(rankings, regionB.name),
    fetchPriceByArea(regionA.name),
    fetchPriceByArea(regionB.name),
    fetchTopComplexes(regionA.name),
    fetchTopComplexes(regionB.name)
  ]);

  return { regionA, regionB, rankA, rankB, priceByAreaA, priceByAreaB, complexesA, complexesB };
}
