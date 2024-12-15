import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Task } from "@/types"
import { ReliabilityRating } from "../ui/reliability-rating"
import { TaskGrid } from "../tasks/task-grid"
import { Badge } from "../ui/badge"

interface CreatorStats {
  totalCompleted: number
  totalWithdrawn: number
  rank: string
  reliability: number
}

interface CreatorProfileProps {
  address: string
  stats: CreatorStats
  tasks: Task[]
}

export function CreatorProfile({ address, stats, tasks }: CreatorProfileProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tinkerings Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWithdrawn} UCO</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tinker Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-lg">
              {stats.rank}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reliability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ReliabilityRating score={stats.reliability} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Your Tinkerings</h2>
        <TaskGrid tasks={tasks} showWithdrawButton={true} />
      </div>
    </div>
  )
} 