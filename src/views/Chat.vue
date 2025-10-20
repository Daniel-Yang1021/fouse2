<template>
  <div class="h-screen touch-none select-none bg-[#4c4c4c]" @contextmenu.prevent @click.prevent="handleGlobalClick">
    <div class="w-full h-auto items-center relative">
      <button
        class="absolute top-4 right-[34vw] z-20 w-[28vw] h-[15vw] rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disableInterruptButton"
        @click.stop="handleInterrupt"
      >
      </button>

      <div @click.stop>
        <ConsultButton
          :is-recording="isRecording"
          :is-consulting="isConsulting"
          :formatted-time="formattedTime"
          :disabled="disableAllButtons"
          :disable-info-button="isInfoButtonOnCooldown || disableAllButtons"
          :show-interrupt="shouldShowInterruptButton"
          @consult-click="handleConsultClick"
          @recording-click="handleRecordingClick"
          @restart-click="handleEndConsult(false, false)"
          @show-info="handleShowInfo"
          @interrupt="handleInterrupt"
        />
      </div>

      <!-- 錯誤訊息 -->
      <div
        class="hidden fixed top-20 left-1/2 -translate-x-1/2 text-red-600 p-2.5 bg-red-100 rounded shadow-lg z-50"
        ref="errorMessage"
      ></div>

      <VideoStream
        ref="videoStreamRef"
        :session-id="sessionId"
        @error="showError"
        class="absolute top-0 left-1/2 -translate-x-1/2"
        style="width: 1080px; height: 1263px;"
      />
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2"
        style="width: 1080px; height: 1263px;"
        :class="{ hidden: showStreamVideo }"
      >
        <video
          ref="videoRef1"
          style="width: 1080px; height: 1263px; object-fit: cover;"
          :class="{ hidden: !showVideo1 }"
          playsinline
          muted
        ></video>
        <video
          ref="videoRef2"
          style="width: 1080px; height: 1263px; object-fit: cover;"
          :class="{ hidden: !showVideo2 }"
          playsinline
          muted
        ></video>
      </div>

      <!-- 隱藏重新整理按鈕（Header圖片「會」字位置 - 右上角） -->
      <button
        class="absolute z-[10000]"
        style="top: 30px; right: 30px; width: 80px; height: 80px; opacity: 0; cursor: pointer;"
        @click.stop="handleReload"
        aria-label="重新整理頁面"
      ></button>

      <!-- 待機畫面固定文字 -->
      <div
        v-show="!isConsulting"
        style="position: absolute; left: 50%; top: 1263px; transform: translateX(-50%); width: 1080px; height: 572px; z-index: 9999; display: flex; align-items: flex-start; justify-content: flex-start; padding: 180px 75px 0 75px;"
      >
        <p style="color: white; font-size: 38px; font-style: normal; font-weight: 500; line-height: 70px; letter-spacing: 2px; text-align: left;">
          我是2025三立集團內容創新發佈大會的宣傳大使AIKKA，想知道三立集團有哪些節目和歷史嗎，歡迎與我聊聊喔
        </p>
      </div>

      <!-- 開始互動後的提示文字 -->
      <div
        v-show="isConsulting && dialogHistory.length === 0 && !isRecording && !isProcessing"
        style="position: absolute; left: 50%; top: 1263px; transform: translateX(-50%); width: 1080px; height: 572px; z-index: 9999; display: flex; align-items: flex-start; justify-content: flex-start; padding: 180px 75px 0 75px;"
      >
        <p style="color: white; font-size: 38px; font-style: normal; font-weight: 500; line-height: 70px; letter-spacing: 2px; text-align: left;">
          你好，可以點擊「開始對話」述說您的問題，或是點擊小「 i 」快速提問
        </p>
      </div>

      <DialogHistory
        :dialog-history="dialogHistory"
        :is-recording="isRecording"
        :is-processing="isProcessing"
      />

      <div @click.stop>
        <InfoBox
          :show="showInfoBox"
          :session-id="sessionId"
          :disabled="disableAllButtons"
          @close="showInfoBox = false"
          @send-message="handleSendMessage"
        />
      </div>

      <div @click.stop>
        <EndDialog
          :show="showEndDialogBox"
          :code="'1234'"
          :disabled="disableAllButtons"
          @close="showEndDialogBox = false"
        />
      </div>
    </div>

    <footer class="absolute bottom-0 left-0 w-full bg-[#333333] text-[#FFFFFF] text-center py-2 text-sm z-30">
      此服務由 創造智能 提供技術支持
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  nextTick,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { loadSrsSdk } from "../utils/srs";
import { useAudioRecording } from "../composables/useAudioRecording";
import { useChat } from "../composables/useChat";
import { chatApi } from '../api/chatApi';
import ConsultButton from "../components/ConsultButton.vue";
import DialogHistory from "../components/DialogHistory.vue";
import InfoBox from "../components/InfoBox.vue";
import EndDialog from "../components/EndDialog.vue";
import VideoStream from "../components/VideoStream.vue";
import idleVideo from "/video/2025 Road Show Kiosk Aikka_待機比愛心 20251002 (1).mov";
import thinkingVideo from "/video/2025 Road Show Kiosk Aikka_思考 20251002 (1).mov";
// i18n
const { t, locale } = useI18n();

