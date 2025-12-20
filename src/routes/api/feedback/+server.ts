import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { messageId, feedback } = await request.json();

        if (!messageId) {
            return json({ error: 'messageId is required' }, { status: 400 });
        }

        // In a real application, you would save this to a database
        // For now, we'll just log it
        console.log(`[Feedback] Message: ${messageId}, Feedback: ${feedback}`);

        return json({ success: true, messageId, feedback });
    } catch (e) {
        console.error('Feedback error:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
