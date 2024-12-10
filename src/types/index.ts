export type TaskStatus = 'pending' | 'active' | 'funded' | 'completed'

export interface Transaction {
  id: string
  donor: string
  amount: number
  date: Date
}

export interface Task {
  id: string
  title: string
  description: string
  goalAmount: number
  currentAmount: number
  deadline: Date
  category: string
  creator: string
  status: TaskStatus
  transactions: Transaction[]
  creatorReliability: number
} 