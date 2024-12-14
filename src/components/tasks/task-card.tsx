'use client'

import { useWallet } from '@/hooks/use-wallet'
import { Task } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { useContributeToTask,usePromoteTask } from '@/lib/hooks'
import { formatDistanceToNow } from 'date-fns'
import { ReliabilityRating } from '../ui/reliability-rating'
import { useTasks } from '@/hooks/use-tasks'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { ContributeDialog } from './contribute-dialog'
import { ThumbsUp } from 'lucide-react'

interface TaskCardProps {
  task: Task
  showWithdrawButton?: boolean
}

export function TaskCard({ task, showWithdrawButton }: TaskCardProps) {
  const { isConnected, isQuorumMember, genesisAddress } = useWallet()
  const { mutate: contribute } = useContributeToTask()
  const { hasVoted, approveTask, validateTask, withdrawFunds } = useTasks()
  const { toast } = useToast()
  const progress = (task.currentAmount / task.goalAmount) * 100
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false)
  const { mutateAsync: promote } = usePromoteTask()

  
  const hasPromoted = genesisAddress && task.promote_addresses.includes(genesisAddress.toUpperCase()) || false

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

  const handlePromote = async () => {
    try {
      const result = await promote(task.id)
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Failed to promote",
          description: result.error,
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Promote error:', error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Please connect your wallet to promote tasks",
        duration: 3000,
      })
    }
  }

  const handleValidate = async () => {
    const result = await validateTask(task.id)
    if (result.success) {
      toast({
        title: "Funding Validated",
        description: "Your validation has been recorded",
      })
    } else {
      toast({
        variant: "destructive", 
        title: "Validation Failed",
        description: result.error,
      })
    }
  }

  const handleWithdraw = async () => {
    try {
      const result = await withdrawFunds(task.id)
      if (result.success) {
        toast({
          title: "Withdrawal Successful",
          description: "Funds have been withdrawn to your wallet",
          duration: 3000,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Withdrawal Failed", 
          description: result.error,
          duration: 3000,
        })
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Please connect your wallet to withdraw funds",
        duration: 3000,
      })
    }
  }

  const renderActionButton = () => {
    if (task.status === 'pending') {
      if (isConnected && isQuorumMember && !hasVoted(task)) {
        return (
          <Button 
            className="w-full"
            onClick={handleApprove}
          >
            Approve
          </Button>
        )
      }
      return (
        <Button className="w-full" disabled>
          Awaiting Approval ({task.votes.length}/1)
        </Button>
      )
    }

    if (task.status === 'funded') {
      return (
        <div className="space-y-2">
          {isConnected && isQuorumMember && !hasVoted(task) && (
            <Button 
              className="w-full"
              onClick={handleValidate}
            >
              Validate Completion
            </Button>
          )}
          {(!isConnected || !isQuorumMember || hasVoted(task)) && (
            <Button className="w-full" disabled>
              Awaiting Validation ({task.votes.length}/3)
            </Button>
          )}
        </div>
      )
    }

    if (task.status === 'completed') {
     
      if (task.creator === genesisAddress?.toUpperCase() && !task.withdrawn && showWithdrawButton) {
        return (
          <Button 
            className="w-full"
            variant="secondary"
            onClick={handleWithdraw}
          >
            Withdraw Funds
          </Button>
        )
      }
      return (
        <Button className="w-full" disabled>
          Completed
        </Button>
      )
    }

    return (
      <>
        <Button 
          className="w-full" 
          disabled={task.status !== 'active'}
          onClick={() => {
            if (task.status === 'active') {
              setContributeDialogOpen(true)
            }
          }}
        >
          {task.status === 'active' ? 'Contribute' : task.status === 'completed' ? 'Completed' : 'Funded'}
        </Button>
        <ContributeDialog
          task={task}
          open={contributeDialogOpen}
          onOpenChange={setContributeDialogOpen}
        />
      </>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePromote}
            disabled={hasPromoted}
            className="flex items-center gap-1"
          >
            {hasPromoted ? (
              <ThumbsUp className="h-4 w-4" fill="currentColor" />
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            <span>{task.promotions}</span>
          </Button>
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
            {task.contributions} contributions

          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center">
        <div className="w-full">
          {renderActionButton()}
        </div>
      </CardFooter>
    </Card>
  )
} 