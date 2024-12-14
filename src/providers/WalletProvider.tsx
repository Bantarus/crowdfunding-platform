'use client'

import { useEffect } from 'react'
import { api } from "@/lib/api"
import { ConnectionState } from "@archethicjs/sdk"
import { useWalletStore } from '@/lib/stores/wallet-store'
import { useToast } from "@/hooks/use-toast"

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const setConnectionState = useWalletStore(state => state.setConnectionState)
  const setQuorumMembership = useWalletStore(state => state.setQuorumMembership)
  const setWalletState = useWalletStore(state => state.setWalletState)
  const genesisAddress = useWalletStore(state => state.genesisAddress)
  const isConnected = useWalletStore(state => state.isConnected)

  useEffect(() => {
    let lastState: ConnectionState | null = null;
    
    const unsubscribe = api.subscribeToConnectionState(async (newState) => {
      // Skip if same state to prevent unnecessary updates
      if (lastState === newState) {
        return;
      }
      
      if (newState === ConnectionState.Open && genesisAddress) {
        const isMember = await api.isQuorumMember(genesisAddress)
        setQuorumMembership(isMember)
      } else if (newState === ConnectionState.Closed) {
        setQuorumMembership(false)
        setWalletState(null, null, false)
        
        if (!isConnected && lastState === ConnectionState.Connecting) {
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Please ensure your wallet is open and unlocked",
          })
        } else if (newState === ConnectionState.Closed && lastState === ConnectionState.Closing) {
          toast({
            variant: "destructive",
            title: "Disconnected",
            description: "Wallet connection closed",
          })
        }
        else {
          toast({
            variant: "destructive",
            title: "Disconnected",
            description: "Wallet connection lost",
          })
        }
      }
      
      console.log('Connection state changed:', newState)
      lastState = newState;
      setConnectionState(newState)
    })

    return () => {
      unsubscribe()
    }
  }, [setConnectionState])

  return children
}
