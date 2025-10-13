<template>
  <div class="absolute left-1/2 -translate-x-1/2 z-20" style="width: 1080px; height: 572px; top: 1263px;">
    <div
      ref="chatContainer"
      class="chat-history bg-transparent h-full overflow-y-auto"
      style="padding: 180px 75px 0 75px;"
    >
      <!-- 只顯示最後一條 AI 回應（錄音或處理中時不顯示） -->
      <div v-if="lastAiMessage && !isRecording && !isProcessing">
        <p style="color: white; font-size: 38px; font-style: normal; font-weight: 500; line-height: 70px; letter-spacing: 2px; text-align: left;">
          {{ lastAiMessage }}
        </p>
      </div>
      <transition name="fade">
        <div v-if="isRecording || isProcessing">
          <p style="color: white; font-size: 38px; font-style: normal; font-weight: 500; line-height: 70px; letter-spacing: 2px; text-align: left;">
            <span class="dots"><span>.</span><span>.</span><span>.</span></span>
          </p>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watchEffect, watch, computed } from "vue";
import type { Dialog } from "../types/chat";

const props = defineProps<{
  dialogHistory: Dialog[];
  isRecording?: boolean;
  isProcessing?: boolean;
}>();

const chatContainer = ref<HTMLElement | null>(null);

// 獲取最後一條 AI 訊息
const lastAiMessage = computed(() => {
  const aiMessages = props.dialogHistory.filter(dialog => !dialog.isUser);
  return aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text : null;
});

// 监听对话历史长度变化和录音/处理状态
watchEffect(() => {
  // 显式追踪依赖
  const historyLength = props.dialogHistory?.length;
  const recording = props.isRecording;
  const processing = props.isProcessing;

  // 如果有对话历史或正在录音或正在处理
  if (historyLength || recording || processing) {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  }
});

watch(
  () => [props.isRecording, props.isProcessing],
  ([recording, processing]) => {
    if (recording || processing) {
      nextTick(() => {
        if (chatContainer.value) {
          chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
      });
    }
  }
);
</script>

<style scoped>
.chat-history {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.chat-history::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.shadow-text {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  user-select: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dots span {
  animation: dots 1.5s infinite;
  display: inline-block;
  opacity: 0;
  color: white;
}

.dots span:nth-child(1) {
  animation-delay: 0s;
}

.dots span:nth-child(2) {
  animation-delay: 0.3s;
}

.dots span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes dots {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.chat-history {
  user-select: none;
}
</style>
