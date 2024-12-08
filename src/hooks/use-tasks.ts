"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { Task } from "@/types"

export function useTasks() {
  const [isCreating, setIsCreating] = useState(false)

  const createTask = async (task: Omit<Task, "currentAmount" | "status">) => {
    try {
      setIsCreating(true)
      const fullTask = {
        ...task,
        currentAmount: 0,
        status: "active" as const,
      }

      // TODO: Replace with actual contract address
      const contractAddress = "0x0000000000000000000000000000000000000000"
      const result = await api.createTask(fullTask, contractAddress)

      if (result) {
        return { success: true }
      } else {
        return { success: false, error: "Failed to create task" }
      }
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
      // TODO: Replace with actual contract address
      const contractAddress = "0x0000000000000000000000000000000000000000"
      const result = await api.fundTask(taskId, amount, contractAddress)

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