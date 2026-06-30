/**
 * 지역별 SEO 페이지 데이터
 * 서울 25개구 + 경기도 주요 도시
 */

export interface RegionData {
  slug: string;         // 기존 한글 slug (하위호환용)
  slugEn: string;       // 새 영문 slug
  name: string;         // 지역명(표시용)
  type: '구' | '시';
  description: string;  // SEO 메타 설명
  questions: string[];  // 대표 질문 3개
  keywords: string[];   // SEO 키워드
  context?: string;     // 지역별 전문가 맥락
  district?: string;    // 백엔드 조회용 풀네임(예: '부산광역시 남구'). 이름 충돌 방지용. 없으면 name 사용.
}

// 백엔드 조회(complexes/price-by-area/rankings)에 쓸 지역 문자열 — 충돌 방지용 풀네임 우선.
export function regionQuery(r: Pick<RegionData, 'name' | 'district'>): string {
  return r.district ?? r.name;
}

// 미분양 조회용 (시도 short, 시군구) 해석.
// 미분양 데이터: region_name=시도 short(서울/경기/부산…), sub_region=시군구(강남구/수원시…).
const _SIDO_LONG_TO_SHORT: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천',
  '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종',
  '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원', '충청북도': '충북', '충청남도': '충남',
  '전라북도': '전북', '전북특별자치도': '전북', '전라남도': '전남', '경상북도': '경북',
  '경상남도': '경남', '제주특별자치도': '제주'
};
// district 없는 bare-name 경기 시 (나머지 bare-name은 서울 구로 간주)
const _GYEONGGI_CITIES = new Set(['분당구', '수원시', '성남시', '용인시', '고양시', '안산시', '안양시',
  '남양주시', '평택시', '김포시', '광명시', '의정부시', '군포시', '하남시', '과천시']);
// 미분양은 시 단위라 자치구를 모시(母市)로 치환
const _SIGUNGU_OVERRIDE: Record<string, string> = { '분당구': '성남시' };

export function regionUnsold(r: Pick<RegionData, 'name' | 'district'>): { sido: string; sigungu: string } | null {
  if (r.district) {
    const parts = r.district.split(' ');
    const sido = _SIDO_LONG_TO_SHORT[parts[0]] ?? parts[0];
    const sigungu = parts.slice(1).join(' ');
    if (!sigungu) return null;
    return { sido, sigungu: _SIGUNGU_OVERRIDE[sigungu] ?? sigungu };
  }
  const name = r.name;
  if (_GYEONGGI_CITIES.has(name)) return { sido: '경기', sigungu: _SIGUNGU_OVERRIDE[name] ?? name };
  if (name.endsWith('구')) return { sido: '서울', sigungu: _SIGUNGU_OVERRIDE[name] ?? name };
  return null;
}