// 初始化語系設定
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const lang = urlParams.get("lang");
  if (lang) {
    locale.value = lang;
    document.documentElement.lang = lang;
  }
});

// Language change handler
// function handleLanguageChange(lang: string) {
//   locale.value = lang;

//   // 更新 URL 的語系參數
//   const url = new URL(window.location.href);
//   url.searchParams.set("lang", lang);
//   window.history.replaceState({}, "", url.toString());

//   // 更新 HTML 的 lang 屬性
//   document.documentElement.lang = lang;
// }

// 获取下一个要播放的视频（固定返回待機影片）
function getNextVideo(): string {
  return idleVideo;
}

const sessionId = "0";
const userId = ref<string>("");

// 生成唯一的 userId
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

const errorMessage = ref<HTMLElement | null>(null);
const videoStreamRef = ref<{ setMuted: (muted: boolean) => void } | null>(null);
const videoRef1 = ref<HTMLVideoElement | null>(null);
const videoRef2 = ref<HTMLVideoElement | null>(null);
const showVideo1 = ref(true);
const showVideo2 = ref(false);
const nextVideo = ref<string>("");

const isEndingConsult = ref(false);
const isInterrupted = ref(false);  // 標記是否已被打斷
const isInterrupting = ref(false);  // 標記是否正在處理打斷
const videoStateLocked = ref(false);  // 影片狀態鎖定
const INTERRUPT_COOLDOWN = 500;  // 打斷冷卻時間（毫秒）
const isInfoButtonOnCooldown = ref(false);  // Info 按鈕冷卻標記
const INFO_BUTTON_COOLDOWN = 10000;  // Info 按鈕冷卻時間（毫秒）10秒

// 判斷是否應顯示打斷按鈕（思考中或AI回應中）
const shouldShowInterruptButton = computed(() => {
  return (
    isProcessing.value ||
    isAIResponding.value ||
    isSpeaking.value
  );
});

const disableAllButtons = computed(() => {
  return (
    isRecording.value ||
    isEndingConsult.value
  );
});

const disableInterruptButton = computed(() => {
  return (
    isRecording.value ||
    isAIResponding.value ||
    isEndingConsult.value ||
    isInterrupting.value  // 打斷處理中時也禁用按鈕
  );
});

const {
  isRecording,
  startAudioCapture,
  stopRecording,
  cleanup: cleanupAudio,
  setAutoStopCallback,
} = useAudioRecording();

const recordingTime = ref(0);
const recordingTimer = ref<number | null>(null);
const countdownInterval = ref<number | null>(null);

const formattedTime = computed(() => {
  const minutes = Math.floor(recordingTime.value / 60);
  const seconds = recordingTime.value % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
});

const showInfoBox = ref(false);
const showEndDialogBox = ref(false);
const inactivityTimer = ref<number | null>(null);
const followupTimer = ref<number | null>(null);
const farewellTimer = ref<number | null>(null);
const notifyEventsInterval = ref<number | null>(null);
const notifyCheckCancelled = ref(false);  // 標記是否取消 notify events 輪詢
const lastProcessedTimestamp = ref<string>("");
const isProcessing = ref(false);
const isSpeakingLocked = ref(false);  // 鎖定 isSpeaking，防止提前切換
const showStreamVideo = ref(false);  // 控制是否顯示串流影片（true=串流，false=待機）
const isLastPrompt = ref(false);  // 標記是否為最後一次提示（come-back）

