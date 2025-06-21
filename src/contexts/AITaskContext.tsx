import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { message } from 'antd'
import { api } from '../services/api'

// AI任务类型
export type AITaskType = 'super-resolution' | 'style-transfer' | 'text-to-image' | 'background-blur'

// AI任务状态
export interface AITask {
  id: string
  type: AITaskType
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startTime: number
  progress?: number
  params: any
  result?: any
  error?: string
  taskId?: string
}

// Context状态
interface AITaskState {
  tasks: AITask[]
  activeTasks: Map<string, NodeJS.Timeout> // 存储轮询定时器
}

// Action类型
type AITaskAction =
  | { type: 'START_TASK'; payload: AITask }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<AITask> } }
  | { type: 'COMPLETE_TASK'; payload: { id: string; result: any } }
  | { type: 'FAIL_TASK'; payload: { id: string; error: string } }
  | { type: 'REMOVE_TASK'; payload: { id: string } }
  | { type: 'LOAD_TASKS'; payload: AITask[] }

// Reducer
const aiTaskReducer = (state: AITaskState, action: AITaskAction): AITaskState => {
  switch (action.type) {
    case 'START_TASK':
      return {
        ...state,
        tasks: [...state.tasks.filter(t => t.id !== action.payload.id), action.payload]
      }
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        )
      }
    
    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, status: 'completed', result: action.payload.result }
            : task
        )
      }
    
    case 'FAIL_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, status: 'failed', error: action.payload.error }
            : task
        )
      }
    
    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.id)
      }
    
    case 'LOAD_TASKS':
      return {
        ...state,
        tasks: action.payload
      }
    
    default:
      return state
  }
}

// Context接口
interface AITaskContextType {
  tasks: AITask[]
  startTask: (type: AITaskType, params: any) => Promise<string>
  getTask: (id: string) => AITask | undefined
  getTasksByType: (type: AITaskType) => AITask[]
  removeTask: (id: string) => void
  isTaskRunning: (type: AITaskType) => boolean
}

// 创建Context
const AITaskContext = createContext<AITaskContextType | undefined>(undefined)

// Hook
export const useAITask = () => {
  const context = useContext(AITaskContext)
  if (!context) {
    throw new Error('useAITask must be used within an AITaskProvider')
  }
  return context
}

