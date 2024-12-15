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
import { PlusCircle, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useWallet } from "@/hooks/use-wallet"

const FormSchema = z.object({
  title: z
    .string()
    .min(1, {
      message: "Title is required",
    })
    .max(100, {
      message: "Title must not exceed 100 characters",
    }),
  description: z
    .string()
    .min(1, {
      message: "Description is required",
    })
    .max(500, {
      message: "Description must not exceed 500 characters",
    }),
  goalAmount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    {
      message: "Goal amount must be a positive number",
    }
  ),
  deadline: z.date({
    required_error: "Please select a deadline",
  }).refine((date) => date > new Date(), {
    message: "Deadline must be in the future",
  }),
  category: z
    .string()
    .min(1, {
      message: "Category is required",
    })
})

type FormValues = z.infer<typeof FormSchema>

export function CreateTaskDialog() {
  const { isConnected } = useWallet()
  const [open, setOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const { toast } = useToast()
  const { isCreating, createTask } = useTasks()

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      description: "",
      goalAmount: "",
      category: "",
    },
  })

  if (!isConnected) {
    return (
      <Button variant="outline" disabled>
        <PlusCircle className="mr-2 h-4 w-4" />
        Connect wallet to create Tinkerings
      </Button>
    )
  }

  async function onSubmit(data: FormValues) {
    try {
      const task = {
        title: data.title,
        description: data.description,
        goalAmount: Number(data.goalAmount),
        deadline: data.deadline,
        category: data.category,
        currentAmount: 0,
        status: "active" as const,
        id: "",
        creator: "",
        transactions: [],
        creatorReliability: 0,
        votes: [],
        contributions: 0,
        promotions: 0,
        promote_addresses: [],
        withdrawn: false
      }

      const result = await createTask(task)

      if (result.success) {
        toast({
          title: "Success",
          description: `Tinkering created and contract deployed at ${result.contractAddress}`,
        })
        setOpen(false)
        form.reset()
      }
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Something went wrong while creating the tinkering.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Tinkering
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Tinkering</DialogTitle>
          <DialogDescription>
            Create a new crowdfunding tinkering. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Tinkering title" {...field} />
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
                      placeholder="Describe your tinkering"
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
                    <Input type="number" placeholder="1000" {...field} />
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
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setCalendarOpen(false)
                          }}
                          disabled={(date) =>
                            date < new Date()
                          }
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
                {isCreating ? "Creating..." : "Create Tinkering"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 