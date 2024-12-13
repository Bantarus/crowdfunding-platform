"use client"

import { useState, useRef, useEffect } from "react"
import { api } from "@/lib/api"
import { ConnectionState } from "@archethicjs/sdk"
import { useToast } from "@/hooks/use-toast"
import { useWalletStore } from '@/lib/stores/wallet-store'

interface WalletState {
  isConnecting: boolean
  isConnected: boolean
  account?: string
  genesisAddress?: string
  connectionState: ConnectionState
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnecting: false,
    isConnected: false,
    account: undefined,
    genesisAddress: undefined,
    connectionState: ConnectionState.Closed,
  })
  const { toast } = useToast()
  const setWalletState = useWalletStore(state => state.setWalletState)
  const isQuorumMember = useWalletStore(state => state.isQuorumMember)
  const isStoreConnected = useWalletStore(state => state.isConnected)
  const previousState = useRef<ConnectionState>(ConnectionState.Closed)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const setQuorumMembership = useWalletStore(state => state.setQuorumMembership)

  // Add debug logging
  useEffect(() => {
    console.log('Wallet Hook State:', {
      hookConnected: state.isConnected,
      storeConnected: isStoreConnected,
      account: state.account,
      connectionState: state.connectionState
    })
  }, [state.isConnected, isStoreConnected, state.account, state.connectionState])

  // Handle connection state subscription
  useEffect(() => {
    const checkQuorumMembership = async (genesisAddress: string | undefined) => {
      if (genesisAddress) {
        const isMember = await api.isQuorumMember(genesisAddress)
        setQuorumMembership(isMember)
      } else {
        setQuorumMembership(false)
      }
    }

    const setupSubscription = () => {
      // Clean up any existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Set up new subscription
      unsubscribeRef.current = api.subscribeToConnectionState((newState) => {
        console.log('Connection state changed:', newState)
        
        if (previousState.current === ConnectionState.Connecting && 
            newState === ConnectionState.Closed) {
          toast({
            variant: "destructive",
            title: "Connection Failed",
            description: "Please ensure aeWallet is open and unlocked before connecting.",
          })
        }
        
        previousState.current = newState
        
        setState(prev => ({ 
          ...prev, 
          connectionState: newState,
          isConnected: newState === ConnectionState.Open,
          isConnecting: prev.isConnecting && newState === ConnectionState.Connecting,
          ...(newState === ConnectionState.Closed ? {
            isConnecting: false,
            isConnected: false,
            account: undefined,
            genesisAddress: undefined,
          } : {})
        }))
        
        if (newState === ConnectionState.Open) {
          checkQuorumMembership(state.genesisAddress)
        } else if (newState === ConnectionState.Closed) {
          setQuorumMembership(false)
        }
      })
    }

    setupSubscription()

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [toast, setQuorumMembership])

  // Persist wallet state across navigation
  useEffect(() => {
    const walletAddress = useWalletStore.getState().walletAddress
    const genesisAddress = useWalletStore.getState().genesisAddress
    
    // If we have a stored connection, restore it with account details
    if (isStoreConnected && !state.isConnected) {
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionState: ConnectionState.Open,
        account: walletAddress || undefined,
        genesisAddress: genesisAddress || undefined
      }))
    }
  }, [isStoreConnected])

  const connect = async () => {
    try {
      console.log('Connecting wallet...')
      setState(prev => ({ ...prev, isConnecting: true }))
      
      const result = await api.connectWallet()
      console.log('Connection result:', result)
      
      if (result.error) {
        console.log('Connection error:', result.error)
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          isConnected: false,
          connectionState: ConnectionState.Closed 
        }))
        setWalletState(null, null, false)
        setQuorumMembership(false)
        return { success: false, error: result.error }
      }

      if (result.connected && result.account) {
        console.log('Connection successful:', {
          account: result.account,
          genesisAddress: result.genesisAddress
        })
        // Check quorum membership immediately after successful connection
        const isMember = await api.isQuorumMember(result.genesisAddress || '')
        setQuorumMembership(isMember)

        setState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
          account: result.account,
          genesisAddress: result.genesisAddress,
          connectionState: ConnectionState.Open,
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
      } else {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          isConnected: false,
          connectionState: ConnectionState.Closed
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
        connectionState: ConnectionState.Closed 
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
        connectionState: ConnectionState.Closed,
      })
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
    isQuorumMember,
    connect,
    disconnect,
  }
} 