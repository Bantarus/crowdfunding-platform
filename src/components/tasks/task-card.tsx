/**
 * <task_card_instructions>
 * Task Card Component
 * 
 * Features implemented:
 * - Progress bar for funding status
 * - Status badges with color coding
 * - Category display
 * - Transaction count
 * - Deadline countdown
 * - Contribution button (active tasks only)
 * - Creator reliability rating (5-star system)
 * 
 * Implementation Details:
 * - Uses shadcn/ui components for consistent design
 * - Integrated with TanStack Query for mutations
 * - Responsive layout with proper spacing
 * - Truncated wallet addresses for better UX
 * - Real-time date formatting with date-fns
 * - Dynamic progress calculation
 * - Status-based color coding
 * - Star-based reliability rating with decimal score
 * - Centered rating display below creator info
 * 
 * Layout Structure:
 * - Header: Category and status badges, title, description
 * - Content: 
 *   - Progress bar with amounts
 *   - Creator info and deadline row
 *   - Centered reliability rating row
 *   - Contributions count
 * - Footer: Contribute button
 * 
 * State Management:
 * - Uses useContributeToTask for handling contributions
 * - Local progress calculation from task data
 * - Disabled states based on task status
 * 
 * Current Limitations:
 * - Fixed contribution amount (100 UCO)
 * - Mock donor address
 * - No contribution confirmation
 * - No detailed transaction view
 * 
 * TODO:
 * - Add contribution amount input
 * - Implement wallet integration for donations
 * - Add transaction history modal
 * - Add contribution confirmation dialog
 * </task_card_instructions>
 */

'use client'

import { Task } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { useContributeToTask } from '@/lib/hooks'
import { formatDistanceToNow } from 'date-fns'
import { ReliabilityRating } from '../ui/reliability-rating'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { mutate: contribute } = useContributeToTask()
  const progress = (task.currentAmount / task.goalAmount) * 100

  const statusColors = {
    active: 'bg-blue-500',
    funded: 'bg-green-500',
    completed: 'bg-purple-500',
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {task.category}
          </Badge>
          <Badge className={statusColors[task.status]}>
            {task.status}
          </Badge>
        </div>
        <h3 className="mt-2 text-xl font-semibold">{task.title}</h3>
        <p className="text-sm text-muted-foreground">{task.description}</p>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>{task.currentAmount} UCO</span>
              <span>{task.goalAmount} UCO</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Created by: {task.creator.slice(0, 6)}...</span>
              <span>
                Deadline: {formatDistanceToNow(task.deadline, { addSuffix: true })}
              </span>
            </div>
            <div className="flex justify-center items-center">
              <ReliabilityRating score={task.creatorReliability} />
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {1} contributions

          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className="w-full" 
          disabled={task.status !== 'active'}
          onClick={() => {
            if (task.status === 'active') {
              contribute({
                taskId: task.id,
                amount: 100, // For demo purposes
            //    donor: '0xMockDonor',
              })
            }
          }}
        >
          Contribute
        </Button>
      </CardFooter>
    </Card>
  )
} 