# PM 직접 처리 작업 목록

> 코드 배포가 아닌, 외부 서비스 가입/설정이 필요한 작업들

---

## 우선순위별 정리

### P0 - 지금 바로 해야 함

#### 1. Google Search Console 등록

**효과**: 구글 검색 노출 가속 (sitemap 제출로 크롤링 요청)

**단계**:
1. https://search.google.com/search-console 접속
2. "속성 추가" → URL 접두어 → `https://zippt-ai.vercel.app`
3. 인증 방법: "HTML 태그" 선택
4. content 값 복사 (예: `abc123def456`)
5. Claude Code에 알려주면 `src/app.html`에 바로 적용
6. 인증 완료 후 → Sitemaps → `https://zippt-ai.vercel.app/sitemap.xml` 제출

#### 2. Naver 서치어드바이저 등록

**효과**: 네이버 검색 노출 (한국 사용자 대상 필수)

**단계**:
1. https://searchadvisor.naver.com 접속 (네이버 계정 필요)
2. "사이트 등록" → `https://zippt-ai.vercel.app`
3. 인증 방법: "HTML 태그" 선택
4. content 값 복사
5. Claude Code에 알려주면 `src/app.html`에 바로 적용
6. 인증 완료 후 → 요청 → 사이트맵 제출 → `https://zippt-ai.vercel.app/sitemap.xml`

---

### P1 - 이번 주 안에

#### 3. 카카오 JavaScript 앱 키 발급

**효과**: 카카오톡 공유 버튼 활성화 (이미 코드 구현 완료, 키만 있으면 됨)

**단계**:
1. https://developers.kakao.com 접속 (카카오 계정 필요)
2. "내 애플리케이션" → "애플리케이션 추가"
3. 앱 이름: `Zippt AI`, 회사명 적당히
4. 앱 설정 → 플랫폼 → Web → `https://zippt-ai.vercel.app` 등록 (필수!)
5. 앱 키 → **JavaScript 키** 복사
6. Vercel 대시보드 → 프로젝트 Settings → Environment Variables
7. `PUBLIC_KAKAO_APP_KEY` = [복사한 JavaScript 키] 추가 → 재배포

---

### P2 - 다음 달 이내

#### 4. Vercel Analytics 대시보드 확인

**효과**: 페이지별 방문자, 유입 경로, 이탈률 파악

**단계**:
1. https://vercel.com/dashboard → zippt-ai 프로젝트
2. Analytics 탭 클릭
3. 주간 방문자 수, 인기 페이지, 유입 국가 확인
4. 지역 SEO 페이지(`/지역/강남구` 등) 유입 여부 모니터링

#### 5. Google Analytics 4 (선택)

**효과**: Vercel Analytics보다 상세한 사용자 행동 분석 (이벤트 추적, 전환율 등)

**단계**:
1. https://analytics.google.com → 속성 만들기
2. 측정 ID 발급 (G-XXXXXXXXXX 형식)
3. Claude Code에 알려주면 `src/app.html`에 스크립트 추가

---

## 완료 체크리스트

- [ ] Google Search Console 등록 + 인증 코드 전달
- [ ] Naver 서치어드바이저 등록 + 인증 코드 전달
- [ ] 카카오 JavaScript 키 발급 + Vercel 환경변수 설정
- [ ] Vercel Analytics 모니터링 시작
- [ ] Google Analytics 4 (선택)

---

## 인증 코드 전달 방법

Claude Code에 이렇게 말하면 됩니다:

```
Google Search Console 인증 코드: abc123def456xyz
Naver 서치어드바이저 인증 코드: naver_abc123
```

그러면 `src/app.html`에 바로 추가하고 배포합니다.

---

*마지막 업데이트: 2026-03-05*
