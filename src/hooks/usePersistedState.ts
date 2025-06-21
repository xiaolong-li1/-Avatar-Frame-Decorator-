import { useState, useEffect } from 'react'

/**
 * 在 localStorage 中持久化 React 状态的 Hook。
 *
 * @param key localStorage 的键名，务必保持全局唯一
 * @param defaultValue 初始值
 */
function usePersistedState<T>(key: string, defaultValue: T) {
  // 初始化状态时尝试从 localStorage 读取
  const [state, setState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : defaultValue
    } catch (err) {
      console.warn(`usePersistedState: 读取 localStorage 失败 -> ${key}`, err)
      return defaultValue
    }
  })

  // 当 state 变化时同步到 localStorage
  useEffect(() => {
    try {
      if (state === undefined || state === null) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify(state))
      }
    } catch (err) {
      console.warn(`usePersistedState: 写入 localStorage 失败 -> ${key}`, err)
    }
  }, [key, state])

  return [state, setState] as const
}

export default usePersistedState 