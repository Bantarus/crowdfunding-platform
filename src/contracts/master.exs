@version 1


# smart contract params functions



# add task condition
condition triggered_by: transaction, on: add_task(task_creation_address,title, description, goal_amount, deadline, category), as: [
  content: (
 
    task_creation_address = String.to_hex(task_creation_address)
    task_transaction = Chain.get_transaction(task_creation_address)
    valid_task? = task_transaction != nil
    valid_content? = Json.parse(task_transaction.content) == Json.parse(get_task_content(title, description, goal_amount, deadline, category))
  
    valid_code? = false
    valid_code? = Code.is_same?(get_task_code(), task_transaction.code)
    
    valid_params? = goal_amount > 0 && deadline > Time.now()

   valid_task? &&
   valid_content? && 
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
    nb_refusals: 0,
    nb_promotes: 0,
    promote_addresses: []
  ]

  # Store task
  tasks = State.get("tasks",Map.new())
  tasks = Map.set(tasks, task.id, task)
  State.set("tasks", tasks)

 Contract.set_content(get_task_content(title, description, goal_amount, deadline, category))
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

      valid_task_address? = task != nil && task.status == "pending"

    end

    valid_task_address?

  )
]

actions triggered_by: transaction, on: approve_task(task_creation_address) do

tasks = State.get("tasks")
task = Map.get(tasks, String.to_hex(task_creation_address))

task = Map.set(task, "nb_approvals",task.nb_approvals + 1 )

if task_is_approved(task.nb_approvals) do

task = Map.set(task,"status","active")

end

tasks = Map.set(tasks,task.id, task)
State.set("tasks",tasks)
end

condition triggered_by: transaction, on: reject_task(), as: [
  content: ()
]

actions triggered_by: transaction, on: reject_task() do


end



# Vote condition
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

# Vote action
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
condition triggered_by: transaction, on: fund_task(task_id), as: [
  content: (
    tasks = State.get("tasks")
    task = Map.get(tasks, task_id)
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
actions triggered_by: transaction, on: fund_task(task_id) do
  tasks = State.get("tasks")
  task = Map.get(tasks, String.to_hex(task_id))
  
  # Get contribution amount
  uco_amount = Map.get(transaction.uco_transfers, Chain.get_genesis_address(contract.address))
  contributor_previous_address = Chain.get_previous_address(transaction)
  contributor_genesis_address = Chain.get_genesis_address(contributor_previous_address)

  # Update task amount
  task = Map.set(task, "current_amount", task.current_amount + uco_amount)

  task = Map.set(task,"nb_contributions",task.nb_contributions + 1)
  
  # Update status if funded
  if task.current_amount >= task.goal_amount do
    task = Map.set(task, "status", "funded")
  end
  
  # Store updated task
  tasks = Map.set(tasks, task_id, task)
  State.set("tasks", tasks)

 
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

fun get_task_code() do

"""
@version 1

# update status condition
condition triggered_by: transaction, on: update_status(status), as: [
  content: (

    # can only be updated by master
    previous_address = Chain.get_previous_address()
    Chain.get_genesis_address(previous_address) == 0x00004035822cdcd26e571ab7bfbd3939d967128e58be4c2cedfa747394b26c5986ba

    
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
end
"""

end

fun task_is_approved(nb_approvals) do

 nb_approvals > (List.size(get_quorum_list()) / 2)

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