<script setup>
/**
 * App.vue
 * 主應用入口
 * - 整合三大圖層：WaveEngine（底）→ DigitalClock（中）→ SettingsMenu（頂）
 * - 管理所有設定狀態與事件處理
 * - 處理點擊顯示/隱藏控制列
 * - 每小時自動換色（智慧洗牌）
 */
import { ref, computed, watch } from 'vue'
import WaveEngine   from './components/clock/WaveEngine.vue'
import DigitalClock from './components/clock/DigitalClock.vue'
import SettingsMenu from './components/ui/SettingsMenu.vue'
import { useTime }     from './composables/useTime.js'
import { useSettings } from './composables/useSettings.js'

// ── 設定狀態 ────────────────────────────────────────────────────────
const {
  is24Hour, isDateVisible, isBlinking,
  isNightMode,
  palettes, currentPaletteIndex, currentPalette,
  liquid,
  performanceMode, PERF_CONFIGS,
} = useSettings()

// ── 時間邏輯 ────────────────────────────────────────────────────────
const { hours, minutes, seconds, ampm, dateString, secondProgress, hourKey } = useTime(is24Hour)

// ── 當前顏色（夜間模式覆蓋）────────────────────────────────────────
const colorA = computed(() => isNightMode.value ? '#ff0000' : currentPalette().colors[0])
const colorB = computed(() => isNightMode.value ? '#ff0000' : currentPalette().colors[1])
const colorC = computed(() => {
  if (isNightMode.value) return '#ff0000'
  // 混合 colorA 和 colorB 的簡單邏輯（可用原版的 HEX 轉換或直接固定顏色）
  return currentPalette().colors[0] // 暫時回退為 A
})

const finalColorA = computed(() => {
  if (liquid.interact === 'swap') return colorB.value
  return colorA.value
})

const finalColorB = computed(() => {
  if (liquid.interact === 'swap') return colorA.value
  return colorB.value
})

const waveColor = computed(() => {
  if (liquid.interact === 'on') return colorC.value
  if (liquid.interact === 'swap') return colorB.value
  return colorA.value
})

// ── 每小時自動換色（智慧洗牌）────────────────────────────────────────
let availableBag = []
let lastHourKey = ''

watch(hourKey, (newKey) => {
  if (newKey === lastHourKey) return
  if (lastHourKey === '') { lastHourKey = newKey; return } // 首次忽略
  lastHourKey = newKey

  const enabledIdx = palettes
    .map((p, i) => (p.enabled ? i : -1))
    .filter(i => i !== -1)
  if (enabledIdx.length === 0) return

  const cleanBag = availableBag.filter(i => enabledIdx.includes(i))
  availableBag = cleanBag.length === 0 ? [...enabledIdx] : cleanBag

  const pick = Math.floor(Math.random() * availableBag.length)
  currentPaletteIndex.value = availableBag[pick]
  availableBag.splice(pick, 1)
})

// ── 控制列顯示 ────────────────────────────────────────────────────────
const showControls = ref(false)

function handleScreenTap() {
  showControls.value = !showControls.value
}

// ── 事件處理 ─────────────────────────────────────────────────────────
function selectPalette(idx) {
  currentPaletteIndex.value = idx
}

function togglePaletteEnabled(idx) {
  palettes[idx].enabled = !palettes[idx].enabled
}

function updateLiquid({ key, value }) {
  liquid[key] = value

  // 特殊規則：刻度模式強制秒跳
  if (key === 'surface' && value === 'line' && liquid.rise !== 'step') {
    liquid.rise = 'step'
  }
  // 極省模式不允許 swap
  if (key === 'interact' && value === 'swap' && performanceMode.value === 'ultrasave') {
    liquid.interact = 'off'
  }
}

function updatePerf(mode) {
  performanceMode.value = mode
  if (mode === 'ultrasave') {
    liquid.surface = 'flat'
    liquid.interact = 'off'
  }
}

function toggleNight() {
  isNightMode.value = !isNightMode.value
}

function updateTimeFormat(v) {
  is24Hour.value = v
}

function updateDate(v) {
  isDateVisible.value = v
}

function updateBlink(v) {
  isBlinking.value = v
}

