import { TaskContractParams } from '@/types/contracts'

// Define the template with typed placeholders
export const TASK_CONTRACT_TEMPLATE = (placeholders: TaskContractParams) => 
`@version 1

# update status condition
condition triggered_by: transaction, on: update_status(status), as: [
  content: (

    # can only be updated by master
    previous_address = Chain.get_previous_address()
    Chain.get_genesis_address(previous_address) == 0x${placeholders.MASTER_ADDRESS}


    
  )
]

# update status action
actions triggered_by: transaction, on: update_status(status) do
  task = State.get("task", Map.new())

  # if first sc call init the state with genesis address content
  if task == nil do 

  previous_address = Chain.get_previous_address(transaction)
  genesis_address = Chain.get_genesis_address(previous_address) 
  genesis_transaction = Chain.get_transaction(genesis_address)
  content = Json.parse(genesis_transaction.content)

  task = [
    id: genesis_address,
    title: content.title,
    description: content.description,
    goal_amount: content.goalAmount,
    current_amount: 0,
    deadline: content.deadline,
    category: content.category,
    creator: content.creator,
    status: "pending",
    #created_at: content.created_at
    creator_reliability: 0

  ]

  end

task = Map.set(task,"status", status)

State.set("task", task)
 
end

# Contribute condition
condition triggered_by: transaction, on: deposit(), as: [
  content: (
    task = State.get("task")
    transfered_amount = Map.get(transaction.uco_movements, contract.address)

    task.status == "active" &&
    Time.now() <= task.deadline &&
    transfered_amount != nil && 
    transfered_amount > 0
  )
]

# Contribute action
actions triggered_by: transaction, on: deposit() do
  task = State.get("task")
  
  # Get contribution amount
  uco_amount = Map.get(transaction.uco_movements, contract.address)
  contributor = Chain.get_genesis_address(transaction.address)

  # Update task amount
  task = Map.set(task, "current_amount", task.current_amount + uco_amount)
  
  # Update status if funded
  if task.current_amount >= task.goal_amount do
    task = Map.set(task, "status", "funded")
  end
  
  State.set("task", task)

  # Track contribution
  contributions = State.get("contributions", Map.new())
  contributor_amount = Map.get(contributions, contributor, 0)
  contributions = Map.set(contributions, contributor, contributor_amount + uco_amount)
  State.set("contributions", contributions)
end

fun init_task() do

end

# Export functions
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