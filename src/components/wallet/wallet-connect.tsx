"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"
import { useToast } from "@/hooks/use-toast"

export function WalletConnect() {
  const { isConnecting, isConnected, account, genesisAddress, connect, disconnect } = useWallet()
  const { toast } = useToast()

  const handleConnect = async () => {
    const result = await connect()
    if (result.success) {
      toast({
        title: "Wallet Connected",
        description: `Connected to ${result.account}`,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: result.error,
      })
    }
  }

  const handleDisconnect = async () => {
    const result = await disconnect()
    if (result.success) {
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected wallet",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Disconnect Error",
        description: result.error,
      })
    }
  }

  return (
    <Button 
      variant="outline"
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        "Connecting..."
      ) : isConnected ? (
        `Disconnect ${account && account.length > 10 ? `${account.slice(0, 6)}...${account.slice(-4)}` : account}`
      ) : (
        "Connect Wallet"
      )}
    </Button>
  )
} 