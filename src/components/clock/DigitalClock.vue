<script setup>
/**
 * DigitalClock.vue
 * 精準還原原版 index.html 的時鐘排版邏輯：
 * - Landscape：HH:MM 單行顯示，日期固定於右下角
 * - Portrait：小時/日期/分鐘分三行，各佔全寬
 * - mix-blend-mode: screen 使數字與水波融合
 * - 閃爍效果由 CSS animation 驅動（不依賴秒數計算）
 * - 小時用 colorA，分鐘用 colorB，冒號用 colorC
 */
import { computed } from 'vue'

const props = defineProps({
  hours:          { type: String,  required: true },
  minutes:        { type: String,  required: true },
  seconds:        { type: Number,  required: true },
  ampm:           { type: String,  default: '' },
  dateString:     { type: String,  default: '' },
  colorA:         { type: String,  default: '#52a9ff' },
  colorB:         { type: String,  default: '#52a9ff' },
  colorC:         { type: String,  default: '#a0d0ff' },
  isBlinking:     { type: Boolean, default: true },
  isDateVisible:  { type: Boolean, default: true },
  isNightMode:    { type: Boolean, default: false },
  isSwap:         { type: Boolean, default: false },
})

const h1 = computed(() => props.hours.length === 2 ? props.hours[0] : '\u00a0')
const h2 = computed(() => props.hours.length === 2 ? props.hours[1] : props.hours[0])
const m1 = computed(() => props.minutes[0])
const m2 = computed(() => props.minutes[1])
</script>

<template>
  <!--
    整個時鐘區塊。
    Landscape：flex-row，小時 + 冒號 + 分鐘橫排
    Portrait ：flex-col，小時行 / 日期 / 分鐘行縱排
  -->
  <div
    class="clock-root"
    :class="{
      'night-mode': isNightMode,
      'no-date': !isDateVisible,
      'is-swap': isSwap
    }"
    :style="{
      '--color-a': colorA,
      '--color-b': colorB,
      '--color-c': colorC,
    }"
  >

    <!-- ── Landscape layout ── -->
    <div class="time-landscape">
      <!-- Hours -->
      <div class="digit-wrapper">
        <span class="digit color-a">{{ h1 }}</span>
      </div>
      <div class="digit-wrapper">
        <span class="digit color-a">{{ h2 }}</span>
      </div>

      <!-- Colon -->
      <span class="colon" :class="{ blink: isBlinking }">:</span>

      <!-- Minutes -->
      <div class="digit-wrapper">
        <span class="digit color-b">{{ m1 }}</span>
      </div>
      <div class="digit-wrapper">
        <span class="digit color-b">{{ m2 }}</span>
      </div>


    </div>


    <!-- Landscape date — rendered inline here, positioned via CSS fixed -->
    <div v-if="isDateVisible" class="date landscape-date">{{ dateString }}</div>

    <!-- ── Portrait layout ── -->
    <div class="time-portrait">
      <!-- Hours row -->
      <div class="portrait-row hours-row">
        <div class="digit-wrapper-p">
          <span class="digit-p color-a">{{ h1 }}</span>
        </div>
        <div class="digit-wrapper-p">
          <span class="digit-p color-a">{{ h2 }}</span>
        </div>
      </div>

      <!-- Date (between hours & minutes in portrait) -->
      <div class="date portrait-date">{{ dateString }}</div>

      <!-- Minutes row -->
      <div class="portrait-row minutes-row">
        <div class="digit-wrapper-p">
          <span class="digit-p color-b">{{ m1 }}</span>
        </div>
        <div class="digit-wrapper-p">
          <span class="digit-p color-b">{{ m2 }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ─── Root ─── */
.clock-root {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ─── Color helpers ─── */
.color-a { color: var(--color-a); }
.color-b { color: var(--color-b); }
.color-c { color: var(--color-c); }

/* ─── Landscape ─── */
.time-landscape {
  display: flex;
  align-items: center;
  justify-content: center;
}

.digit-wrapper {
  position: relative;
  margin: 0 -1vw;
  width: 22vw;
  height: 28vw;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: width 0.5s ease, margin 0.5s ease;
}

.digit {
  position: absolute;
  font-size: 40vw;
  font-weight: 900;
  line-height: 0.8;
  letter-spacing: -0.05em;
  mix-blend-mode: screen;
  opacity: 0.9;
  transition: color 2s ease;
  font-family: 'Nunito', -apple-system, sans-serif;
}

.colon {
  font-size: 20vw;
  font-weight: 900;
  color: #ffffff;
  mix-blend-mode: normal;
  margin: 0 -1vw;
  padding-bottom: 2vw;
  line-height: 0.8;
  transition: opacity 0.2s ease;
  position: relative;
  z-index: 2;
}

@keyframes blinker {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.1; }
}
.colon.blink {
  animation: blinker 2s linear infinite;
}

.ampm {
  font-size: 5vw;
  font-weight: 800;
  align-self: flex-end;
  margin-bottom: 2vw;
  margin-left: 1vw;
  mix-blend-mode: screen;
  transition: color 2s ease;
}

/* Landscape date: fixed bottom-right */
.landscape-date {
  position: fixed;
  bottom: max(20px, env(safe-area-inset-bottom));
  right: max(20px, env(safe-area-inset-right));
  font-size: 4vw;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--color-a);
  opacity: 0.8;
  white-space: nowrap;
  transition: color 2s ease;
}

/* ─── Portrait (hidden by default) ─── */
.time-portrait { display: none; }

@media (orientation: portrait) {
  .time-landscape  { display: none !important; }
  .landscape-date  { display: none !important; }
  .time-portrait   {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2vh;
  }

  .portrait-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
  }

  .digit-wrapper-p {
    position: relative;
    width: 64vw;
    height: 65vw;
    margin: 0 -9vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .digit-p {
    position: absolute;
    font-size: 80vw;
    font-weight: 900;
    line-height: 0.7;
    letter-spacing: -0.05em;
    mix-blend-mode: screen;
    opacity: 0.9;
    transition: color 2s ease;
    font-family: 'Nunito', -apple-system, sans-serif;
  }

  .portrait-date {
    font-size: 6vw;
    font-weight: 700;
    letter-spacing: 2px;
    color: var(--color-a);
    opacity: 0.8;
    white-space: nowrap;
    transition: color 2s ease;
    margin: 1vh 0;
    display: block;
  }
}

/* ─── Night mode ─── */
.night-mode .digit,
.night-mode .digit-p,
.night-mode .colon {
  mix-blend-mode: normal;
  opacity: 0.5;
  color: #ff0000 !important;
}

.night-mode .landscape-date,
.night-mode .portrait-date {
  color: #ff0000 !important;
  opacity: 0.4;
}

/* ─── Interact Mode (Difference) ─── */
.clock-root.interact-on .digit,
.clock-root.interact-on .digit-p,
.clock-root.interact-on .landscape-date,
.clock-root.interact-on .portrait-date,
.clock-root.interact-on .ampm,
.clock-root.interact-on .colon {
  mix-blend-mode: difference;
}

/* ─── Swap Clock Overrides ─── */
.clock-root.is-swap .digit,
.clock-root.is-swap .digit-p,
.clock-root.is-swap .colon,
.clock-root.is-swap .ampm {
  mix-blend-mode: normal;
}
.clock-root.is-swap .landscape-date,
.clock-root.is-swap .portrait-date {
  display: none !important;
}
</style>
