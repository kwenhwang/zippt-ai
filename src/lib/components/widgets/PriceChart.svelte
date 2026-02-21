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

<div class="glass-card rounded-2xl p-5 border border-[var(--border-light)]">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
      {data.complexName} 가격 추이
    </h3>
    <span class="text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-full">최근 1년</span>
  </div>
  
  <div class="relative">
    <svg viewBox="0 0 {width} {height}" class="w-full h-48 overflow-visible">
      <defs>
        <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.2" />
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      {#each [0, 0.25, 0.5, 0.75, 1] as ratio}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight * (1 - ratio)}
          x2={width - padding.right}
          y2={padding.top + chartHeight * (1 - ratio)}
          stroke="var(--border-medium)"
          stroke-width="0.5"
          stroke-dasharray="4,4"
          opacity="0.5"
        />
        <text
          x={padding.left - 8}
          y={padding.top + chartHeight * (1 - ratio) + 4}
          text-anchor="end"
          class="text-[10px] font-medium fill-[var(--text-tertiary)]"
        >
          {formatPrice(minPrice + priceRange * ratio)}
        </text>
      {/each}

      <!-- Area -->
      <path d={areaD} fill="url(#area-gradient)" />

      <!-- Line -->
      <path d={pathD} stroke="var(--accent-primary)" stroke-width="2.5" fill="none" class="drop-shadow-sm" />

      <!-- Points -->
      {#each points as point, i}
        <!-- Touch Target -->
        <circle
          cx={point.x}
          cy={point.y}
          r="16"
          fill="transparent"
          class="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2"
          role="button"
          tabindex="0"
          aria-label="{formatDate(point.date)} {formatPrice(point.price)}"
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              hoveredPoint = point;
            }
          }}
          on:mouseenter={() => hoveredPoint = point}
          on:mouseleave={() => hoveredPoint = null}
          on:touchstart={(e) => { e.preventDefault(); hoveredPoint = point; }}
          on:touchend={(e) => { e.preventDefault(); setTimeout(() => hoveredPoint = null, 2000); }}
        />
        <!-- Visual Point -->
        <circle
          cx={point.x}
          cy={point.y}
          r={hoveredPoint === point ? 6 : 0}
          fill="var(--bg-card)"
          stroke="var(--accent-primary)"
          stroke-width="3"
          pointer-events="none"
          class="transition-all duration-200"
        />
      {/each}

      <!-- X-axis labels -->
      {#each points.filter((_, i) => i % Math.ceil(points.length / 4) === 0) as point}
        <text
          x={point.x}
          y={height - padding.bottom + 24}
          text-anchor="middle"
          class="text-[10px] fill-[var(--text-tertiary)] font-medium"
        >
          {formatDate(point.date)}
        </text>
      {/each}
    </svg>

    <!-- Tooltip -->
    {#if hoveredPoint}
      <div
        class="absolute bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl px-3 py-2 shadow-xl z-10 min-w-[120px]"
        style="left: {hoveredPoint.x}px; top: -10px; transform: translate(-50%, -100%);"
      >
        <div class="text-[var(--text-secondary)] text-xs font-medium mb-0.5">{hoveredPoint.date.toLocaleDateString('ko-KR')}</div>
        <div class="text-[var(--text-primary)] font-bold text-lg leading-tight flex items-baseline gap-1">
          {formatPrice(hoveredPoint.price)}
          <span class="text-[10px] text-[var(--accent-primary)] font-medium bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded-full">실거래</span>
        </div>
        <div class="text-[var(--text-tertiary)] text-xs mt-1">{hoveredPoint.area}㎡</div>
        <div class="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[var(--bg-card)] border-r border-b border-[var(--border-light)] rotate-45"></div>
      </div>
    {/if}
  </div>
</div>
