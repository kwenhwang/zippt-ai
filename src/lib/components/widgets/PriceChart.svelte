<script lang="ts">
  import type { PriceChartData } from '$lib/types/widgets';

  export let data: PriceChartData;

  // 데이터 변환 및 스케일링
  $: chartData = data.data.map(d => ({
    date: new Date(d.date),
    price: d.price / 10000, // 억 단위로 변환
    area: d.area
  }));

  $: minPrice = Math.min(...chartData.map(d => d.price));
  $: maxPrice = Math.max(...chartData.map(d => d.price));
  $: priceRange = maxPrice - minPrice;

  // SVG 좌표 계산
  const width = 600;
  const height = 150;
  const padding = { left: 50, right: 20, top: 10, bottom: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  $: points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.price - minPrice) / priceRange) * chartHeight;
    return { x, y, ...d };
  });

  $: pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  $: areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  let hoveredPoint: typeof points[0] | null = null;

  function formatPrice(price: number): string {
    return price.toFixed(1) + '억';
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' });
  }
</script>

<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
  <h3 class="text-sm font-medium text-zinc-300 mb-3">
    📈 {data.complexName} 가격 추이
  </h3>
  <div class="relative">
    <svg viewBox="0 0 {width} {height}" class="w-full h-48">
      <!-- Grid lines -->
      {#each [0, 0.25, 0.5, 0.75, 1] as ratio}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight * (1 - ratio)}
          x2={width - padding.right}
          y2={padding.top + chartHeight * (1 - ratio)}
          stroke="#3f3f46"
          stroke-width="0.5"
          stroke-dasharray="2,2"
        />
        <text
          x={padding.left - 5}
          y={padding.top + chartHeight * (1 - ratio) + 4}
          text-anchor="end"
          class="text-xs fill-zinc-500"
        >
          {formatPrice(minPrice + priceRange * ratio)}
        </text>
      {/each}

      <!-- Area -->
      <path d={areaD} fill="rgb(249 115 22 / 0.1)" />

      <!-- Line -->
      <path d={pathD} stroke="rgb(249 115 22)" stroke-width="2" fill="none" />

      <!-- Points -->
      {#each points as point, i}
        <!-- 큰 투명 터치 영역 (44x44px 최소 터치 영역) -->
        <circle
          cx={point.x}
          cy={point.y}
          r="16"
          fill="transparent"
          class="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          role="button"
          tabindex="0"
          aria-label="{formatDate(point.date)}: {formatPrice(point.price)}, {point.area}㎡"
          on:mouseenter={() => hoveredPoint = point}
          on:mouseleave={() => hoveredPoint = null}
          on:touchstart={(e) => {
            e.preventDefault();
            hoveredPoint = point;
          }}
          on:touchend={(e) => {
            e.preventDefault();
            setTimeout(() => hoveredPoint = null, 2000);
          }}
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              hoveredPoint = hoveredPoint === point ? null : point;
            }
          }}
        />
        <!-- 실제 보이는 작은 포인트 -->
        <circle
          cx={point.x}
          cy={point.y}
          r="4"
          fill="rgb(249 115 22)"
          class={hoveredPoint === point ? "transition-all" : ""}
          style={hoveredPoint === point ? "r: 6px;" : ""}
          pointer-events="none"
        />
      {/each}

      <!-- X-axis labels -->
      {#each points.filter((_, i) => i % Math.ceil(points.length / 5) === 0) as point}
        <text
          x={point.x}
          y={height - padding.bottom + 20}
          text-anchor="middle"
          class="text-xs fill-zinc-500"
        >
          {formatDate(point.date)}
        </text>
      {/each}
    </svg>

    <!-- Tooltip -->
    {#if hoveredPoint}
      <div
        class="absolute bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm pointer-events-none"
        style="left: {hoveredPoint.x}px; top: {hoveredPoint.y - 60}px; transform: translateX(-50%);"
      >
        <div class="text-zinc-400 text-xs">{hoveredPoint.date.toLocaleDateString('ko-KR')}</div>
        <div class="text-orange-400 font-bold">{formatPrice(hoveredPoint.price)}</div>
        <div class="text-zinc-500 text-xs">{hoveredPoint.area}㎡</div>
      </div>
    {/if}
  </div>
</div>
