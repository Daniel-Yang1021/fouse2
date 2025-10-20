# 數位人對話系統 - 完整流程圖

## 1. 系統初始化流程

```mermaid
graph TD
    A[頁面載入] --> B[初始化設定]
    B --> C[載入 SRS SDK]
    B --> D[初始化 i18n 語系]
    B --> E[啟動 isSpeaking 狀態輪詢]
    E --> F[每 200ms 檢查 /is_speaking API]
    B --> G[載入待機影片]
    G --> H[雙緩衝影片循環播放]
```

## 2. 用戶互動流程總覽

```mermaid
graph TD
    Start[待機畫面] --> Choice{用戶操作}
    Choice -->|點擊開始互動| Consult[開始對話]
    Choice -->|點擊 Info 按鈕| Info[顯示 InfoBox]
    Choice -->|點擊重新整理隱藏區| Reload[重新整理頁面]

    Consult --> Generate[生成 userId]
    Generate --> Ready[準備狀態]

    Ready --> UserInput{用戶輸入方式}
    UserInput -->|錄音| Recording[錄音流程]
    UserInput -->|Info 快速提問| InfoFlow[Info 流程]

    Recording --> AIResponse[AI 回應流程]
    InfoFlow --> AIResponse

    AIResponse --> Ready
```

## 3. 錄音對話流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant UI as 前端 UI
    participant Audio as 錄音模組
    participant API as 後端 API
    participant AI as AI 引擎

    User->>UI: 點擊「開始對話」按鈕
    UI->>Audio: startAudioCapture()
    Audio->>Audio: 開始音量檢測 (threshold: 0.02)
    Audio-->>UI: 開始錄音，顯示錄音動畫

    Note over User,Audio: 錄音中 (最長 30 秒)

    User->>UI: 再次點擊或自動停止
    UI->>Audio: stopRecording()
    Audio-->>UI: 返回 audioBlob

    UI->>UI: playThinkingVideo() - 播放思考影片
    UI->>API: POST /transcribe4 (audioBlob)
    API-->>UI: {input_text, text, userId}

    UI->>UI: addDialog(input_text, true) - 添加用戶對話
    UI->>API: POST /human {text, sessionid, userid}
    API-->>UI: 200 OK

    UI->>UI: startNotifyCheck() - 開始輪詢 notify events

    loop 每 100ms 輪詢
        UI->>API: POST /get_notify_events
        API-->>UI: {data: [{event, timestamp}]}

        alt event.status === 'start'
            UI->>UI: 切換到後端串流影片
            UI->>UI: addDialog(event.text, false) - 添加 AI 對話
            UI->>AI: 顯示 AI 說話影片 + 字幕
        end

        alt event.status === 'end'
            UI->>UI: stopNotifyCheck()
            UI->>UI: 1 秒後切換回待機影片
        end
    end
```

## 4. Info 按鈕流程（新優化機制）

```mermaid
graph TD
    A[用戶點擊 Info 按鈕] --> B{AI 是否正在說話/思考?}

    B -->|是| C[執行打斷 handleInterrupt]
    B -->|否| D[直接顯示 InfoBox]

    C --> C1[🛑 設置打斷標記]
    C1 --> C2[🔒 鎖定 isSpeaking 1.5秒]
    C2 --> C3[🔒 鎖定影片狀態 300ms]
    C3 --> C4[⏸️ 暫停本地影片]
    C4 --> C5[🔇 串流影片靜音]
    C5 --> C6[📤 發送 /human interrupt API]
    C6 --> C7[⏹️ 停止 notify events 輪詢]
    C7 --> C8[🗑️ 清空對話歷史]
    C8 --> C9[🔄 切換回待機影片]
    C9 --> D

    D --> E[顯示 InfoBox 選項列表]
    E --> F[用戶選擇問題]
    F --> G{Info 按鈕是否在冷卻中?}

    G -->|是| H[❌ 拒絕發送 console 警告]
    G -->|否| I[✅ 允許發送]

    I --> I1[🔒 啟動 10 秒冷卻]
    I1 --> I2[Info 按鈕顯示 disabled]
    I2 --> J[clearAllTimers]
    J --> K[播放思考影片]
    K --> L[POST /ai_chat_set]
    L --> M[收到 AI 回應文本]
    M --> N[POST /human API]
    N --> O[startNotifyCheck]
    O --> P[AI 回應流程]

    I1 --> Q[10 秒後自動解除冷卻]
    Q --> R[Info 按鈕恢復正常]

    style C fill:#ffcccc
    style C9 fill:#ccffcc
    style I1 fill:#ffffcc
    style I2 fill:#ffddaa
