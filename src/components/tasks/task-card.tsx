'use client'

import { useWallet } from '@/hooks/use-wallet'
import { Task } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { useContributeToTask } from '@/lib/hooks'
import { formatDistanceToNow } from 'date-fns'
import { ReliabilityRating } from '../ui/reliability-rating'
import { useTasks } from '@/hooks/use-tasks'
import { useToast } from '@/hooks/use-toast'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const { mutate: contribute } = useContributeToTask()
  const { isQuorumMember, hasVoted, approveTask } = useTasks()
  const { toast } = useToast()
  const progress = (task.currentAmount / task.goalAmount) * 100

  const handleApprove = async () => {
    const result = await approveTask(task.id)
    if (result.success) {
      toast({
        title: "Task Approved",
        description: "Your approval has been recorded",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: result.error,
      })
    }
  }

  const renderActionButton = () => {
    if (task.status === 'pending') {
      if (isQuorumMember && !hasVoted(task)) {
        return (
          <Button 
            className="w-full"
            onClick={handleApprove}
          >
            Approve Task
          </Button>
        )
      }
      return (
        <Button className="w-full" disabled>
          Awaiting Approval ({task.votes.length}/1)
        </Button>
      )
    }

    return (
      <Button 
        className="w-full" 
        disabled={task.status !== 'active'}
        onClick={() => {
          if (task.status === 'active') {
            contribute({
              taskId: task.id,
              amount: 100,
            })
          }
        }}
      >
        {task.status === 'active' ? 'Contribute' : task.status === 'funded' ? 'Funded' : 'Completed'}
      </Button>
    )
  }

  const statusColors = {
    pending: 'bg-yellow-500',
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
        {renderActionButton()}
      </CardFooter>
    </Card>
  )
} 