<script lang="ts">
  import { Building2, MapPin, Calendar, Users } from 'lucide-svelte';
  import type { ComplexCardData } from '$lib/types/widgets';

  export let data: ComplexCardData;

  function formatPrice(price: number): string {
    return (price / 10000).toFixed(1) + '억';
  }
</script>

<div class="glass-card rounded-[var(--radius-2xl)] p-0 border border-[var(--border-light)] overflow-hidden transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-lg">
  <div class="p-[1.25rem]">
    <div class="flex items-start gap-[1rem]">
      <div class="p-[0.75rem] bg-[var(--accent-primary)]/10 rounded-[var(--radius-xl)] flex-shrink-0">
        <Building2 class="w-6 h-6 text-[var(--accent-primary)]" strokeWidth={2.5} />
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-[var(--text-lg)] font-bold text-[var(--text-primary)] leading-tight">{data.name}</h3>
        <p class="text-[var(--text-sm)] text-[var(--text-secondary)] flex items-center gap-1.5 mt-1 truncate">
          <MapPin class="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> {data.address}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-0 mt-6 divide-x divide-[var(--border-light)]">
      <div class="pr-4">
        <p class="text-[0.7rem] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">평균 시세</p>
        <p class="text-[var(--text-lg)] font-bold text-[var(--accent-primary)]">{formatPrice(data.avgPrice)}</p>
      </div>
      <div class="px-4">
        <p class="text-[0.7rem] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">세대수</p>
        <p class="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{data.totalUnits.toLocaleString()}</p>
      </div>
      <div class="pl-4">
        <p class="text-[0.7rem] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">준공년도</p>
        <p class="text-[var(--text-lg)] font-semibold text-[var(--text-primary)]">{data.buildYear}</p>
      </div>
    </div>
  </div>

  {#if data.recentTransaction}
    <div class="py-3 px-5 bg-[var(--bg-tertiary)]/50 border-t border-[var(--border-light)] flex items-center justify-between text-xs transition-colors hover:bg-[var(--bg-tertiary)]">
      <span class="font-medium text-[var(--text-secondary)]">최근 실거래</span>
      <div class="flex items-center gap-3">
        <span class="text-[var(--text-tertiary)]">{data.recentTransaction.date}</span>
        <span class="w-1 h-1 rounded-full bg-[var(--border-medium)]"></span>
        <span class="font-medium text-[var(--text-primary)]">{data.recentTransaction.area}㎡</span>
        <span class="w-1 h-1 rounded-full bg-[var(--border-medium)]"></span>
        <span class="font-bold text-[var(--text-primary)]">{formatPrice(data.recentTransaction.price)}</span>
      </div>
    </div>
  {/if}
</div>
