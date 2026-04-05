<script setup>
/**
 * WaveEngine.vue
 * PixiJS WebGL 水波渲染引擎
 * - 底層為全螢幕 Canvas，直接操作 GPU 渲染，不干擾 DOM 排版
 * - 接收來自父層的顏色、波高、秒數進度並即時反應
 * - 效能控制：極省模式暫停 Ticker；頁面隱藏時自動暫停（Visibility API）
 */
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import * as PIXI from 'pixi.js'

const props = defineProps({
  colorA:       { type: String,  default: '#52a9ff' },
  colorB:       { type: String,  default: '#52a9ff' },
  opacity:      { type: Number,  default: 0.3 },
  waveHeight:   { type: Number,  default: 75 },
  progress:     { type: Number,  default: 0 },     // 0~100%（秒數進度）
  surface:      { type: String,  default: 'wave' }, // 'wave'|'flat'|'line'
  visible:      { type: Boolean, default: true },
  performance:  { type: String,  default: 'powersave' }, // 'standard'|'powersave'|'ultrasave'
  rise:         { type: String,  default: 'smooth' },
  scaleWidth:   { type: Number,  default: 1.5 },
  waterFill:    { type: Boolean, default: true },
  nightMode:    { type: Boolean, default: false },
  reset:        { type: String,  default: 'instant' },
})

const canvasEl = ref(null)
let app = null
let liquidFill = null   // 液體填充矩形
let waveSurface = null  // 波浪曲面
let wavePhase = 0       // 波浪相位（JS 驅動的動態值）
let currentWaveH = 0    // 當前波浪高度（用於平滑過渡）
let renderedSeconds = 0 // 讓繪製框架有自己的平滑秒數邏輯，避免 Vue 反應延遲

// DOM Refs for Line Mode
const scaleContainer = ref(null)
const secondLabel = ref(null)
let lastCurSec = -1

// ── 工具函式：hex string → PixiJS color number ────────────────
function toPixiColor(hex) {
  // nightMode 統一處理
  if (props.nightMode) return 0xff0000
  return parseInt(hex.replace('#', '0x'), 16)
}

// ── 繪製液體填充矩形 ────────────────────────────────────────
function drawFill() {
  if (!liquidFill) return
  const h = app.screen.height
  const w = app.screen.width
  const fillHeight = Math.max(0, (renderedSeconds / 60) * h)
  const y = h - fillHeight

  liquidFill.clear()
  if (props.surface === 'line' && !props.waterFill) return // 不畫填充
  
  liquidFill.fill({ color: toPixiColor(props.colorA), alpha: 1 })
  liquidFill.rect(0, y, w, fillHeight)
  liquidFill.fill()
}

// ── 繪製波浪曲面 ─────────────────────────────────────────────
function drawWave(phase) {
  if (!waveSurface) return
  const h = app.screen.height
  const w = app.screen.width
  const fillHeight = Math.max(0, (renderedSeconds / 60) * h)
  const pts = 120  // 曲線點數

  // 建立 Polygon 遮罩字串供 Vue 頂層使用
  let cssPolygon = `100% 100%, 0% 100%`

  waveSurface.clear()
  waveSurface.fill({ color: toPixiColor(props.colorA), alpha: 1 })

  // 繪製上緣波浪路徑
  waveSurface.moveTo(0, h)
  for (let i = 0; i <= pts; i++) {
    const x = (i / pts) * w
    const angle = (i / pts) * Math.PI * 2.5 + wavePhase
    const y = h - fillHeight - Math.sin(angle) * (currentWaveH / 2) - currentWaveH / 2
    waveSurface.lineTo(x, y)
    
    // 計算 clip-path 所需的百分比座標
    const px = (x / w * 100).toFixed(2)
    const py = (y / h * 100).toFixed(2)
    cssPolygon += `, ${px}% ${py}%`
  }
  
  waveSurface.lineTo(w, h)
  waveSurface.lineTo(0, h)
  waveSurface.closePath()
  waveSurface.fill()

  // 輸出給 CSS 使用
  document.body.style.setProperty('--dynamic-wave-polygon', `polygon(${cssPolygon})`)
}

