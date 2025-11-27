<script lang="ts">
  import { PriceChart, CompareTable, ComplexCard, WidgetRenderer } from '$lib/components/widgets';
  import type { PriceChartData, CompareTableData, ComplexCardData } from '$lib/types/widgets';

  // Sample data for PriceChart
  const priceChartData: PriceChartData = {
    type: 'price_chart',
    complexName: '래미안아파트',
    data: [
      { date: '2024-01', price: 80000, area: 84.5 },
      { date: '2024-02', price: 82000, area: 84.5 },
      { date: '2024-03', price: 85000, area: 84.5 },
      { date: '2024-04', price: 83000, area: 84.5 },
      { date: '2024-05', price: 87000, area: 84.5 },
      { date: '2024-06', price: 90000, area: 84.5 }
    ]
  };

  // Sample data for CompareTable
  const compareTableData: CompareTableData = {
    type: 'compare_table',
    items: [
      { name: '래미안아파트', avgPrice: 90000, pricePerPyeong: 3500, totalUnits: 1200, buildYear: 2018 },
      { name: '힐스테이트', avgPrice: 85000, pricePerPyeong: 3300, totalUnits: 1000, buildYear: 2019 },
      { name: '아이파크', avgPrice: 95000, pricePerPyeong: 3700, totalUnits: 1500, buildYear: 2020 }
    ]
  };

  // Sample data for ComplexCard
  const complexCardData: ComplexCardData = {
    type: 'complex_card',
    name: '래미안아파트',
    address: '서울시 강남구 역삼동',
    totalUnits: 1200,
    buildYear: 2018,
    avgPrice: 90000,
    recentTransaction: {
      date: '2024-06-15',
      price: 92000,
      area: 84.5
    }
  };
</script>

<div class="min-h-screen bg-zinc-950 text-zinc-100 p-8">
  <div class="max-w-6xl mx-auto space-y-8">
    <div>
      <h1 class="text-3xl font-bold mb-2">Zippt AI - Widget Components Demo</h1>
      <p class="text-zinc-400">Generative UI 위젯 컴포넌트 테스트</p>
    </div>

    <!-- Price Chart -->
    <div>
      <h2 class="text-xl font-semibold mb-4">1. Price Chart Widget</h2>
      <PriceChart data={priceChartData} />
    </div>

    <!-- Compare Table -->
    <div>
      <h2 class="text-xl font-semibold mb-4">2. Compare Table Widget</h2>
      <CompareTable data={compareTableData} />
    </div>

    <!-- Complex Card -->
    <div>
      <h2 class="text-xl font-semibold mb-4">3. Complex Card Widget</h2>
      <ComplexCard data={complexCardData} />
    </div>

    <!-- Widget Renderer (unified interface) -->
    <div>
      <h2 class="text-xl font-semibold mb-4">4. Widget Renderer (Unified)</h2>
      <div class="space-y-4">
        <WidgetRenderer widget={priceChartData} />
        <WidgetRenderer widget={compareTableData} />
        <WidgetRenderer widget={complexCardData} />
      </div>
    </div>
  </div>
</div>
