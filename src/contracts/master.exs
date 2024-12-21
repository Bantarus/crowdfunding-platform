@version 1


# smart contract params functions



# add task condition
condition triggered_by: transaction, on: add_task(task_creation_address,title, description, goal_amount, deadline, category), as: [
  content: (
 
    previous_address = Chain.get_previous_address(transaction)
    creator_genesis_address = Chain.get_genesis_address(previous_address)

    valid_creator? = Contract.call_function(task_creation_address, "get_creator", []) == creator_genesis_address

    task_creation_address = String.to_hex(task_creation_address)
    task_transaction = Chain.get_transaction(task_creation_address)
    valid_task? = task_transaction != nil
   
    valid_code? = false
    valid_code? = Code.is_same?(get_task_code(creator_genesis_address), task_transaction.code)

    valid_params? = goal_amount > 0 && deadline > Time.now()

   valid_task? &&
   valid_creator? &&
   valid_code? && 
   valid_params?
    
  )
]

# add task action
actions triggered_by: transaction, on: add_task(task_creation_address,title, description, goal_amount, deadline, category ) do
 
  task_creation_address = String.to_hex(task_creation_address)
  task_transaction = Chain.get_transaction(task_creation_address)

  previous_address = Chain.get_previous_address(transaction)
  creator_genesis_address = Chain.get_genesis_address(previous_address)

  # Create task structure
  task = [
    id: task_creation_address,
    title: title,
    description: description,
    goal_amount: goal_amount,
    current_amount: 0,
    deadline: deadline,
    category: category,
    creator: creator_genesis_address,
    status: "pending",
    validated_at: task_transaction.timestamp,
    nb_contributions: 0,
    min_votes: 1,
    nb_approvals: 0,
    approve_addresses: [],
    nb_refusals: 0,
    nb_promotes: 0,
    promote_addresses: [],
    nb_validations: 0
  ]

  # Store task
  tasks = State.get("tasks",Map.new())
  tasks = Map.set(tasks, task.id, task)
  State.set("tasks", tasks)

  Contract.set_type("transfer")
  Contract.add_recipient(address: task_creation_address, action: "init", args: [task_creation_address, title, description, goal_amount, deadline, category])
 
end

condition triggered_by: transaction, on: approve_task(task_creation_address), as: [
  content: (

    approver_previous_address = Chain.get_previous_address(transaction)
    approver_genesis_address = Chain.get_genesis_address(approver_previous_address)

     valid_approver? = List.in?(get_quorum_list(),approver_genesis_address)

    

    valid_task_address? = false

    if valid_approver? do

      tasks = State.get("tasks", Map.new())
      task = Map.get(tasks,String.to_hex(task_creation_address))

      valid_task_address? = task != nil && task.status == "pending" && !List.in?(task.approve_addresses,approver_genesis_address)


    end

    valid_task_address?

  )
]

actions triggered_by: transaction, on: approve_task(task_creation_address) do
approver_previous_address = Chain.get_previous_address(transaction)
approver_genesis_address = Chain.get_genesis_address(approver_previous_address)
task_creation_address = String.to_hex(task_creation_address)
tasks = State.get("tasks")
task = Map.get(tasks, task_creation_address)

task = Map.set(task, "nb_approvals",task.nb_approvals + 1 )
task = Map.set(task, "approve_addresses", List.prepend(task.approve_addresses, approver_genesis_address))


if task_is_approved(task.nb_approvals) do

task = Map.set(task,"status","active")

Contract.set_type("transfer")
Contract.add_recipient(address: task_creation_address, action: "update_status", args: ["active"])


end

tasks = Map.set(tasks,task.id, task)
State.set("tasks",tasks)


end

condition triggered_by: transaction, on: reject_task(), as: [
  content: ()
]

actions triggered_by: transaction, on: reject_task() do


end



# promote condition
condition triggered_by: transaction, on: promote_task(task_creation_address), as: [
  content: (
    valid? = false

    tasks = State.get("tasks", Map.new())
    task = Map.get(tasks, String.to_hex(task_creation_address))

    valid? =  task != nil && task.status != "completed"

    if valid? do

     previous_promote_address = Chain.get_previous_address(transaction)
     genesis_promote_address = Chain.get_genesis_address(previous_promote_address)


      valid? = !List.in?(task.promote_addresses,genesis_promote_address)

    end
    
    valid?
  )
]

# promote action
actions triggered_by: transaction, on: promote_task(task_creation_address) do

  previous_promote_address = Chain.get_previous_address(transaction)
  genesis_promote_address = Chain.get_genesis_address(previous_promote_address)
  task_creation_address = String.to_hex(task_creation_address)
  tasks = State.get("tasks")
  task = Map.get(tasks, task_creation_address )

  promote_addresses = Map.get(task,"promote_addresses",[])

  promote_addresses = List.prepend(promote_addresses, genesis_promote_address)
  
  task = Map.set(task, "nb_promotes", task.nb_promotes + 1 )

  task = Map.set(task, "promote_addresses",promote_addresses)
  
  tasks = Map.set(tasks,task.id, task)

  State.set("tasks", tasks)

