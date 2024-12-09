import { create } from 'zustand'
import { Task, TaskStatus } from '@/types'

interface TaskStore {
  tasks: Task[]
  filteredTasks: Task[]
  selectedCategory: string | null
  searchQuery: string
  statusFilter: TaskStatus | null
  sortBy: 'deadline' | 'amount' | 'progress'
  walletAddress: string | null
  isWalletConnected: boolean
  setTasks: (tasks: Task[]) => void
  setFilteredTasks: (tasks: Task[]) => void
  setSelectedCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: TaskStatus | null) => void
  setSortBy: (sort: 'deadline' | 'amount' | 'progress') => void
  setWalletAddress: (address: string | null) => void
  setWalletConnection: (isConnected: boolean) => void
}

const applyFilters = (
  tasks: Task[],
  category: string | null,
  query: string,
  status: TaskStatus | null
): Task[] => {
  console.log('Filtering with:', { category, query, status })
  console.log('Available tasks:', tasks.map(t => ({ id: t.id, category: t.category })))
  
  const filtered = tasks.filter((task) => {
    const matchesCategory = !category || task.category === category
    const matchesQuery = !query || 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = !status || task.status === status

    if (category && !matchesCategory) {
      console.log('Task rejected by category:', task.id, task.category, 'looking for:', category)
    }

    return matchesCategory && matchesQuery && matchesStatus
  })

  console.log('Filtered tasks:', filtered.length)
  return filtered
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filteredTasks: [],
  selectedCategory: null,
  searchQuery: '',
  statusFilter: null,
  sortBy: 'deadline',
  walletAddress: null,
  isWalletConnected: false,
  
  setTasks: (tasks) => {
    set({ tasks })
    const state = get()
    const filtered = applyFilters(tasks, state.selectedCategory, state.searchQuery, state.statusFilter)
    set({ filteredTasks: filtered })
  },
  
  setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
  
  setSelectedCategory: (category) => {
    set({ selectedCategory: category })
    const state = get()
    const filtered = applyFilters(state.tasks, category, state.searchQuery, state.statusFilter)
    set({ filteredTasks: filtered })
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query })
    const state = get()
    const filtered = applyFilters(state.tasks, state.selectedCategory, query, state.statusFilter)
    set({ filteredTasks: filtered })
  },
  
  setStatusFilter: (status) => {
    set({ statusFilter: status })
    const state = get()
    const filtered = applyFilters(state.tasks, state.selectedCategory, state.searchQuery, status)
    set({ filteredTasks: filtered })
  },
  
  setSortBy: (sort) => set({ sortBy: sort }),
  setWalletAddress: (address) => set({ walletAddress: address }),
  setWalletConnection: (isConnected) => set({ isWalletConnected: isConnected }),
}))