const {
  dialogHistory,
  isSpeaking,
  isConsulting,
  isAIResponding,
  initializeSettings,
  startSpeakingCheck,
  handleTranscribeResult,
  handleTextMessage,
  // handleAiTextMessage,  // 已取消倒數機制，不再使用
  clearDialogHistory,
  addDialog,
  cleanup: cleanupChat,
} = useChat(sessionId, isSpeakingLocked);

// const INACTIVITY_TIMEOUT = 15 * 1000;  // 已取消倒數機制
// const FOLLOWUP_TIMEOUT = 10 * 1000;  // 已取消倒數機制
// const FAREWELL_TIMEOUT = 5 * 1000;
const END_DIALOG_TIMEOUT = 15 * 1000;

// const longPressTimer = ref<number | null>(null);
// const LONG_PRESS_DURATION = 5000; // 5秒

// 檢查通知事件
async function checkNotifyEvents() {
  // 在處理前檢查是否已取消
  if (notifyCheckCancelled.value) {
    console.log('⚠️ Notify events 輪詢已取消，跳過檢查');
    return;
  }

  try {
    const response = await chatApi.getNotifyEvents(sessionId);

    // 在處理事件前再次檢查是否已取消
    if (notifyCheckCancelled.value) {
      console.log('⚠️ 事件處理已取消，停止處理');
      return;
    }

    if (response.code === 0 && response.data && response.data.length > 0) {
      // 按timestamp排序，確保順序處理
      const events = response.data.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log('處理事件:', events);

      // 收集所有新事件
      let lastStartEvent = null;
      let hasEndEvent = false;
      let latestTimestamp = lastProcessedTimestamp.value;

      for (const event of events) {
        // 只收集新事件
        if (event.timestamp > lastProcessedTimestamp.value) {
          console.log('發現新事件:', event);
          if (event.event.status === 'start') {
            lastStartEvent = event;  // 保留最後一個 start 事件
          } else if (event.event.status === 'end') {
            hasEndEvent = true;
          }
          // 更新最新時間戳
          if (event.timestamp > latestTimestamp) {
            latestTimestamp = event.timestamp;
          }
        }
      }

      // 處理收集到的事件
      if (lastStartEvent) {
        console.log('AI開始說話，切換到後端串流影片:', lastStartEvent.event.text);
        addDialog(lastStartEvent.event.text, false);
        isProcessing.value = false;
        showStreamVideo.value = true;  // 顯示後端串流影片，隱藏本地待機影片
      }

      if (hasEndEvent) {
        console.log('AI 文本生成完成，停止輪詢 notify events');
        isAIResponding.value = false;
        stopNotifyCheck();
        // 延遲 1 秒後切換回待機影片
        setTimeout(() => {
          console.log('延遲結束，切換回待機影片');
          showStreamVideo.value = false;  // 隱藏後端串流影片，顯示本地待機影片

          // 如果是最後一次提示，再延遲 2 秒後結束對話
          if (isLastPrompt.value) {
            setTimeout(() => {
              console.log('最後一次提示結束，自動結束對話');
              isLastPrompt.value = false;  // 重置標記
              handleEndConsult(true);
            }, 2000);
          }
        }, 1000);
      }

      // 更新最後處理的時間戳
      lastProcessedTimestamp.value = latestTimestamp;
    }
  } catch (error) {
    console.error('檢查通知事件時發生錯誤:', error);
  }
}

// 開始輪詢通知事件
function startNotifyCheck() {
  // 先停止現有的輪詢（如果有）
  stopNotifyCheck();

  // 立即更新時間戳為當前時間，忽略所有舊事件
  const currentTimestamp = new Date().toISOString();
  lastProcessedTimestamp.value = currentTimestamp;
  console.log('✅ 開始新的 notify events 輪詢，時間戳重置為:', currentTimestamp);

  // 重置取消標記並啟動新的輪詢
  notifyCheckCancelled.value = false;
  checkNotifyEvents();
  notifyEventsInterval.value = window.setInterval(checkNotifyEvents, 100);  // 縮短到 100ms 提升響應速度
}

