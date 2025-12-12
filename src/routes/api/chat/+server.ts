import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const API_CATALOG_URL = env.API_CATALOG_URL || 'https://korean-api-platform.vercel.app';

/**
 * api-catalog /api/chat 프록시
 *
 * zippt-ai는 UI/UX 전용 클라이언트로, AI 로직은 api-catalog에서 처리합니다.
 * 이 엔드포인트는 SSE 스트리밍을 그대로 전달합니다.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // 세션 ID 생성/가져오기 (Rate Limit용)
    let sessionId = cookies.get('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      cookies.set('session_id', sessionId, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30일
      });
    }

    // api-catalog Chat API 호출
    const response = await fetch(`${API_CATALOG_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
        'x-forwarded-for': request.headers.get('x-forwarded-for') || ''
      },
      body: JSON.stringify({
        messages: body.messages,
        stream: true
      })
    });

    // 에러 응답 처리
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        console.error(`[Chat Proxy] Non-JSON error response: ${errorText.substring(0, 500)}`);
      }

      console.error(`[Chat Proxy] API error: status=${response.status}, url=${API_CATALOG_URL}`);

      // Rate Limit 초과
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: '사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          code: 'RATE_LIMIT_EXCEEDED',
          ...errorData
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '',
            'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '',
            'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset') || ''
          }
        });
      }

      return new Response(JSON.stringify({
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        code: 'SERVER_ERROR'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // SSE 스트림 그대로 전달 (AI SDK 스트리밍 헤더 포함)
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'x-vercel-ai-ui-message-stream': 'v1', // AI SDK Data Stream Protocol
        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '',
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '',
        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset') || ''
      }
    });

  } catch (error) {
    console.error('Chat API Proxy Error:', error);

    return new Response(JSON.stringify({
      error: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      code: 'CONNECTION_ERROR'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