export const REGIONS: RegionData[] = [
  // 서울 강남권
  {
    slug: '강남구', slugEn: 'gangnam', name: '강남구', type: '구',
    description: '강남구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['강남구 아파트 평균 매매가가 얼마인가요?', '강남구 전세가율이 어떻게 되나요?', '강남구에서 투자하기 좋은 단지를 추천해줘'],
    keywords: ['강남구 아파트 시세', '강남구 실거래가', '강남구 부동산'],
    context: '서울 최고 학군(대치동), 재건축 이슈(개포동), 직주근접(역삼·선릉) 세 축의 수요가 공존하는 지역. 목적에 따라 입지 선택이 달라집니다.'
  },
  {
    slug: '서초구', slugEn: 'seocho', name: '서초구', type: '구',
    description: '서초구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['서초구 아파트 평균 가격이 얼마인가요?', '서초구 래미안 아파트 시세 알려줘', '서초구 전세 구하기 좋은 단지는?'],
    keywords: ['서초구 아파트 시세', '서초구 실거래가', '서초구 부동산'],
    context: '반포·잠원의 한강변 고급 단지와 서초동 법조타운 수요가 견인. 강남구 대비 용산·동작 접근성이 좋아 도심 직주근접 선호층에 인기.'
  },
  {
    slug: '송파구', slugEn: 'songpa', name: '송파구', type: '구',
    description: '송파구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['잠실 아파트 평균 시세가 얼마인가요?', '송파구 헬리오시티 최근 거래가 알려줘', '송파구 전세가 얼마인가요?'],
    keywords: ['송파구 아파트 시세', '잠실 아파트 시세', '송파구 부동산'],
    context: '헬리오시티·잠실 대단지 중심의 실수요 강세 지역. 9호선·2호선·8호선 트리플 역세권으로 교통 프리미엄이 높음.'
  },
  // 서울 마용성
  {
    slug: '마포구', slugEn: 'mapo', name: '마포구', type: '구',
    description: '마포구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['마포구 아파트 평균 가격이 얼마인가요?', '마포구 공덕 아파트 시세 알려줘', '마포구 아파트 투자 전망은?'],
    keywords: ['마포구 아파트 시세', '마포구 실거래가', '공덕 아파트 시세'],
    context: '홍대·합정의 젊은 수요와 공덕·마포의 직장인 수요 공존. 강남 대비 합리적 가격에 교통 접근성이 우수해 30~40대 첫 주택 구매자에게 인기.'
  },
  {
    slug: '용산구', slugEn: 'yongsan', name: '용산구', type: '구',
    description: '용산구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['용산구 아파트 평균 매매가는?', '용산구 한강 조망 아파트 시세', '이촌동 아파트 최근 거래가 알려줘'],
    keywords: ['용산구 아파트 시세', '이촌동 아파트', '용산 부동산'],
    context: '이촌동 한강변 고급 주거와 용산개발 기대감이 시세를 지지. 한남동은 재개발 이슈, 이촌동은 안정적 실수요.'
  },
  {
    slug: '성동구', slugEn: 'seongdong', name: '성동구', type: '구',
    description: '성동구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['성동구 아파트 평균 가격은?', '왕십리 아파트 시세 알려줘', '성동구 전세 시세는?'],
    keywords: ['성동구 아파트 시세', '왕십리 아파트', '성동구 부동산'],
    context: '성수동 카페거리·IT기업 유입으로 2030 수요 급증. 뚝섬·왕십리역 역세권 단지 위주로 거래량과 시세 모두 상승 추세.'
  },
  // 서울 기타
  {
    slug: '영등포구', slugEn: 'yeongdeungpo', name: '영등포구', type: '구',
    description: '영등포구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['영등포구 아파트 평균 가격은?', '여의도 아파트 시세 알려줘', '영등포구 투자 추천 단지는?'],
    keywords: ['영등포구 아파트 시세', '여의도 아파트', '영등포 부동산'],
    context: '여의도 금융타운 수요와 문래·당산의 실수요 공존. 여의도 아파트지구 재건축 진행에 따라 중장기 가격 상승 기대.'
  },
  {
    slug: '노원구', slugEn: 'nowon', name: '노원구', type: '구',
    description: '노원구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['노원구 아파트 평균 가격은?', '노원구 저렴한 아파트 추천해줘', '상계동 아파트 시세는?'],
    keywords: ['노원구 아파트 시세', '상계동 아파트', '노원 부동산'],
    context: '서울 대표 실수요 지역. 중계동 학원가 수요와 상대적으로 합리적인 가격대로 첫 주택 구매자에게 진입장벽이 낮은 편.'
  },
  {
    slug: '강동구', slugEn: 'gangdong', name: '강동구', type: '구',
    description: '강동구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['강동구 아파트 평균 가격은?', '둔촌주공 재건축 시세 알려줘', '강동구 투자 전망은?'],
    keywords: ['강동구 아파트 시세', '둔촌주공', '강동 부동산'],
    context: '둔촌주공(올림픽파크포레온) 입주 완료로 신규 공급 이슈 일단락. 9호선 연장·강일지구 개발로 동서 간 가격 격차 점차 해소 중.'
  },
  {
    slug: '강서구', slugEn: 'gangseo', name: '강서구', type: '구',
    description: '강서구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['강서구 아파트 평균 가격은?', '마곡지구 아파트 시세', '강서구 전세 시세는?'],
    keywords: ['강서구 아파트 시세', '마곡 아파트', '강서 부동산']
  },
  // 서울 기타 (추가)
  {
    slug: '강북구', slugEn: 'gangbuk', name: '강북구', type: '구',
    description: '강북구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['강북구 아파트 평균 매매가가 얼마인가요?', '미아동 아파트 시세는 어떻게 되나요?', '수유역 근처 투자하기 좋은 단지 추천해줘'],
    keywords: ['강북구 아파트 시세', '강북구 실거래가', '강북구 부동산']
  },
  {
    slug: '관악구', slugEn: 'gwanak', name: '관악구', type: '구',
    description: '관악구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['관악구 아파트 평균 매매가가 얼마인가요?', '신림동 아파트 전세 시세는 어떻게 되나요?', '봉천동 투자하기 좋은 단지 추천해줘'],
    keywords: ['관악구 아파트 시세', '관악구 실거래가', '관악구 부동산']
  },
  {
    slug: '광진구', slugEn: 'gwangjin', name: '광진구', type: '구',
    description: '광진구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['광진구 아파트 평균 매매가가 얼마인가요?', '건대 근처 아파트 전세 시세는 어떻게 되나요?', '구의동 투자하기 좋은 단지 추천해줘'],
    keywords: ['광진구 아파트 시세', '광진구 실거래가', '광진구 부동산']
  },
  {
    slug: '구로구', slugEn: 'guro', name: '구로구', type: '구',
    description: '구로구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['구로구 아파트 평균 매매가가 얼마인가요?', '구로디지털단지 아파트 전세 시세는 어떻게 되나요?', '신도림 투자하기 좋은 단지 추천해줘'],
    keywords: ['구로구 아파트 시세', '구로구 실거래가', '구로구 부동산']
  },
  {
    slug: '금천구', slugEn: 'geumcheon', name: '금천구', type: '구',
    description: '금천구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['금천구 아파트 평균 매매가가 얼마인가요?', '가산디지털단지 아파트 전세 시세는 어떻게 되나요?', '시흥동 투자하기 좋은 단지 추천해줘'],
    keywords: ['금천구 아파트 시세', '금천구 실거래가', '금천구 부동산']
  },
  {
    slug: '도봉구', slugEn: 'dobong', name: '도봉구', type: '구',
    description: '도봉구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['도봉구 아파트 평균 매매가가 얼마인가요?', '도봉구 전세 시세는 어떻게 되나요?', '쌍문동 방학동 투자하기 좋은 단지 추천해줘'],
    keywords: ['도봉구 아파트 시세', '도봉구 실거래가', '도봉구 부동산']
  },
  {
    slug: '동대문구', slugEn: 'dongdaemun', name: '동대문구', type: '구',
    description: '동대문구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['동대문구 아파트 평균 매매가가 얼마인가요?', '동대문구 전세 시세는 어떻게 되나요?', '장안동 답십리 투자하기 좋은 단지 추천해줘'],
    keywords: ['동대문구 아파트 시세', '동대문구 실거래가', '동대문구 부동산']
  },
  {
    slug: '동작구', slugEn: 'dongjak', name: '동작구', type: '구',
    description: '동작구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['동작구 아파트 평균 매매가가 얼마인가요?', '동작구 전세 시세는 어떻게 되나요?', '흑석동 사당동 투자하기 좋은 단지 추천해줘'],
    keywords: ['동작구 아파트 시세', '동작구 실거래가', '동작구 부동산']
  },
  {
    slug: '서대문구', slugEn: 'seodaemun', name: '서대문구', type: '구',
    description: '서대문구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['서대문구 아파트 평균 매매가가 얼마인가요?', '서대문구 전세 시세는 어떻게 되나요?', '홍제동 신촌 투자하기 좋은 단지 추천해줘'],
    keywords: ['서대문구 아파트 시세', '서대문구 실거래가', '서대문구 부동산']
  },
  {
    slug: '성북구', slugEn: 'seongbuk', name: '성북구', type: '구',
    description: '성북구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['성북구 아파트 평균 매매가가 얼마인가요?', '성북구 전세 시세는 어떻게 되나요?', '길음동 정릉 투자하기 좋은 단지 추천해줘'],
    keywords: ['성북구 아파트 시세', '성북구 실거래가', '성북구 부동산']
  },
  {
    slug: '양천구', slugEn: 'yangcheon', name: '양천구', type: '구',
    description: '양천구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['양천구 아파트 평균 매매가가 얼마인가요?', '양천구 전세 시세는 어떻게 되나요?', '목동 신정동 투자하기 좋은 단지 추천해줘'],
    keywords: ['양천구 아파트 시세', '양천구 실거래가', '양천구 부동산'],
    context: '목동 학원가 중심의 강한 학군 수요. 목동신시가지 아파트 재건축 추진 여부가 최대 관심사로, 진행 속도에 따라 시세 변동성 존재.'
  },
  {
    slug: '은평구', slugEn: 'eunpyeong', name: '은평구', type: '구',
    description: '은평구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['은평구 아파트 평균 매매가가 얼마인가요?', '은평구 전세 시세는 어떻게 되나요?', '불광동 진관동 투자하기 좋은 단지 추천해줘'],
    keywords: ['은평구 아파트 시세', '은평구 실거래가', '은평구 부동산']
  },
  {
    slug: '종로구', slugEn: 'jongno', name: '종로구', type: '구',
    description: '종로구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['종로구 아파트 평균 매매가가 얼마인가요?', '종로구 전세 시세는 어떻게 되나요?', '평창동 부암동 투자하기 좋은 단지 추천해줘'],
    keywords: ['종로구 아파트 시세', '종로구 실거래가', '종로구 부동산']
  },
  {
    slug: '중구', slugEn: 'jung', name: '중구', type: '구',
    description: '중구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['중구 아파트 평균 매매가가 얼마인가요?', '중구 전세 시세는 어떻게 되나요?', '황학동 신당동 투자하기 좋은 단지 추천해줘'],
    keywords: ['중구 아파트 시세', '중구 실거래가', '중구 부동산']
  },
  {
    slug: '중랑구', slugEn: 'jungnang', name: '중랑구', type: '구',
    description: '중랑구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요. 10.7M 실거래 데이터 기반 즉시 답변.',
    questions: ['중랑구 아파트 평균 매매가가 얼마인가요?', '중랑구 전세 시세는 어떻게 되나요?', '묵동 신내동 투자하기 좋은 단지 추천해줘'],
    keywords: ['중랑구 아파트 시세', '중랑구 실거래가', '중랑구 부동산']
  },
  // 경기도
  {
    slug: '분당구', slugEn: 'bundang', name: '분당구', type: '구',
    description: '분당구 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['분당 아파트 평균 가격은?', '판교 아파트 시세 알려줘', '분당 전세 시세는?'],
    keywords: ['분당 아파트 시세', '판교 아파트', '분당 부동산']
  },
  {
    slug: '수원시', slugEn: 'suwon', name: '수원시', type: '시',
    description: '수원시 아파트 실거래가, 시세, 투자 정보를 AI에게 물어보세요.',
    questions: ['수원시 아파트 평균 가격은?', '광교 아파트 시세 알려줘', '수원시 투자 추천 지역은?'],
    keywords: ['수원 아파트 시세', '광교 아파트', '수원 부동산']
  },
  // ── 경기 주요 시 (2026-06-30 추가) ──
  {
    slug: '성남시', slugEn: 'seongnam', name: '성남시', type: '시',
    description: '성남시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['성남시 아파트 평균 시세가 얼마인가요?', '성남시 평형별 가격이 어떻게 되나요?', '성남시 아파트 투자 전망은?'],
    keywords: ['성남시 아파트 시세', '성남시 실거래가', '성남시 부동산']
  },
  {
    slug: '용인시', slugEn: 'yongin', name: '용인시', type: '시',
    description: '용인시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['용인시 아파트 평균 시세가 얼마인가요?', '용인시 평형별 가격이 어떻게 되나요?', '용인시 아파트 투자 전망은?'],
    keywords: ['용인시 아파트 시세', '용인시 실거래가', '용인시 부동산']
  },
  {
    slug: '고양시', slugEn: 'goyang', name: '고양시', type: '시',
    description: '고양시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['고양시 아파트 평균 시세가 얼마인가요?', '고양시 평형별 가격이 어떻게 되나요?', '고양시 아파트 투자 전망은?'],
    keywords: ['고양시 아파트 시세', '고양시 실거래가', '고양시 부동산']
  },
  {
    slug: '안산시', slugEn: 'ansan', name: '안산시', type: '시',
    description: '안산시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['안산시 아파트 평균 시세가 얼마인가요?', '안산시 평형별 가격이 어떻게 되나요?', '안산시 아파트 투자 전망은?'],
    keywords: ['안산시 아파트 시세', '안산시 실거래가', '안산시 부동산']
  },
  {
    slug: '안양시', slugEn: 'anyang', name: '안양시', type: '시',
    description: '안양시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['안양시 아파트 평균 시세가 얼마인가요?', '안양시 평형별 가격이 어떻게 되나요?', '안양시 아파트 투자 전망은?'],
    keywords: ['안양시 아파트 시세', '안양시 실거래가', '안양시 부동산']
  },
  {
    slug: '남양주시', slugEn: 'namyangju', name: '남양주시', type: '시',
    description: '남양주시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['남양주시 아파트 평균 시세가 얼마인가요?', '남양주시 평형별 가격이 어떻게 되나요?', '남양주시 아파트 투자 전망은?'],
    keywords: ['남양주시 아파트 시세', '남양주시 실거래가', '남양주시 부동산']
  },
  {
    slug: '평택시', slugEn: 'pyeongtaek', name: '평택시', type: '시',
    description: '평택시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['평택시 아파트 평균 시세가 얼마인가요?', '평택시 평형별 가격이 어떻게 되나요?', '평택시 아파트 투자 전망은?'],
    keywords: ['평택시 아파트 시세', '평택시 실거래가', '평택시 부동산']
  },
  {
    slug: '김포시', slugEn: 'gimpo', name: '김포시', type: '시',
    description: '김포시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['김포시 아파트 평균 시세가 얼마인가요?', '김포시 평형별 가격이 어떻게 되나요?', '김포시 아파트 투자 전망은?'],
    keywords: ['김포시 아파트 시세', '김포시 실거래가', '김포시 부동산']
  },
  {
    slug: '광명시', slugEn: 'gwangmyeong', name: '광명시', type: '시',
    description: '광명시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['광명시 아파트 평균 시세가 얼마인가요?', '광명시 평형별 가격이 어떻게 되나요?', '광명시 아파트 투자 전망은?'],
    keywords: ['광명시 아파트 시세', '광명시 실거래가', '광명시 부동산']
  },
  {
    slug: '의정부시', slugEn: 'uijeongbu', name: '의정부시', type: '시',
    description: '의정부시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['의정부시 아파트 평균 시세가 얼마인가요?', '의정부시 평형별 가격이 어떻게 되나요?', '의정부시 아파트 투자 전망은?'],
    keywords: ['의정부시 아파트 시세', '의정부시 실거래가', '의정부시 부동산']
  },
  {
    slug: '군포시', slugEn: 'gunpo', name: '군포시', type: '시',
    description: '군포시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['군포시 아파트 평균 시세가 얼마인가요?', '군포시 평형별 가격이 어떻게 되나요?', '군포시 아파트 투자 전망은?'],
    keywords: ['군포시 아파트 시세', '군포시 실거래가', '군포시 부동산']
  },
  {
    slug: '하남시', slugEn: 'hanam', name: '하남시', type: '시',
    description: '하남시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['하남시 아파트 평균 시세가 얼마인가요?', '하남시 평형별 가격이 어떻게 되나요?', '하남시 아파트 투자 전망은?'],
    keywords: ['하남시 아파트 시세', '하남시 실거래가', '하남시 부동산']
  },
  {
    slug: '과천시', slugEn: 'gwacheon', name: '과천시', type: '시',
    description: '과천시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['과천시 아파트 평균 시세가 얼마인가요?', '과천시 평형별 가격이 어떻게 되나요?', '과천시 아파트 투자 전망은?'],
    keywords: ['과천시 아파트 시세', '과천시 실거래가', '과천시 부동산']
  },
  {
    slug: '구리시', slugEn: 'guri', name: '구리시', type: '시',
    description: '구리시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['구리시 아파트 평균 시세가 얼마인가요?', '구리시 평형별 가격이 어떻게 되나요?', '구리시 아파트 투자 전망은?'],
    keywords: ['구리시 아파트 시세', '구리시 실거래가', '구리시 부동산']
  },
  // ── 광역시 주요 구 (충돌 이름은 district 풀네임) ──
  {
    slug: '해운대구', slugEn: 'busan-haeundae', name: '해운대구', type: '구', district: '부산광역시 해운대구',
    description: '해운대구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['해운대구 아파트 평균 시세가 얼마인가요?', '해운대구 평형별 가격이 어떻게 되나요?', '해운대구 아파트 투자 전망은?'],
    keywords: ['해운대구 아파트 시세', '해운대구 실거래가', '해운대구 부동산']
  },
  {
    slug: '수영구', slugEn: 'busan-suyeong', name: '수영구', type: '구', district: '부산광역시 수영구',
    description: '수영구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['수영구 아파트 평균 시세가 얼마인가요?', '수영구 평형별 가격이 어떻게 되나요?', '수영구 아파트 투자 전망은?'],
    keywords: ['수영구 아파트 시세', '수영구 실거래가', '수영구 부동산']
  },
  {
    slug: '부산진구', slugEn: 'busanjin', name: '부산진구', type: '구', district: '부산광역시 부산진구',
    description: '부산진구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['부산진구 아파트 평균 시세가 얼마인가요?', '부산진구 평형별 가격이 어떻게 되나요?', '부산진구 아파트 투자 전망은?'],
    keywords: ['부산진구 아파트 시세', '부산진구 실거래가', '부산진구 부동산']
  },
  {
    slug: '동래구', slugEn: 'busan-dongnae', name: '동래구', type: '구', district: '부산광역시 동래구',
    description: '동래구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['동래구 아파트 평균 시세가 얼마인가요?', '동래구 평형별 가격이 어떻게 되나요?', '동래구 아파트 투자 전망은?'],
    keywords: ['동래구 아파트 시세', '동래구 실거래가', '동래구 부동산']
  },
  {
    slug: '부산 남구', slugEn: 'busan-nam', name: '부산 남구', type: '구', district: '부산광역시 남구',
    description: '부산 남구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['부산 남구 아파트 평균 시세가 얼마인가요?', '부산 남구 평형별 가격이 어떻게 되나요?', '부산 남구 아파트 투자 전망은?'],
    keywords: ['부산 남구 아파트 시세', '부산 남구 실거래가', '부산 남구 부동산']
  },
  {
    slug: '수성구', slugEn: 'daegu-suseong', name: '수성구', type: '구', district: '대구광역시 수성구',
    description: '수성구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['수성구 아파트 평균 시세가 얼마인가요?', '수성구 평형별 가격이 어떻게 되나요?', '수성구 아파트 투자 전망은?'],
    keywords: ['수성구 아파트 시세', '수성구 실거래가', '수성구 부동산']
  },
  {
    slug: '달서구', slugEn: 'daegu-dalseo', name: '달서구', type: '구', district: '대구광역시 달서구',
    description: '달서구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['달서구 아파트 평균 시세가 얼마인가요?', '달서구 평형별 가격이 어떻게 되나요?', '달서구 아파트 투자 전망은?'],
    keywords: ['달서구 아파트 시세', '달서구 실거래가', '달서구 부동산']
  },
  {
    slug: '대구 중구', slugEn: 'daegu-jung', name: '대구 중구', type: '구', district: '대구광역시 중구',
    description: '대구 중구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['대구 중구 아파트 평균 시세가 얼마인가요?', '대구 중구 평형별 가격이 어떻게 되나요?', '대구 중구 아파트 투자 전망은?'],
    keywords: ['대구 중구 아파트 시세', '대구 중구 실거래가', '대구 중구 부동산']
  },
  {
    slug: '연수구', slugEn: 'incheon-yeonsu', name: '연수구', type: '구', district: '인천광역시 연수구',
    description: '연수구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['연수구 아파트 평균 시세가 얼마인가요?', '연수구 평형별 가격이 어떻게 되나요?', '연수구 아파트 투자 전망은?'],
    keywords: ['연수구 아파트 시세', '연수구 실거래가', '연수구 부동산']
  },
  {
    slug: '남동구', slugEn: 'incheon-namdong', name: '남동구', type: '구', district: '인천광역시 남동구',
    description: '남동구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['남동구 아파트 평균 시세가 얼마인가요?', '남동구 평형별 가격이 어떻게 되나요?', '남동구 아파트 투자 전망은?'],
    keywords: ['남동구 아파트 시세', '남동구 실거래가', '남동구 부동산']
  },
  {
    slug: '부평구', slugEn: 'incheon-bupyeong', name: '부평구', type: '구', district: '인천광역시 부평구',
    description: '부평구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['부평구 아파트 평균 시세가 얼마인가요?', '부평구 평형별 가격이 어떻게 되나요?', '부평구 아파트 투자 전망은?'],
    keywords: ['부평구 아파트 시세', '부평구 실거래가', '부평구 부동산']
  },
  {
    slug: '미추홀구', slugEn: 'incheon-michuhol', name: '미추홀구', type: '구', district: '인천광역시 미추홀구',
    description: '미추홀구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['미추홀구 아파트 평균 시세가 얼마인가요?', '미추홀구 평형별 가격이 어떻게 되나요?', '미추홀구 아파트 투자 전망은?'],
    keywords: ['미추홀구 아파트 시세', '미추홀구 실거래가', '미추홀구 부동산']
  },
  {
    slug: '인천 서구', slugEn: 'incheon-seo', name: '인천 서구', type: '구', district: '인천광역시 서구',
    description: '인천 서구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['인천 서구 아파트 평균 시세가 얼마인가요?', '인천 서구 평형별 가격이 어떻게 되나요?', '인천 서구 아파트 투자 전망은?'],
    keywords: ['인천 서구 아파트 시세', '인천 서구 실거래가', '인천 서구 부동산']
  },
  {
    slug: '유성구', slugEn: 'daejeon-yuseong', name: '유성구', type: '구', district: '대전광역시 유성구',
    description: '유성구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['유성구 아파트 평균 시세가 얼마인가요?', '유성구 평형별 가격이 어떻게 되나요?', '유성구 아파트 투자 전망은?'],
    keywords: ['유성구 아파트 시세', '유성구 실거래가', '유성구 부동산']
  },
  {
    slug: '대전 서구', slugEn: 'daejeon-seo', name: '대전 서구', type: '구', district: '대전광역시 서구',
    description: '대전 서구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['대전 서구 아파트 평균 시세가 얼마인가요?', '대전 서구 평형별 가격이 어떻게 되나요?', '대전 서구 아파트 투자 전망은?'],
    keywords: ['대전 서구 아파트 시세', '대전 서구 실거래가', '대전 서구 부동산']
  },
  {
    slug: '대전 중구', slugEn: 'daejeon-jung', name: '대전 중구', type: '구', district: '대전광역시 중구',
    description: '대전 중구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['대전 중구 아파트 평균 시세가 얼마인가요?', '대전 중구 평형별 가격이 어떻게 되나요?', '대전 중구 아파트 투자 전망은?'],
    keywords: ['대전 중구 아파트 시세', '대전 중구 실거래가', '대전 중구 부동산']
  },
  {
    slug: '광산구', slugEn: 'gwangju-gwangsan', name: '광산구', type: '구', district: '광주광역시 광산구',
    description: '광산구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['광산구 아파트 평균 시세가 얼마인가요?', '광산구 평형별 가격이 어떻게 되나요?', '광산구 아파트 투자 전망은?'],
    keywords: ['광산구 아파트 시세', '광산구 실거래가', '광산구 부동산']
  },
  {
    slug: '광주 서구', slugEn: 'gwangju-seo', name: '광주 서구', type: '구', district: '광주광역시 서구',
    description: '광주 서구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['광주 서구 아파트 평균 시세가 얼마인가요?', '광주 서구 평형별 가격이 어떻게 되나요?', '광주 서구 아파트 투자 전망은?'],
    keywords: ['광주 서구 아파트 시세', '광주 서구 실거래가', '광주 서구 부동산']
  },
  {
    slug: '광주 남구', slugEn: 'gwangju-nam', name: '광주 남구', type: '구', district: '광주광역시 남구',
    description: '광주 남구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['광주 남구 아파트 평균 시세가 얼마인가요?', '광주 남구 평형별 가격이 어떻게 되나요?', '광주 남구 아파트 투자 전망은?'],
    keywords: ['광주 남구 아파트 시세', '광주 남구 실거래가', '광주 남구 부동산']
  },
  {
    slug: '울산 남구', slugEn: 'ulsan-nam', name: '울산 남구', type: '구', district: '울산광역시 남구',
    description: '울산 남구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['울산 남구 아파트 평균 시세가 얼마인가요?', '울산 남구 평형별 가격이 어떻게 되나요?', '울산 남구 아파트 투자 전망은?'],
    keywords: ['울산 남구 아파트 시세', '울산 남구 실거래가', '울산 남구 부동산']
  },
  {
    slug: '울산 중구', slugEn: 'ulsan-jung', name: '울산 중구', type: '구', district: '울산광역시 중구',
    description: '울산 중구 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['울산 중구 아파트 평균 시세가 얼마인가요?', '울산 중구 평형별 가격이 어떻게 되나요?', '울산 중구 아파트 투자 전망은?'],
    keywords: ['울산 중구 아파트 시세', '울산 중구 실거래가', '울산 중구 부동산']
  },
  // ── 세종 (단지 데이터 제한적, 평형·시세 위주) ──
  {
    slug: '세종시', slugEn: 'sejong', name: '세종시', type: '시', district: '세종특별자치시',
    description: '세종시 아파트 실거래가·시세·평형별 가격을 AI에게 물어보세요. 국토교통부 실거래 데이터 기반 즉시 답변.',
    questions: ['세종시 아파트 평균 시세가 얼마인가요?', '세종시 평형별 가격이 어떻게 되나요?', '세종시 아파트 투자 전망은?'],
    keywords: ['세종시 아파트 시세', '세종시 실거래가', '세종시 부동산']
  },

];