// ── 繪製平滑遮罩 (Flat / Line mode) ────────────────────────────────
function updateFlatMask(fillHeight) {
  const h = app.screen.height
  const yPercent = (((h - fillHeight) / h) * 100).toFixed(2)
  document.body.style.setProperty('--dynamic-wave-polygon', `polygon(100% 100%, 0% 100%, 0% ${yPercent}%, 100% ${yPercent}%)`)
}
// (WebGl scale method removed - using DOM instead)

// ── PixiJS 初始化 ─────────────────────────────────────────────
async function initPixi() {
  app = new PIXI.Application()
  await app.init({
    canvas: canvasEl.value,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  })

  liquidFill = new PIXI.Graphics()
  waveSurface = new PIXI.Graphics()
  app.stage.addChild(liquidFill)
  app.stage.addChild(waveSurface)

  // Initialize DOM Scale Marks
  if (scaleContainer.value && scaleContainer.value.children.length === 0) {
    for (let i = 0; i <= 60; i++) {
      const mark = document.createElement('div')
      if (i % 10 === 0) mark.className = 'scale-mark major'
      else if (i % 5 === 0) mark.className = 'scale-mark medium'
      else mark.className = 'scale-mark'
      mark.dataset.second = i
      mark.style.bottom = `${(i / 60) * 100}%`
      scaleContainer.value.appendChild(mark)
    }
  }

  app.ticker.maxFPS = getFPS()

  app.ticker.add(() => {
    if (document.hidden) return
    
    const h = app.screen.height
    const dt = app.ticker.deltaTime

    // 高精準度計算目前秒數
    const now = new Date()
    const currentSeconds = now.getSeconds()
    const currentMilliseconds = now.getMilliseconds()
    
    let targetSeconds = currentSeconds
    if (props.rise === 'smooth') {
      targetSeconds = currentSeconds + currentMilliseconds / 1000
    }

    // 處理跨分重置 (Drain or Instant)
    if (currentSeconds === 0) {
      if (props.reset === 'instant' || targetSeconds === 0) {
        renderedSeconds = targetSeconds
      } else if (props.reset === 'drain') {
        if (renderedSeconds > targetSeconds && renderedSeconds > 1) {
          renderedSeconds *= Math.pow(0.85, dt) // 極速抽乾
          if (renderedSeconds < targetSeconds + 0.1) renderedSeconds = targetSeconds
        } else {
          renderedSeconds = targetSeconds
        }
      }
    } else {
      if (props.rise === 'step') {
        // 秒跳模式平滑往上移 (ease out)
        renderedSeconds += (targetSeconds - renderedSeconds) * 0.15 * dt
        if (Math.abs(targetSeconds - renderedSeconds) < 0.01) renderedSeconds = targetSeconds
      } else {
        renderedSeconds = targetSeconds
      }
    }

    // 移除 54 秒的壓制，允許液面抵達 60 (100% 高度)
    renderedSeconds = Math.min(renderedSeconds, 60)
    
    const fillHeight = Math.max(0, (renderedSeconds / 60) * h)
    const targetWaveH = (props.surface === 'wave') ? props.waveHeight : 0
    
    currentWaveH += (targetWaveH - currentWaveH) * 0.05 * dt

    if (!props.visible) return

    if (props.surface === 'wave') {
      wavePhase += 0.018 * dt
      // 不畫 drawFill() 避免重疊造成透明度改變
      liquidFill.clear()
      drawWave(wavePhase)
    } else if (props.surface === 'flat') {
      drawFill()
      updateFlatMask(fillHeight)
      waveSurface.clear()
    } else if (props.surface === 'line') {
      drawFill()
      updateFlatMask(fillHeight)
      waveSurface.clear()
      
      // 更新原汁原味的 DOM Label 和 Mark
      const curSec = currentSeconds
      const pct = (renderedSeconds / 60) * 100
      
      if (secondLabel.value) {
        secondLabel.value.textContent = curSec + 's'
        const th = (30 / window.innerHeight) * 100
        if (pct > (100 - th - 2)) {
          secondLabel.value.style.bottom = 'auto'
          secondLabel.value.style.top = `${100 - pct + 1}%`
        } else {
          secondLabel.value.style.top = 'auto'
          secondLabel.value.style.bottom = `${pct + 1}%`
        }
      }
      
      if (lastCurSec !== curSec && scaleContainer.value) {
        const prev = scaleContainer.value.querySelector('.scale-mark.current')
        if (prev) prev.classList.remove('current')
        const curr = scaleContainer.value.querySelector(`.scale-mark[data-second="${curSec}"]`)
        if (curr) curr.classList.add('current')
        lastCurSec = curSec
      }
      
    } else {
      liquidFill.clear()
      waveSurface.clear()
      document.body.style.setProperty('--dynamic-wave-polygon', `polygon(100% 100%, 0% 100%, 0% 100%, 100% 100%)`)
    }
  })
}

