'use client'

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { CreatorProfile } from "@/components/profile/creator-profile"
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useCreatorTasks } from "@/lib/hooks"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getRank, calculateReliability } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { useTaskStore } from "@/lib/store"

export default function TasksPage() {
  const { toast } = useToast()
  const { genesisAddress, isConnected } = useWalletStore()
  const router = useRouter()
  
  console.log('Current genesis address:', genesisAddress)
  
  const { data: creatorTasks, isLoading } = useCreatorTasks(genesisAddress || undefined)
  
  console.log('Creator tasks:', creatorTasks)

  useEffect(() => {
    if (!isConnected) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to view your tasks",
      })
    }
  }, [isConnected, toast])

  return (
    <DashboardLayout>
      {!isConnected ? (
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
          <p className="text-muted-foreground">Please connect your wallet to view your tasks</p>
        </Card>
      ) : isLoading ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Loading your tasks...</p>
        </Card>
      ) : (
        <CreatorProfile 
          address={genesisAddress!}
          stats={{
            totalCompleted: creatorTasks?.filter(t => t.status === 'completed').length ?? 0,
            totalWithdrawn: creatorTasks?.reduce((acc, t) => acc + (t.currentAmount || 0), 0) ?? 0,
            rank: getRank(creatorTasks?.filter(t => t.status === 'completed').length ?? 0),
            reliability: calculateReliability(creatorTasks || [])
          }}
          tasks={creatorTasks || []}
        />
      )}
    </DashboardLayout>
  )
} 