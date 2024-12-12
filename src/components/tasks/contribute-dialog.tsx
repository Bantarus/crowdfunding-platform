import { useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { useToast } from "@/hooks/use-toast"
import { useTasks } from "@/hooks/use-tasks"
import { Task } from "@/types"

interface ContributeDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContributeDialog({ task, open, onOpenChange }: ContributeDialogProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { fundTask } = useTasks()
  const { toast } = useToast()

  const handleContribute = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid number",
      })
      return
    }

    setIsLoading(true)
    const result = await fundTask(task.id, Number(amount))
    setIsLoading(false)

    if (result.success) {
      toast({
        title: "Contribution initiated",
        description: "Please confirm the transaction in your wallet",
      })
      onOpenChange(false)
      setAmount("")
    } else {
      toast({
        variant: "destructive",
        title: "Contribution failed",
        description: result.error,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to &quot;{task.title}&quot;</DialogTitle>
          <DialogDescription>
            Enter the amount you want to contribute to this task. You will receive a
            confirmation request in your wallet to approve the transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount (UCO)
            </label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Task goal: {task.goalAmount} UCO</p>
            <p>Currently funded: {task.currentAmount} UCO</p>
            <p>Remaining: {task.goalAmount - task.currentAmount} UCO</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContribute} disabled={isLoading}>
            {isLoading ? "Contributing..." : "Contribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 