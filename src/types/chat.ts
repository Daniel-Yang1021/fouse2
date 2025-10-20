export interface Dialog {
    text: string;
    isUser: boolean;
}

export interface Avatar {
    id: string;
    display_name: string;
}

export interface Voice {
    id: number;
    name: string;
}

export interface SpeakingResponse {
    data: boolean;
}

export interface TranscribeResponse {
    input_text: string;
    text: string;
}

export interface ConfigResponse {
    code: number;
    data: any;
}

export interface AvatarsResponse {
    code: number;
    data: Record<string, Avatar>;
}

export interface VoicesResponse {
    code: number;
    data: Record<string, Voice>;
}

export interface NotifyEvent {
    timestamp: string;
    event: {
        status: 'start' | 'end';
        text: string;
        msgenvent: any;
    };
}

export interface NotifyEventsResponse {
    code: number;
    data: NotifyEvent[];
}
