import { REGIONS } from '$lib/data/regions';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// 빌드 시 정적 페이지 사전 생성
export const prerender = true;

export function entries() {
  return REGIONS.map(r => ({ slug: r.slug }));
}

export const load: PageLoad = ({ params }) => {
  const region = REGIONS.find(r => r.slug === params.slug);
  if (!region) throw error(404, '지역을 찾을 수 없습니다');
  return { region };
};
