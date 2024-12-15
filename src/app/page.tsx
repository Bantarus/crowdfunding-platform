import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { TaskGrid } from "@/components/tasks/task-grid"
import { TaskFilters } from "@/components/tasks/task-filters"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Tinkerings</h2>
        <div className="flex items-center space-x-2">
          <CreateTaskDialog />
        </div>
      </div>
      <div className="space-y-4">
        <TaskFilters />
        <TaskGrid tasks={[]} />
      </div>
    </DashboardLayout>
  )
}
