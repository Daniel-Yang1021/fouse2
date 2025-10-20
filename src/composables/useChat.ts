import { ref, onBeforeUnmount } from 'vue';
import type { Dialog, Avatar, Voice } from '../types/chat';
import { chatApi } from '../api/chatApi';

// interface ChatResponse {
//     input_text: string;
//     text: string;
// }

export function useChat(sessionId: string, isSpeakingLocked?: { value: boolean }) {
    const dialogHistory = ref<Dialog[]>([]);
    const isSpeaking = ref(false);
    const isConsulting = ref(false);
    const isAIResponding = ref(false);
    const avatars = ref<Avatar[]>([]);
    const voices = ref<Voice[]>([]);
    let speakingCheckInterval: number | null = null;

    function addDialog(text: string, isUser: boolean) {
        dialogHistory.value.push({ text, isUser });
    }


    // async function addDialog(userText: string, aiText: string) {
    //     // 等待直到 isSpeaking 变为 true（AI 开始说话）
    //     while (!isSpeaking.value) {
    //         await new Promise(resolve => setTimeout(resolve, 100));
    //     }

    //     dialogHistory.value.push({ user: userText ? userText : "...", ai: aiText });
    //     if (dialogHistory.value.length > MAX_DIALOG_HISTORY) {
    //         dialogHistory.value = dialogHistory.value.slice(-MAX_DIALOG_HISTORY);
    //     }
    // }

    //只插入ＡＩ主動發送的訊息 (沒有使用者訊息)
    // async function addAiDialog(aiText: string) {
    //     // 等待直到 isSpeaking 变为 true（AI 开始说话）
    //     while (!isSpeaking.value) {
    //         await new Promise(resolve => setTimeout(resolve, 100));
    //     }

    //     dialogHistory.value.push({ user: '', ai: aiText });
    //     if (dialogHistory.value.length > MAX_DIALOG_HISTORY) {
    //         dialogHistory.value = dialogHistory.value.slice(-MAX_DIALOG_HISTORY);
    //     }
    // }

    function clearDialogHistory() {
        dialogHistory.value = [];
    }

    async function checkSpeakingStatus() {
        try {
            const response = await chatApi.checkSpeakingStatus(sessionId);
            const previousValue = isSpeaking.value;

            // 如果鎖定，不更新 isSpeaking
            if (isSpeakingLocked && isSpeakingLocked.value) {
                console.log(`isSpeaking 已鎖定，忽略 /is_speaking API 返回值: ${response.data}`);
                return;
            }

            isSpeaking.value = response.data;

            // 只在狀態變化時記錄
            if (previousValue !== response.data) {
                console.log(`/is_speaking 狀態變化: ${previousValue} → ${response.data}`);
            }
        } catch (error) {
            console.error("檢查說話狀態時發生錯誤:", error);
        }
    }

    async function startSpeakingCheck() {
        if (!speakingCheckInterval) {
            await checkSpeakingStatus();
            speakingCheckInterval = window.setInterval(checkSpeakingStatus, 200);  // 縮短到 200ms 提升響應速度
        }
    }

    async function handleTranscribeResult(audioBlob: Blob, onBeforeResponse?: () => void | boolean, userId?: string, onHumanSent?: () => void) {
        isAIResponding.value = true;
        try {
            console.log('開始轉錄音頻, audioBlob size:', audioBlob.size, 'userId:', userId);
            const result = await chatApi.transcribeAudio(audioBlob, sessionId, userId);
            console.log('轉錄結果:', result);

            // 檢查 onBeforeResponse 回調
            if (onBeforeResponse) {
                const shouldContinue = onBeforeResponse();
                // 如果回調返回 false，表示應該停止（已被打斷）
                if (shouldContinue === false) {
                    console.log('⚠️ onBeforeResponse 返回 false，停止發送 /human API');
                    isAIResponding.value = false;
                    return false;
                }
            }
            addDialog(result.input_text ? result.input_text : "...", true);

            console.log('發送 AI 回應到後端:', result.text, 'sessionId:', sessionId, 'userId:', userId);
            await chatApi.sendHumanMessage(result.text, sessionId, userId);
            console.log('AI 回應已發送');

            // 通知已發送 human API，開始輪詢 notify events
            if (onHumanSent) {
                onHumanSent();
            }

            return true;
        } catch (error) {
            console.error("轉錄處理錯誤:", error);
            isAIResponding.value = false;
            throw error;
        }
    }

    async function initializeSettings() {
        try {
            const configData = await chatApi.getCurrentConfig(sessionId);
            if (configData.code === 0) {
                const avatarsData = await chatApi.getAvatars();
                const voicesData = await chatApi.getVoices();

                if (avatarsData.code === 0 && voicesData.code === 0) {
                    avatars.value = Object.values(avatarsData.data);
                    voices.value = Object.values(voicesData.data);
                }
            }
        } catch (error) {
            console.error("初始化設定時發生錯誤:", error);
            throw new Error("初始化設定失敗");
        }
    }

    function cleanup() {
        if (speakingCheckInterval) {
            clearInterval(speakingCheckInterval);
            speakingCheckInterval = null;
        }
    }

    onBeforeUnmount(() => {
        cleanup();
    });

    async function handleTextMessage(text: string, userId?: string, onBeforeResponse?: () => void | boolean, onHumanSent?: () => void) {
        isAIResponding.value = true;
        try {
            console.log('發送文本消息:', text, 'userId:', userId);
            addDialog(text, true);

            const response = await chatApi.sendTextMessage(text, userId);
            console.log('ai_chat_set 響應:', response);

            // 檢查 onBeforeResponse 回調
            if (onBeforeResponse) {
                const shouldContinue = onBeforeResponse();
                // 如果回調返回 false，表示應該停止（已被打斷）
                if (shouldContinue === false) {
                    console.log('⚠️ onBeforeResponse 返回 false，停止發送 /human API');
                    isAIResponding.value = false;
                    return false;
                }
            }

            console.log('發送 human API:', response.text, 'sessionId:', sessionId, 'userId:', userId);
            await chatApi.sendHumanMessage(response.text, sessionId, userId);
            console.log('human API 已發送');

            // 通知已發送 human API，開始輪詢 notify events
            if (onHumanSent) {
                onHumanSent();
            }

            return true;
        } catch (error) {
            console.error("發送文本消息錯誤:", error);
            isAIResponding.value = false;
            throw error;
        }
    }

    //處理ＡＩ主動發送的訊息
    async function handleAiTextMessage(text: string, onHumanSent?: () => void) {
        isAIResponding.value = true;
        try {
            console.log('發送 AI 主動訊息:', text, 'sessionId:', sessionId);
            await chatApi.sendHumanMessage(text, sessionId);
            console.log('AI 主動訊息已發送');

            // 通知已發送 human API，開始輪詢 notify events
            if (onHumanSent) {
                onHumanSent();
            }

            return true;
        } catch (error) {
            console.error("發送 AI 主動訊息錯誤:", error);
            isAIResponding.value = false;
            throw error;
        }
    }

    return {
        dialogHistory,
        isSpeaking,
        isConsulting,
        isAIResponding,
        avatars,
        voices,
        clearDialogHistory,
        addDialog,
        startSpeakingCheck,
        handleTranscribeResult,
        handleTextMessage,
        handleAiTextMessage,
        initializeSettings,
        cleanup
    };
}