export function getRegion(slug: string): RegionData | undefined {
  return REGIONS.find(r => r.slugEn === slug || r.slug === slug);
}

export function getRegionEntries() {
  return REGIONS.map(r => ({ slug: r.slugEn }));
}

/**
 * 질문 인텐트 라우팅: 일반 "지역 개요" 질문이면 해당 RegionData 반환 (→ /area/[slugEn] 템플릿으로 즉시 이동).
 * 매칭이 아니면 null (→ 기존 채팅 폴백). 오라우팅(잘못된 페이지 표시)이 느린-정답보다 나쁘므로 보수적으로 판정한다:
 *  - 비교/특정평형/긴(복잡) 질문은 채팅으로 보냄
 *  - 지역이 정확히 1개 매칭되고, 일반 개요 키워드가 있을 때만 라우팅
 */
const _COMPARE_HINTS = ['vs', 'versus', '비교', '대비', '차이', '어디가'];
const _OVERVIEW_HINTS = ['시세', '평균', '전세', '매매', '투자', '추천', '분석', '전망', '어때', '얼마', '현황', '정보', '부동산', '아파트', '가격'];

// 지역 별칭: 전체명에서 끝의 '구'/'시'를 뗀 짧은 형태(강남구→강남)도 인식. 2자 미만(중구→중)은 모호하므로 제외.
function regionAlias(r: RegionData): string | null {
  const base = r.name.replace(/(구|시)$/, '');
  return base.length >= 2 && base !== r.name ? base : null;
}

