<template>
  <div class="absolute left-1/2 -translate-x-1/2 z-20" style="top: 1120px;">
    <template v-if="!isConsulting">
      <button
        class="transition flex flex-col items-center justify-center ripple-button disabled:opacity-50 disabled:cursor-not-allowed"
        style="width: 222px; height: 225px; border-radius: 225px; border: 5px solid #CCBC80; background: linear-gradient(145deg, #C1B47E 8.98%, #8D7551 81.19%); box-shadow: 0 1px 7.7px 0 rgba(0, 0, 0, 0.65);"
        @click="$emit('consultClick')"
        :disabled="disabled"
      >
        <span style="color: #FFF; text-shadow: -32px -32px 32px rgba(0, 0, 0, 0.01), 8px 8px 16px rgba(0, 0, 0, 0.08), 4px 4px 8px rgba(0, 0, 0, 0.16); -webkit-text-stroke-width: 0.43px; -webkit-text-stroke-color: #000; font-family: 'Noto Sans Thai UI'; font-size: 56px; font-style: normal; font-weight: 700; line-height: 69px; letter-spacing: 2.8px;">開始</span>
        <span style="color: #FFF; text-shadow: -32px -32px 32px rgba(0, 0, 0, 0.01), 8px 8px 16px rgba(0, 0, 0, 0.08), 4px 4px 8px rgba(0, 0, 0, 0.16); -webkit-text-stroke-width: 0.43px; -webkit-text-stroke-color: #000; font-family: 'Noto Sans Thai UI'; font-size: 56px; font-style: normal; font-weight: 700; line-height: 69px; letter-spacing: 2.8px;">互動</span>
      </button>
    </template>

    <template v-else>
      <!-- 更多資訊按鈕 -->
      <button
        class="flex flex-col justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
        style="position: absolute; top: -198px; left: 70%; transform: translateX(325px); width: 108px; height: 108px; gap: 16px; border-radius: 100px; background: radial-gradient(50% 50% at 50% 50%, #EBD8B2 0%, #CDB689 100%); z-index: 100;"
        @click="$emit('showInfo')"
        :disabled="disabled"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="52" viewBox="0 0 12 34" fill="none">
          <path d="M6.69479 9.49833C8.30983 9.49833 9.61807 10.8547 9.61807 12.5291V27.9049C10.1698 28.2352 10.601 28.745 10.8448 29.3553C11.0886 29.9656 11.1314 30.6422 10.9665 31.2802C10.8016 31.9183 10.4382 32.482 9.93278 32.8842C9.42733 33.2863 8.80802 33.5043 8.1709 33.5043H6.75268C6.36879 33.5043 5.98866 33.4259 5.63399 33.2736C5.27932 33.1213 4.95706 32.8981 4.68561 32.6166C4.41416 32.3352 4.19883 32.0011 4.05192 31.6334C3.90501 31.2657 3.8294 30.8716 3.8294 30.4736V15.4998C3.06177 15.4998 2.32558 15.1837 1.78279 14.6209C1.24 14.0582 0.935059 13.2949 0.935059 12.4991C0.935059 11.7032 1.24 10.94 1.78279 10.3772C2.32558 9.81448 3.06177 9.49833 3.8294 9.49833H6.69479ZM6.72373 0.496094C7.49136 0.496094 8.22755 0.812244 8.77034 1.37499C9.31313 1.93774 9.61807 2.70099 9.61807 3.49684C9.61807 4.29269 9.31313 5.05594 8.77034 5.61869C8.22755 6.18144 7.49136 6.49759 6.72373 6.49759C5.95611 6.49759 5.21992 6.18144 4.67713 5.61869C4.13434 5.05594 3.8294 4.29269 3.8294 3.49684C3.8294 2.70099 4.13434 1.93774 4.67713 1.37499C5.21992 0.812244 5.95611 0.496094 6.72373 0.496094Z" fill="#333333"/>
        </svg>
      </button>

      <div class="relative">
        <!-- 麥克風按鈕 -->
        <button
          v-if="isRecording"
          class="rounded-full flex items-center justify-center transition relative recording disabled:opacity-50 disabled:cursor-not-allowed"
          style="width: 222px; height: 222px; border: 5px solid #CCBC80; background: linear-gradient(145deg, #C1B47E 8.98%, #8D7551 81.19%); box-shadow: 0 1px 7.7px 0 rgba(0, 0, 0, 0.65); overflow: visible;"
          @click="$emit('recordingClick')"
        >
          <!-- 波紋動畫容器（絕對定位） -->
          <div class="recording-animation" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
            <div class="wave wave-1"></div>
            <div class="wave wave-2"></div>
            <div class="wave wave-3"></div>
          </div>
          <!-- 圓形（與聲波同大小） -->
          <div class="bg-white" style="width: 30%; height: 30%; border-radius: 50%; z-index: 10;"></div>
        </button>
        <button
          v-else
          class="transition flex flex-col items-center justify-center ripple-button disabled:opacity-50 disabled:cursor-not-allowed"
          style="width: 222px; height: 225px; border-radius: 225px; border: 5px solid #CCBC80; background: linear-gradient(145deg, #C1B47E 8.98%, #8D7551 81.19%); box-shadow: 0 1px 7.7px 0 rgba(0, 0, 0, 0.65);"
          @click="showInterrupt ? $emit('interrupt') : $emit('recordingClick')"
          :disabled="disabled"
        >
          <!-- 根據狀態顯示不同圖標 -->
          <template v-if="showInterrupt">
            <!-- 打斷對話：禁止圖標 -->
            <svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70" fill="none" style="filter: drop-shadow(0 1.6px 4.1px rgba(0, 0, 0, 0.25)); margin-bottom: 13px;">
              <circle cx="35" cy="35" r="28" stroke="white" stroke-width="5" stroke-linecap="round"/>
              <line x1="15" y1="15" x2="55" y2="55" stroke="white" stroke-width="5" stroke-linecap="round"/>
            </svg>
            <span style="color: #FFF; text-shadow: -32px -32px 32px rgba(0, 0, 0, 0.01), 8px 8px 16px rgba(0, 0, 0, 0.08), 4px 4px 8px rgba(0, 0, 0, 0.16); -webkit-text-stroke-width: 0.43px; -webkit-text-stroke-color: #000; font-family: 'Noto Sans Thai UI'; font-size: 33px; font-style: normal; font-weight: 700; line-height: 100%; letter-spacing: 1.67px;">{{ t('button.interrupt') }}</span>
          </template>
          <template v-else>
            <!-- 開始對話：麥克風圖標 -->
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="82" viewBox="0 0 48 62" fill="none" style="filter: drop-shadow(0 1.6px 4.1px rgba(0, 0, 0, 0.25)); margin-bottom: 13px;">
              <g filter="url(#filter0_d_3104_205)">
                <path d="M15.9248 12.0258C15.9248 9.85343 16.7756 7.77007 18.29 6.23399C19.8045 4.69792 21.8585 3.83496 24.0003 3.83496C26.142 3.83496 28.196 4.69792 29.7105 6.23399C31.2249 7.77007 32.0757 9.85343 32.0757 12.0258V25.6771C32.0757 27.8495 31.2249 29.9328 29.7105 31.4689C28.196 33.005 26.142 33.8679 24.0003 33.8679C21.8585 33.8679 19.8045 33.005 18.29 31.4689C16.7756 29.9328 15.9248 27.8495 15.9248 25.6771V12.0258Z" stroke="white" stroke-width="4.41" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5.15723 25.6748C5.15723 30.7436 7.14244 35.6048 10.6761 39.189C14.2098 42.7731 19.0025 44.7867 23.9999 44.7867M23.9999 44.7867C28.9973 44.7867 33.7901 42.7731 37.3237 39.189C40.8574 35.6048 42.8427 30.7436 42.8427 25.6748M23.9999 44.7867V55.7078M13.2327 55.7078H34.7672" stroke="white" stroke-width="4.41" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
                <filter id="filter0_d_3104_205" x="0.352149" y="0.0298829" width="47.2957" height="61.4832" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="1"/>
                  <feGaussianBlur stdDeviation="1.3"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3104_205"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3104_205" result="shape"/>
                </filter>
              </defs>
            </svg>
            <span style="color: #FFF; text-shadow: -32px -32px 32px rgba(0, 0, 0, 0.01), 8px 8px 16px rgba(0, 0, 0, 0.08), 4px 4px 8px rgba(0, 0, 0, 0.16); -webkit-text-stroke-width: 0.43px; -webkit-text-stroke-color: #000; font-family: 'Noto Sans Thai UI'; font-size: 33px; font-style: normal; font-weight: 700; line-height: 100%; letter-spacing: 1.67px;">開始對話</span>
          </template>
        </button>
        
        <!-- 重啟對話按鈕 - 放在info按鈕下方 -->
        <button
          class="absolute rounded-full shadow-lg flex flex-col items-center justify-center"
          :class="{
            'opacity-50 cursor-not-allowed': disabled
          }"
          style="display: flex; width: 108px; height: 105px; flex-direction: column; justify-content: center; align-items: center; gap: 5px; flex-shrink: 0; background: radial-gradient(50% 50% at 50% 50%, #EBD8B2 0%, #CDB689 100%); left: 70%; transform: translateX(325px); top: -67px;"
          :disabled="disabled"
          @click="openConfirmDialog"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 28 28" fill="none" style="width: 30px; height: 30px; flex-shrink: 0;">
            <path d="M13.1629 4.55338C15.4463 4.36695 17.7257 5.01951 19.5766 6.38955C21.4275 7.7596 22.7238 9.75376 23.2242 12.0007C23.7245 14.2477 23.3948 16.5943 22.2964 18.6036C21.198 20.613 19.4058 22.1481 17.2535 22.9231C15.1011 23.6982 12.7354 23.6604 10.5967 22.8167C8.45808 21.973 6.69227 20.381 5.62809 18.3371C4.56391 16.2931 4.2739 13.9366 4.81206 11.7062C5.35022 9.4759 6.67986 7.52374 8.55342 6.21326" stroke="#333333" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15.8189 8.37852L13.0973 4.48515L16.9597 1.78516" stroke="#333333" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="color: #333; font-family: 'Noto Sans Thai UI'; font-size: 17.5px; font-style: normal; font-weight: 700; line-height: 100%; letter-spacing: 1.22px;">{{ t('button.restart-chat') }}</span>
        </button>
      </div>
    </template>

    <!-- 確認重啟對話彈窗 -->
    <ConfirmDialog
      :show="showConfirmDialog"
      @confirm="confirmRestart"
      @cancel="closeConfirmDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from "vue-i18n";
