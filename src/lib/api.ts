/**
 * <api_service_instructions>
 * API Service Layer (Currently using Mock Data)
 * 
 * Implements:
 * - Task CRUD operations
 * - Contribution handling
 * - Wallet integration placeholders
 * 
 * Current Implementation:
 * - Uses mock data with simulated network delays
 * - Includes placeholder wallet functions for Archethic integration
 * - Simulates task funding and status updates
 * 
 * API Endpoints:
 * - getTasks: Fetches all tasks with 500ms delay
 * - getTask: Fetches single task by ID
 * - createTask: Creates new task with auto-generated ID
 * - contributeToTask: Adds contribution and updates task status
 * 
 * Wallet Functions (Placeholder):
 * - connect: Will handle Archethic wallet connection
 * - disconnect: Will handle wallet disconnection
 * - getBalance: Will fetch wallet balance
 * 
 * Current Limitations:
 * - Uses in-memory mock data
 * - No persistence between refreshes
 * - Simplified error handling
 * - Basic wallet integration stubs
 * 
 * TODO:
 * - Implement actual Archethic blockchain integration
 * - Add proper error handling and validation
 * - Implement real wallet connection flow
 * - Add transaction verification
 * </api_service_instructions>
 */

import { Task, Transaction } from '@/types'
import { mockTasks } from './mock-data'
import Archethic, { Utils, Crypto, ConnectionState } from '@archethicjs/sdk'

const contractAddress = "0x0000000000000000000000000000000000000000000000000000000000000000"

const archethicEndpoint = "https://testnet.archethic.net"
const originPrivateKey = Utils.originPrivateKey
const archethic = new Archethic(archethicEndpoint)

let isConnected = false

// Add connection initialization function
export const initializeArchethic = async () => {
  if (!isConnected) {
    try {
      await archethic.connect()
      isConnected = true
      console.log("Connected to Archethic")
    } catch (error) {
      console.error("Failed to connect to Archethic:", error)
      throw error
    }
  }
}

// API endpoints - with actual Archethic blockchain calls
    
// Initialize Archethic client with required config
const archethicClient = new Archethic(undefined)

// Mock API endpoints - Replace with actual Archethic blockchain calls
export const api = {
  getTasks: async (): Promise<Task[]> => {
    await initializeArchethic()
    const tasks = await archethic.network.callFunction(contractAddress, "get_tasks_list", [])
    console.log(tasks)
    return tasks
  },

  // Wallet connection management
  connectWallet: async (): Promise<{
    connected: boolean
    account?: string
    endpoint?: string
  }> => {
    try {
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      // Listen to wallet connection state changes
      archethicClient.rpcWallet.onconnectionstatechange(async (state) => {
        if (!archethicClient.rpcWallet) return

        switch (state) {
          case ConnectionState.Open:
            const { endpointUrl } = await archethicClient.rpcWallet.getEndpoint()
            const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
            console.log(`Connected as ${walletAccount.shortName} to ${endpointUrl}`)
            break
          case ConnectionState.Closed:
            console.log("Wallet connection closed")
            break
        }
      })

      // Attempt connection
      await archethicClient.connect()
      
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized after connection')
      }

      // Get connection details
      const { endpointUrl } = await archethicClient.rpcWallet.getEndpoint()
      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      
      return {
        connected: true,
        account: walletAccount.shortName,
        endpoint: endpointUrl,
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      return { connected: false }
    }
  },

  // Disconnect wallet
  disconnectWallet: async (): Promise<void> => {
    try {
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      await archethicClient.rpcWallet.close()
      archethicClient.rpcWallet.unsubscribeconnectionstatechange()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  },

  // Create a new crowdfunding task
  createTask: async (
    task: Task,
    contractAddress: string
  ): Promise<boolean> => {
    try {
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      const txBuilder = archethicClient.transaction
        .new()
        .setType("transfer")
        .addRecipient(contractAddress, "create_task", [
          task.title,
          task.description,
          task.goalAmount.toString(),
          task.deadline.toISOString(),
          task.category,
        ])

      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      
      const signResult = await archethicClient.rpcWallet.signTransactions(
        walletAccount.shortName,
        "",
        [txBuilder]
      )

      return true
    } catch (error) {
      console.error("Failed to create task:", error)
      return false
    }
  },

  // Fund an existing task
  fundTask: async (
    taskId: string,
    amount: number,
    contractAddress: string
  ): Promise<boolean> => {
    try {
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      const txBuilder = archethicClient.transaction
        .new()
        .setType("transfer")
        .addRecipient(contractAddress, "fund_task", [taskId, amount.toString()])

      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      
      const signResult = await archethicClient.rpcWallet.signTransactions(
        walletAccount.shortName,
        "",
        [txBuilder]
      )

      return true
    } catch (error) {
      console.error("Failed to fund task:", error)
      return false
    }
  }
}