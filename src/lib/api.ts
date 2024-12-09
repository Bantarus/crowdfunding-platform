import { Task, Transaction } from '@/types'
import { mockTasks } from './mock-data'
import Archethic, { Utils, Crypto, ConnectionState } from '@archethicjs/sdk'

const contractAddress = "0000EAE2C633CE40125C1BD570F94F76E571CAAD24F59BF26EE45B256561A8438DF7"

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
    const tasksMap = await archethic.network.callFunction(contractAddress, "get_tasks_list", [])
    console.log('Raw tasks from contract:', tasksMap)
    
    // Convert the map object to an array of tasks
    const tasksArray = Object.entries(tasksMap).map(([id, task]) => ({
      ...(task as Task),
      id: id, // Ensure the id is included in the task object
    }))
    
    console.log('Transformed tasks array:', tasksArray)
    return tasksArray
 
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))

        return mockTasks
     
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
          case ConnectionState.Connecting:
            console.log("Connecting  ...")
            break
          case ConnectionState.Closing:
            console.log("Disconnecting ...")
            break
        }
      })

      // Attempt connection
      await archethicClient.connect()
      
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized after connection')
      }

      /// Listen to rpc wallet connection status changes
      const accountSubscription = await archethicClient.rpcWallet.onCurrentAccountChange(async (account: any) => {
        console.log(account)
      })

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
    task: Task
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
          task.goalAmount,
          task.deadline.toISOString(),
          task.category,
        ])

      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      console.log(walletAccount)
      
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)
      console.log(response)
      return true
    } catch (error) {
      console.error("Failed to create task:", error)
      return false
    }
  },

  // Fund an existing task
  fundTask: async (
    taskId: string,
    amount: number
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
      
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)

      return true
    } catch (error) {
      console.error("Failed to fund task:", error)
      return false
    }
  }
}