end



# Contribute condition
condition triggered_by: transaction, on: fund_task(task_creation_address), as: [
  content: (
    tasks = State.get("tasks")
    task = Map.get(tasks, task_creation_address)
    transfered_amount = Map.get(transaction.uco_transfers, Chain.get_genesis_address(contract.address))

    # Validate task exists and is active
    task != nil && 
    task.status == "active" &&
    Time.now() < task.deadline &&
    # Check uco transferred > 0
    transfered_amount != nil && transfered_amount > 0
    
  )
]

# Contribute action
actions triggered_by: transaction, on: fund_task(task_creation_address) do
  tasks = State.get("tasks")
  task = Map.get(tasks, String.to_hex(task_creation_address))
  
  # Get contribution amount
  uco_amount = Map.get(transaction.uco_transfers, Chain.get_genesis_address(contract.address))
  contributor_previous_address = Chain.get_previous_address(transaction)
  contributor_genesis_address = Chain.get_genesis_address(contributor_previous_address)

  # Update task amount
  Contract.set_type("transfer")
  Contract.add_uco_transfer(to: task_creation_address,amount:  uco_amount)
  task = Map.set(task, "current_amount", task.current_amount + uco_amount)

  task = Map.set(task,"nb_contributions",task.nb_contributions + 1)
  
  # Update status if funded
  if task.current_amount >= task.goal_amount do
    task = Map.set(task, "status", "funded")
    Contract.set_type("transfer")
    Contract.add_recipient(address: task_creation_address, action: "update_status", args: ["funded"])

  end
  
  # Store updated task
  tasks = Map.set(tasks, task.id, task)
  State.set("tasks", tasks)

 
end

#validate condition
condition triggered_by: transaction, on: validate_task(task_creation_address), as: [
  content: (

    approver_previous_address = Chain.get_previous_address(transaction)
    approver_genesis_address = Chain.get_genesis_address(approver_previous_address)

     valid_approver? = List.in?(get_quorum_list(),approver_genesis_address)

    valid_task_address? = false

    if valid_approver? do

      tasks = State.get("tasks", Map.new())
      task = Map.get(tasks,String.to_hex(task_creation_address))

      valid_task_address? = task != nil && task.status == "funded"

    end

    valid_task_address?

  )
]

#validate action
actions triggered_by: transaction, on: validate_task(task_creation_address) do

tasks = State.get("tasks")
task = Map.get(tasks, String.to_hex(task_creation_address))

task = Map.set(task, "nb_validations",task.nb_validations + 1 )

if task_is_validated(task.nb_validations) do

  task = Map.set(task,"status","completed")
  # update task sc status 
  Contract.set_type("transfer")
  Contract.add_recipient(address: task_creation_address, action: "update_status", args: ["completed"])


end

tasks = Map.set(tasks,task.id, task)
State.set("tasks",tasks)
end


fun get_task_content(title, description, goal_amount, deadline, category) do

  Json.to_string(
    title: title,
    description: description,
    goalAmount: goal_amount,
    deadline: deadline,
    category: category,
    currentAmount: 0,
    status: "pending",
    id: "",
    creator: "",
    transactions: [],
    creatorReliability: 0
  )
  
end

fun get_task_code(creator_genesis_address) do

"""
@version 1

# update status condition
condition triggered_by: transaction, on: init(creation_address, title, description, goal_amount, deadline, category), as: [
  content: (

    # can only be init by master
    previous_address = Chain.get_previous_address(transaction)
    genesis_address = Chain.get_genesis_address(previous_address)
    task = State.get("task")
    task == nil && genesis_address == 0x0000ec63e23dc8b2dd002bcfd96c9fea1e83d9443b7f73d862455fb3ed855766f0df


    
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
    task != nil && task.status != new_status && genesis_address == 0x0000ec63e23dc8b2dd002bcfd96c9fea1e83d9443b7f73d862455fb3ed855766f0df


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
  0x#{creator_genesis_address}
end

export fun get_task() do
  State.get("task")
end
"""

end

fun task_is_approved(nb_approvals) do

 nb_approvals > (List.size(get_quorum_list()) / 2)

end

fun task_is_validated(nb_validations) do

  nb_validations > (List.size(get_quorum_list()) / 2)

end

# Export functions for reading data
export fun get_task(task_id) do
  tasks = State.get("tasks",Map.new())
  Map.get(tasks, String.to_hex(task_id))
end

export fun get_tasks_list() do
  State.get("tasks", Map.new())
end

export fun get_task_contributions(task_id) do
  contributions = State.get("contributions",Map.new())
  Map.get(contributions, String.to_hex(task_id), Map.new())
  
end

export fun get_quorum_list() do

["0000231DC9B33875C3C64E7298835C5025D5028D536CC08D855CA7FD66766DDA0061"]

end