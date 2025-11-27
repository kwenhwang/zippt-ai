<script lang="ts">
  import { Building2, MapPin, Calendar, Users } from 'lucide-svelte';
  import type { ComplexCardData } from '$lib/types/widgets';

  export let data: ComplexCardData;

  function formatPrice(price: number): string {
    return (price / 10000).toFixed(1) + '억';
  }
</script>

<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
  <div class="flex items-start gap-3">
    <div class="p-2 bg-orange-500/20 rounded-lg">
      <Building2 class="w-6 h-6 text-orange-500" />
    </div>
    <div class="flex-1">
      <h3 class="font-medium text-zinc-100">{data.name}</h3>
      <p class="text-sm text-zinc-400 flex items-center gap-1 mt-1">
        <MapPin class="w-3 h-3" /> {data.address}
      </p>
    </div>
  </div>

  <div class="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-700">
    <div>
      <p class="text-xs text-zinc-500">평균 시세</p>
      <p class="text-lg font-bold text-orange-400">{formatPrice(data.avgPrice)}</p>
    </div>
    <div>
      <p class="text-xs text-zinc-500">세대수</p>
      <p class="text-sm text-zinc-200">{data.totalUnits.toLocaleString()}세대</p>
    </div>
    <div>
      <p class="text-xs text-zinc-500">준공</p>
      <p class="text-sm text-zinc-200">{data.buildYear}년</p>
    </div>
  </div>

  {#if data.recentTransaction}
    <div class="mt-3 p-2 bg-zinc-900/50 rounded text-xs">
      <span class="text-zinc-500">최근 거래:</span>
      <span class="text-zinc-300 ml-1">
        {data.recentTransaction.date} | {data.recentTransaction.area}㎡ | {formatPrice(data.recentTransaction.price)}
      </span>
    </div>
  {/if}
</div>
