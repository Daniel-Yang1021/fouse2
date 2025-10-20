interface SrsRtcPublisherAsync {
    constraints: {
        audio: boolean;
        video: {
            width: {
                ideal: number;
                max: number;
            };
        };
    };
    publish: (url: string) => Promise<any>;
    close: () => void;
    ontrack: (event: { track: MediaStreamTrack }) => void;
    stream: MediaStream;
}

interface Window {
    SrsRtcPublisherAsync: new () => SrsRtcPublisherAsync;
}
