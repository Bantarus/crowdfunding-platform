"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { Task } from "@/types"
import { useCreateTaskMutation } from "@/lib/hooks"
import { useTaskStore } from "@/lib/store"
import { shallow } from 'zustand/shallow'

export function useTasks() {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isQuorumMember, setIsQuorumMember] = useState(false)
  const createTaskMutation = useCreateTaskMutation()
  
  // Use separate selectors or shallow comparison
  const genesisAddress = useTaskStore(state => state.genesisAddress)
  const isWalletConnected = useTaskStore(state => state.isWalletConnected)

  // Alternative using shallow comparison:
  // const { genesisAddress, isWalletConnected } = useTaskStore(
  //   state => ({
  //     genesisAddress: state.genesisAddress,
  //     isWalletConnected: state.isWalletConnected
  //   }),
  //   shallow
  // )

  useEffect(() => {
    const checkQuorumMembership = async () => {
      if (isWalletConnected && genesisAddress) {
        const isMember = await api.isQuorumMember(genesisAddress)
        setIsQuorumMember(isMember)
      } else {
        setIsQuorumMember(false)
      }
    }
    
    checkQuorumMembership()
  }, [genesisAddress, isWalletConnected])

  const hasVoted = (task: Task): boolean => {
    return Boolean(genesisAddress && task.votes.includes(genesisAddress))
  }

  const deployTask = async (task: Task) => {
    setIsCreating(true)
    setError(null)
    
    try {
      const placeholders = {
        MIN_VOTES: 3,
        MASTER_ADDRESS: process.env.NEXT_PUBLIC_MASTER_CONTRACT_ADDRESS
      }
      const contractAddress = await api.deployTaskContract(task, placeholders)
      return contractAddress
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy contract'
      setError(errorMessage)
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  const createTask = async (task: Omit<Task, "currentAmount" | "status">) => {
    try {
      setIsCreating(true)
      const fullTask = {
        ...task,
        currentAmount: 0,
        status: "pending" as const,
      }

      const contractAddress = await deployTask(fullTask)
      
      //await createTaskMutation.mutateAsync(fullTask)
      
      return { success: true, contractAddress }
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

  const approveTask = async (taskId: string) => {
    try {
      if (!isQuorumMember) {
        throw new Error("Not authorized to approve tasks")
      }
      await api.approveTask(taskId)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to approve task" 
      }
    }
  }

  return {
    isCreating,
    error,
    isQuorumMember,
    hasVoted,
    createTask,
    fundTask,
    deployTask,
    approveTask,
  }
} 