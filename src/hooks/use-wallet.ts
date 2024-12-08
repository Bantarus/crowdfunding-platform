"use client"

import { useState } from "react"
import { api } from "@/lib/api"

interface WalletState {
  isConnecting: boolean
  isConnected: boolean
  account?: string
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnecting: false,
    isConnected: false,
    account: undefined,
  })

  const connect = async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true }))
      const result = await api.connectWallet()
      
      if (result.connected && result.account) {
        setState({
          isConnecting: false,
          isConnected: true,
          account: result.account,
        })
        return { success: true, account: result.account }
      } else {
        setState(prev => ({ ...prev, isConnecting: false }))
        return { success: false, error: "Failed to connect" }
      }
    } catch (error) {
      setState(prev => ({ ...prev, isConnecting: false }))
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