// Provider组件
export const AITaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aiTaskReducer, {
    tasks: [],
    activeTasks: new Map()
  })

  // 从localStorage加载任务
  useEffect(() => {
    const loadPersistedTasks = () => {
      try {
        const saved = localStorage.getItem('ai-tasks')
        if (saved) {
          const tasks: AITask[] = JSON.parse(saved)
          // 只恢复未完成的任务
          const activeTasks = tasks.filter(task => 
            task.status === 'processing' || task.status === 'pending'
          )
          
          if (activeTasks.length > 0) {
            dispatch({ type: 'LOAD_TASKS', payload: activeTasks })
            
            // 重新开始轮询未完成的任务
            activeTasks.forEach(task => {
              if (task.taskId && task.status === 'processing') {
                startPolling(task.id, task.taskId)
              }
            })
            
            message.info(`已恢复 ${activeTasks.length} 个AI处理任务`)
          }
        }
      } catch (error) {
        console.error('加载AI任务失败:', error)
      }
    }

    loadPersistedTasks()
  }, [])

  // 保存任务到localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ai-tasks', JSON.stringify(state.tasks))
    } catch (error) {
      console.error('保存AI任务失败:', error)
    }
  }, [state.tasks])

  // 开始轮询任务状态
  const startPolling = (taskId: string, apiTaskId: string) => {
    if (state.activeTasks.has(taskId)) {
      clearInterval(state.activeTasks.get(taskId)!)
    }

    let pollCount = 0
    const maxPolls = 60 // 最多轮询2分钟

    const pollInterval = setInterval(async () => {
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval)
        state.activeTasks.delete(taskId)
        dispatch({
          type: 'FAIL_TASK',
          payload: { id: taskId, error: '处理超时' }
        })
        message.error('AI处理超时，请重试')
        return
      }

      try {
        const response = await api.getTaskStatus(apiTaskId)
        
        if (response.success && response.data) {
          const { status, resultUrl, progress, error } = response.data

          // 更新进度
          if (progress !== undefined) {
            dispatch({
              type: 'UPDATE_TASK',
              payload: { id: taskId, updates: { progress } }
            })
          }

          if (status === 'completed' && resultUrl) {
            clearInterval(pollInterval)
            state.activeTasks.delete(taskId)
            dispatch({
              type: 'COMPLETE_TASK',
              payload: { id: taskId, result: { resultUrl } }
            })
            message.success('AI处理完成！')
          } else if (status === 'failed') {
            clearInterval(pollInterval)
            state.activeTasks.delete(taskId)
            dispatch({
              type: 'FAIL_TASK',
              payload: { id: taskId, error: error || '处理失败' }
            })
            message.error('AI处理失败')
          }
        }
      } catch (error) {
        console.error('轮询任务状态失败:', error)
      }

      pollCount++
    }, 2000) // 每2秒轮询一次

    state.activeTasks.set(taskId, pollInterval)
  }

  // 开始新任务
  const startTask = async (type: AITaskType, params: any): Promise<string> => {
    const taskId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const task: AITask = {
      id: taskId,
      type,
      status: 'pending',
      startTime: Date.now(),
      params
    }

    dispatch({ type: 'START_TASK', payload: task })

    try {
      let response: any

      // 根据任务类型调用不同的API
      switch (type) {
        case 'super-resolution':
          response = await api.superResolution(params.fileId, params.scaleFactor, params.quality)
          break
        case 'style-transfer':
          response = await api.styleTransfer(params.fileId, params.styleId)
          break
        case 'text-to-image':
          response = await api.textToImage(params.prompt, params.width, params.height, params.model, params.quality)
          break
        case 'background-blur':
          response = await api.backgroundBlur(params.fileId, params.blurIntensity)
          break

        default:
          throw new Error(`不支持的任务类型: ${type}`)
      }

      if (response.success) {
        if (response.data.resultUrl) {
          // 直接返回结果
          dispatch({
            type: 'COMPLETE_TASK',
            payload: { id: taskId, result: response.data }
          })
          message.success('AI处理完成！')
        } else if (response.data.taskId) {
          // 需要轮询
          dispatch({
            type: 'UPDATE_TASK',
            payload: {
              id: taskId,
              updates: {
                status: 'processing',
                taskId: response.data.taskId
              }
            }
          })
          startPolling(taskId, response.data.taskId)
          message.info('AI处理中，可切换页面，处理完成后会自动通知')
        }
      } else {
        throw new Error(response.message || '任务启动失败')
      }
    } catch (error: any) {
      dispatch({
        type: 'FAIL_TASK',
        payload: { id: taskId, error: error.message || '任务启动失败' }
      })
      throw error
    }

    return taskId
  }

  // 获取任务
  const getTask = (id: string): AITask | undefined => {
    return state.tasks.find(task => task.id === id)
  }

  // 根据类型获取任务
  const getTasksByType = (type: AITaskType): AITask[] => {
    return state.tasks.filter(task => task.type === type)
  }

  // 移除任务
  const removeTask = (id: string) => {
    // 清除轮询
    if (state.activeTasks.has(id)) {
      clearInterval(state.activeTasks.get(id)!)
      state.activeTasks.delete(id)
    }
    
    dispatch({ type: 'REMOVE_TASK', payload: { id } })
  }

  // 检查是否有正在运行的任务
  const isTaskRunning = (type: AITaskType): boolean => {
    return state.tasks.some(task => 
      task.type === type && (task.status === 'processing' || task.status === 'pending')
    )
  }

  // 清理函数
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有轮询
      state.activeTasks.forEach(interval => clearInterval(interval))
    }
  }, [])

  return (
    <AITaskContext.Provider
      value={{
        tasks: state.tasks,
        startTask,
        getTask,
        getTasksByType,
        removeTask,
        isTaskRunning
      }}
    >
      {children}
    </AITaskContext.Provider>
  )
} 