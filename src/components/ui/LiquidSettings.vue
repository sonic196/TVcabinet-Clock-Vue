<script setup>
/**
 * LiquidSettings.vue
 * 液體相關設定面板
 * 選項：總開關、液面樣式、浪高、顏色濃度、上升效果、顏色交互、重置模式、刻度粗細、水量填充
 */
import { computed } from 'vue'

const props = defineProps({
  liquid: { type: Object, required: true },
})

const emit = defineEmits(['update'])

function set(key, value) {
  emit('update', { key, value })
}

const showWaveHeight = computed(() => props.liquid.surface === 'wave')
const showScaleWidth = computed(() => props.liquid.surface === 'line')
const showWaterFill  = computed(() => props.liquid.surface === 'line')
</script>

<template>
  <div class="liquid-settings">

    <!-- 總開關 -->
    <div class="section">
      <div class="section-title">總開關</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.visible }"    @click="set('visible', true)">開啟</div>
        <div class="opt" :class="{ active: !liquid.visible }"   @click="set('visible', false)">關閉</div>
      </div>
    </div>

    <!-- 液面樣式 -->
    <div class="section">
      <div class="section-title">液面樣式</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.surface === 'wave' }" @click="set('surface', 'wave')">波浪</div>
        <div class="opt" :class="{ active: liquid.surface === 'flat' }" @click="set('surface', 'flat')">靜面</div>
        <div class="opt" :class="{ active: liquid.surface === 'line' }" @click="set('surface', 'line')">刻度</div>
      </div>
    </div>

    <!-- 浪高（波浪模式才顯示） -->
    <div class="section" :class="{ disabled: !showWaveHeight }">
      <div class="section-title">浪高</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.waveHeight === 40 }"  @click="set('waveHeight', 40)">小</div>
        <div class="opt" :class="{ active: liquid.waveHeight === 75 }"  @click="set('waveHeight', 75)">中</div>
        <div class="opt" :class="{ active: liquid.waveHeight === 120 }" @click="set('waveHeight', 120)">大</div>
      </div>
    </div>

    <!-- 顏色濃度 -->
    <div class="section">
      <div class="section-title">顏色濃度</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.opacity === 0.15 }" @click="set('opacity', 0.15)">淡</div>
        <div class="opt" :class="{ active: liquid.opacity === 0.3 }"  @click="set('opacity', 0.3)">標準</div>
        <div class="opt" :class="{ active: liquid.opacity === 0.5 }"  @click="set('opacity', 0.5)">濃</div>
      </div>
    </div>

    <!-- 上升效果 -->
    <div class="section">
      <div class="section-title">上升效果</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.rise === 'smooth' }" @click="set('rise', 'smooth')">平滑</div>
        <div class="opt" :class="{ active: liquid.rise === 'step' }"   @click="set('rise', 'step')">秒跳</div>
      </div>
    </div>

    <!-- 顏色交互 -->
    <div class="section">
      <div class="section-title">顏色交互</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.interact === 'on' }"   @click="set('interact', 'on')">反差</div>
        <div class="opt" :class="{ active: liquid.interact === 'swap' }" @click="set('interact', 'swap')">交換</div>
        <div class="opt" :class="{ active: liquid.interact === 'off' }"  @click="set('interact', 'off')">關閉</div>
      </div>
    </div>

    <!-- 重置模式 -->
    <div class="section">
      <div class="section-title">重置模式</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.reset === 'instant' }" @click="set('reset', 'instant')">瞬間</div>
        <div class="opt" :class="{ active: liquid.reset === 'drain' }"   @click="set('reset', 'drain')">排水</div>
      </div>
    </div>

    <!-- 刻度粗細（線模式才顯示） -->
    <div class="section" :class="{ disabled: !showScaleWidth }">
      <div class="section-title">刻度粗細</div>
      <div class="options">
        <div class="opt" :class="{ active: liquid.scaleWidth === 1 }"   @click="set('scaleWidth', 1)">細</div>
        <div class="opt" :class="{ active: liquid.scaleWidth === 1.5 }" @click="set('scaleWidth', 1.5)">中</div>
        <div class="opt" :class="{ active: liquid.scaleWidth === 2 }"   @click="set('scaleWidth', 2)">粗</div>
      </div>
    </div>

    <!-- 水量填充（線模式才顯示） -->
    <div class="section" :class="{ disabled: !showWaterFill }">
      <div class="section-title">水量填充</div>
      <div class="options">
        <div class="opt" :class="{ active: !liquid.waterFill }" @click="set('waterFill', false)">關閉</div>
        <div class="opt" :class="{ active: liquid.waterFill }"  @click="set('waterFill', true)">開啟</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.liquid-settings { display: flex; flex-direction: column; gap: 12px; }

.section { display: flex; flex-direction: column; gap: 6px; }
.section.disabled { opacity: 0.4; pointer-events: none; }

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
</style>