function getFPS() {
  if (props.performance === 'ultrasave') return 0
  if (props.performance === 'powersave') return 15
  return 60
}

// ── 監聽 Props 變化 ───────────────────────────────────────────
watch(() => props.performance, (mode) => {
  if (!app) return
  if (mode === 'ultrasave') {
    app.ticker.stop()
    liquidFill?.clear()
    waveSurface?.clear()
  } else {
    app.ticker.maxFPS = getFPS()
    app.ticker.start()
  }
})

watch(() => props.opacity, (v) => {
  if (app) app.stage.alpha = v
})

watch(() => props.visible, (v) => {
  if (!app) return
  if (!v) { liquidFill?.clear(); waveSurface?.clear() }
})

watch(() => props.waveHeight, () => { /* 波高直接由 drawWave 使用 */ })

// 進度改變（秒數跳動）重繪靜止模式
watch(() => props.progress, () => {
  if (props.surface !== 'wave') {
    drawFill()
  }
})

// ── 掛載與卸載 ────────────────────────────────────────────────
onMounted(async () => {
  await initPixi()

  // Visibility API：背景時暫停
  document.addEventListener('visibilitychange', onVisibilityChange)

  // 套用全域透明度
  app.stage.alpha = props.opacity
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  app?.destroy(false)
  app = null
})

function onVisibilityChange() {
  if (!app) return
  if (document.hidden) {
    app.ticker.stop()
  } else {
    if (props.performance !== 'ultrasave') app.ticker.start()
    // 重新繪製最新狀態
    if (props.surface === 'wave') {
      liquidFill.clear()
      drawWave(wavePhase)
    } else {
      drawFill()
      if (waveSurface) waveSurface.clear()
      if (props.surface === 'flat' || props.surface === 'line') {
        const h = app.screen.height
        updateFlatMask(Math.max(0, (renderedSeconds / 60) * h))
      }
    }
  }
}
</script>

<template>
  <div class="wave-engine" :style="{
    '--scale-width': scaleWidth,
    '--scale-color': nightMode ? '#ff0000' : '#ffffff',
    '--label-color': nightMode ? '#ff0000' : colorA
  }">
    <canvas ref="canvasEl"></canvas>

    <!-- 原汁原味的 DOM 刻度和文字 -->
    <div id="liquid-scale" v-show="surface === 'line' && visible" ref="scaleContainer"></div>
    <div id="liquid-second-label" v-show="surface === 'line' && visible" ref="secondLabel"></div>
  </div>
</template>

<style scoped>
.wave-engine {
  position: fixed;
  top: 0; left: 0; 
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1; /* Match original wave-canvas z-index to be behind the clock */
}
canvas {
  width: 100%; height: 100%;
  display: block;
}

#liquid-scale {
  position: absolute;
  left: 0;
  bottom: 0;
  width: calc(30px * var(--scale-width));
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

:deep(.scale-mark) {
  position: absolute;
  left: 0;
  width: calc(8px * var(--scale-width));
  height: calc(1.5px * var(--scale-width));
  background-color: var(--scale-color);
  opacity: 0.5;
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease;
}

:deep(.scale-mark.medium) {
  width: calc(12px * var(--scale-width));
  height: calc(2px * var(--scale-width));
  opacity: 0.7;
}

:deep(.scale-mark.major) {
  width: calc(16px * var(--scale-width));
  height: calc(2.5px * var(--scale-width));
  opacity: 0.9;
}

:deep(.scale-mark.current) {
  width: calc(28px * var(--scale-width)) !important;
  height: calc(3.5px * var(--scale-width)) !important;
  opacity: 1 !important;
  box-shadow: 0 0 8px var(--scale-color);
  z-index: 2;
}

#liquid-second-label {
  position: absolute;
  left: 3vw;
  bottom: auto;
  color: var(--label-color);
  font-size: 1.5vw;
  font-weight: 700;
  opacity: 0.8;
  pointer-events: none;
  z-index: 5;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: opacity 0.5s;
}
</style>
