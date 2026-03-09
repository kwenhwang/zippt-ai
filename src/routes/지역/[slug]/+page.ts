import { redirect } from '@sveltejs/kit';
import { getRegion } from '$lib/data/regions';

export function load({ params }: { params: { slug: string } }) {
  const region = getRegion(params.slug);
  if (region) {
    redirect(301, `/area/${region.slugEn}`);
  }
  redirect(301, '/');
}
