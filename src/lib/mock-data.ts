/**
 * <mock_data_instructions>
 * Mock Data Generator for Development
 * 
 * Provides:
 * - 10 sample tasks (5 active, 3 funded, 2 completed)
 * - Realistic task properties with random values
 * - Sample transactions for each task
 * 
 * Mock Data Features:
 * - Random goal amounts (500-1500 UCO)
 * - Random current amounts (0-500 UCO)
 * - Deadlines within next 30 days
 * - 4 categories: Development, Design, Marketing, Research
 * - Random transaction history
 * 
 * Implementation Details:
 * - Uses fixed category names with proper capitalization
 * - Generates random but realistic amounts and dates
 * - Maintains consistent task status distribution
 * - Creates linked transaction history for each task
 * 
 * Current Limitations:
 * - Fixed set of categories
 * - Predetermined status distribution
 * - Random data might not reflect real-world patterns
 * 
 * TODO:
 * - Add more realistic data patterns
 * - Consider making categories configurable
 * - Add more varied transaction patterns
 * </mock_data_instructions>
 */

import { Task, TaskStatus } from '@/types'

const generateMockTask = (id: number, status: TaskStatus): Task => ({
  id: `task-${id}`,
  title: `Task ${id}`,
  description: `This is a sample task ${id} description. It demonstrates how the task card will look with real content.`,
  goalAmount: Math.floor(Math.random() * 1000) + 500,
  currentAmount: Math.floor(Math.random() * 500),
  deadline: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
  category: ['Development', 'Design', 'Marketing', 'Research'][Math.floor(Math.random() * 4)],
  creator: `0x${Math.random().toString(16).slice(2, 8)}`,
  creatorReliability: Math.floor(Math.random() * 100),
  status,
  transactions: Array(Math.floor(Math.random() * 5)).fill(null).map((_, i) => ({
    id: `tx-${id}-${i}`,
    donor: `0x${Math.random().toString(16).slice(2, 8)}`,
    amount: Math.floor(Math.random() * 100) + 10,
    date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  })),
})

export const mockTasks: Task[] = [
  ...Array(5).fill(null).map((_, i) => generateMockTask(i, 'active')),
  ...Array(3).fill(null).map((_, i) => generateMockTask(i + 5, 'funded')),
  ...Array(2).fill(null).map((_, i) => generateMockTask(i + 8, 'completed')),
] 