import { ref } from 'vue';
import { nextTick } from 'vue';

export function useAudioRecording() {
    const isRecording = ref(false);
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number | null = null;
    let silenceTimer: number | null = null;
    let autoStopCallback: (() => void) | null = null;
    let recordingStartTime: number = 0;

    // 音量閾值和靜音時長（毫秒）
    const VOLUME_THRESHOLD = 0.02; // 低於此值視為靜音
    const SILENCE_DURATION = 2000; // 2秒
    const MIN_RECORDING_DURATION = 5000; // 最少錄音5秒

    async function audioBufferToWav(
        audioBuffer: AudioBuffer
    ): Promise<ArrayBuffer> {
        const length = audioBuffer.length * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);

        const writeString = (view: DataView, offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, "RIFF");
        view.setUint32(4, 44 + length - 8, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 16000, true);
        view.setUint32(28, 16000 * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, length, true);

        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < channelData.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            const value = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(offset, value, true);
            offset += 2;
        }

        return buffer;
    }

    async function processAudio(audioBlob: Blob): Promise<Blob> {
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioData = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(audioData);

        const monoBuffer = audioContext.createBuffer(
            1,
            audioBuffer.length,
            audioBuffer.sampleRate
        );
        const monoData = monoBuffer.getChannelData(0);

        if (audioBuffer.numberOfChannels === 2) {
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.getChannelData(1);
            for (let i = 0; i < audioBuffer.length; i++) {
                monoData[i] = (left[i] + right[i]) / 2;
            }
        } else {
            const sourceData = audioBuffer.getChannelData(0);
            monoData.set(sourceData);
        }

        const wavBuffer = await audioBufferToWav(monoBuffer);
        return new Blob([wavBuffer], { type: "audio/wav" });
    }

    function startRecording(stream: MediaStream) {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/mp4";

        mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 16000,
        });

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        isRecording.value = true;
        recordingStartTime = Date.now();
        nextTick(() => {
            startVolumeAnalysis(stream);
            mediaRecorder?.start();
        });
    }

    function startVolumeAnalysis(stream: MediaStream) {
        if (!isRecording.value) {
            console.log('⚠️ startVolumeAnalysis: isRecording 為 false，停止執行');
            return;
        }

        console.log('✅ startVolumeAnalysis: 開始音量分析');
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2;
        source.connect(analyser);

        let logCounter = 0;
        const analyzeVolume = async () => {
            if (!analyser || !isRecording.value) {
                console.log('⚠️ analyzeVolume 停止: analyser =', !!analyser, ', isRecording =', isRecording.value);
                return;
            }

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            let maxAmplitude = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const amplitude = Math.abs(dataArray[i] - 128);
                sum += amplitude;
                maxAmplitude = Math.max(maxAmplitude, amplitude);
            }
            const average = sum / dataArray.length;
            const normalizedVolume = Math.min(1, (average + maxAmplitude) / 256);
            // 使用平方根放大小音量的效果，讓小聲音也有明顯波動
            const scale = 1.3 + (Math.sqrt(normalizedVolume) * 3);

            // 每 2 秒輸出一次音量狀態
            logCounter++;
            if (logCounter % 60 === 0) {  // 假設 60fps，約每秒輸出一次
                console.log('📊 音量檢測中, normalizedVolume:', normalizedVolume.toFixed(3), 'threshold:', VOLUME_THRESHOLD);
            }

            // 檢測靜音（只在錄音開始5秒後才啟用）
            const recordingElapsed = Date.now() - recordingStartTime;
            if (recordingElapsed >= MIN_RECORDING_DURATION) {
                if (normalizedVolume < VOLUME_THRESHOLD) {
                    // 音量低於閾值，開始計時（只觸發一次，忽略後續背景噪音）
                    if (silenceTimer === null) {
                        console.log('🔇 偵測到靜音，開始倒計時 2 秒, normalizedVolume:', normalizedVolume.toFixed(3));
                        silenceTimer = window.setTimeout(() => {
                            console.log('⏹️ 靜音持續 2 秒，自動停止錄音');
                            if (autoStopCallback) {
                                autoStopCallback();
                            }
                        }, SILENCE_DURATION);
                    }
                }
                // 不取消倒計時，忽略背景噪音干擾
            } else {
                // 還在 5 秒內，每 2 秒提示一次
                if (logCounter % 120 === 0) {
                    console.log('⏱️ 錄音進行中，剩餘', Math.ceil((MIN_RECORDING_DURATION - recordingElapsed) / 1000), '秒開始靜音檢測');
                }
            }

            await nextTick();

            // 更新動畫（可選，如果元素存在才更新）
            const animationEl = document.querySelector('.recording-animation');
            if (animationEl) {
                const waves = animationEl.querySelectorAll('.wave');
                if (waves.length > 0) {
                    waves.forEach((wave, index) => {
                        const waveEl = wave as HTMLElement;
                        const delay = index * 0.2;
                        const waveScale = scale * (1 + delay * 0.4);
                        waveEl.style.transform = `translate(-50%, -50%) scale(${waveScale})`;
                        // 波紋透明度：有聲音時更明顯
                        const opacityValue = 0.3 + (Math.sqrt(normalizedVolume) * 0.5);
                        waveEl.style.opacity = String(Math.min(0.8, opacityValue));
                    });
                }
            }

            // 持續執行音量分析（不依賴動畫元素）
            animationFrameId = requestAnimationFrame(analyzeVolume);
        };
        analyzeVolume();
    }

    async function stopRecording(): Promise<Blob | null> {
        return new Promise((resolve) => {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.onstop = async () => {
                    isRecording.value = false;
                    cleanup();
                    const audioBlob = new Blob(audioChunks);
                    audioChunks = [];
                    const processedBlob = await processAudio(audioBlob);
                    resolve(processedBlob);
                };
                mediaRecorder.stop();
            } else {
                isRecording.value = false;
                resolve(null);
            }
        });
    }

    function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }
        recordingStartTime = 0;
    }

    async function startAudioCapture(): Promise<void> {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                sampleSize: 16,
            },
            video: false,
        });

        startRecording(stream);
    }

    function setAutoStopCallback(callback: () => void) {
        autoStopCallback = callback;
    }

    return {
        isRecording,
        startAudioCapture,
        stopRecording,
        cleanup,
        setAutoStopCallback
    };
}