// 질문에서 지역이 등장하는 가장 이른 위치(없으면 -1) — 전체명/slug/별칭 모두 고려.
function regionPos(q: string, r: RegionData): number {
  const cands = [r.name, r.slug, regionAlias(r)].filter(Boolean) as string[];
  let best = -1;
  for (const c of cands) {
    const i = q.indexOf(c);
    if (i >= 0 && (best === -1 || i < best)) best = i;
  }
  return best;
}

export function matchRegionIntent(question: string): RegionData | null {
  const q = (question || '').trim();
  if (!q || q.length > 30) return null;                 // 길면 복잡 질문 → 채팅
  if (/\d+\s*평/.test(q)) return null;                  // 특정 평형(단지 시세 등) → 채팅
  if (_COMPARE_HINTS.some((h) => q.includes(h))) return null; // 비교 질문 → 채팅
  const matched = REGIONS.filter((r) => regionPos(q, r) >= 0);
  if (matched.length !== 1) return null;                // 0개 또는 2개+ (비교성) → 채팅
  if (!_OVERVIEW_HINTS.some((k) => q.includes(k))) return null; // 개요 키워드 없으면 → 채팅
  return matched[0];
}

/**
 * 지역비교 인텐트: 비교 신호 + 지역 정확히 2개 매칭 시 /compare/[slugA-vs-slugB] 경로 반환.
 * 등장 순서를 보존해 "강남 vs 서초" → gangnam-vs-seocho. 2개가 아니면 null(→ 단일지역/채팅 폴백).
 */
