<script lang="ts">
  import type { BarChartData } from '$lib/types/widgets';

  export let data: BarChartData;

  $: maxValue = Math.max(...data.data.map(d => Math.abs(d.value)));

  function formatValue(value: number): string {
    if (data.unit === '억') return (value / 10000).toFixed(1) + '억';
    if (data.unit === '%') return value.toFixed(1) + '%';
    return value.toLocaleString() + (data.unit || '');
  }

  function getBarWidth(value: number): number {
    return (Math.abs(value) / maxValue) * 100;
  }

  function getBarColor(value: number, index: number): string {
    if (data.unit === '%') {
      return value >= 0 ? 'bg-red-500' : 'bg-blue-500';
    }
    const colors = ['bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
    return colors[index % colors.length];
  }
</script>

<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
  <h3 class="text-sm font-medium text-zinc-300 mb-4">📊 {data.title}</h3>
  <div class="space-y-3">
    {#each data.data as item, i}
      <div class="space-y-1">
        <div class="flex justify-between text-sm">
          <span class="text-zinc-400">{item.label}</span>
          <span class="text-zinc-200 font-medium">{formatValue(item.value)}</span>
        </div>
        <div class="h-4 bg-zinc-700 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 {getBarColor(item.value, i)}"
            style="width: {getBarWidth(item.value)}%"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</div>