```

## 5. 打斷機制詳細流程

```mermaid
sequenceDiagram
    participant User as 用戶
    participant UI as 前端 UI
    participant State as 狀態管理
    participant API as 後端 API
    participant Video as 影片控制

    User->>UI: 點擊打斷按鈕/Info 按鈕

    UI->>State: 檢查 isInterrupting
    alt 正在處理打斷
        State-->>UI: 返回 (防抖動)
    end

    UI->>State: isInterrupting = true
    UI->>State: isInterrupted = true
    UI->>State: isSpeakingLocked = true (1.5秒)
    UI->>State: videoStateLocked = true (300ms)

    UI->>Video: 暫停並重置本地影片
    UI->>Video: 串流影片靜音

    UI->>API: POST /human {interrupt: true}
    API-->>UI: 200 OK

    UI->>UI: stopNotifyCheck() - 停止輪詢
    UI->>UI: clearAllTimers() - 清除計時器
    UI->>UI: clearDialogHistory() - 清空對話

    UI->>State: 重置所有狀態
    State->>State: isProcessing = false
    State->>State: isAIResponding = false
    State->>State: showStreamVideo = false
    State->>State: firstFlag = true

    Note over UI,Video: 延遲 300ms
    UI->>State: videoStateLocked = false
    UI->>Video: 重新播放待機影片

    Note over UI,State: 延遲 1500ms
    UI->>State: isSpeakingLocked = false

    Note over UI,State: 延遲 500ms (打斷冷卻)
    UI->>State: isInterrupting = false
```

## 6. 冷卻機制對比圖

```mermaid
graph TD
    subgraph "打斷按鈕冷卻 (500ms)"
        A1[點擊打斷] --> A2[isInterrupting = true]
        A2 --> A3[執行打斷邏輯]
        A3 --> A4[500ms 後 isInterrupting = false]
    end

    subgraph "Info 按鈕冷卻 (10秒)"
        B1[點擊 Info] --> B2{AI 在說話?}
        B2 -->|是| B3[觸發打斷 不啟動冷卻]
        B2 -->|否| B4[顯示 InfoBox 不啟動冷卻]
        B4 --> B5[用戶選擇問題發送]
        B5 --> B6[isInfoButtonOnCooldown = true]
        B6 --> B7[Info 按鈕 disabled 10 秒]
        B7 --> B8[10 秒後解除冷卻]
    end

    style A2 fill:#ffcccc
    style A4 fill:#ccffcc
    style B6 fill:#ffffcc
    style B7 fill:#ffddaa
    style B8 fill:#ccffcc
```

## 7. 狀態鎖定機制

```mermaid
gantt
    title 打斷操作後的狀態鎖定時間軸
    dateFormat X
    axisFormat %L ms

    section 打斷標記
    isInterrupted (永久直到下次操作) :done, 0, 2000

    section isSpeaking 鎖定
    isSpeakingLocked :crit, 0, 1500
    後端狀態可更新 :active, 1500, 2000

    section 影片狀態鎖定
    videoStateLocked :crit, 0, 300
    影片恢復控制 :active, 300, 2000

    section 打斷處理鎖定
    isInterrupting :crit, 0, 500
    可再次打斷 :active, 500, 2000
```

## 8. Notify Events 輪詢機制

```mermaid
graph TD
    A[startNotifyCheck] --> B[停止現有輪詢]
    B --> C[重置時間戳為當前時間]
    C --> D[notifyCheckCancelled = false]
    D --> E[啟動 100ms 間隔輪詢]

    E --> F{每 100ms 執行}
    F --> G{檢查是否已取消?}
    G -->|是| H[跳過檢查]
    G -->|否| I[POST /get_notify_events]

    I --> J{有新事件?}
    J -->|否| F
    J -->|是| K[按時間戳排序]

    K --> L{事件類型?}
    L -->|start| M[切換到串流影片]
    L -->|end| N[停止輪詢]

    M --> O[addDialog AI 回應]
    O --> P[isProcessing = false]
    P --> F

    N --> Q[1 秒後切換回待機影片]
    Q --> R[isAIResponding = false]

    style B fill:#ffcccc
    style C fill:#ffffcc
    style M fill:#ccffff
    style N fill:#ccffcc
