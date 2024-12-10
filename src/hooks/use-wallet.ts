"use client"

import { useState, useRef } from "react"
import { api } from "@/lib/api"
import { ConnectionState } from "@archethicjs/sdk"
import { useToast } from "@/hooks/use-toast"

interface WalletState {
  isConnecting: boolean
  isConnected: boolean
  account?: string
  connectionState: ConnectionState
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnecting: false,
    isConnected: false,
    account: undefined,
    connectionState: ConnectionState.Closed,
  })
  const { toast } = useToast()
  const previousState = useRef<ConnectionState>(ConnectionState.Closed)

  const connect = async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true }))
      
      api.subscribeToConnectionState((newState) => {
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
          } : {})
        }))
      })

      const result = await api.connectWallet()
      
      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          isConnected: false,
          connectionState: ConnectionState.Closed 
        }))
        return { success: false, error: result.error }
      }
      
      if (result.connected && result.account) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          isConnected: true,
          account: result.account,
          connectionState: ConnectionState.Open,
        }))
        return { success: true, account: result.account }
      } else {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          isConnected: false,
          connectionState: ConnectionState.Closed
        }))
        return { success: false, error: "Failed to connect" }
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        isConnected: false,
        connectionState: ConnectionState.Closed 
      }))
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
        connectionState: ConnectionState.Closed,
      })
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }
    }
  }

  return {
    ...state,
    connect,
    disconnect,
  }
} 