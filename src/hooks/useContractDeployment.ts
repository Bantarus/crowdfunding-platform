'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Task } from '@/types'
import { TaskContractParams } from '@/types/contracts'

export const useContractDeployment = () => {
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deployTask = async (task: Task) => {
    setIsDeploying(true)
    setError(null)
    
    try {
      const placeholders: Partial<TaskContractParams> = {
        MIN_VOTES: 3,
        MASTER_ADDRESS: process.env.NEXT_PUBLIC_MASTER_CONTRACT_ADDRESS
      }
      const contractAddress = await api.deployTaskContract(task, placeholders)
      return contractAddress
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy contract')
      throw err
    } finally {
      setIsDeploying(false)
    }
  }

  return {
    deployTask,
    isDeploying,
    error
  }
} 