#!/bin/bash

echo "=== 집피티 새 위젯 구현 검증 ==="
echo ""

# 파일 존재 확인
echo "📁 파일 존재 확인:"
files=(
  "src/lib/types/widgets.ts"
  "src/lib/components/widgets/RankingsTable.svelte"
  "src/lib/components/widgets/BarChart.svelte"
  "src/lib/components/widgets/PieChart.svelte"
  "src/lib/components/widgets/WidgetRenderer.svelte"
  "src/lib/components/widgets/index.ts"
  "src/routes/api/chat/+server.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file")
    echo "  ✅ $file ($size bytes)"
  else
    echo "  ❌ $file (missing)"
  fi
done

echo ""
echo "📊 타입 정의 확인:"
grep -c "RankingsTableData" src/lib/types/widgets.ts > /dev/null && echo "  ✅ RankingsTableData"
grep -c "BarChartData" src/lib/types/widgets.ts > /dev/null && echo "  ✅ BarChartData"
grep -c "PieChartData" src/lib/types/widgets.ts > /dev/null && echo "  ✅ PieChartData"

echo ""
echo "🎨 컴포넌트 import 확인:"
grep -c "RankingsTable" src/lib/components/widgets/WidgetRenderer.svelte > /dev/null && echo "  ✅ RankingsTable import"
grep -c "BarChart" src/lib/components/widgets/WidgetRenderer.svelte > /dev/null && echo "  ✅ BarChart import"
grep -c "PieChart" src/lib/components/widgets/WidgetRenderer.svelte > /dev/null && echo "  ✅ PieChart import"

echo ""
echo "🔧 WidgetRenderer 렌더링 확인:"
grep -c "rankings_table" src/lib/components/widgets/WidgetRenderer.svelte > /dev/null && echo "  ✅ rankings_table case"
grep -c "bar_chart" src/lib/components/widgets/WidgetRenderer.svelte > /dev/null && echo "  ✅ bar_chart case"
grep -c "pie_chart" src/lib/components/widgets/WidgetRenderer.svelte > /dev/null && echo "  ✅ pie_chart case"

echo ""
echo "🤖 API 프롬프트 확인:"
grep -c "rankings_table" src/routes/api/chat/+server.ts > /dev/null && echo "  ✅ rankings_table 예시"
grep -c "bar_chart" src/routes/api/chat/+server.ts > /dev/null && echo "  ✅ bar_chart 예시"
grep -c "pie_chart" src/routes/api/chat/+server.ts > /dev/null && echo "  ✅ pie_chart 예시"

echo ""
echo "✨ 검증 완료!"
