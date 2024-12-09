'use client'

import { useTasksQuery } from '@/lib/hooks'
import { useTaskStore } from '@/lib/store'
import { TaskCard } from './task-card'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

export function TaskGrid() {
  const { isLoading, error } = useTasksQuery()
  const filteredTasks = useTaskStore((state) => state.filteredTasks)

  if (error) {
    return (
      <Card className="p-6 text-center text-red-500">
        Error loading tasks. Please try again later.
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(6).fill(null).map((_, i) => (
          <Skeleton key={i} className="h-[300px] w-full" />
        ))}
      </div>
    )
  }

  if (filteredTasks.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No tasks found. Try adjusting your filters.
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredTasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  )
} 