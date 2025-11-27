<script lang="ts">
  import type { RankingsTableData } from '$lib/types/widgets';
  import { TrendingUp, TrendingDown } from 'lucide-svelte';

  export let data: RankingsTableData;

  function getMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  }

  function formatValue(value: number, metric: string): string {
    if (metric === 'price') return (value / 10000).toFixed(1) + '억';
    if (metric === 'volume') return value.toLocaleString() + '건';
    if (metric === 'growth' || metric === 'yield') return value.toFixed(1) + '%';
    return value.toLocaleString();
  }
</script>

<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
  <h3 class="text-sm font-medium text-zinc-300 mb-3">🏆 {data.title}</h3>
  <div class="space-y-2">
    {#each data.items as item}
      <div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-700/30 transition-colors">
        <div class="flex items-center gap-3">
          <span class="text-lg w-8 text-center">{getMedal(item.rank)}</span>
          <span class="text-zinc-200">{item.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-orange-400 font-medium">{formatValue(item.value, data.metric)}</span>
          {#if item.change !== undefined}
            <span class="text-xs flex items-center gap-0.5 {item.change >= 0 ? 'text-red-400' : 'text-blue-400'}">
              {#if item.change >= 0}
                <TrendingUp class="w-3 h-3" />
              {:else}
                <TrendingDown class="w-3 h-3" />
              {/if}
              {Math.abs(item.change).toFixed(1)}%
            </span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
