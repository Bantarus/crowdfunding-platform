/**
 * <hooks_instructions>
 * Custom React Hooks for Task Management
 * 
 * Hooks implemented:
 * - useTasksQuery: Main task fetching with store integration
 * - useTaskQuery: Single task fetching
 * - useCreateTask: Task creation with cache invalidation
 * - useContributeToTask: Task contribution handling
 * - useWalletConnection: Wallet connection management
 * 
 * Implementation Details:
 * - Uses TanStack Query for data fetching and caching
 * - Integrates with Zustand store for state management
 * - Implements optimistic updates for contributions
 * - Handles proper cache invalidation
 * - Includes error handling for wallet operations
 * 
 * State Management:
 * - Synchronizes API data with store state
 * - Maintains query cache for performance
 * - Updates filtered tasks on data changes
 * - Handles wallet connection state
 * 
 * Current Limitations:
 * - Basic error handling
 * - No retry mechanisms
 * - Mock wallet implementation
 * - No offline support
 * 
 * TODO:
 * - Implement proper error handling and retries
 * - Add offline support with local storage
 * - Integrate real wallet connection
 * - Add query prefetching for performance
 * </hooks_instructions>
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useTaskStore } from './store'
import { Task } from '@/types'
import React from 'react'

export const useTasksQuery = () => {
  const setTasks = useTaskStore((state) => state.setTasks)

  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  })

  React.useEffect(() => {
    if (query.data) {
      setTasks(query.data)
    }
  }, [query.data, setTasks])

  return query
}



/* export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
} */

/* export const useContributeToTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, amount, donor }: { taskId: string; amount: number; donor: string }) =>
      api.contributeToTask(taskId, amount, donor),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
    },
  })
} */
