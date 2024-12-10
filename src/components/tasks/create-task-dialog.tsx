"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTasks } from "@/hooks/use-tasks"
import { PlusCircle } from "lucide-react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(500),
  goalAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Goal amount must be a positive number",
  }),
  deadline: z.string().refine((val) => {
    const date = new Date(val)
    return date > new Date()
  }, {
    message: "Deadline must be in the future",
  }),
  category: z.string().min(1, "Category is required"),
})

type TaskFormValues = z.infer<typeof taskFormSchema>

const defaultValues: Partial<TaskFormValues> = {
  title: "",
  description: "",
  goalAmount: "",
  deadline: "",
  category: "",
}

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const { isCreating, createTask } = useTasks()
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  async function onSubmit(data: TaskFormValues) {
    const task = {
      title: data.title,
      description: data.description,
      goalAmount: Number(data.goalAmount),
      deadline: new Date(data.deadline),
      category: data.category,
      currentAmount: 0,
      status: "active" as const,
      id: "", // Will be generated by API
      creator: "", // Will be set by API
      transactions: [], // Empty initial transactions
      creatorReliability: 0 // Initial reliability score
    }

    const result = await createTask(task)

    if (result.success) {
      toast({
        title: "Task Created",
        description: `Task created and contract deployed at ${result.contractAddress}`,
      })
      setOpen(false)
      form.reset()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new crowdfunding task. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your task"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Amount (UCO)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            field.onChange(date?.toISOString())
                            setIsCalendarOpen(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Development, Design" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 