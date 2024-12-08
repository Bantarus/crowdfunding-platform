export interface Task {
  id: string
  title: string
  description: string
  goalAmount: number
  currentAmount: number
  deadline: Date
  category: string
  creator: string
  creatorReliability: number
  status: "active" | "funded" | "completed"
  transactions: Transaction[]
}

export interface Transaction {
  id: string
  donor: string
  amount: number
  date: Date
} 