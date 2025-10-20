import { createI18n } from 'vue-i18n'

const messages = {
    zh: {
        'info-box': {
            title: '快速提問'
        },
        questions: {
            'innovation-2025': '2025年三立創新內容',
            'first-drama': '三立第一部八點檔',
            'golden-bell': '三立得過的金鐘獎',
            'classic-drama': '三立的經典偶像劇',
            'popular-variety': '三立的熱門綜藝節目',
            'channels': '三立各頻道介紹',
            'history': '三立的歷史',
            'core-values': '三立的核心思想'
        },
        button: {
            'start-chat': '開始對話',
            'end-chat': '結束對話',
            'end-dialog': '完成對話',
            'restart-chat': '重啟對話',
            'continue-chat': '繼續對話',
            'interrupt': '打斷對話'
        },
        confirm: {
            'restart-title': '是否重新啟用對話？'
        },
        error: {
            'processing-failed': '處理失敗'
        },
        message: {
            'need-help': '請問還有我能夠協助的地方嗎?',
            'come-back': '若還有需要我協助的地方，隨時歡迎回來找我。',
            farewell: '期待下次見囉！希望您今天的體驗愉快。'
        },
        prompt: {
            'innovation-2025': '2025年有什麼創新內容',
            'first-drama': '三立第一部八點檔是',
            'golden-bell': '三立有得過金鐘獎嗎',
            'classic-drama': '三立有什麼經典偶像劇',
            'popular-variety': '三立有什麼熱門綜藝',
            'channels': '三立有哪些頻道',
            'history': '三立的歷史',
            'core-values': '三立的核心思想'
        }
    }
    // en: {
    //     'info-box': {
    //         title: 'Quick Questions'
    //     },
    //     questions: {
    //         'innovation-2025': 'What innovative content in 2025',
    //         'first-drama': 'What was SET\'s first 8pm drama',
    //         'golden-bell': 'Has SET won Golden Bell Awards',
    //         'classic-drama': 'What classic idol dramas does SET have',
    //         'popular-variety': 'What popular variety shows does SET have',
    //         'channels': 'What channels does SET have',
    //         'history': 'SET\'s history',
    //         'core-values': 'SET\'s core values'
    //     },
    //     button: {
    //         'start-chat': "Let's Chat",
    //         'end-chat': 'End Chat',
    //         'end-dialog': 'OK',
    //         'restart-chat': 'Restart Chat',
    //         'continue-chat': 'Continue Chat'
    //     },
    //     confirm: {
    //         'restart-title': 'Restart conversation?'
    //     },
    //     error: {
    //         'processing-failed': 'Processing failed'
    //     },
    //     message: {
    //         'need-help': 'Is there anything else I can assist you with?',
    //         'need-further-explanation': 'Would you like me to explain anything further?',
    //         'come-back': 'If you need more help, feel free to come back anytime.',
    //         farewell: 'I look forward to seeing you next time, and hope you had a pleasant experience today!',
    //         welcome: 'Maxgut Biochemical offers one‑stop skincare contract‑manufacturing services. If you have any questions, just tap the microphone button on the screen and ask me！'
    //     },
    //     prompt: {
    //         'innovation-2025': 'What innovative content in 2025',
    //         'first-drama': 'What was SET\'s first 8pm drama',
    //         'golden-bell': 'Has SET won Golden Bell Awards',
    //         'classic-drama': 'What classic idol dramas does SET have',
    //         'popular-variety': 'What popular variety shows does SET have',
    //         'channels': 'What channels does SET have',
    //         'history': 'SET\'s history',
    //         'core-values': 'SET\'s core values'
    //     }
    // }
}

const i18n = createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'zh',
    messages
})

export default i18n