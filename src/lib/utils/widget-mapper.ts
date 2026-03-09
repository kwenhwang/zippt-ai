/**
 * api-catalog 위젯 타입을 zippt-ai 위젯 타입으로 매핑
 * ADR-004 기반 구현
 */

import type {
  WidgetData,
  PriceChartData,
  CompareTableData,
  RankingsTableData,
  BarChartData
} from '$lib/types/widgets';

// api-catalog에서 오는 차트 데이터 타입
export interface ApiCatalogChartData {
  type: 'price_trend' | 'region_compare' | 'rankings' | 'area_distribution';
  title: string;
  data: any[];
}

// 타입 매핑 테이블
const TYPE_MAP: Record<string, WidgetData['type']> = {
  'price_trend': 'price_chart',
  'region_compare': 'compare_table',
  'rankings': 'rankings_table',
  'area_distribution': 'bar_chart'
};

/**
 * api-catalog 위젯을 zippt-ai 위젯으로 변환
 */
export function mapApiCatalogWidget(apiWidget: ApiCatalogChartData): WidgetData | null {
  const mappedType = TYPE_MAP[apiWidget.type];
  if (!mappedType) {
    console.warn(`Unknown widget type: ${apiWidget.type}`);
    return null;
  }

  switch (apiWidget.type) {
    case 'price_trend':
      return mapPriceTrend(apiWidget);
    case 'region_compare':
      return mapRegionCompare(apiWidget);
    case 'rankings':
      return mapRankings(apiWidget);
    case 'area_distribution':
      return mapAreaDistribution(apiWidget);
    default:
      return null;
  }
}

function mapPriceTrend(apiWidget: ApiCatalogChartData): PriceChartData {
  return {
    type: 'price_chart',
    complexName: apiWidget.title || '가격 추이',
    data: apiWidget.data.map(d => ({
      date: d.date || d.month || '',
      price: d.price || d.avgPrice || 0,
      area: d.area || 84
    }))
  };
}

function mapRegionCompare(apiWidget: ApiCatalogChartData): CompareTableData {
  return {
    type: 'compare_table',
    items: apiWidget.data.map(d => ({
      name: d.region || d.name || '',
      avgPrice: d.avgPrice || d.price || 0,
      pricePerPyeong: d.pricePerPyeong || Math.round((d.avgPrice || 0) / 30),
      totalUnits: d.count || d.totalUnits || 0,
      buildYear: d.buildYear || 2020
    }))
  };
}

function mapRankings(apiWidget: ApiCatalogChartData): RankingsTableData {
  return {
    type: 'rankings_table',
    title: apiWidget.title || '순위',
    metric: 'price',
    items: apiWidget.data.map((d, i) => ({
      rank: d.rank || i + 1,
      name: d.region || d.name || '',
      value: d.avgPrice || d.value || 0,
      change: d.change || d.changeRate || undefined
    }))
  };
}

function mapAreaDistribution(apiWidget: ApiCatalogChartData): BarChartData {
  return {
    type: 'bar_chart',
    title: apiWidget.title || '면적별 분포',
    unit: '건',
    data: apiWidget.data.map(d => ({
      label: d.area || d.label || '',
      value: d.count || d.value || 0
    }))
  };
}

/**
 * SSE 이벤트에서 위젯 데이터 추출
 */
export function parseWidgetFromSSE(eventData: any): WidgetData | null {
  // chart_data 상태인 경우
  if (eventData.status === 'chart_data' && eventData.chartData) {
    return mapApiCatalogWidget(eventData.chartData);
  }

  // 직접 차트 데이터인 경우
  if (eventData.type && TYPE_MAP[eventData.type]) {
    return mapApiCatalogWidget(eventData as ApiCatalogChartData);
  }

  return null;
}

/**
 * tool-output-available 결과에서 위젯 데이터 파싱
 */
export function parseWidgetFromToolResult(toolResult: unknown): WidgetData | null {
  try {
    const result = typeof toolResult === 'string' ? JSON.parse(toolResult) : toolResult;
    if (!result || typeof result !== 'object') return null;
    const r = result as Record<string, unknown>;

    // 직접 widget 키가 있는 경우 (백엔드가 widget 블록을 명시적으로 내려주는 경우)
    const widget = r['widget'] as Record<string, unknown> | undefined;
    if (widget && typeof widget.type === 'string' && TYPE_MAP[widget.type]) {
      return mapApiCatalogWidget(widget as unknown as ApiCatalogChartData);
    }

    // result.data 가 rankings 배열인 경우 (지역별 시세 순위)
    const data = r['data'] as Record<string, unknown> | undefined;
    if (data && Array.isArray(data['rankings'])) {
      const rankings = data['rankings'] as Record<string, unknown>[];
      return {
        type: 'rankings_table',
        title: (data['title'] as string | undefined) || '지역별 시세 순위',
        metric: 'price',
        items: rankings.slice(0, 10).map((item, i) => ({
          rank: typeof item['rank'] === 'number' ? item['rank'] : i + 1,
          name: String(
            (item['region_name'] as string | undefined)?.replace('서울특별시 ', '') ||
            item['name'] ||
            ''
          ),
          value: typeof item['avg_price'] === 'number' ? item['avg_price'] : 0,
          change: typeof item['change_rate'] === 'number' ? item['change_rate'] : undefined
        }))
      } satisfies RankingsTableData;
    }

    // result.data 가 by_area 배열인 경우 (평형별 시세)
    if (data && Array.isArray(data['by_area'])) {
      const byArea = (data['by_area'] as Record<string, unknown>[]).filter(
        (a) => a['avg_price'] !== undefined && a['avg_price'] !== null
      );
      const district = data['district'] as string | undefined;
      return {
        type: 'compare_table',
        items: byArea.map((a) => ({
          name: String(a['label'] || a['area_range'] || ''),
          avgPrice: typeof a['avg_price'] === 'number' ? a['avg_price'] : 0,
          pricePerPyeong: typeof a['avg_price_per_py'] === 'number' ? a['avg_price_per_py'] : 0,
          totalUnits: typeof a['transaction_count'] === 'number' ? a['transaction_count'] : 0,
          buildYear: 0
        })),
        // CompareTableData 에는 title 필드가 없으므로 items 에 포함
        ...(district ? {} : {})
      } satisfies CompareTableData;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 메시지 내용에서 위젯 JSON 블록 추출 (기존 방식 호환)
 */
export function parseWidgetFromContent(content: string): { text: string; widget: WidgetData | null } {
  const widgetMatch = content.match(/```widget\n([\s\S]*?)\n```/);

  if (widgetMatch) {
    try {
      const widgetData = JSON.parse(widgetMatch[1]);
      const text = content.replace(/```widget\n[\s\S]*?\n```/, '').trim();

      // api-catalog 타입이면 매핑
      if (widgetData.type && TYPE_MAP[widgetData.type]) {
        return { text, widget: mapApiCatalogWidget(widgetData) };
      }

      // 이미 zippt-ai 타입이면 그대로 반환
      return { text, widget: widgetData as WidgetData };
    } catch (e) {
      console.error('Failed to parse widget:', e);
      return { text: content, widget: null };
    }
  }

  return { text: content, widget: null };
}
