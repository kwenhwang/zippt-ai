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
        toolResult?: unknown;
    }[];
    // 동명 단지 선택 칩 (예: '래미안푸르지오' → 마포 1~4단지)
    suggestions?: { label: string; sub?: string; href: string }[];
}

export interface ChatHistory {
    id: string;
    title: string;
    messages: Message[];
    createdAt: string;
}
