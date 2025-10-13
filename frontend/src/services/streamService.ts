import { WHEP_URL, DEFAULT_STREAM_NAME } from "../constants/stream";
import '../lib/srs.sdk.js';

// SDK 類型聲明
declare global {
    interface Window {
        SrsRtcWhipWhepAsync: any;
    }
}

export class StreamService {
    private sdk: any = null;
    private videoElement: HTMLVideoElement | null = null;

    constructor(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
    }

    public startPlay(sessionId: string = "0"): Promise<void> {
        if (!this.videoElement) return Promise.reject("No video element provided");

        this.videoElement.style.display = "";
        if (this.sdk) {
            this.sdk.close();
        }

        this.sdk = new window.SrsRtcWhipWhepAsync();
        this.videoElement.srcObject = this.sdk.stream;

        const streamName = sessionId === "0" ? DEFAULT_STREAM_NAME : `${DEFAULT_STREAM_NAME}${sessionId}`;
        const url = `${WHEP_URL}?app=live&stream=${streamName}`;

        return this.sdk.play(url);
    }

    public close(): void {
        if (this.sdk) {
            this.sdk.close();
        }
    }
}
