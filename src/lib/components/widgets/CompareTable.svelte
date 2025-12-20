<script lang="ts">
  import type { CompareTableData } from '$lib/types/widgets';

  export let data: CompareTableData;

  function formatPrice(price: number): string {
    return (price / 10000).toFixed(1) + '억';
  }
</script>

<div class="glass-card rounded-2xl p-5 border border-[var(--border-light)] overflow-hidden">
  <h3 class="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
    <span class="text-lg">📊</span> 단지 비교
  </h3>
  <div class="overflow-x-auto -mx-5 px-5">
    <table class="w-full text-sm min-w-[400px]">
      <thead>
        <tr class="border-b border-[var(--border-medium)]">
          <th class="text-left py-3 px-2 font-medium text-[var(--text-tertiary)] w-[30%]">단지명</th>
          <th class="text-right py-3 px-2 font-medium text-[var(--text-tertiary)]">평균가</th>
          <th class="text-right py-3 px-2 font-medium text-[var(--text-tertiary)]">평당가</th>
          <th class="text-right py-3 px-2 font-medium text-[var(--text-tertiary)]">세대수</th>
          <th class="text-right py-3 px-2 font-medium text-[var(--text-tertiary)]">준공</th>
        </tr>
      </thead>
      <tbody>
        {#each data.items as item}
          <tr class="group border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-tertiary)]/50 transition-colors">
            <td class="py-3 px-2 font-medium text-[var(--text-primary)]">{item.name}</td>
            <td class="py-3 px-2 text-right font-bold text-[var(--accent-primary)]">{formatPrice(item.avgPrice)}</td>
            <td class="py-3 px-2 text-right text-[var(--text-secondary)]">{item.pricePerPyeong.toLocaleString()}만</td>
            <td class="py-3 px-2 text-right text-[var(--text-secondary)]">{item.totalUnits.toLocaleString()}</td>
            <td class="py-3 px-2 text-right text-[var(--text-tertiary)]">{item.buildYear}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
