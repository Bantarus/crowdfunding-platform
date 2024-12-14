import { TaskContractParams } from '@/types/contracts'

// Define the template with typed placeholders
export const TASK_CONTRACT_TEMPLATE = (placeholders: TaskContractParams) => 
`@version 1

# update status condition
condition triggered_by: transaction, on: init(creation_address, title, description, goal_amount, deadline, category), as: [
  content: (

    # can only be init by master
    previous_address = Chain.get_previous_address(transaction)
    genesis_address = Chain.get_genesis_address(previous_address)
    task = State.get("task")
    task == nil && genesis_address == 0x${placeholders.MASTER_ADDRESS}


    
  )
]

# update status action
actions triggered_by: transaction, on: init(creation_address, title, description, goal_amount, deadline, category) do
  
  # init the state with creation address content
 
  genesis_address = Chain.get_genesis_address(creation_address) 
  creation_transaction = Chain.get_transaction(creation_address)

  task = [
    id: String.to_hex(creation_address),
    title: title,
    description: description,
    goal_amount: goal_amount,
    current_amount: 0,
    deadline: deadline,
    category: category,
    creator: get_creator(),
    status: "pending",
    created_at: creation_transaction.timestamp

  ]

 
State.set("task", task)
 
end

# update_status condition
condition triggered_by: transaction, on: update_status(new_status), as: [
  content: (
    

    # can only be init by master and have to init first
    previous_address = Chain.get_previous_address(transaction)
    genesis_address = Chain.get_genesis_address(previous_address)
    task = State.get("task")
    task != nil && task.status != new_status && genesis_address == 0x${placeholders.MASTER_ADDRESS}


  )
]

# update status action
actions triggered_by: transaction, on: update_status(new_status) do

  task = State.get("task")
  task = Map.set(task,"status", new_status)
  State.set("task", task)
  
end


#withdraw condition
condition triggered_by: transaction, on: withdraw(), as: [
  content: (
    valid? = false

    previous_address = Chain.get_previous_address(transaction)
    genesis_address = Chain.get_genesis_address(previous_address)
    task = State.get("task")

    valid? = task != nil && task.status == "completed" && genesis_address == String.to_hex(task.creator)


    if valid? do

      
      valid? =  Chain.get_uco_balance(contract.address) > 0


    end

    valid?
    
    
  )
]

# withdraw action
actions triggered_by: transaction, on: withdraw() do

  
  task = State.get("task")

  Contract.set_type("transfer")
  Contract.set_content("withdraw task funds")
  Contract.add_uco_transfer(to: transaction.address, amount: Chain.get_uco_balance(contract.address))
  

end

fun init_task() do

end

# Export functions
export fun get_creator() do
  0x${placeholders.CREATOR_ADDRESS}
end

export fun get_task() do
  State.get("task")
end`

// Helper function to validate and replace placeholders
export function generateTaskContract(placeholders: Partial<TaskContractParams>): string {
  // Default values
  const defaults: TaskContractParams = {
    MASTER_ADDRESS: "0000000000000000000000000000000000000000000000000000000000000000",
    MIN_VOTES: 3,
    CREATOR_ADDRESS: "0000000000000000000000000000000000000000000000000000000000000000"
  }

  // Merge defaults with provided values
  const finalPlaceholders = { ...defaults, ...placeholders }

  // Validate required placeholders
  Object.entries(finalPlaceholders).forEach(([key, value]) => {
    if (value === undefined) {
      throw new Error(`Missing required placeholder: ${key}`)
    }
  })

  return TASK_CONTRACT_TEMPLATE(finalPlaceholders)
} 