// 停止輪詢通知事件
function stopNotifyCheck() {
  notifyCheckCancelled.value = true;  // 設置取消標記
  if (notifyEventsInterval.value) {
    clearInterval(notifyEventsInterval.value);
    notifyEventsInterval.value = null;
  }
  console.log('✅ 已停止 notify events 輪詢');
  // 不重置 lastProcessedTimestamp，避免重複處理舊事件
}

// 播放思考影片
async function playThinkingVideo(): Promise<void> {
  return new Promise((resolve) => {
    const currentVideoRef = showVideo1.value ? videoRef1.value : videoRef2.value;
    if (!currentVideoRef) {
      resolve();
      return;
    }

    // 設置思考影片
    currentVideoRef.src = thinkingVideo;
    currentVideoRef.muted = true;

    // 監聽影片結束
    const onEnded = () => {
      currentVideoRef.removeEventListener('ended', onEnded);
      clearInterval(interruptCheckInterval);
      resolve();
    };

    // 定期檢查是否被打斷
    const interruptCheckInterval = setInterval(() => {
      if (isInterrupted.value) {
        console.log('⚠️ 思考影片播放中被打斷，立即停止並切換到待機影片');
        currentVideoRef.removeEventListener('ended', onEnded);
        clearInterval(interruptCheckInterval);

        // 切換到待機影片（不設置 loop，保持原有的雙緩衝機制）
        currentVideoRef.src = getNextVideo();
        currentVideoRef.play().catch((error) => {
          console.error('播放待機影片失敗:', error);
        });

        resolve();
      }
    }, 100);  // 每 100ms 檢查一次

    currentVideoRef.addEventListener('ended', onEnded);
    currentVideoRef.play().catch((error) => {
      console.error('播放思考影片失敗:', error);
      currentVideoRef.removeEventListener('ended', onEnded);
      clearInterval(interruptCheckInterval);
      resolve();
    });
  });
}

function clearAllTimers() {
  console.log("清除所有計時器");
  if (inactivityTimer.value) {
    clearTimeout(inactivityTimer.value);
    inactivityTimer.value = null;
  }
  if (followupTimer.value) {
    clearTimeout(followupTimer.value);
    followupTimer.value = null;
  }
  if (farewellTimer.value) {
    clearTimeout(farewellTimer.value);
    farewellTimer.value = null;
  }
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
    countdownInterval.value = null;
  }
  stopNotifyCheck();
  isLastPrompt.value = false;  // 重置最後提示標記
}

