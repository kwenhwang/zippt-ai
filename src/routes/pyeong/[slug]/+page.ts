import { getRegion, regionQuery } from '$lib/data/regions';

export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

export async function load({ params }) {
  const region = getRegion(params.slug);
  if (!region) return { region: null, byArea: [] };

  let byArea: any[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(regionQuery(region))}`);
    if (res.ok) {
      const json = await res.json();
      byArea = json?.data?.by_area || [];
    }
  } catch {}

  return { region, byArea };
}