```

## 9. 雙緩衝影片播放機制

```mermaid
stateDiagram-v2
    [*] --> Video1Playing

    Video1Playing: 顯示 Video1
    Video1Playing: 預載 Video2
    Video1Playing: showVideo1 = true

    Video2Playing: 顯示 Video2
    Video2Playing: 預載 Video1
    Video2Playing: showVideo2 = true

    ThinkingVideo: 播放思考影片
    ThinkingVideo: 監聽打斷標記

    StreamVideo: 顯示後端串流
    StreamVideo: 同步字幕

    Video1Playing --> Video2Playing: onended
    Video2Playing --> Video1Playing: onended

    Video1Playing --> ThinkingVideo: 用戶開始對話
    Video2Playing --> ThinkingVideo: 用戶開始對話

    ThinkingVideo --> StreamVideo: AI 開始說話
    ThinkingVideo --> Video1Playing: 被打斷
    ThinkingVideo --> Video2Playing: 被打斷

    StreamVideo --> Video1Playing: AI 說話結束
    StreamVideo --> Video2Playing: AI 說話結束
```

## 10. 完整用戶場景流程

### 場景 A: 正常對話流程

```mermaid
sequenceDiagram
    participant U as 用戶
    participant UI as 介面
    participant S as 狀態
    participant API as API

    U->>UI: 點擊「開始互動」
    UI->>S: 生成 userId
    UI->>UI: 顯示提示文字

    U->>UI: 點擊「開始對話」錄音
    UI->>S: isRecording = true
    Note over UI: 顯示錄音動畫

    U->>UI: 再次點擊停止錄音
    UI->>S: isRecording = false
    UI->>S: isProcessing = true
    UI->>UI: 播放思考影片

    UI->>API: POST /transcribe4
    API-->>UI: 轉錄結果

    UI->>API: POST /human
    API-->>UI: 200 OK

    UI->>UI: startNotifyCheck()

    loop 輪詢
        UI->>API: /get_notify_events
        API-->>UI: start event
    end

    UI->>UI: 切換到串流影片
    UI->>UI: 顯示字幕

    Note over U,UI: AI 說話中

    UI->>API: /get_notify_events
    API-->>UI: end event

    UI->>UI: 停止輪詢
    UI->>UI: 1秒後切回待機
```

### 場景 B: 快速連續點擊 Info（防呆機制）

```mermaid
sequenceDiagram
    participant U as 用戶
    participant UI as 介面
    participant S as 狀態 (isInfoButtonOnCooldown)

    U->>UI: 點擊 Info 按鈕 (第1次)
    UI->>UI: 顯示 InfoBox

    U->>UI: 選擇問題發送
    UI->>S: isInfoButtonOnCooldown = true
    Note over UI: Info 按鈕變 disabled
    UI->>UI: 發送訊息並播放

    U->>UI: 點擊 Info 按鈕 (第2次 - 3秒內)
    UI->>S: 檢查 isInfoButtonOnCooldown
    S-->>UI: true (冷卻中)
    UI-->>U: 🚫 顯示 disabled，點擊無效
    Note over UI: Console: 冷卻中，忽略點擊

    U->>UI: 點擊 Info 按鈕 (第3次 - 仍在冷卻)
    UI->>S: 檢查 isInfoButtonOnCooldown
    S-->>UI: true (冷卻中)
    UI-->>U: 🚫 顯示 disabled，點擊無效

    Note over S: 10 秒後
    S->>S: isInfoButtonOnCooldown = false
    Note over UI: Info 按鈕恢復正常

    U->>UI: 點擊 Info 按鈕 (第4次)
    UI->>S: 檢查 isInfoButtonOnCooldown
    S-->>UI: false (可用)
    UI->>UI: ✅ 顯示 InfoBox
