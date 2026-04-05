// src/composables/useTime.js
// 時間計算邏輯：每秒響應式更新，支援 12H/24H 切換

import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useTime(is24Hour) {
  const now = ref(new Date())
  let timer = null

  onMounted(() => {
    // Poll every 50ms for smooth wave animation
    timer = setInterval(() => {
      now.value = new Date()
    }, 250)
  })

  onUnmounted(() => {
    clearInterval(timer)
  })

  const hours = computed(() => {
    const h = now.value.getHours()
    if (is24Hour.value) return String(h).padStart(2, '0')
    const h12 = h % 12 || 12
    return String(h12)
  })

  const hours24Raw = computed(() => now.value.getHours())

  const minutes = computed(() => String(now.value.getMinutes()).padStart(2, '0'))

  const seconds = computed(() => now.value.getSeconds())

  const ampm = computed(() => {
    if (is24Hour.value) return ''
    return now.value.getHours() >= 12 ? 'PM' : 'AM'
  })

  const dateString = computed(() => {
    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    const month = now.value.getMonth() + 1
    const day = now.value.getDate()
    const weekday = days[now.value.getDay()]
    const ap = ampm.value
    return ap ? `${ap}｜${month}月${day}日 ${weekday}` : `${month}月${day}日 ${weekday}`
  })

  // 秒數進度 0~100%（用於液體上升）
  // 使用毫秒取得更平滑的進度，與原版行為一致
  // 最高不超過 90%，避免水波完全覆蓋畫面
  const secondProgress = computed(() => {
    const ms = now.value.getMilliseconds()
    const s  = now.value.getSeconds()
    const raw = (s + ms / 1000) / 60 * 100
    return Math.min(raw, 90)
  })

  // 當前小時是否改變（用於每小時自動換色盤）
  const hourKey = computed(() => String(hours24Raw.value).padStart(2, '0'))

  return { now, hours, minutes, seconds, ampm, dateString, secondProgress, hourKey }
}