export function matchCompareIntent(question: string): string | null {
  const q = (question || '').trim();
  if (!q || q.length > 40) return null;
  if (!_COMPARE_HINTS.some((h) => q.includes(h))) return null;  // 비교 신호 없으면 비교 아님
  // 질문 내 등장 위치 순으로 정렬 (가장 먼저 나온 지역이 좌측). 전체명/별칭(강남) 모두 인식.
  const hits = REGIONS
    .map((r) => ({ r, pos: regionPos(q, r) }))
    .filter((h) => h.pos >= 0)
    .sort((a, b) => a.pos - b.pos);
  if (hits.length !== 2) return null;                   // 정확히 2개일 때만 비교
  return `${hits[0].r.slugEn}-vs-${hits[1].r.slugEn}`;
}

/**
 * 시장 타이밍 인텐트: 타이밍/심리 질문(특정 지역 개요가 아닌)을 /market으로.
 * region 라우팅 뒤에 호출하므로(지역 개요 질문은 먼저 /area), 순수 타이밍 질문만 여기로 떨어진다.
 */
const _MARKET_HINTS = [
  '타이밍', '시장 심리', '매수심리', '매도심리', '시장 분위기', '시장분위기',
  '지금 사도', '지금 팔', '지금 집 사', '사야 할', '팔아야', '상승장', '하락장',
  '매수 타이밍', '집 살 때', '시장 전망', '지금 사야', '지금이 기회'
];
export function matchMarketIntent(question: string): boolean {
  const q = (question || '').trim();
  if (!q || q.length > 40) return false;
  return _MARKET_HINTS.some((h) => q.includes(h));
}

