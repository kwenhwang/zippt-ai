<script lang="ts">
  import type { CompareTableData } from '$lib/types/widgets';

  export let data: CompareTableData;

  function formatPrice(price: number): string {
    return (price / 10000).toFixed(1) + '억';
  }
</script>

<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700 overflow-x-auto">
  <h3 class="text-sm font-medium text-zinc-300 mb-3">📊 단지 비교</h3>
  <table class="w-full text-sm">
    <thead>
      <tr class="text-zinc-400 border-b border-zinc-700">
        <th class="text-left py-2 px-2">단지명</th>
        <th class="text-right py-2 px-2">평균가</th>
        <th class="text-right py-2 px-2">평당가</th>
        <th class="text-right py-2 px-2">세대수</th>
        <th class="text-right py-2 px-2">준공</th>
      </tr>
    </thead>
    <tbody>
      {#each data.items as item}
        <tr class="border-b border-zinc-700/50 hover:bg-zinc-700/30">
          <td class="py-2 px-2 text-zinc-200">{item.name}</td>
          <td class="py-2 px-2 text-right text-orange-400">{formatPrice(item.avgPrice)}</td>
          <td class="py-2 px-2 text-right text-zinc-300">{item.pricePerPyeong.toLocaleString()}만</td>
          <td class="py-2 px-2 text-right text-zinc-400">{item.totalUnits.toLocaleString()}</td>
          <td class="py-2 px-2 text-right text-zinc-400">{item.buildYear}년</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
