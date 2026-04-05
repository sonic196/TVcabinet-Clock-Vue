// src/composables/useSettings.js
// 全域設定狀態管理（含 localStorage 持久化）

import { ref, reactive, watch } from 'vue'
import { PALETTE_DATA } from '../data/palettes.js'

const LS_KEY = 'tvclock-settings'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useSettings() {
  const saved = loadFromStorage()

  // ── 時間格式 ──────────────────────────
  const is24Hour = ref(saved?.is24Hour ?? true)
  const isDateVisible = ref(saved?.isDateVisible ?? true)
  const isBlinking = ref(saved?.isBlinking ?? true)

  // ── 夜間模式 ──────────────────────────
  const isNightMode = ref(saved?.isNightMode ?? false)

  // ── 調色盤 ────────────────────────────
  const palettes = reactive(
    saved?.palettes
      ? PALETTE_DATA.map((p, i) => ({ ...p, enabled: saved.palettes[i]?.enabled ?? true }))
      : PALETTE_DATA.map(p => ({ ...p }))
  )
  const currentPaletteIndex = ref(saved?.currentPaletteIndex ?? 0)

  // ── 液體設定 ──────────────────────────
  const liquid = reactive({
    visible:    saved?.liquid?.visible    ?? true,
    surface:    saved?.liquid?.surface    ?? 'wave',   // 'wave' | 'flat' | 'line'
    opacity:    saved?.liquid?.opacity    ?? 0.3,
    waveHeight: saved?.liquid?.waveHeight ?? 75,
    rise:       saved?.liquid?.rise       ?? 'smooth', // 'smooth' | 'step'
    interact:   saved?.liquid?.interact   ?? 'off',    // 'off' | 'on' | 'swap'
    reset:      saved?.liquid?.reset      ?? 'instant',// 'instant' | 'drain'
    scaleWidth: saved?.liquid?.scaleWidth ?? 1.5,
    waterFill:  saved?.liquid?.waterFill  ?? true,
  })

  // ── 效能模式 ──────────────────────────
  // 'standard' | 'powersave' | 'ultrasave'
  const performanceMode = ref(saved?.performanceMode ?? 'powersave')

  // ── 效能模式設定表 ────────────────────
  const PERF_CONFIGS = {
    standard:  { waveFPS: 60, digitAnim: '旋轉 + 縮放', duration: '3 秒',  gpu: '啟用',  warnings: [] },
    powersave: { waveFPS: 15, digitAnim: '淡入淡出',    duration: '0.5 秒', gpu: '停用',  warnings: [] },
    ultrasave: { waveFPS: 0,  digitAnim: '無',          duration: '0 秒',   gpu: '停用',
      warnings: ['液體設定 > 水面樣式 (波浪)', '液體設定 > 顏色交互 (交換)'] },
  }

  // ── 目前調色盤顏色（便於 prop 傳遞）────
  const currentPalette = () => palettes[currentPaletteIndex.value] || palettes[0]

  // ── localStorage 自動儲存 ─────────────
  function saveToStorage() {
    const snapshot = {
      is24Hour: is24Hour.value,
      isDateVisible: isDateVisible.value,
      isBlinking: isBlinking.value,
      isNightMode: isNightMode.value,
      palettes: palettes.map(p => ({ enabled: p.enabled })),
      currentPaletteIndex: currentPaletteIndex.value,
      liquid: { ...liquid },
      performanceMode: performanceMode.value,
    }
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot))
  }

  watch([is24Hour, isDateVisible, isBlinking, isNightMode, currentPaletteIndex, performanceMode], saveToStorage)
  watch(liquid, saveToStorage, { deep: true })

  return {
    is24Hour, isDateVisible, isBlinking,
    isNightMode,
    palettes, currentPaletteIndex, currentPalette,
    liquid,
    performanceMode, PERF_CONFIGS,
  }
}
