'use client'
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTaskStore } from "@/lib/store"
import { TaskStatus } from "@/types"

export function TaskFilters() {
  const setSearchQuery = useTaskStore((state) => state.setSearchQuery)
  const setStatusFilter = useTaskStore((state) => state.setStatusFilter)
  const setSelectedCategory = useTaskStore((state) => state.setSelectedCategory)
  const searchQuery = useTaskStore((state) => state.searchQuery)
  const statusFilter = useTaskStore((state) => state.statusFilter)
  const selectedCategory = useTaskStore((state) => state.selectedCategory)
  const setSortBy = useTaskStore((state) => state.setSortBy)
  const sortBy = useTaskStore((state) => state.sortBy)

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <Input
        placeholder="Search tinkerings..."
        className="md:w-[300px]"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Select 
        value={statusFilter || 'all'} 
        onValueChange={(value) => setStatusFilter(value === 'all' ? null : value as TaskStatus)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="funded">Funded</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Select 
        value={selectedCategory || 'all'} 
        onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="Development">Development</SelectItem>
          <SelectItem value="Design">Design</SelectItem>
          <SelectItem value="Marketing">Marketing</SelectItem>
          <SelectItem value="Research">Research</SelectItem>
        </SelectContent>
      </Select>
      <Select 
        value={sortBy} 
        onValueChange={setSortBy}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="popular">Most Popular</SelectItem>
          <SelectItem value="deadline">Deadline</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 