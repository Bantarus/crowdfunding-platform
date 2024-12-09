import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useTaskStore } from './store'
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



export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
} 

 export const useContributeToTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, amount}: { taskId: string; amount: number;  }) =>
      api.fundTask(taskId, amount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] })
    },
  })
} 
