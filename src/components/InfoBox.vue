<template>
  <div v-if="show">
    <!-- Lightbox 遮罩與主體 -->
    <div
      class="fixed inset-0 bg-black/40 z-40"
      style="pointer-events: auto"
    ></div>
    <div
      class="fixed inset-0 flex items-center justify-center z-50"
      style="pointer-events: none"
    >
      <!-- 外層背景 -->
      <div
        class="relative"
        style="width: 729px; height: 630px; transform: rotate(90deg); flex-shrink: 0; border-radius: 12px; background: rgba(229, 229, 229, 0.60); pointer-events: auto;"
      >
        <button
          class="absolute w-16 h-16 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-gray-800 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-4xl"
          style="top: -24px; left: -24px; transform: rotate(-90deg);"
          @click="emit('close')"
          aria-label="關閉"
          :disabled="disabled"
        >
          ✕
        </button>

        <!-- 中間白底 -->
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row items-center"
          style="display: flex; width: 576px; height: 443px; justify-content: center; align-items: center; gap: 10px; flex-shrink: 0; border-radius: 19px; background: #FFF;"
        >
          <!-- 按鈕列表 -->
          <button
            v-for="item in questionItems"
            :key="item.key"
            class="flex items-center justify-center text-center font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
            style="display: flex; width: 59px; height: 387px; flex-direction: column; justify-content: center; align-items: center; gap: 16px; flex-shrink: 0; border-radius: 8px; background: radial-gradient(50% 50% at 50% 50%, #FFF8E9 0%, #DEC799 100%); box-shadow: 0 1.6px 6.4px 0 rgba(0, 0, 0, 0.25); white-space: nowrap;"
            :class="{ 'hover:opacity-90': !disabled }"
            @click="handleItemClick(item)"
            :disabled="disabled"
          >
            <span style="transform: rotate(-90deg); display: inline-block; color: #80642F; text-align: center; font-family: 'Noto Sans Thai UI'; font-size: 29px; font-style: normal; font-weight: 700; line-height: 100%; letter-spacing: 1.4px;">{{ t(item.key) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  show: boolean;
  sessionId: string;
  disabled?: boolean;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "send-message", message: string): void;
}>();

interface MenuItem {
  key: string;
}

const questionItems: MenuItem[] = [
  { key: "questions.innovation-2025" },
  { key: "questions.first-drama" },
  { key: "questions.golden-bell" },
  { key: "questions.classic-drama" },
  { key: "questions.popular-variety" },
  { key: "questions.channels" },
  { key: "questions.history" },
  { key: "questions.core-values" },
];

function handleItemClick(item: MenuItem) {
  if (props.disabled) return;
  emit("close");
  emit("send-message", t(item.key));  // 發送按鈕顯示的文字（questions）
}
</script>