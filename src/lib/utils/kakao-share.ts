/**
 * @module kakao-share
 * 카카오톡 공유 기능
 * ⚠️ 사용 전 필요: Vercel 환경변수 PUBLIC_KAKAO_APP_KEY 설정
 * 카카오 개발자 콘솔: https://developers.kakao.com
 * 플랫폼에 zippt-ai.vercel.app 도메인 등록 필요
 */

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: string;
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: { mobileWebUrl: string; webUrl: string };
  };
  buttons: Array<{
    title: string;
    link: { mobileWebUrl: string; webUrl: string };
  }>;
}

const APP_URL = 'https://zippt-ai.vercel.app';
const OG_IMAGE = `${APP_URL}/og-image.svg`;

function initKakao(): boolean {
  if (typeof window === 'undefined' || !window.Kakao) return false;
  // PUBLIC_ 접두사: SvelteKit에서 클라이언트에 노출되는 환경변수
  const appKey = import.meta.env.PUBLIC_KAKAO_APP_KEY;
  if (!appKey) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(appKey);
  }
  return true;
}

export function shareToKakao(question: string, answer: string): boolean {
  if (!initKakao()) {
    // 카카오 SDK 없거나 앱 키 미설정 → 폴백: 링크 복사
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(APP_URL);
    }
    return false;
  }

  const preview = answer
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim()
    .slice(0, 100);

  window.Kakao!.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: `Zippt AI: ${question.slice(0, 40)}`,
      description: preview + (answer.length > 100 ? '...' : ''),
      imageUrl: OG_IMAGE,
      link: { mobileWebUrl: APP_URL, webUrl: APP_URL }
    },
    buttons: [
      {
        title: '나도 AI에게 물어보기',
        link: { mobileWebUrl: APP_URL, webUrl: APP_URL }
      }
    ]
  });
  return true;
}
