import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { OPENAI_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

const REALTY_API_URL = env.REALTY_API_URL || '';

// RealtyAPI 도구 정의
const realtyTools = {
  getTransactions: tool({
    description: '아파트 실거래가 내역을 조회합니다. 단지명, 지역명으로 검색 가능합니다.',
    parameters: z.object({
      complexName: z.string().optional().describe('아파트 단지명'),
      region: z.string().optional().describe('지역명 (예: 강남구, 서초구)'),
      limit: z.number().default(10).describe('조회 건수'),
    }),
    execute: async ({ complexName, region, limit }: { complexName?: string; region?: string; limit: number }) => {
      try {
        const params = new URLSearchParams();
        if (complexName) params.append('complex_name', complexName);
        if (region) params.append('region', region);
        params.append('limit', String(limit));

        const res = await fetch(`${REALTY_API_URL}/api/transactions?${params}`);
        if (!res.ok) throw new Error('API 호출 실패');
        return await res.json();
      } catch (error) {
        return { error: '실거래가 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      }
    },
  }),

  getComplexInfo: tool({
    description: '아파트 단지 정보를 조회합니다.',
    parameters: z.object({
      complexName: z.string().describe('아파트 단지명'),
    }),
    execute: async ({ complexName }: { complexName: string }) => {
      try {
        const res = await fetch(`${REALTY_API_URL}/api/complexes?name=${encodeURIComponent(complexName)}`);
        if (!res.ok) throw new Error('API 호출 실패');
        return await res.json();
      } catch (error) {
        return { error: '단지 정보 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      }
    },
  }),

  getStatsSummary: tool({
    description: '지역별 부동산 통계 요약을 조회합니다.',
    parameters: z.object({
      region: z.string().describe('지역명'),
    }),
    execute: async ({ region }: { region: string }) => {
      try {
        const res = await fetch(`${REALTY_API_URL}/api/stats/summary?region=${encodeURIComponent(region)}`);
        if (!res.ok) throw new Error('API 호출 실패');
        return await res.json();
      } catch (error) {
        return { error: '통계 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' };
      }
    },
  }),
};

export async function POST({ request }) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `당신은 '집피티'라는 이름의 부동산 전문 AI 어시스턴트입니다.
한국 부동산 시장, 특히 아파트 실거래가, 시세, 단지 정보에 대해 전문적으로 답변합니다.
항상 친절하고 정확하게 답변하며, 필요한 경우 도구를 사용해 실시간 데이터를 조회합니다.
금액은 억 단위로 표시하고, 날짜는 한국어 형식으로 표시합니다.

## 응답 형식
일반 텍스트 응답과 함께, 데이터 시각화가 필요한 경우 다음 JSON 블록을 응답 끝에 추가하세요:

\`\`\`widget
{
  "type": "price_chart" | "compare_table" | "complex_card" | "rankings_table" | "bar_chart" | "pie_chart",
  "data": { ... }
}
\`\`\`

## 위젯 사용 케이스
- 가격/시세 질문 → price_chart (시간에 따른 가격 변화를 보여줄 때)
- 비교 질문 → compare_table (여러 단지를 비교할 때)
- 단지 정보 질문 → complex_card (특정 단지의 상세 정보를 보여줄 때)
- 순위/랭킹 질문 → rankings_table (TOP N 형식으로 보여줄 때)
- 지역별/카테고리별 수치 비교 → bar_chart (막대 그래프로 비교할 때)
- 비율/구성 질문 → pie_chart (전체 중 부분의 비율을 보여줄 때)

## 위젯 데이터 예시

**price_chart**: 시간에 따른 가격 변화
\`\`\`widget
{
  "type": "price_chart",
  "complexName": "래미안 퍼스티지",
  "data": [
    {"date": "2024-01", "price": 245000, "area": 84},
    {"date": "2024-06", "price": 252000, "area": 84}
  ]
}
\`\`\`

**compare_table**: 여러 단지 비교
\`\`\`widget
{
  "type": "compare_table",
  "items": [
    {"name": "래미안 퍼스티지", "avgPrice": 245000, "pricePerPyeong": 8500, "totalUnits": 1200, "buildYear": 2015},
    {"name": "헬리오시티", "avgPrice": 189000, "pricePerPyeong": 7200, "totalUnits": 9510, "buildYear": 2020}
  ]
}
\`\`\`

**complex_card**: 단지 상세 정보
\`\`\`widget
{
  "type": "complex_card",
  "name": "래미안 퍼스티지",
  "address": "서울시 강남구 개포동",
  "totalUnits": 1234,
  "buildYear": 2018,
  "avgPrice": 245000,
  "recentTransaction": {
    "date": "2024-06-15",
    "price": 252000,
    "area": 84
  }
}
\`\`\`

**rankings_table**: 순위 테이블
\`\`\`widget
{
  "type": "rankings_table",
  "title": "강남구 비싼 아파트 TOP 5",
  "metric": "price",
  "items": [
    {"rank": 1, "name": "래미안 퍼스티지", "value": 350000, "change": 5.2},
    {"rank": 2, "name": "타워팰리스", "value": 320000, "change": 3.1}
  ]
}
\`\`\`

**bar_chart**: 막대 그래프
\`\`\`widget
{
  "type": "bar_chart",
  "title": "지역별 상승률",
  "unit": "%",
  "data": [
    {"label": "강남구", "value": 8.5},
    {"label": "서초구", "value": 6.2},
    {"label": "송파구", "value": 4.8}
  ]
}
\`\`\`

**pie_chart**: 원형 그래프
\`\`\`widget
{
  "type": "pie_chart",
  "title": "평형별 거래 비율",
  "data": [
    {"label": "소형(~59㎡)", "value": 120, "percentage": 30},
    {"label": "중형(60~84㎡)", "value": 200, "percentage": 50},
    {"label": "대형(85㎡~)", "value": 80, "percentage": 20}
  ]
}
\`\`\`

중요: 위젯은 실제 데이터가 있을 때만 사용하세요. 가상의 데이터로 위젯을 생성하지 마세요.`,
    messages,
    // TODO: Re-enable tools after fixing type errors
    // tools: realtyTools,
    // maxSteps: 5,
  });

  return result.toTextStreamResponse();
}
