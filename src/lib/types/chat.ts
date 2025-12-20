export interface Citation {
    index: number;
    title: string;
    url: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    feedback?: 'like' | 'dislike' | null;
    processSteps?: {
        type: 'tool' | 'thinking';
        content: string;
        status: 'pending' | 'done';
    }[];
}

export interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
}
