export enum FeedbackStatus {
    NOT_GENERATED = 'NOT_GENERATED',
    GENERATING = 'GENERATING',
    GENERATED = 'GENERATED',
    REJECTED = 'REJECTED',
    APPROVED = 'APPROVED',
    PUBLISHED = 'PUBLISHED'
}

export type FeedbackType = 'short' | 'long';

export interface FeedbackData {
    status: FeedbackStatus;
    type: FeedbackType | null;
    content: string;
    generated_at?: string;
    approved_at?: string;
    published_at?: string;
    rejected_at?: string;
    rejected_reason?: string;
}

export interface ShareData {
    token: string;
    url: string;
    created_at: string;
}

export interface InterviewResult {
    session_id: string;
    candidate: {
        id: string;
        name: string;
        email?: string;
    };
    position?: {
        title: string;
    };
    company?: {
        name: string;
    };
    date: string;
    feedback: FeedbackData;
    share?: ShareData;
}
