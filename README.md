# AI 對話系統 - 即時對嘴功能

基於 Vue 3 + TypeScript + Vite 構建的即時 AI 對話系統，具備完整的對嘴(lip-sync)功能。

## 🎯 系統概覽

這是一個即時 AI 對話系統，支援語音輸入、AI 回應，並具備完美的唇形同步效果。

### 核心工作流程
```
用戶語音 → 語音轉錄 → AI對話 → TTS + 唇形生成 → WebRTC串流 → 同步播放
```

## 🏗️ 技術架構

### 前端技術棧
- **Vue 3** - 響應式 UI 框架
- **TypeScript** - 類型安全
- **Vite** - 快速建構工具
- **WebRTC** - 即時媒體串流
- **Web Audio API** - 音頻處理

### 核心功能模組

#### 1. 音頻錄製與處理 (`src/composables/useAudioRecording.ts`)
- 使用 `MediaRecorder API` 錄製用戶語音
- 音頻格式轉換：`webm/opus → 16kHz WAV` 單聲道
- 即時音量分析用於視覺回饋動畫

#### 2. 語音轉錄 (`src/api/chatApi.ts`)
- 將音頻檔案發送至語音轉錄 API
- 支援多語言切換
- 返回轉錄文字供 AI 處理

#### 3. AI 對話處理 (`src/composables/useChat.ts`)
- 發送轉錄文字到後端 AI 系統
- 觸發 AI 回應生成
- 管理對話狀態和歷史記錄

#### 4. 即時串流播放 (`src/services/streamService.ts`)
- 使用 WebRTC (SRS SDK) 進行低延遲串流
- 支援多 Session 管理
- 自動處理音視頻同步

## 🔄 對嘴同步原理

### 後端處理流程
1. **TTS 音頻生成**：將文字轉換為語音並記錄音素時間戳
2. **唇形視頻生成**：基於音素分析生成對應的嘴型動畫
3. **音視頻同步**：確保時間軸完全對齊並封裝為媒體流

### 前端播放機制
1. **WebRTC 低延遲傳輸**：使用 WHEP 協議進行即時串流
2. **自動同步播放**：`VideoStream` 組件自動處理音視頻同步
3. **狀態監控**：每 500ms 檢查說話狀態以控制 UI

## 📍 API 端點配置

### 串流服務 (`src/constants/stream.ts`)
```typescript
STREAM_BASE_URL = "https://talk-dev.aitago.tw:1986"
WHEP_URL = "https://talk-dev.aitago.tw:1986/rtc/v1/whep/"
```

### API 服務 (`src/api/chatApi.ts`)
```typescript
API_BASE_URL = "https://talk-dev.aitago.tw"          // 主要 API
API_TRANSCRIBE_URL = "https://talk-dev.aitago.tw:9880"  // 語音轉錄 API
```

### 完整串流 URL 格式
```
https://talk-dev.aitago.tw:1986/rtc/v1/whep/?app=live&stream=livestream[sessionId]
```

## 🎨 主要功能

- ✅ 即時語音錄製與轉錄
- ✅ AI 智能對話回應
- ✅ 完美的唇形同步效果
- ✅ 多語言支援 (中文/英文)
- ✅ 低延遲 WebRTC 串流
- ✅ 響應式 UI 設計
- ✅ 對話歷史管理
- ✅ 自動對話超時處理

## 🚀 開發運行

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置生產版本
```bash
npm run build
```

### 預覽生產版本
```bash
npm run preview
```

## 📁 專案結構

```
src/
├── api/              # API 呼叫邏輯
├── components/       # Vue 組件
├── composables/      # 組合式 API
├── constants/        # 常數配置
├── i18n/            # 國際化配置
├── services/        # 服務層
├── types/           # TypeScript 類型定義
├── utils/           # 工具函數
└── views/           # 頁面組件
```

## 🔧 核心組件說明

- **`VideoStream.vue`** - 負責 WebRTC 串流接收和播放
- **`useAudioRecording.ts`** - 音頻錄製和處理邏輯
- **`useChat.ts`** - 對話狀態管理和 API 呼叫
- **`StreamService.ts`** - WebRTC 串流服務封裝

## 💡 技術亮點

- **毫秒級音視頻同步** - WebRTC 確保超低延遲
- **即時對嘴生成** - 非預錄視頻，AI 即時生成
- **多 Session 支援** - 支援多用戶同時使用
- **優雅降級處理** - 網路異常時的備用方案
- **響應式設計** - 適配各種設備尺寸

## 📱 使用方式

1. 點擊「開始諮詢」按鈕開始對話
2. 按住麥克風按鈕進行語音輸入
3. AI 會即時回應並展示同步的唇形動畫
4. 支援文字輸入作為替代方案
5. 自動處理對話超時和結束流程

---

Built with ❤️ using Vue 3 + TypeScript + WebRTC