```

### 場景 C: AI 說話時打斷並切換話題

```mermaid
sequenceDiagram
    participant U as 用戶
    participant UI as 介面
    participant S as 狀態
    participant API as API

    Note over U,API: AI 正在說話中

    U->>UI: 點擊 Info 按鈕
    UI->>UI: 檢測到 isSpeaking = true
    UI->>UI: handleInterrupt()

    UI->>S: isInterrupting = true
    UI->>S: isInterrupted = true
    UI->>S: isSpeakingLocked = true

    UI->>UI: 暫停影片
    UI->>API: POST /human {interrupt: true}
    UI->>UI: stopNotifyCheck()
    UI->>UI: clearDialogHistory()

    Note over UI: 300ms 後
    UI->>UI: 重啟待機影片

    Note over UI: 100ms 後
    UI->>UI: 顯示 InfoBox

    U->>UI: 選擇新問題
    UI->>S: isInfoButtonOnCooldown = true
    UI->>API: POST /ai_chat_set
    API-->>UI: 新問題的回應
    UI->>API: POST /human
    UI->>UI: startNotifyCheck()

    Note over UI: 開始新的 AI 回應循環
```

## 11. 錯誤處理流程

```mermaid
graph TD
    A[操作開始] --> B{可能的錯誤點}

    B -->|錄音失敗| C1[捕獲錯誤]
    B -->|API 請求失敗| C2[捕獲錯誤]
    B -->|影片載入失敗| C3[捕獲錯誤]

    C1 --> D[console.error 記錄]
    C2 --> D
    C3 --> D

    D --> E[重置相關狀態]
    E --> E1[isProcessing = false]
    E --> E2[isAIResponding = false]
    E --> E3[stopNotifyCheck]
    E --> E4[isInfoButtonOnCooldown = false]

    E --> F[顯示錯誤訊息給用戶]
    F --> G[showError 5 秒後自動隱藏]

    G --> H[返回待機狀態]
```

## 12. 主要狀態變數說明

| 狀態變數 | 用途 | 鎖定時間 |
|---------|------|---------|
| `isRecording` | 是否正在錄音 | - |
| `isProcessing` | 是否正在處理（思考影片） | - |
| `isAIResponding` | AI 是否正在回應 | - |
| `isSpeaking` | AI 是否正在說話 | - |
| `isSpeakingLocked` | 鎖定 isSpeaking 狀態 | 1.5 秒 |
| `isInterrupted` | 是否已被打斷 | 直到下次操作 |
| `isInterrupting` | 是否正在處理打斷 | 500ms |
| `videoStateLocked` | 鎖定影片狀態 | 300ms |
| `isInfoButtonOnCooldown` | Info 按鈕冷卻 | 10 秒 |
| `showStreamVideo` | 是否顯示串流影片 | - |
| `showInfoBox` | 是否顯示 InfoBox | - |

## 13. API 端點總覽

```mermaid
graph LR
    A[前端] --> B[/is_speaking - 每 200ms]
    A --> C[/transcribe4 - 語音轉文字]
    A --> D[/ai_chat_set - Info 文字訊息]
    A --> E[/human - 發送到 AI]
    A --> F[/get_notify_events - 每 100ms]
    A --> G[/get_current_config - 初始化]
    A --> H[/get_avatars - 取得角色]
    A --> I[/get_voices - 取得聲音]

    B --> J[https://talk-dev.aitago.tw]
    C --> K[https://talk-dev.aitago.tw:9880]
    D --> K
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
```

---

## 總結

此系統實現了完整的數位人對話功能，包含：

1. **錄音對話**：語音輸入 → 轉錄 → AI 回應
2. **快速提問**：Info 按鈕 → 預設問題 → AI 回應
3. **打斷機制**：隨時打斷 AI 說話，重置狀態
4. **冷卻防呆**：
   - Info 按鈕：10 秒冷卻，防止快速連續發送
   - 打斷按鈕：500ms 冷卻，防止過快連續打斷
   - **獨立計時**：互不干擾
5. **狀態管理**：多層鎖定機制確保狀態一致性
6. **影片同步**：雙緩衝 + 串流切換，流暢過渡
7. **錯誤處理**：完整的異常捕獲和狀態恢復

所有機制協同工作，提供流暢的用戶體驗。