function randomize() {
  // 隨機調色盤
  const enabled = palettes.map((p, i) => p.enabled ? i : -1).filter(i => i !== -1)
  if (enabled.length) {
    currentPaletteIndex.value = enabled[Math.floor(Math.random() * enabled.length)]
  }
  // 隨機液體
  const surfaces = ['wave', 'flat', 'line']
  liquid.surface   = surfaces[Math.floor(Math.random() * surfaces.length)]
  liquid.opacity   = [0.15, 0.3, 0.5][Math.floor(Math.random() * 3)]
  liquid.rise      = Math.random() > 0.5 ? 'smooth' : 'step'
  liquid.interact  = performanceMode.value === 'ultrasave' ? 'off' : ['off', 'on', 'swap'][Math.floor(Math.random() * 3)]
  liquid.reset     = Math.random() > 0.5 ? 'instant' : 'drain'
  liquid.visible   = Math.random() > 0.1
  // 其他
  isBlinking.value    = Math.random() > 0.5
  isDateVisible.value = Math.random() > 0.3
}
</script>

<template>
  <div
    class="app"
    :class="{ 'night-mode': isNightMode }"
    @click="handleScreenTap"
  >
    <!-- 夜間遮罩 -->
    <div class="night-overlay" :style="{ opacity: isNightMode ? 0.6 : 0 }" />

    <!-- 底層：PixiJS 水波 Canvas -->
    <WaveEngine
      :color-a="waveColor"
      :color-b="finalColorB"
      :opacity="liquid.opacity"
      :wave-height="liquid.waveHeight"
      :progress="secondProgress"
      :surface="liquid.visible ? liquid.surface : 'none'"
      :visible="liquid.visible"
      :performance="performanceMode"
      :rise="liquid.rise"
      :scale-width="liquid.scaleWidth"
      :water-fill="liquid.waterFill"
      :night-mode="isNightMode"
      :reset="liquid.reset"
    />

    <!-- 中層：主數字時鐘 -->
    <div class="clock-layer" style="z-index: 10;">
      <DigitalClock
        :hours="hours"
        :minutes="minutes"
        :seconds="seconds"
        :ampm="ampm"
        :date-string="dateString"
        :color-a="colorA"
        :color-b="colorB"
        :color-c="colorC"
        :is-blinking="isBlinking"
        :is-date-visible="isDateVisible"
        :is-night-mode="isNightMode"
        :performance-mode="performanceMode"
        :class="{ 'interact-on': liquid.interact === 'on' }"
      />
    </div>

    <!-- 中層：Swap 模式專用時鐘 (只在水面以下顯示) -->
    <div 
      v-if="liquid.interact === 'swap'" 
      class="clock-layer swap-clock" 
      style="z-index: 20; pointer-events: none; clip-path: var(--dynamic-wave-polygon);"
    >
      <DigitalClock
        :hours="hours"
        :minutes="minutes"
        :seconds="seconds"
        :ampm="ampm"
        :date-string="dateString"
        :color-a="colorB"
        :color-b="colorA"
        :color-c="colorC"
        :is-blinking="isBlinking"
        :is-date-visible="isDateVisible"
        :is-night-mode="isNightMode"
        :performance-mode="performanceMode"
        :is-swap="true"
      />
    </div>

    <!-- 頂層：設定選單（只在 showControls 時顯示按鈕） -->
    <SettingsMenu
      :show-controls="showControls"
      :palettes="palettes"
      :current-palette-index="currentPaletteIndex"
      :liquid="liquid"
      :is-night-mode="isNightMode"
      :is24-hour="is24Hour"
      :is-date-visible="isDateVisible"
      :is-blinking="isBlinking"
      :performance-mode="performanceMode"
      :perf-configs="PERF_CONFIGS"
      @select-palette="selectPalette"
      @toggle-palette-enabled="togglePaletteEnabled"
      @update-liquid="updateLiquid"
      @update-perf="updatePerf"
      @toggle-night="toggleNight"
      @randomize="randomize"
      @update-time-format="updateTimeFormat"
      @update-date="updateDate"
      @update-blink="updateBlink"
    />
  </div>
</template>

<style>
/* global reset */
*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #000;
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000;
}

.night-overlay {
  position: fixed;
  inset: 0;
  background: black;
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: 20;
}

.clock-layer {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: max(20px, env(safe-area-inset-left));
  padding-right: max(20px, env(safe-area-inset-right));
}
</style>
