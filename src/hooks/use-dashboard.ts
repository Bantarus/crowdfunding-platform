'use client'

import { useTaskStore } from "@/lib/store"
import { useEffect } from "react"

export function useDashboard() {
  const { tasks, filteredTasks } = useTaskStore()

  useEffect(() => {
    // Re-apply filters when returning to dashboard
    useTaskStore.getState().setTasks(tasks)
  }, [tasks])

  return {
    tasks,
    filteredTasks
  }
} 