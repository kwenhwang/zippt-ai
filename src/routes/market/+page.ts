// 시장 심리/타이밍 화면 데이터 로드.
// /api/market/sentiment (시장심리지수, 시도+전국+수도권/비수도권, 월별) 기반.
export const prerender = false;

const API_BASE = 'https://korean-api-platform.vercel.app';

interface Point { period: string; index: number; }
interface RegionSeries {
  name: string;
  latest: number | null;
  prev: number | null;
  delta: number | null;
  status: string | null;
  series: Point[];
}

export async function load({ fetch }) {
  let raw: any[] = [];
  try {
    const res = await fetch(`${API_BASE}/api/market/sentiment?limit=500`);
    if (res.ok) raw = (await res.json())?.data ?? [];
  } catch { /* graceful */ }

  // region별 시계열 구성 (기간 오름차순)
  const byRegion = new Map<string, Point[]>();
  for (const r of raw) {
    if (r?.sentiment_index == null || !r?.region_name || !r?.period) continue;
    if (!byRegion.has(r.region_name)) byRegion.set(r.region_name, []);
    byRegion.get(r.region_name)!.push({ period: r.period, index: r.sentiment_index });
  }

  const statusByRegionLatest = new Map<string, string>();
  for (const r of raw) {
    if (r?.region_name && r?.sentiment_status) {
      // raw는 period DESC 정렬이므로 첫 등장이 최신
      if (!statusByRegionLatest.has(r.region_name)) statusByRegionLatest.set(r.region_name, r.sentiment_status);
    }
  }

  const regions: RegionSeries[] = [];
  let latestPeriod = '';
  for (const [name, pts] of byRegion) {
    pts.sort((a, b) => a.period.localeCompare(b.period));
    const latest = pts.length ? pts[pts.length - 1].index : null;
    const prev = pts.length > 1 ? pts[pts.length - 2].index : null;
    const delta = latest != null && prev != null ? Math.round((latest - prev) * 10) / 10 : null;
    if (pts.length) latestPeriod = pts[pts.length - 1].period > latestPeriod ? pts[pts.length - 1].period : latestPeriod;
    regions.push({
      name,
      latest,
      prev,
      delta,
      status: statusByRegionLatest.get(name) ?? null,
      series: pts
    });
  }

  return { regions, latestPeriod };
}
