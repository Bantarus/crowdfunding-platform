import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useTaskStore } from './store'
import React from 'react'

export const useTasksQuery = () => {
  const setTasks = useTaskStore((state) => state.setTasks)

  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })

  React.useEffect(() => {
    if (query.data) {
      setTasks(query.data)
    }
  }, [query.data, setTasks])

  return query
}

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      console.error('Failed to create task:', error)
    },
  })
}

export const useContributeToTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, amount}: { taskId: string; amount: number }) =>
      api.fundTask(taskId, amount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
    },
  })
}

export const useApproveTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => api.approveTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', taskId] })
    },
  })
}

export const usePromoteTask = () => {
  const queryClient = useQueryClient()

  return useMutation<
    { success: boolean; error?: string },
    Error,
    string,
    unknown
  >({
    mutationFn: async (taskId: string) => {
      const result = await api.promoteTask(taskId)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useCreatorTasks = (creatorAddress?: string) => {
  return useQuery({
    queryKey: ['tasks', 'creator', creatorAddress],
    queryFn: () => api.getCreatorTasks(creatorAddress),
    enabled: !!creatorAddress,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}
