/**
 * <task_filters_instructions>
 * Task Filters Component
 * 
 * Features implemented:
 * - Search filter: Filters tasks by title and description (case-insensitive)
 * - Status filter: Filters tasks by their current status (active/funded/completed)
 * - Category filter: Filters tasks by their category (Development/Design/Marketing/Research)
 * 
 * Implementation details:
 * - Uses Zustand store for state management
 * - All filters can be combined (search + status + category)
 * - "All" options reset their respective filters to null
 * - Categories match exactly with mock data capitalization
 * - Status values are typed using TaskStatus type
 * 
 * Store integration:
 * - searchQuery: Text-based filtering for title and description
 * - statusFilter: Handles task status filtering (null means show all)
 * - selectedCategory: Handles category filtering (null means show all)
 * 
 * Current limitations:
 * - Categories are hardcoded and must match mock data exactly
 * - Status options are fixed based on TaskStatus type
 * 
 * TODO:
 * - Consider making categories dynamic based on available task categories
 * - Add sorting functionality
 * - Add date range filtering
 * </task_filters_instructions>
 */

'use client'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
      <Input
        placeholder="Search tasks..."
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
    </div>
  )
} 