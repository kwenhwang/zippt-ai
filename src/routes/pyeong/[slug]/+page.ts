import { getRegion } from '$lib/data/regions';

export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

export async function load({ params }) {
  const region = getRegion(params.slug);
  if (!region) return { region: null, byArea: [] };

  let byArea: any[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(region.name)}`);
    if (res.ok) {
      const json = await res.json();
      byArea = json?.data?.by_area || [];
    }
  } catch {}

  return { region, byArea };
}
