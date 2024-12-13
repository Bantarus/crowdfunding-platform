import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Task, TaskStatus } from '@/types'

interface TaskStore {
  tasks: Task[]
  filteredTasks: Task[]
  selectedCategory: string | null
  searchQuery: string
  statusFilter: TaskStatus | null
  sortBy: string
  walletAddress: string | null
  genesisAddress: string | null
  isWalletConnected: boolean
  isQuorumMember: boolean
  setTasks: (tasks: Task[]) => void
  setFilteredTasks: (tasks: Task[]) => void
  setSelectedCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: TaskStatus | null) => void
  setSortBy: (sort: string) => void
  setWalletState: (address: string | null, genesisAddress: string | null, isConnected: boolean) => void
  setQuorumMembership: (isMember: boolean) => void
}

const applyFilters = (
  tasks: Task[],
  category: string | null,
  query: string,
  status: TaskStatus | null,
  sortBy: string
): Task[] => {
  let filtered = tasks.filter((task) => {
    const matchesCategory = !category || task.category === category
    const matchesQuery = !query || 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      task.description.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = !status || task.status === status

    return matchesCategory && matchesQuery && matchesStatus
  })

  // Apply sorting
  switch (sortBy) {
    case 'popular':
      return [...filtered].sort((a, b) => b.promotions - a.promotions)
    case 'deadline':
      return [...filtered].sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    case 'progress':
      return [...filtered].sort((a, b) => (b.currentAmount / b.goalAmount) - (a.currentAmount / a.goalAmount))
    case 'newest':
    default:
      return filtered
  }
}

export const useTaskStore = create(
  subscribeWithSelector<TaskStore>((set, get) => ({
    tasks: [],
    filteredTasks: [],
    selectedCategory: null,
    searchQuery: '',
    statusFilter: null,
    sortBy: 'newest',
    walletAddress: null,
    genesisAddress: null,
    isWalletConnected: false,
    isQuorumMember: false,
    
    setTasks: (tasks) => {
      set({ tasks })
      const state = get()
      const filtered = applyFilters(tasks, state.selectedCategory, state.searchQuery, state.statusFilter, state.sortBy)
      set({ filteredTasks: filtered })
    },
    
    setFilteredTasks: (tasks) => set({ filteredTasks: tasks }),
    
    setSelectedCategory: (category) => {
      set({ selectedCategory: category })
      const state = get()
      const filtered = applyFilters(state.tasks, category, state.searchQuery, state.statusFilter, state.sortBy)
      set({ filteredTasks: filtered })
    },
    
    setSearchQuery: (query) => {
      set({ searchQuery: query })
      const state = get()
      const filtered = applyFilters(state.tasks, state.selectedCategory, query, state.statusFilter, state.sortBy)
      set({ filteredTasks: filtered })
    },
    
    setStatusFilter: (status) => {
      set({ statusFilter: status })
      const state = get()
      const filtered = applyFilters(state.tasks, state.selectedCategory, state.searchQuery, status, state.sortBy)
      set({ filteredTasks: filtered })
    },
    
    setSortBy: (sort) => set({ sortBy: sort }),
    setWalletState: (address, genesisAddress, isConnected) => 
      set({ 
        walletAddress: address, 
        genesisAddress: genesisAddress,
        isWalletConnected: isConnected 
      }),
    setQuorumMembership: (isMember) => set({ isQuorumMember: isMember }),
    
   
  }))
)