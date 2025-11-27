<script lang="ts">
  import type { WidgetData } from '$lib/types/widgets';
  import PriceChart from './PriceChart.svelte';
  import CompareTable from './CompareTable.svelte';
  import ComplexCard from './ComplexCard.svelte';
  import RankingsTable from './RankingsTable.svelte';
  import BarChart from './BarChart.svelte';
  import PieChart from './PieChart.svelte';

  export let widget: WidgetData;
</script>

{#if widget.type === 'price_chart'}
  <PriceChart data={widget} />
{:else if widget.type === 'compare_table'}
  <CompareTable data={widget} />
{:else if widget.type === 'complex_card'}
  <ComplexCard data={widget} />
{:else if widget.type === 'rankings_table'}
  <RankingsTable data={widget} />
{:else if widget.type === 'bar_chart'}
  <BarChart data={widget} />
{:else if widget.type === 'pie_chart'}
  <PieChart data={widget} />
{/if}