function setInactivityTimer() {
  // 已取消倒數結束對話機制
  // if (!isConsulting.value) return;

  // document.addEventListener("click", handleClick);
  // console.log("開始新的倒數計時");
  // let pausedTime = 0;
  // let startTime = Date.now();
  // let isPaused = false;

  // // 每秒更新倒數
  // countdownInterval.value = window.setInterval(() => {
  //   // 如果AI正在說話，暫停倒數
  //   if (isSpeaking.value && !isPaused) {
  //     isPaused = true;
  //     pausedTime = Date.now() - startTime;
  //     console.log("AI正在說話，暫停倒數");
  //     return;
  //   }

  //   // 如果AI停止說話，恢復倒數
  //   if (!isSpeaking.value && isPaused) {
  //     isPaused = false;
  //     startTime = Date.now() - pausedTime;
  //     console.log("AI停止說話，繼續倒數");
  //   }

  //   // 只在非暫停狀態下更新倒數
  //   if (!isPaused) {
  //     const elapsed = Date.now() - startTime;
  //     const remaining = Math.ceil((INACTIVITY_TIMEOUT - elapsed) / 1000);
  //     if (remaining > 0) {
  //       console.log(`倒數：${remaining} 秒`);
  //     }
  //   }
  // }, 1000);

  // inactivityTimer.value = window.setTimeout(async () => {
  //   if (countdownInterval.value) {
  //     clearInterval(countdownInterval.value);
  //     countdownInterval.value = null;
  //   }
  //   console.log("第一次提示");
  //   await handleAiTextMessage(t("message.need-help"), () => {
  //     console.log('第一次提示 Human API 已發送，開始輪詢 notify events');
  //     startNotifyCheck();
  //   });

  //   // 設置第二次提示的倒數計時
  //   let followupStartTime = Date.now();
  //   countdownInterval.value = window.setInterval(() => {
  //     const followupElapsed = Date.now() - followupStartTime;
  //     const followupRemaining = Math.ceil((FOLLOWUP_TIMEOUT - followupElapsed) / 1000);
  //     if (followupRemaining > 0) {
  //       console.log(`第二次提示倒數：${followupRemaining} 秒`);
  //     }
  //   }, 1000);

  //   // 6秒後的第二次提示
  //   followupTimer.value = window.setTimeout(async () => {
  //     if (countdownInterval.value) {
  //       clearInterval(countdownInterval.value);
  //       countdownInterval.value = null;
  //     }
  //     console.log("第二次提示（最後一次）");
  //     isLastPrompt.value = true;  // 標記這是最後一次提示
  //     await handleAiTextMessage(t("message.come-back"), () => {
  //       console.log('第二次提示 Human API 已發送，開始輪詢 notify events');
  //       startNotifyCheck();
  //     });

  //     // 等待 AI 說話結束後，直接結束對話
  //     // 註解掉 farewell，不再播放第三次提示
  //     // // 設置最後提示的倒數計時
  //     // let farewellStartTime = Date.now();
  //     // countdownInterval.value = window.setInterval(() => {
  //     //   const farewellElapsed = Date.now() - farewellStartTime;
  //     //   const farewellRemaining = Math.ceil((FAREWELL_TIMEOUT - farewellElapsed) / 1000);
  //     //   if (farewellRemaining > 0) {
  //     //     console.log(`最後提示倒數：${farewellRemaining} 秒`);
  //     //   }
  //     // }, 1000);

  //     // // 3秒後的最後提示
  //     // farewellTimer.value = window.setTimeout(async () => {
  //     //   if (countdownInterval.value) {
  //     //     clearInterval(countdownInterval.value);
  //     //     countdownInterval.value = null;
  //     //   }
  //     //   console.log("最後提示");
  //     //   await handleAiTextMessage(t("message.farewell"), () => {
  //     //     console.log('最後提示 Human API 已發送，開始輪詢 notify events');
  //     //     startNotifyCheck();
  //     //   });
  //     //   isEndingConsult.value = true;
  //     //   setTimeout(() => {
  //     //     console.log("結束對話");
  //     //     handleEndConsult(true);
  //     //     isEndingConsult.value = false;
  //     //   }, 1000);
  //     // }, FAREWELL_TIMEOUT);
  //   }, FOLLOWUP_TIMEOUT);
  // }, INACTIVITY_TIMEOUT);
}

function showError(message: string) {
  if (errorMessage.value) {
    errorMessage.value.textContent = message;
    errorMessage.value.classList.remove("hidden");
    setTimeout(() => {
      if (errorMessage.value) errorMessage.value.classList.add("hidden");
    }, 5000);
  }
}

async function handleConsultClick() {
  try {
    // 生成新的 userId
    userId.value = generateUserId();
    console.log('開始新對話, userId:', userId.value);

    // 立即清空對話歷史
    clearDialogHistory();

    // 重置時間戳，避免拉取舊的通知事件
    lastProcessedTimestamp.value = new Date().toISOString();
    console.log('重置時間戳:', lastProcessedTimestamp.value);

    // 重置影片顯示狀態
    showStreamVideo.value = false;
    isLastPrompt.value = false;  // 重置最後提示標記

    isConsulting.value = true;
    firstFlag.value = false;  // 因為沒有歡迎詞，直接設為 false

    nextTick(() => {
      videoStreamRef.value?.setMuted(false);
      // 確保本地影片繼續播放
      if (videoRef1.value && videoRef2.value) {
        const currentVideoRef = showVideo1.value ? videoRef1.value : videoRef2.value;
        if (currentVideoRef.paused) {
          currentVideoRef.play();
        }
      }
    });
    // 不播放欢迎词，也不显示任何对话
  } catch (error: any) {
    showError(`${t("error.processing-failed")}: ${error.message}`);
  }
}

