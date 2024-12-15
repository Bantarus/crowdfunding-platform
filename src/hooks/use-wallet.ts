"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { ConnectionState } from "@archethicjs/sdk"
import { useToast } from "@/hooks/use-toast"
import { useWalletStore } from '@/lib/stores/wallet-store'

interface WalletState {
  isConnecting: boolean
  isConnected: boolean
  account?: string
  genesisAddress?: string
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnecting: false,
    isConnected: false,
    account: undefined,
    genesisAddress: undefined,
  })
  const { toast } = useToast()
  const setWalletState = useWalletStore(state => state.setWalletState)
  const isQuorumMember = useWalletStore(state => state.isQuorumMember)
  const isStoreConnected = useWalletStore(state => state.isConnected)
  const connectionState = useWalletStore(state => state.connectionState)
  const setQuorumMembership = useWalletStore(state => state.setQuorumMembership)

  // Sync with store connection state
  useEffect(() => {
    const walletAddress = useWalletStore.getState().walletAddress
    const genesisAddress = useWalletStore.getState().genesisAddress
    
    setState(prev => ({
      ...prev,
      isConnected: isStoreConnected,
      account: isStoreConnected ? (walletAddress || undefined) : undefined,
      genesisAddress: isStoreConnected ? (genesisAddress || undefined) : undefined,
    }))
  }, [isStoreConnected])

  const connect = async () => {
    try {
      console.log('Connecting wallet...')
      setState(prev => ({ ...prev, isConnecting: true }))
      
      const result = await api.connectWallet()
      console.log('Connection result:', result)
      
      if (!result.connected || result.error) {
        console.log('Connection error:', result.error)
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          isConnected: false,
        }))
        setWalletState(null, null, false)
        setQuorumMembership(false)
        return { success: false, error: result.error || "Failed to connect" }
      }

      if (result.account) {
        console.log('Connection successful:', {
          account: result.account,
          genesisAddress: result.genesisAddress
        })
        // Check quorum membership but don't prevent connection
        // This only affects permissions for certain actions
        const isMember = await api.isQuorumMember(result.genesisAddress || '')
        setQuorumMembership(isMember)

        setState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
          account: result.account,
          genesisAddress: result.genesisAddress,
        }))
        setWalletState(
          result.account,
          result.genesisAddress || null,
          true
        )
        return { 
          success: true, 
          account: result.account,
          genesisAddress: result.genesisAddress 
        }
      }else{
      
      // If we get here, something went wrong
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: false,
      }))
      setWalletState(null, null, false)
      return { success: false, error: "Failed to connect" }
    }
    } catch (error) {
      console.error('Connection error:', error)
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: false,
      }))
      setWalletState(null, null, false)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }
    }
  }

  const disconnect = async () => {
    try {
      await api.disconnectWallet()
      setState({
        isConnecting: false,
        isConnected: false,
        account: undefined,
        genesisAddress: undefined,
      })
      setWalletState(null, null, false)
      setQuorumMembership(false)
      return { success: true }
    } catch (error ) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }
    }
  }

  return {
    ...state,
    connectionState,
    isQuorumMember,
    connect,
    disconnect,
  }
} 