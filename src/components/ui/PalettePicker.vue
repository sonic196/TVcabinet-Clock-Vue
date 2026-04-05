<script setup>
/**
 * PalettePicker.vue
 * 調色盤切換面板
 * - 顯示所有 24 種配色
 * - 長按可禁用/啟用某個配色
 * - 點擊切換當前配色
 */
// defineProps and defineEmits are compiler macros, no import needed

const props = defineProps({
  palettes:            { type: Array,  required: true },
  currentPaletteIndex: { type: Number, required: true },
})

const emit = defineEmits(['select', 'toggle-enabled'])

let pressTimer = null

function startPress(index) {
  pressTimer = setTimeout(() => {
    emit('toggle-enabled', index)
    if (navigator.vibrate) navigator.vibrate(50)
    pressTimer = null
  }, 600)
}

function endPress(index) {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
}

function handleClick(index) {
  if (pressTimer === null && props.palettes[index].enabled) {
    emit('select', index)
  }
}
</script>

<template>
  <div class="palette-grid">
    <div
      v-for="(p, i) in palettes"
      :key="i"
      class="palette-item"
      :class="{ active: i === currentPaletteIndex, disabled: !p.enabled }"
      @mousedown="startPress(i)"
      @mouseup="endPress(i)"
      @mouseleave="endPress(i)"
      @touchstart.passive="startPress(i)"
      @touchend="endPress(i)"
      @click="handleClick(i)"
      @contextmenu.prevent
    >
      <div
        class="palette-preview"
        :style="{ background: `linear-gradient(135deg, ${p.colors[0]}, ${p.colors[1]})` }"
      />
      <span class="palette-name" :class="{ strikethrough: !p.enabled }">{{ p.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.palette-item {
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s, transform 0.1s;
  -webkit-user-select: none;
  user-select: none;
}

.palette-item:active { transform: scale(0.97); }

.palette-item.active {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
}

.palette-item.disabled {
  opacity: 0.3;
  filter: grayscale(1);
}

.palette-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.palette-name {
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.strikethrough { text-decoration: line-through; }
</style>