async function handleRecordingClick() {
  try {
    clearAllTimers();
    if (isRecording.value) {
      isInterrupted.value = false;  // 重置打斷標記
      firstFlag.value = false;  // 允許後續啟動倒數計時
      isProcessing.value = true;
      const audioBlob = await stopRecording();
      if (audioBlob) {
        // 播放思考影片，同時處理轉錄
        const thinkingPromise = playThinkingVideo();

        const transcribePromise = handleTranscribeResult(
          audioBlob,
          () => {
            // 檢查是否已被打斷
            if (isInterrupted.value) {
              console.log('⚠️ 已被打斷，不執行後續操作');
              return false;  // 返回 false 表示應該停止
            }
            videoStreamRef.value?.setMuted(false);
            return true;  // 返回 true 或 undefined 表示繼續
          },
          userId.value,
          () => {
            // human API 發送完成後開始輪詢
            console.log('錄音轉錄完成，Human API 已發送，開始輪詢 notify events');
            startNotifyCheck();
          }
        );

        // 等待思考影片和轉錄都完成
        await Promise.all([thinkingPromise, transcribePromise]);
      }
      if (recordingTimer.value) {
        clearInterval(recordingTimer.value);
        recordingTimer.value = null;
      }
      recordingTime.value = 0;
      // isProcessing 會在收到 start 事件時設為 false
    } else {
      // 開始錄音前，清除之前的對話歷史
      if (dialogHistory.value.length > 0) {
        console.log('清除上一段對話歷史');
        clearDialogHistory();
      }

      recordingTime.value = 0;
      await startAudioCapture();
      await nextTick();
      if (recordingTimer.value) {
        clearInterval(recordingTimer.value);
      }
      recordingTimer.value = setInterval(() => {
        if (isRecording.value) {
          recordingTime.value = (recordingTime.value || 0) + 1;
          if (recordingTime.value >= 30) {
            handleRecordingClick();
          }
        }
      }, 1000);
    }
  } catch (error: any) {
    isProcessing.value = false;
    isAIResponding.value = false;
    stopNotifyCheck();
    showError(`${t("error.processing-failed")}: ${error.message}`);
  }
}

