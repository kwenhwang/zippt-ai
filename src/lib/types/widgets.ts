export type WidgetType = 'price_chart' | 'compare_table' | 'complex_card' | 'stats_chart' | 'rankings_table' | 'bar_chart' | 'pie_chart';

export interface PriceChartData {
  type: 'price_chart';
  complexName: string;
  data: Array<{
    date: string;
    price: number; // 만원 단위
    area: number;  // 전용면적
  }>;
}

export interface CompareTableData {
  type: 'compare_table';
  items: Array<{
    name: string;
    avgPrice: number;
    pricePerPyeong: number;
    totalUnits: number;
    buildYear: number;
  }>;
}

export interface ComplexCardData {
  type: 'complex_card';
  name: string;
  address: string;
  totalUnits: number;
  buildYear: number;
  avgPrice: number;
  recentTransaction?: {
    date: string;
    price: number;
    area: number;
  };
}

export interface StatsChartData {
  type: 'stats_chart';
  title: string;
  data: Array<{
    label: string;
    value: number;
  }>;
}

export interface RankingsTableData {
  type: 'rankings_table';
  title: string;
  metric: 'price' | 'volume' | 'growth' | 'yield';
  items: Array<{
    rank: number;
    name: string;
    value: number;
    change?: number; // 변화율 (%)
  }>;
}

export interface BarChartData {
  type: 'bar_chart';
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  unit?: string; // '억', '%', '건' 등
}

export interface PieChartData {
  type: 'pie_chart';
  title: string;
  data: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
}

export type WidgetData = PriceChartData | CompareTableData | ComplexCardData | StatsChartData | RankingsTableData | BarChartData | PieChartData;
