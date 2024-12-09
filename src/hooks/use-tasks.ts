"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { Task } from "@/types"
import { useCreateTaskMutation } from "@/lib/hooks"

export function useTasks() {
  const [isCreating, setIsCreating] = useState(false)
  const createTaskMutation = useCreateTaskMutation()

  const createTask = async (task: Omit<Task, "currentAmount" | "status">) => {
    try {
      setIsCreating(true)
      const fullTask = {
        ...task,
        currentAmount: 0,
        status: "active" as const,
      }

      await createTaskMutation.mutateAsync(fullTask)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }
    } finally {
      setIsCreating(false)
    }
  }

  const fundTask = async (taskId: string, amount: number) => {
    try {
    
      const result = await api.fundTask(taskId, amount)

      if (result) {
        return { success: true }
      } else {
        return { success: false, error: "Failed to fund task" }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }
    }
  }

  return {
    isCreating,
    createTask,
    fundTask,
  }
} 