async function handleEndConsult(isTimeout: boolean = false, showEndDialog: boolean = true) {
  try {
    console.log('handleEndConsult 被調用, isTimeout:', isTimeout, 'showEndDialog:', showEndDialog);

    // 如果 AI 正在說話或處理中，先觸發打斷
    if (isProcessing.value || isAIResponding.value || isSpeaking.value) {
      console.log('⚠️ AI 正在說話或處理中，重啟對話前先執行打斷');
      await handleInterrupt();
      // 等待打斷完成後再繼續
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    clearAllTimers();
    document.removeEventListener("click", handleClick);
    clearDialogHistory();

    // 清空 userId
    userId.value = "";
    console.log('userId 已清空');

    // 重置影片顯示狀態
    showStreamVideo.value = false;

    // 重置所有可能導致按鈕 disable 的狀態
    isProcessing.value = false;
    isAIResponding.value = false;
    isEndingConsult.value = false;

    nextTick(() => {
      setTimeout(() => {
        isConsulting.value = false;
      }, 200);
    });

    if (!isTimeout && showEndDialog) {
      showEndDialogBox.value = true;
    }
    if (showInfoBox.value) {
      showInfoBox.value = false;
    }
    if (showEndDialog) {
      setTimeout(() => {
        showEndDialogBox.value = false;
      }, END_DIALOG_TIMEOUT);
    }
  } catch (error: any) {
    showError(`${t("error.processing-failed")}: ${error.message}`);
  }
}

async function handleSendMessage(message: string) {
  try {
    // 防呆機制：如果 Info 按鈕在冷卻中，忽略發送請求
    if (isInfoButtonOnCooldown.value) {
      console.log('⚠️ Info 按鈕冷卻中，忽略發送請求（防止快速連續點擊）');
      return;
    }

    // 設置 Info 按鈕冷卻，防止快速連續發送
    isInfoButtonOnCooldown.value = true;
    console.log('✅ Info 訊息已發送，進入 10 秒冷卻狀態');

    // 設置冷卻時間
    setTimeout(() => {
      isInfoButtonOnCooldown.value = false;
      console.log('✅ Info 按鈕冷卻結束，可以再次發送訊息');
    }, INFO_BUTTON_COOLDOWN);

    clearAllTimers();
    isInterrupted.value = false;  // 重置打斷標記
    firstFlag.value = false;  // 允許後續啟動倒數計時
    isProcessing.value = true;

    // 播放思考影片，同時處理文本消息
    const thinkingPromise = playThinkingVideo();
    const textPromise = handleTextMessage(
      message,
      userId.value,
      () => {
        // 檢查是否已被打斷
        if (isInterrupted.value) {
          console.log('⚠️ 已被打斷，不執行後續操作');
          return false;  // 返回 false 表示應該停止
        }
        videoStreamRef.value?.setMuted(false);
        return true;  // 返回 true 或 undefined 表示繼續
      },
      () => {
        // human API 發送完成後開始輪詢
        console.log('Human API 已發送，開始輪詢 notify events');
        startNotifyCheck();
      }
    );

    // 等待思考影片和文本消息處理都完成
    await Promise.all([thinkingPromise, textPromise]);
    // isProcessing 會在收到 start 事件時設為 false
  } catch (error: any) {
    // 發生錯誤時解除冷卻
    isInfoButtonOnCooldown.value = false;
    console.log('❌ 發生錯誤，Info 按鈕冷卻已解除');

    isProcessing.value = false;
    isAIResponding.value = false;
    stopNotifyCheck();
    showError(`${t("error.processing-failed")}: ${error.message}`);
  }
}

function handleClick() {
  setTimeout(() => {
    if (
      isConsulting.value &&
      !isRecording.value &&
      !isSpeaking.value &&
      !isAIResponding.value
    ) {
      clearAllTimers();
      setInactivityTimer();
    }
  }, 500);
}

function preloadNextVideo(videoElement: HTMLVideoElement | null) {
  if (videoElement) {
    nextVideo.value = getNextVideo();
    videoElement.src = nextVideo.value;
    videoElement.load();
  }
}

function switchVideos() {
  showVideo1.value = !showVideo1.value;
  showVideo2.value = !showVideo2.value;
}

// function startLongPress() {
//   longPressTimer.value = window.setTimeout(() => {
//     window.location.reload();
//   }, LONG_PRESS_DURATION);
// }

// function cancelLongPress() {
//   if (longPressTimer.value) {
//     clearTimeout(longPressTimer.value);
//     longPressTimer.value = null;
//   }
// }

onMounted(async () => {
  if (videoRef1.value && videoRef2.value) {
    videoRef1.value.src = getNextVideo();
    videoRef1.value.play();

    preloadNextVideo(videoRef2.value);

    videoRef1.value.onended = () => {
      if (videoRef2.value) {
        videoRef2.value.play();
        switchVideos();
        preloadNextVideo(videoRef1.value);
      }
    };

    videoRef2.value.onended = () => {
      if (videoRef1.value) {
        videoRef1.value.play();
        switchVideos();
        preloadNextVideo(videoRef2.value);
      }
    };

    // 監聽影片錯誤
    videoRef1.value.onerror = (e) => {
      console.error('Video1 error:', e);
    };
    videoRef2.value.onerror = (e) => {
      console.error('Video2 error:', e);
    };
  }

  // 設置自動停止錄音的回調
  setAutoStopCallback(() => {
    if (isRecording.value) {
      handleRecordingClick();
    }
  });

  await loadSrsSdk();

  try {
    await initializeSettings();
    await startSpeakingCheck();
    console.log('Speaking check started, isSpeaking:', isSpeaking.value);
  } catch (error: any) {
    showError(error.message);
  }
});

const firstFlag = ref(true);

watch(isSpeaking, (newVal) => {
  if (!newVal && isConsulting.value) {
    // 如果正在處理、錄音或被打斷，不啟動倒數計時
    if (isProcessing.value || isRecording.value || isInterrupted.value) {
      return;
    }

    if (firstFlag.value) {
      firstFlag.value = false;
    } else {
      if (inactivityTimer.value || followupTimer.value || farewellTimer.value) {
        return;
      }
      setInactivityTimer();
    }
  }
});

onBeforeUnmount(() => {
  cleanupAudio();
  cleanupChat();
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value);
  }
  clearAllTimers();
  document.removeEventListener("click", handleClick);
});

// 全局點擊處理函數，攔截所有未被允許的點擊
function handleGlobalClick() {
  // 所有點擊都會被 @click.prevent 阻止
  // 只有使用 @click.stop 的子元素才能正常響應點擊
  // console.log('🚫 全局點擊被攔截');  // 減少輸出
}

// 隱藏重新整理功能（Header 圖片「會」字位置）
function handleReload() {
  console.log('🔄 執行頁面重新整理');
  window.location.reload();
}

