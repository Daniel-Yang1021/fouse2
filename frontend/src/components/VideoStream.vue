<template>
  <div id="media" style="width: 1080px; height: 1263px;">
    <video
      class="z-2 relative"
      style="width: 1080px; height: 1263px; object-fit: cover;"
      ref="videoRef"
      autoplay
      muted
      playsinline
    ></video>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { StreamService } from "../services/streamService";

const props = defineProps<{
  sessionId: string;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);

const setMuted = (muted: boolean) => {
  if (videoRef.value) {
    videoRef.value.muted = muted;
  }
};

defineExpose({
  setMuted,
});
const streamService = ref<StreamService | null>(null);

const emit = defineEmits<{
  (e: "error", message: string): void;
}>();

onMounted(async () => {
  if (videoRef.value) {
    streamService.value = new StreamService(videoRef.value);
    streamService.value.startPlay(props.sessionId).catch((reason: any) => {
      if (videoRef.value) videoRef.value.classList.add("hidden");
      emit("error", "串流連接失敗: " + reason);
    });
  }
});

onBeforeUnmount(() => {
  streamService.value?.close();
});
</script>
