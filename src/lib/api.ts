import { Task, Transaction } from '@/types'
import { mockTasks } from './mock-data'
import Archethic, { Utils, Crypto, ConnectionState } from '@archethicjs/sdk'
import { generateTaskContract } from './contracts/templates'
import { TaskContractParams } from '@/types/contracts'

const masterContractAddress = process.env.NEXT_PUBLIC_MASTER_CONTRACT_ADDRESS

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

let connectionStateCallback: ((state: ConnectionState) => void) | null = null;

// Mock API endpoints - Replace with actual Archethic blockchain calls
export const api = {
  getTasks: async (): Promise<Task[]> => {
    await initializeArchethic()
    if (!masterContractAddress) {
      throw new Error('Master contract address is not defined')
    }
 /*    const tasksMap = await archethic.network.callFunction(masterContractAddress, "get_tasks_list", [])
    console.log('Raw tasks from contract:', tasksMap)
    
    // Convert the map object to an array of tasks with correct property mapping
    const tasksArray = Object.entries(tasksMap).map(([id, taskData]: [string, any]) => ({
      id: id,
      title: taskData.title,
      description: taskData.description,
      goalAmount: taskData.goal_amount,
      currentAmount: taskData.current_amount,
      deadline: new Date(taskData.deadline * 1000),
      category: taskData.category,
      creator: taskData.creator,
      status: taskData.status,
      createdAt: new Date(taskData.created_at * 1000),
      transactions: [],
      creatorReliability: 0
    }))
    
    console.log('Transformed tasks array:', tasksArray) */
   // return tasksArray
 
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))

        return mockTasks
     
  },

  // Wallet connection management
  connectWallet: async (): Promise<{
    connected: boolean
    account?: string
    endpoint?: string
    error?: string
  }> => {
    try {
      if (!archethicClient.rpcWallet || archethicClient.rpcWallet  === undefined) {
        throw new Error('RPC Wallet not initialized')
      }
      console.log('archethicClient', archethicClient)

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
      await archethicClient.connect().catch((error) => {
        console.error('Error connecting to Archethic:', error)
        throw new Error('Error connecting to Archethic: ' + error)
      })
      console.log('passed connect')
      
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
      if (!masterContractAddress) {
        throw new Error('Master contract address is not defined')
      }
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      // Convert the JavaScript Date to Unix timestamp (seconds since epoch)
      const unixTimestamp = Math.floor(task.deadline.getTime() / 1000)

      const txBuilder = archethicClient.transaction
        .new()
        .setType("transfer")
        .addRecipient(masterContractAddress, "create_task", [
          task.title,
          task.description,
          task.goalAmount,
          unixTimestamp,
          task.category,
        ])

      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      console.log(walletAccount)
      
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)
      console.log(response)
      return true
    } catch (error) {
      console.error("Failed to create task:", error)
      throw error
    }
  },

  // Fund an existing task
  fundTask: async (
    taskId: string,
    amount: number
  ): Promise<boolean> => {
    try {
      if (!masterContractAddress) {
        throw new Error('Master contract address is not defined')
      }
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      const txBuilder = archethicClient.transaction
        .new()
        .setType("transfer")
        .addRecipient(masterContractAddress, "fund_task", [taskId, amount.toString()])

      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)

      return true
    } catch (error) {
      console.error("Failed to fund task:", error)
      throw error
    }
  },

  registerTaskWithMaster: async (taskContractAddress: string): Promise<void> => {
    try {
      if (!masterContractAddress) {
        throw new Error('Master contract address is not defined')
      }
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      const txBuilder = archethicClient.transaction
        .new()
        .setType("transfer")
        .addRecipient(masterContractAddress, "add_task", [taskContractAddress])

      await archethicClient.rpcWallet.sendTransaction(txBuilder)
    } catch (error) {
      console.error("Failed to register task with master:", error)
      throw error
    }
  },

  deployTaskContract: async (
    task: Task,
    placeholders: Partial<TaskContractParams>
  ): Promise<string> => {
    try {
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      const walletAccount = await archethicClient.rpcWallet.getCurrentAccount()
      
      // Generate contract code with placeholders
      const contractCode = generateTaskContract({
        ...placeholders,
        CREATOR_ADDRESS: walletAccount.genesisAddress,
      })
      
      // Create the contract transaction
      const txBuilder = archethicClient.transaction
        .new()
        .setType("contract")
        .setCode(contractCode)
        
      // Send the transaction
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)
      
      // Get the contract address from the response
      const taskContractAddress = response.transactionAddress
      
      // Register the contract with the master contract
      await api.registerTaskWithMaster(taskContractAddress)
      
      return taskContractAddress
    } catch (error) {
      console.error("Failed to deploy task contract:", error)
      throw error
    }
  },

  subscribeToConnectionState: (callback: (state: ConnectionState) => void) => {
    connectionStateCallback = callback
    
    if (!archethicClient.rpcWallet) {
      console.warn("RPC Wallet not initialized, cannot subscribe to connection state changes.")
      return
    }
    
    archethicClient.rpcWallet.onconnectionstatechange(async (state) => {
      if (connectionStateCallback) {
        connectionStateCallback(state)
      }
      
      // Handle additional logic based on connection state if needed
      switch (state) {
        case ConnectionState.Open:
          console.log("Connection state: Open")
          break
        case ConnectionState.Closed:
          console.log("Connection state: Closed")
          break
        case ConnectionState.Connecting:
          console.log("Connection state: Connecting")
          break
        case ConnectionState.Closing:
          console.log("Connection state: Closing")
          break
        default:
          console.log("Unknown connection state")
      }
    })
  },

}