/**
 * 평형분석 인텐트: '평형' 키워드 + 지역 정확히 1개 매칭 시 /pyeong/[slugEn] 반환.
 * "강남구 평형별 시세", "송파 평형분석" 등. 2개+ 지역이면 비교로 가도록 null.
 */
const _PYEONG_HINTS = ['평형', '평수', '평대', '평형별', '평형분석', '면적별'];
export function matchPyeongIntent(question: string): RegionData | null {
  const q = (question || '').trim();
  if (!q || q.length > 35) return null;
  if (!_PYEONG_HINTS.some((h) => q.includes(h))) return null;
  if (_COMPARE_HINTS.some((h) => q.includes(h))) return null;  // 비교는 비교 라우팅으로
  const matched = REGIONS.filter((r) => regionPos(q, r) >= 0);
  if (matched.length !== 1) return null;
  return matched[0];
}

/**
 * 단지 인텐트: 단지 브랜드/접미사 신호가 있으면 단지명 코어를 추출해 /complex/[name]로 라우팅.
 * 클라에 단지목록이 없어 휴리스틱 — 못 찾으면 /complex 화면이 채팅 폴백 버튼을 제공하므로 graceful.
 * 부동산 챗 맥락이라 시티/타운/마을/단지 같은 일반 접미사도 단지로 간주.
 */
