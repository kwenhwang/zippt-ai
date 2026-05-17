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

<div class="glass-card rounded-[var(--radius-2xl)] p-5 border border-[var(--border-light)]">
  <h3 class="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
    <span class="text-lg">🏆</span> {data.title}
  </h3>
  <div class="flex flex-col gap-1">
    {#each data.items as item}
      <div class="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--bg-tertiary)]/50 transition-colors">
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-lg w-8 text-center flex-shrink-0">{getMedal(item.rank)}</span>
          <span class="text-[var(--text-primary)] font-medium truncate">{item.name}</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[var(--accent-primary)] font-bold tabular-nums">{formatValue(item.value, data.metric)}</span>
          {#if item.change !== undefined}
            <span class="text-xs flex items-center gap-0.5 font-medium tabular-nums {item.change >= 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-400'}">
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
