import { getRegion, getRegionEntries, regionQuery, regionUnsold } from '$lib/data/regions';

export const prerender = true;

export function entries() {
  return getRegionEntries();
}

export async function load({ params }) {
  const region = getRegion(params.slug);
  if (!region) return { region: null, complexes: [], rankInfo: null, priceByArea: [], valueRanking: [], complexesAll: [], unsold: null };

  const API_BASE = 'https://korean-api-platform.vercel.app';
  const q = regionQuery(region); // 충돌 방지 풀네임(예: '부산광역시 남구')
  const uk = regionUnsold(region); // 미분양 조회키 {sido, sigungu}

  const [complexesRes, rankingsRes, priceByAreaRes, unsoldRes, presaleRes] = await Promise.allSettled([
    fetch(`${API_BASE}/api/complexes?district=${encodeURIComponent(q)}&limit=30&period_months=3`),
    fetch(`${API_BASE}/api/stats/rankings?sort_by=price&order=desc&limit=50`),
    fetch(`${API_BASE}/api/stats/price-by-area?district=${encodeURIComponent(q)}`),
    uk
      ? fetch(`${API_BASE}/api/market/unsold?region=${encodeURIComponent(uk.sido)}&sigungu=${encodeURIComponent(uk.sigungu)}&limit=18`)
      : Promise.reject(new Error('no unsold key')),
    uk
      ? fetch(`${API_BASE}/api/market/presale?region=${encodeURIComponent(uk.sido)}&sigungu=${encodeURIComponent(uk.sigungu)}&limit=6`)
      : Promise.reject(new Error('no presale key'))
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

  // 미분양: 해당 시군구 최근 추세 + 전국 맥락
  let unsold: any = null;
  if (uk && unsoldRes.status === 'fulfilled' && unsoldRes.value.ok) {
    try {
      const data = await unsoldRes.value.json();
      const series = (data?.data || [])
        .map((x: any) => ({ period: x.period, units: x.unsold_units }))
        .sort((a: any, b: any) => a.period.localeCompare(b.period));
      if (series.length > 0) {
        const latest = series[series.length - 1];
        const prev = series.length >= 2 ? series[series.length - 2] : null;
        const yearAgo = series.length >= 13 ? series[series.length - 13] : series[0];
        unsold = {
          sigungu: uk.sigungu,
          sido: uk.sido,
          latest: latest.units,
          latestPeriod: latest.period,
          momChange: prev ? latest.units - prev.units : null,
          yoyChange: yearAgo ? latest.units - yearAgo.units : null,
          series: series.slice(-12),
          national: data?.meta?.latest_national ?? null
        };
      }
    } catch { /* graceful */ }
  }

  // 분양: 해당 시군구 공고 (청약접수 최신순) — 분양가·일정
  let presale: any[] = [];
  const today = new Date().toISOString().slice(0, 10); // 빌드 시점 기준
  if (uk && presaleRes.status === 'fulfilled' && presaleRes.value.ok) {
    try {
      const data = await presaleRes.value.json();
      presale = (data?.data || []).map((x: any) => ({
        name: x.house_nm,
        sigungu: x.sigungu,
        households: x.tot_suply_hshldco,
        rceptBgn: x.rcept_bgnde,     // 청약접수 시작
        rceptEnd: x.rcept_endde,
        priceMin: x.price_min,        // 만원
        priceMax: x.price_max,
        builder: x.cnstrct_entrps_nm,
        rentType: x.rent_secd_nm,     // 분양주택/임대
        url: x.pblanc_url,
        upcoming: !!(x.rcept_bgnde && x.rcept_bgnde >= today)  // 청약 예정(빌드 기준)
      })).filter((x: any) => x.name);
    } catch { /* graceful */ }
  }

  return { region, complexes, rankInfo, priceByArea, valueRanking, complexesAll, unsold, presale };
}
