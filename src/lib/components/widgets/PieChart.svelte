<script lang="ts">
  import type { PieChartData } from '$lib/types/widgets';

  export let data: PieChartData;

  const colors = [
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#3b82f6', // blue-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
  ];

  // SVG 도넛 차트 계산
  $: total = data.data.reduce((sum, d) => sum + d.value, 0);
  $: segments = calculateSegments(data.data);

  function calculateSegments(items: typeof data.data) {
    let currentAngle = 0;
    return items.map((item, i) => {
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...item,
        startAngle,
        endAngle: currentAngle,
        color: colors[i % colors.length]
      };
    });
  }

  function describeArc(startAngle: number, endAngle: number, radius: number): string {
    const start = polarToCartesian(50, 50, radius, endAngle);
    const end = polarToCartesian(50, 50, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
</script>

<div class="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
  <h3 class="text-sm font-medium text-zinc-300 mb-3">🥧 {data.title}</h3>

  <div class="flex items-center gap-4">
    <!-- 도넛 차트 -->
    <svg viewBox="0 0 100 100" class="w-32 h-32">
      {#each segments as seg}
        <path
          d={describeArc(seg.startAngle, seg.endAngle, 35)}
          fill="none"
          stroke={seg.color}
          stroke-width="20"
        />
      {/each}
    </svg>

    <!-- 범례 -->
    <div class="flex-1 space-y-1">
      {#each segments as seg}
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" style="background-color: {seg.color}"></div>
            <span class="text-zinc-400">{seg.label}</span>
          </div>
          <span class="text-zinc-200">{seg.percentage.toFixed(0)}%</span>
        </div>
      {/each}
    </div>
  </div>
</div>
