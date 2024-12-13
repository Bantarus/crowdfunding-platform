import { Task, Transaction } from '@/types'
import { mockTasks, getQuorumAddresses } from './mock-data'
import Archethic, { Utils, Crypto, Contract, ConnectionState } from '@archethicjs/sdk'
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
    const tasksMap = await archethic.network.callFunction(masterContractAddress, "get_tasks_list", [])
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
      creatorReliability: 0,
      votes: taskData.votes || [],
      contributions: taskData.nb_contributions || 0,
      promotions: taskData.nb_promotes || 0,
      promote_addresses: taskData.promote_addresses || []
 
    }))
    
    console.log('Transformed tasks array:', tasksArray) 
   return tasksArray
 
        // Simulate network delay with mock data
     //  await new Promise(resolve => setTimeout(resolve, 500))

     //   return mockTasks
     
  },

  // Wallet connection management
  connectWallet: async (): Promise<{
    connected: boolean
    account?: string
    genesisAddress?: string
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
      
      // Get the genesis address
      const genesisAddress = walletAccount.genesisAddress
      
      return {
        connected: true,
        account: walletAccount.shortName,
        genesisAddress: genesisAddress,
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
        .addUCOTransfer(masterContractAddress, BigInt(amount * 10 ** 8))
        .addRecipient(masterContractAddress, "fund_task", [taskId])
        

      console.log('txBuilder', txBuilder)
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
      if (!masterContractAddress) {
        throw new Error('Master contract address is not defined')
      }
      if (!process.env.NEXT_PUBLIC_FUNDING_AMOUNT) {
        throw new Error('FUNDING_AMOUNT is not defined')
      }

       // 1. Generate a seed and derive address for the task contract
    const taskSeed = Crypto.randomSecretKey() // Generate random seed
    const taskAddress = Utils.uint8ArrayToHex(Crypto.deriveAddress(taskSeed, 0)) // Get address at index 0
    console.log('Generated task address:', taskAddress)

       // 2. Fund the generated address with UCO using wallet
    const fundingAmount = parseInt(process.env.NEXT_PUBLIC_FUNDING_AMOUNT) * 10 ** 8 // Amount of UCO to fund (adjust as needed)
    const fundingTx = archethicClient.transaction
      .new()
      .setType("transfer")
      .addUCOTransfer(taskAddress, BigInt(fundingAmount))

    // Send funding transaction through wallet
    const fundingResult = await archethicClient.rpcWallet.sendTransaction(fundingTx)
    console.log('Funding transaction sent:', fundingResult)

    // Wait for confirmation to ensure funds are available
    await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay


    // 3. Deploy the smart contract using the generated seed
    const contractCode = generateTaskContract({
      ...placeholders,
      CREATOR_ADDRESS: taskAddress,
    })

     // Send contract deployment transaction directly to network
    const storageNoncePublicKey = await archethic.network.getStorageNoncePublicKey();
    const { encryptedSecret, authorizedKeys } = Crypto.encryptSecret(taskSeed, storageNoncePublicKey);
  
  //  const deployTx = await Contract.newContractTransaction(archethic,contractCode, taskSeed)
    const deployTx = archethic.transaction
    .new()
    .setType("contract")
    .setCode(contractCode)
    .setContent(JSON.stringify({
      ...task,
      deadline: Math.floor(task.deadline.getTime() / 1000),
      votes: undefined,
      promotions: undefined,
      contributions: undefined,
      promote_addresses: undefined
    }))
    .addOwnership(encryptedSecret,authorizedKeys)
    .build(taskSeed,0)
    
    
    let nbConfirmation = 0;

      deployTx.originSign(Utils.originPrivateKey)
      .on("requiredConfirmation", (nbConf: any) => {
        console.log('Contract deployment confirmed:', nbConf)
        nbConfirmation = nbConf
        
      })
      .on("error", (context: any, reason: any) => {
        console.error(reason)
      
      })
      .send()
    
   
   console.log('deployTx address : ', Utils.uint8ArrayToHex(deployTx.address))

   // Wait for sufficient confirmations before proceeding
   await new Promise((resolve, reject) => {
     const checkConfirmations = () => {
       if (nbConfirmation>= 11) {
         resolve(true);
       } else if (nbConfirmation === -1) {
         reject(new Error("Transaction failed"));
       } else {
        console.log('nbConfirmation : ', nbConfirmation)
         setTimeout(checkConfirmations, 1000); // Check again in 1 second
       }
     };
     checkConfirmations();
   });

   const taskDeployedAddress = Utils.uint8ArrayToHex(deployTx.address)

     // 4. Register the task with master contract through wallet
     console.log('masterContractAddress : ', masterContractAddress)
     const registerTx = archethicClient.transaction
     .new()
     .setType("transfer")
     .addRecipient(masterContractAddress, "add_task", [
      taskDeployedAddress,
       task.title,
       task.description,
       task.goalAmount,
       Math.floor(task.deadline.getTime() / 1000), //unix timestamp
       task.category
     ])

     console.log('registerTx', registerTx)

    // Send registration transaction through wallet
    const registerResult = await archethicClient.rpcWallet.sendTransaction(registerTx)
    .then((result) => {
      console.log('Task registration transaction sent:', result)
    })
    .catch((error) => {
      console.error("Failed to register task with master:", error)
      throw error
    })
    

    return taskAddress

        
    } catch (error) {
      console.error("Failed to deploy task contract:", error)
      throw error
    }
  },

  subscribeToConnectionState: (callback: (state: ConnectionState) => void) => {
    archethicClient.rpcWallet?.onconnectionstatechange(callback)
    return () => archethicClient.rpcWallet?.unsubscribeconnectionstatechange()
  },

  approveTask: async (taskId: string): Promise<boolean> => {
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
        .addRecipient(masterContractAddress, "approve_task", [taskId])

        console.log('txBuilder', txBuilder)
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)
      return true
    } catch (error) {
      console.error("Failed to approve task:", error)
      throw error
    }
  },

  getQuorumList: async (): Promise<string[]> => {
    try {
      if (!masterContractAddress) {
        throw new Error('Master contract address is not defined')
      }

      console.log("getQuorumList")
      // For development: return mock data
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500))
        return getQuorumAddresses()
      }

      // For production: get from blockchain
      if (!archethicClient.rpcWallet) {
        throw new Error('RPC Wallet not initialized')
      }

      const quorumList = await archethic.network.callFunction(
        masterContractAddress,
        "get_quorum_list",
        []
      )
      console.log("quorumList: ", quorumList)
      return quorumList || []
    } catch (error) {
      console.error("Failed to get quorum list:", error)
      throw error
    }
  },

  // Add a helper method to check if an address is in the quorum
  isQuorumMember: async (address: string): Promise<boolean> => {
    try {
      console.log('isQuorumMember', address)
      const quorumList = await api.getQuorumList()
      return quorumList.includes(address.toUpperCase())
    } catch (error) {
      console.error("Failed to check quorum membership:", error)
      return false
    }
  },

  promoteTask: async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!masterContractAddress) {
        throw new Error('Master contract address is not defined')
      }
      if (!archethicClient.rpcWallet || !archethicClient.rpcWallet.getCurrentAccount()) {
        throw new Error('RPC Wallet not initialized')
      }

      console.log('archethicClient.rpcWallet', archethicClient.rpcWallet)

      const txBuilder = archethicClient.transaction
        .new()
        .setType("transfer")
        .addRecipient(masterContractAddress, "promote_task", [taskId])

      await archethicClient.rpcWallet.sendTransaction(txBuilder)
      return { success: true }
    } catch (error) {
      console.error("Failed to promote task:", error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to promote task" 
      }
    }
  },

  validateTask: async (taskId: string): Promise<boolean> => {
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
        .addRecipient(masterContractAddress, "validate_task", [taskId])

      console.log('Validation transaction:', txBuilder)
      const response = await archethicClient.rpcWallet.sendTransaction(txBuilder)
      return true
    } catch (error) {
      console.error("Failed to validate task:", error)
      throw error
    }
  },
}