const _COMPLEX_HINTS = [
  '자이', '래미안', '푸르지오', '힐스테이트', 'e편한세상', '이편한세상', '아이파크',
  '센트레빌', '롯데캐슬', '캐슬', '위브', '더샵', '팰리스', '베르디움', '데시앙',
  '꿈에그린', 'sk뷰', '시티', '타운', '마을', '단지', '파크'
];

export function matchComplexIntent(question: string): string | null {
  const q = (question || '').trim();
  if (!q || q.length > 25) return null;
  if (_COMPARE_HINTS.some((h) => q.includes(h))) return null; // 비교는 채팅
  const qLow = q.toLowerCase();
  if (!_COMPLEX_HINTS.some((h) => qLow.includes(h))) return null; // 단지 신호 없으면 채팅
  // 꼬리 질문어/평형 제거 → 단지명 코어
  let name = q
    .replace(/\d+\s*평.*$/, '')
    .replace(/\s*(아파트\s*)?(시세|실거래가?|매매가?|가격|얼마.*|분석.*|알려.*|어때.*|전세.*|월세.*|투자.*|전망.*|정보.*)$/, '')
    .trim();
  if (name.length < 2) name = q.replace(/\d+\s*평.*$/, '').trim();
  return name.length >= 2 ? name : null;
}

