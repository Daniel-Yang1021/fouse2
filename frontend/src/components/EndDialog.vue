<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
  >
    <div
      class="bg-white rounded-lg p-8 shadow-lg w-[90vw] max-w-xl flex flex-col items-center relative"
    >
      <div class="text-[2vw] font-bold mb-4 text-center">
        <template v-if="$i18n.locale === 'zh'">
          很高興為您服務，我準備了一份小禮物給您，可以憑以下編號<br />
          「<span class="text-blue-600 text-[3vw] font-bold">{{ code }}</span
          >」 向展位人員領取。期待下次見囉，希望您今天的體驗愉快！
        </template>
        <template v-else>
          It was a pleasure serving you. I've prepared a small gift for you;
          simply show the staff the following code to collect it:<br />
          「<span class="text-blue-600 text-[3vw] font-bold">{{ code }}</span
          >」
        </template>
      </div>
      <button
        class="mt-4 px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg text-[2vw] font-bold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        @click="$emit('close')"
        :disabled="disabled"
      >
        {{ t("button.end-dialog") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  show: boolean;
  code: string;
  disabled?: boolean;
}>();

defineEmits<{
  (e: "close"): void;
}>();

const { t } = useI18n();
</script>
