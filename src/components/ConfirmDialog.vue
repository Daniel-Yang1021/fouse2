<template>
    <div v-if="isVisible" style="position: relative; z-index: 10000;">
      <!-- Lightbox 遮罩與主體 -->
      <div
        class="fixed inset-0 bg-black/40"
        style="pointer-events: auto; z-index: 10000;"
      ></div>
      <div
        class="fixed flex items-center justify-center"
        style="bottom: 0px; left: 50%; transform: translateX(-50%); pointer-events: auto; z-index: 10001;"
      >
        <!-- 外層背景 -->
        <div
          class="relative"
          style="width: 445px; height: 729px; transform: rotate(0deg); flex-shrink: 0; border-radius: 12px; background: rgba(229, 229, 229, 0.60); pointer-events: auto; z-index: 10010;"
        >
          <!-- 中間白底 -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-10"
            style="width: 397px; height: 635px; border-radius: 19px; background: rgb(255, 255, 255); padding: 32px; z-index: 10020;"
          >
            <!-- 標題文字（水平置中） -->
            <h2
              class="text-center font-bold"
              style="color: #333; font-size: 32px; font-weight: 700; letter-spacing: 3.2px; position: relative; z-index: 10050;"
            >
              {{ t('confirm.restart-title') }}
            </h2>

            <!-- 按鈕區域 -->
            <div class="flex flex-col gap-6" style="position: relative; z-index: 99998;">
              <button
                class="flex items-center justify-center text-center font-bold transition hover:opacity-90"
                style="width: 254px; height: 79px; border-radius: 40px; background: radial-gradient(50% 50% at 50% 50%, #E5E5E5 0%, #B8B8B8 100%); box-shadow: 0 1.6px 6.4px 0 rgba(0, 0, 0, 0.25); color: #4A4A4A; font-size: 25px; font-weight: 700; pointer-events: auto; cursor: pointer; position: relative; z-index: 99999;"
                @click.stop="handleCancel"
              >
                <span style="pointer-events: none;">{{ t('button.continue-chat') }}</span>
              </button>

              <button
                class="flex items-center justify-center text-center font-bold transition hover:opacity-90"
                style="width: 254px; height: 79px; border-radius: 40px; background: radial-gradient(50% 50% at 50% 50%, #FFF8E9 0%, #DEC799 100%); box-shadow: 0 1.6px 6.4px 0 rgba(0, 0, 0, 0.25); color: #80642F; font-size: 25px; font-weight: 700; pointer-events: auto; cursor: pointer; position: relative; z-index: 100000;"
                @click.stop="handleConfirm"
                @mousedown="() => console.log('mousedown on 重啟對話')"
                @mouseup="() => console.log('mouseup on 重啟對話')"
              >
                <span style="pointer-events: none;">{{ t('button.restart-chat') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from "vue-i18n";
  
  // 使用明確的類型定義
  interface ConfirmDialogProps {
    show?: boolean;
  }
  
  // 使用默認值
  const props = withDefaults(defineProps<ConfirmDialogProps>(), {
    show: false
  });
  
  // 使用計算屬性避免直接使用 props
  const isVisible = computed(() => !!props.show);
  
  // 明確的事件類型
  const emit = defineEmits<{
    (e: 'confirm'): void;
    (e: 'cancel'): void;
  }>();

  const { t } = useI18n();

  // 處理取消（繼續對話）
  function handleCancel() {
    console.log('ConfirmDialog: 繼續對話按鈕被點擊');
    emit('cancel');
  }

  // 處理確認（重啟對話）
  function handleConfirm() {
    console.log('ConfirmDialog: 重啟對話按鈕被點擊');
    emit('confirm');
  }
  </script>