<template>
  <div class="absolute top-8 right-[5vw] z-20 text-[2vw]">
    <div class="flex gap-4 items-center">
      <button
        v-for="lang in ['zh', 'en']"
        :key="lang"
        class="w-[12vw] py-[0.5vw] rounded-2xl border border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          locale === lang
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        @click="handleClick(lang)"
        :disabled="disabled"
      >
        {{ lang === "zh" ? "中文" : "EN" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  isSpeaking: boolean;
  disabled?: boolean;
  sessionId: string;
}>();

const emit = defineEmits<{
  (e: "language-change", value: string): void;
}>();

const { locale } = useI18n();

function handleClick(lang: string) {
  if (props.disabled) return;
  emit("language-change", lang);
}
</script>
