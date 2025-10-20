export function loadSrsSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.SrsRtcWhipWhepAsync) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = "/lib/srs.sdk.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load srs.sdk.js"));
        document.head.appendChild(script);
    });
}
