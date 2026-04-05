<script setup>
/**
 * SettingsMenu.vue
 * 主控制列：包含所有的面板切換按鈕
 * 並整合 PalettePicker、LiquidSettings、PerformancePanel 作為滑出面板
 */
import { ref } from 'vue'
import PalettePicker   from './PalettePicker.vue'
import LiquidSettings  from './LiquidSettings.vue'
import PerformancePanel from './PerformancePanel.vue'

const props = defineProps({
  palettes:            { type: Array,   required: true },
  currentPaletteIndex: { type: Number,  required: true },
  liquid:              { type: Object,  required: true },
  isNightMode:         { type: Boolean, required: true },
  is24Hour:            { type: Boolean, required: true },
  isDateVisible:       { type: Boolean, required: true },
  isBlinking:          { type: Boolean, required: true },
  performanceMode:     { type: String,  required: true },
  perfConfigs:         { type: Object,  required: true },
  showControls:        { type: Boolean, default: false },
})

const emit = defineEmits([
  'select-palette', 'toggle-palette-enabled',
  'update-liquid', 'update-perf',
  'toggle-night', 'randomize',
  'update-time-format', 'update-date', 'update-blink',
])

// 目前開啟的面板
const openPanel = ref(null)

function togglePanel(name) {
  openPanel.value = openPanel.value === name ? null : name
}

function closeAll() {
  openPanel.value = null
}
</script>

<template>
  <!-- 點擊背景關閉面板 -->
  <div v-if="openPanel" class="panel-backdrop" @click="closeAll" />

  <div class="controls" :class="{ show: showControls }">
    <button class="btn" @click.stop="togglePanel('palette')">🎨<span class="btn-text"> 換色</span></button>
    <button class="btn" @click.stop="togglePanel('time')">⏰<span class="btn-text"> 時間</span></button>
    <button class="btn" @click.stop="togglePanel('liquid')">🌊<span class="btn-text"> 液體</span></button>
    <button class="btn" @click.stop="togglePanel('perf')">⚡<span class="btn-text"> 效能</span></button>
    <button class="btn" @click.stop="emit('randomize')">🎲<span class="btn-text"> 隨機</span></button>
    <button class="btn" @click.stop="emit('toggle-night')">🌙<span class="btn-text"> {{ isNightMode ? '日間' : '夜間' }}</span></button>
  </div>

  <!-- 調色盤面板 -->
  <div class="panel" :class="{ visible: openPanel === 'palette' }" @click.stop>
    <PalettePicker
      :palettes="palettes"
      :current-palette-index="currentPaletteIndex"
      @select="emit('select-palette', $event)"
      @toggle-enabled="emit('toggle-palette-enabled', $event)"
    />
  </div>

  <!-- 時間設定面板 -->
  <div class="panel time-panel" :class="{ visible: openPanel === 'time' }" @click.stop>
    <div class="panel-header">⏰ 時間日期設定</div>

    <div class="section">
      <div class="section-title">時制</div>
      <div class="options">
        <div class="opt" :class="{ active: !is24Hour }" @click="emit('update-time-format', false)">12H</div>
        <div class="opt" :class="{ active: is24Hour  }" @click="emit('update-time-format', true)">24H</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">日期</div>
      <div class="options">
        <div class="opt" :class="{ active: isDateVisible  }" @click="emit('update-date', true)">顯示</div>
        <div class="opt" :class="{ active: !isDateVisible }" @click="emit('update-date', false)">隱藏</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">分隔符閃爍</div>
      <div class="options">
        <div class="opt" :class="{ active: isBlinking  }" @click="emit('update-blink', true)">開</div>
        <div class="opt" :class="{ active: !isBlinking }" @click="emit('update-blink', false)">關</div>
      </div>
    </div>
  </div>

  <!-- 液體設定面板 -->
  <div class="panel liquid-panel" :class="{ visible: openPanel === 'liquid' }" @click.stop>
    <div class="panel-header">🌊 液體設定</div>
    <LiquidSettings :liquid="liquid" @update="emit('update-liquid', $event)" />
  </div>

  <!-- 效能面板 -->
  <div class="panel" :class="{ visible: openPanel === 'perf' }" @click.stop>
    <div class="panel-header">⚡ 效能模式</div>
    <PerformancePanel
      :performance-mode="performanceMode"
      :perf-configs="perfConfigs"
      @update="emit('update-perf', $event)"
    />
  </div>
</template>

<style scoped>
/* 背景遮罩（透明，只用來攔截點擊關閉） */
.panel-backdrop {
  position: fixed;
  inset: 0;
  z-index: 38;
}

/* ── 控制按鈕列 ─── */
.controls {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 40;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  pointer-events: none;
}

.controls.show {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 10px 15px;
  border-radius: 20px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  white-space: nowrap;
}

.btn-text {
  margin-left: 4px;
}

/* ── 面板通用 ─── */
.panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: rgba(15, 15, 15, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  z-index: 39;
  min-width: 280px;
  max-width: 90vw;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
  transform: translateY(16px);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
}

.panel.visible {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.panel-header {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

/* 時間面板內的 section 樣式 */
.section { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }

.section-title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.options {
  display: flex;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 2px;
}

.opt {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  font-size: 13px;
  cursor: pointer;
  border-radius: 8px;
  color: white;
  transition: background 0.2s;
  -webkit-user-select: none;
  user-select: none;
}

.opt.active {
  background: rgba(255,255,255,0.2);
  font-weight: bold;
}

/* 直版：按鈕列移至底部中央 */
@media (orientation: portrait) {
  .controls {
    bottom: max(10px, env(safe-area-inset-bottom));
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    gap: 6px;
    flex-wrap: nowrap;
    max-width: 95vw;
  }

  .btn-text { display: none; }

  .panel {
    bottom: 80px;
    right: 20px;
    left: auto;
    max-height: calc(100vh - 160px);
  }
}
</style>
