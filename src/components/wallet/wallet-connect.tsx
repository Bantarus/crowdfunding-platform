"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"
import { ConnectionState } from "@archethicjs/sdk"
import { useEffect } from "react"

export function WalletConnect() {
  const { 
    isConnecting, 
    isConnected, 
    account, 
    connectionState, 
    connect, 
    disconnect 
  } = useWallet()
  const { toast } = useToast()

  // Reset connecting state when connection is closed
  useEffect(() => {
    if (connectionState === ConnectionState.Closed && isConnecting) {
      // You might want to call disconnect here to ensure state consistency
      disconnect()
    }
  }, [connectionState, isConnecting, disconnect])

  const handleConnect = async () => {
    try {
      const result = await connect()
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      const result = await disconnect()
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Disconnect Error",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Disconnect Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const getButtonText = () => {
    if (isConnecting) {
      return connectionState === ConnectionState.Closed ? 
        "Wallet Not Found" : 
        "Connecting..."
    }
    if (isConnected) {
      return `Disconnect ${account && account.length > 10 ? 
        `${account.slice(0, 6)}...${account.slice(-4)}` : 
        account}`
    }
    return "Connect Wallet"
  }

  return (
    <Button 
      variant="outline"
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isConnecting}
    >
      {getButtonText()}
    </Button>
  )
} 