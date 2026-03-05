import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messageId, feedback, content } = await request.json();

		if (!messageId) {
			return json({ error: 'messageId is required' }, { status: 400 });
		}

		// Korean-api-platform으로 피드백 포워딩 (Langfuse에 기록됨)
		const apiUrl = 'https://realty-api-platform.vercel.app/api/feedback';
		try {
			await fetch(apiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageId,
					feedback, // 'like' | 'dislike'
					content: content?.slice(0, 200), // 답변 앞 200자
					source: 'zippt-ai',
					timestamp: new Date().toISOString()
				})
			});
		} catch {
			// 포워딩 실패해도 사용자에게 에러 노출 안 함
		}

		// 구조화된 로그 (Vercel 로그에서 집계 가능)
		console.log(JSON.stringify({
			event: 'feedback',
			messageId,
			feedback,
			contentPreview: content?.slice(0, 100),
			timestamp: new Date().toISOString()
		}));

		return json({ success: true, messageId, feedback });
	} catch (e) {
		console.error('Feedback error:', e);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