// 질문에서 단지명 후보(코어)만 추출 — 백엔드 검증용. 힌트 불필요.
export function extractComplexCandidate(question: string): string | null {
  const q = (question || '').trim();
  if (!q || q.length > 25) return null;
  if (_COMPARE_HINTS.some((h) => q.includes(h))) return null;
  let name = q
    .replace(/\d+\s*평.*$/, '')
    .replace(/\s*(아파트\s*)?(시세|실거래가?|매매가?|가격|얼마.*|분석.*|알려.*|어때.*|전세.*|월세.*|투자.*|전망.*|정보.*|추천.*)$/, '')
    .trim();
  name = name.replace(/\s*아파트$/, '').trim(); // "은마아파트"→"은마" (백엔드 저장명과 일치)
  return name.length >= 2 ? name : null;
}

const _norm = (s: string) => (s || '').replace(/[\s아파트]/g, '').toLowerCase();

/**
 * 백엔드에 단지명을 조회해 '실제 존재 + 이름 일치' 확인되면 canonical complex_name 반환.
 * 브랜드 힌트가 없어도(은마, 도곡렉슬 등) 라우팅 가능. 오라우팅 방지를 위해
 * 반환 단지명과 후보가 서로 포함관계일 때만 채택.
 */
export async function verifyComplexName(
  question: string,
  fetchFn: typeof fetch = fetch
): Promise<string | null> {
  const cand = extractComplexCandidate(question);
  if (!cand) return null;
  try {
    const res = await fetchFn(
      `https://korean-api-platform.vercel.app/api/complexes?query=${encodeURIComponent(cand)}&limit=1`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const top = (json?.data ?? [])[0];
    if (!top?.complex_name) return null;
    const a = _norm(cand);
    const b = _norm(top.complex_name);
    // 후보와 단지명이 서로 포함(=확실한 일치)일 때만 라우팅
    if (a.length >= 2 && (b.includes(a) || a.includes(b))) return top.complex_name;
    return null;
  } catch {
    return null;
  }
}

export type ComplexResolution =
  | { type: 'one'; name: string }
  | { type: 'many'; options: { label: string; sub?: string; href: string }[] }
  | null;

/**
 * 단지명 후보를 백엔드 조회해 라우팅 결정:
 *  - 정확 일치 또는 후보 1개 → 'one'(직행)
 *  - 구분되는 단지 2개+ → 'many'(선택칩 제시) — '래미안푸르지오' → 마포 1~4단지 등
 *  - 매칭 없음 → null(채팅 폴백)
 */
export async function resolveComplex(
  question: string,
  fetchFn: typeof fetch = fetch
): Promise<ComplexResolution> {
  const cand = extractComplexCandidate(question);
  if (!cand) return null;
  // 질문형/긴 문장은 단지명 아님 → 스킵(불필요한 조회 방지)
  if (cand.length > 18 || /[?？]|무엇|뭐|어떻게|왜|추천|비교/.test(question)) return null;
  try {
    const res = await fetchFn(
      `https://korean-api-platform.vercel.app/api/complexes?query=${encodeURIComponent(cand)}&limit=6`
    );
    if (!res.ok) return null;
    const rows = (await res.json())?.data ?? [];
    // complex_name+district로 중복 제거
    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const r of rows) {
      if (!r?.complex_name) continue;
      const k = r.complex_name + '|' + (r.district ?? '');
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(r);
    }
    if (uniq.length === 0) return null;
    const na = _norm(cand);
    const exact = uniq.find((u) => _norm(u.complex_name) === na);
    if (exact) return { type: 'one', name: exact.complex_name };
    if (uniq.length === 1) return { type: 'one', name: uniq[0].complex_name };
    return {
      type: 'many',
      options: uniq.slice(0, 5).map((u) => ({
        label: u.complex_name,
        sub: u.district,
        href: `/complex/${encodeURIComponent(u.complex_name)}`
      }))
    };
  } catch {
    return null;
  }
}
