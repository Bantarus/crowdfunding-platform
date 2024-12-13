import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Task } from "@/types"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRank(completedTasks: number): string {
  if (completedTasks >= 50) return 'Elite'
  if (completedTasks >= 25) return 'Expert'
  if (completedTasks >= 10) return 'Advanced'
  if (completedTasks >= 5) return 'Intermediate'
  return 'Beginner'
}

export function calculateReliability(tasks: Task[]): number {
  if (tasks.length === 0) return 0
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  return Math.round((completedTasks / tasks.length) * 100)
}
