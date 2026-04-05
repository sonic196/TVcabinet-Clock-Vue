<script setup>
/**
 * PerformancePanel.vue
 * 效能模式選擇面板
 */
const props = defineProps({
  performanceMode: { type: String, required: true },
  perfConfigs:     { type: Object, required: true },
})

const emit = defineEmits(['update'])
</script>

<template>
  <div class="perf-panel">
    <div class="options">
      <div class="opt" :class="{ active: performanceMode === 'standard' }"
           @click="emit('update', 'standard')">🟢 標準</div>
      <div class="opt" :class="{ active: performanceMode === 'powersave' }"
           @click="emit('update', 'powersave')">🟡 省電</div>
      <div class="opt" :class="{ active: performanceMode === 'ultrasave' }"
           @click="emit('update', 'ultrasave')">🔴 極省</div>
    </div>

    <div class="info">
      <div class="info-title">📋 目前設定</div>
      <div class="info-row">• 波浪動畫：<span>{{ perfConfigs[performanceMode].waveFPS === 0 ? '停用' : perfConfigs[performanceMode].waveFPS + ' fps' }}</span></div>
      <div class="info-row">• 數字動畫：<span>{{ perfConfigs[performanceMode].digitAnim }}</span></div>
      <div class="info-row">• 動畫時長：<span>{{ perfConfigs[performanceMode].duration }}</span></div>
      <div class="info-row">• GPU 加速：<span>{{ perfConfigs[performanceMode].gpu }}</span></div>
    </div>

    <div v-if="perfConfigs[performanceMode].warnings.length > 0" class="warnings">
      <div class="warn-title">⚠️ 以下功能已被限制</div>
      <div v-for="w in perfConfigs[performanceMode].warnings" :key="w" class="warn-item">• {{ w }}</div>
    </div>
  </div>
</template>


<style scoped>
.perf-panel { display: flex; flex-direction: column; gap: 12px; }

.options {
  display: flex;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 2px;
  gap: 4px;
}

.opt {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  font-size: 12px;
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

.info {
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.info-title {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.info-row {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  line-height: 1.8;
}

.info-row span { color: #fff; font-weight: 600; }

.warnings {
  padding-top: 8px;
  border-top: 1px solid rgba(255,200,0,0.3);
}

.warn-title {
  font-size: 11px;
  color: #ffcc00;
  margin-bottom: 4px;
}

.warn-item {
  font-size: 11px;
  color: rgba(255,200,0,0.8);
  line-height: 1.6;
}
</style>