// 處理顯示 InfoBox，如果在思考或說話中，先執行打斷
async function handleShowInfo() {
  // 檢查是否正在思考或 AI 正在說話
  if (isProcessing.value || isAIResponding.value || isSpeaking.value) {
    console.log('⚠️ 正在思考或說話中，點擊 Info 按鈕觸發打斷');
    await handleInterrupt();
    // 打斷完成後，延遲一小段時間再顯示 InfoBox（確保狀態已重置）
    setTimeout(() => {
      showInfoBox.value = true;
    }, 100);
  } else {
    // 正常情況直接顯示 InfoBox
    showInfoBox.value = true;
  }
}

async function handleInterrupt() {
  // 防抖動：如果正在處理打斷，直接返回
  if (isInterrupting.value) {
    console.log('⚠️ 正在處理打斷，忽略重複請求');
    return;
  }

  console.log('🛑 執行打斷對話');

  try {
    // 設置打斷處理標記
    isInterrupting.value = true;

    // 設置打斷標記，阻止 transcribe 後續操作
    isInterrupted.value = true;
    console.log('✅ 已設置打斷標記');

    // 立即鎖定 isSpeaking，防止後端狀態干擾前端
    isSpeakingLocked.value = true;
    console.log('✅ 已鎖定 isSpeaking 狀態');

    // 鎖定影片狀態
    videoStateLocked.value = true;
    console.log('✅ 已鎖定影片狀態');

    // 立即停止所有影片相關操作
    const currentVideoRef = showVideo1.value ? videoRef1.value : videoRef2.value;
    if (currentVideoRef) {
      currentVideoRef.pause();
      currentVideoRef.currentTime = 0;
      console.log('✅ 已暫停並重置本地影片');
    }

    // 強制停止串流影片
    if (videoStreamRef.value) {
      videoStreamRef.value.setMuted(true);
      console.log('✅ 已將串流影片靜音');
    }

    // 發送打斷請求到後端
    await chatApi.sendInterruptMessage(sessionId);
    console.log('✅ 已發送打斷請求到後端');

    // 停止輪詢 notify events
    stopNotifyCheck();

    // 清除所有計時器
    clearAllTimers();

    // 移除點擊事件監聽
    document.removeEventListener("click", handleClick);

    // 重置時間戳，避免處理舊的通知事件
    const newTimestamp = new Date().toISOString();
    lastProcessedTimestamp.value = newTimestamp;
    console.log('✅ 已重置時間戳:', newTimestamp);

    // 清空對話歷史
    clearDialogHistory();
    console.log('✅ 已清空對話歷史');

    // 重置狀態
    isProcessing.value = false;
    isAIResponding.value = false;
    isEndingConsult.value = false;
    showStreamVideo.value = false;  // 切換回待機影片
    showInfoBox.value = false;
    firstFlag.value = true;  // 重置 firstFlag，防止倒數計時被觸發
    console.log('✅ 已重置狀態，切換回待機影片，已重置 firstFlag');

    // 延遲解鎖影片狀態和 isSpeaking，確保後端已完全停止
    setTimeout(() => {
      videoStateLocked.value = false;
      console.log('✅ 已解鎖影片狀態');

      // 確保待機影片正在播放
      const currentVideoRef = showVideo1.value ? videoRef1.value : videoRef2.value;
      if (currentVideoRef) {
        currentVideoRef.src = getNextVideo();
        currentVideoRef.play().catch((error) => {
          console.error('播放待機影片失敗:', error);
        });
        console.log('✅ 已重新啟動待機影片播放');
      }
    }, 300);

    // 延遲更長時間才解鎖 isSpeaking，確保後端數位人物已完全停止
    setTimeout(() => {
      isSpeakingLocked.value = false;
      console.log('✅ 已解鎖 isSpeaking，允許後端狀態更新');
    }, 1500);  // 延長至 1.5 秒，確保後端完全停止

    console.log('✅ 打斷對話完成，已回到待機狀態，不會觸發倒數計時');
  } catch (error) {
    console.error('❌ 打斷對話時發生錯誤:', error);
  } finally {
    // 設置冷卻時間，防止過快連續打斷
    setTimeout(() => {
      isInterrupting.value = false;
      console.log('✅ 打斷冷卻時間結束，可以再次打斷');
    }, INTERRUPT_COOLDOWN);
  }
}
</script>

<style scoped>
:deep(.dialog-history) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

:deep(.dialog-history::-webkit-scrollbar) {
  display: none; /* Chrome, Safari and Opera */
}
</style>
