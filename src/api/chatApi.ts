import type { AvatarsResponse, ConfigResponse, VoicesResponse, SpeakingResponse, TranscribeResponse, NotifyEventsResponse } from '../types/chat';

const API_BASE_URL = 'https://talk-dev.aitago.tw';
const API_TRANSCRIBE_URL = 'https://talk-dev.aitago.tw:9880';
const API_NOTIFY_URL = 'https://talk-dev.aitago.tw';

// 獲取語系後綴
function getLocaleSuffix(): string {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    return lang === 'en' ? '_en' : '';
}

export const chatApi = {
    /**
     * 檢查 AI 是否正在說話
     * @param sessionId - 會話 ID
     * @returns 返回 AI 說話狀態的響應
     */
    async checkSpeakingStatus(sessionId: string): Promise<SpeakingResponse> {
        const response = await fetch(`${API_BASE_URL}/is_speaking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionid: parseInt(sessionId) }),
        });
        return response.json();
    },

    /**
     * 發送用戶消息到 AI
     * @param text - 用戶要發送的消息文本
     * @param sessionId - 會話 ID
     * @param userId - 用戶 ID
     */
    async sendHumanMessage(text: string, sessionId: string, userId?: string): Promise<void> {
        const payload: any = {
            text,
            type: 'echo',
            sessionid: parseInt(sessionId),
        };
        if (userId) {
            payload.userid = userId;
        }
        console.log('發送 /human 請求:', `${API_BASE_URL}/human`, payload);
        const response = await fetch(`${API_BASE_URL}/human`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        console.log('收到 /human 響應:', response.status, response.statusText);
    },

    /**
     * 發送中斷消息，用於打斷 AI 的當前回應
     * @param sessionId - 會話 ID
     */
    async sendInterruptMessage(sessionId: string): Promise<void> {
        await fetch(`${API_BASE_URL}/human`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: '',
                type: '',
                sessionid: parseInt(sessionId),
                interrupt: true,
            }),
        });
    },

    /**
     * 將音頻轉錄為文本 (使用 transcribe4 端點)
     * @param audioBlob - 音頻數據
     * @param sessionId - 會話 ID
     * @param userId - 用戶 ID
     * @returns 返回轉錄結果
     */
    async transcribeAudio(audioBlob: Blob, sessionId: string, userId?: string): Promise<TranscribeResponse> {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');
        formData.append('sessionid', sessionId);
        if (userId) {
            formData.append('userId', userId);
        }

        const url = `${API_TRANSCRIBE_URL}/transcribe4${getLocaleSuffix()}`;
        console.log('發送 /transcribe4 請求:', url, 'sessionId:', sessionId, 'userId:', userId, 'audioBlob size:', audioBlob.size);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            console.log('收到 /transcribe4 響應:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('/transcribe4 請求失敗:', response.status, errorText);
                throw new Error(`轉錄請求失敗: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            console.log('/transcribe4 結果:', result);
            return result;
        } catch (error) {
            console.error('/transcribe4 請求錯誤:', error);
            throw error;
        }
    },

    /**
     * 獲取當前會話的配置信息
     * @param sessionId - 會話 ID
     * @returns 返回當前配置信息
     */
    async getCurrentConfig(sessionId: string): Promise<ConfigResponse> {
        const response = await fetch(`${API_BASE_URL}/get_current_config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionid: parseInt(sessionId) }),
        });
        return response.json();
    },

    /**
     * 獲取可用的虛擬形象列表
     * @returns 返回虛擬形象列表
     */
    async getAvatars(): Promise<AvatarsResponse> {
        const response = await fetch(`${API_BASE_URL}/get_avatars`);
        return response.json();
    },

    /**
     * 獲取可用的語音列表
     * @returns 返回語音列表
     */
    async getVoices(): Promise<VoicesResponse> {
        const response = await fetch(`${API_BASE_URL}/get_voices`);
        return response.json();
    },

    /**
     * 發送純文本消息到 AI 聊天接口
     * 此接口用於發送不需要語音合成的純文本消息
     * @param text - 要發送的文本消息
     * @param userId - 用戶 ID
     * @returns 返回 AI 的回應
     */
    async sendTextMessage(text: string, userId?: string) {
        const payload: any = { text };
        if (userId) {
            payload.userId = userId;
        }
        console.log('發送 /ai_chat_set 請求:', `${API_TRANSCRIBE_URL}/ai_chat_set`, payload);
        const response = await fetch(`${API_TRANSCRIBE_URL}/ai_chat_set`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        console.log('收到 /ai_chat_set 響應:', response.status, response.statusText);
        return response.json();
    },

    /**
     * 獲取通知事件
     * @param sessionId - 會話 ID
     * @returns 返回通知事件列表
     */
    async getNotifyEvents(sessionId: string): Promise<NotifyEventsResponse> {
        const response = await fetch(`${API_NOTIFY_URL}/get_notify_events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionid: parseInt(sessionId) }),
        });
        return response.json();
    },
};