import ConfirmDialog from './ConfirmDialog.vue';

defineProps<{
  isRecording: boolean;
  isConsulting: boolean;
  formattedTime: string;
  disabled?: boolean;
  showInterrupt?: boolean;
}>();

const emit = defineEmits<{
  (e: "consultClick"): void;
  (e: "recordingClick"): void;
  (e: "showInfo"): void;
  (e: "restartClick"): void;
  (e: "interrupt"): void;
}>();

const { t } = useI18n();

// 確認對話框狀態
const showConfirmDialog = ref(false);

// 打開確認對話框
function openConfirmDialog() {
  showConfirmDialog.value = true;
}

// 確認重啟對話
function confirmRestart() {
  console.log('ConsultButton: confirmRestart 被調用');
  showConfirmDialog.value = false;
  emit('restartClick'); // 觸發重啟事件
}

// 關閉確認對話框
function closeConfirmDialog() {
  showConfirmDialog.value = false;
}
</script>

<style scoped>
.recording {
  cursor: pointer;
}

.recording-animation {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  transform-origin: center;
  transition: transform 0.15s ease-out, opacity 0.15s ease-out;
  pointer-events: none;
  will-change: transform, opacity;
  border: 6px solid transparent;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.wave-1 {
  width: 30%;
  height: 30%;
  border-color: rgba(255, 255, 255, 0.5);
  z-index: 3;
}

.wave-2 {
  width: 30%;
  height: 30%;
  border-color: rgba(255, 255, 255, 0.5);
  z-index: 2;
}

.wave-3 {
  width: 30%;
  height: 30%;
  border-color: rgba(255, 255, 255, 0.5);
  z-index: 1;
}

.ripple-button {
  position: relative;
  overflow: visible;
}

.ripple-button::before,
.ripple-button::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #B9AB79;
  border-radius: 50%;
  transform: scale(1);
  box-shadow: 0 0 5px #B9AB79;
}

.ripple-button:not(:disabled)::before {
  animation: ripple 2s linear infinite;
}

.ripple-button:not(:disabled)::after {
  animation: ripple 2s linear infinite 1s;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>