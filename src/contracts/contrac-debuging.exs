@version 1

# add task condition
condition triggered_by: transaction, on: add_task(task_genesis_address,title, description, goal_amount, deadline, category), as: [
  content: (
 
    task_genesis_address = String.to_hex(task_genesis_address)
    task_transaction = Chain.get_transaction(task_genesis_address)
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
actions triggered_by: transaction, on: add_task(task_genesis_address,title, description, goal_amount, deadline, category ) do
 
  task_genesis_address = String.to_hex(task_genesis_address)

  previous_address = Chain.get_previous_address(transaction)
 # creator_genesis_address = Chain.get_genesis_address(previous_address)

  # Create task structure
  task = [
    id: task_genesis_address,
    title: title,
    description: description,
    goal_amount: goal_amount,
    current_amount: 0,
    deadline: deadline,
    category: category,
  #  creator: creator_genesis_address,
    status: "pending",
    created_at: Time.now(),
    contributions: 0,
    min_votes: 1
  ]

  # Store task
  tasks = State.get("tasks",Map.new())
  tasks = Map.set(tasks, task_id, task)
  State.set("tasks", tasks)

 Contract.set_content(get_task_content(title, description, goal_amount, deadline, category))
end

# Vote condition
condition triggered_by: transaction, on: vote(task_genesis_address), as: [
  content: (
    valid? = false
    tasks = State.get("tasks", Map.new())
    valid? =  Map.get(tasks,task_genesis_address) != nil && task.status == "pending"

    if valid? do
      # Check if voter hasn't voted yet
      votes = Map.get(task,"votes",Map.new())
      voter_previous_address =  Chain.get_previous_address(transaction)
      voter_genesis_address = Chain.get_genesis_address(voter_previous_address)

      valid? = Map.get(votes,voter_genesis_address) == nil

    end
    
    valid?
  )
]

# Vote action
actions triggered_by: transaction, on: vote(task_genesis_address) do
  task_genesis_address = String.to_hex(task_genesis_address)
  tasks = State.get("tasks")
  task = Map.get(tasks, task_genesis_address )
  votes = Map.get(task, "votes", Map.new())

  voter_previous_address =  Chain.get_previous_address(transaction)
  voter_genesis_address = Chain.get_genesis_address(voter_previous_address)

  # Record vote
  votes = Map.set(votes, voter_genesis_address, true)
  

  task = Map.set(task, "votes", votes)
  
  # Check if minimum votes reached
  if Map.size(votes) >= task.min_votes do
    task = Map.set(task, "status", "active")
    
  end

  tasks = Map.set(tasks,task_genesis_address, task)
  State.set("tasks", tasks)

end



# Contribute condition
condition triggered_by: transaction, on: contribute(task_id), as: [
  content: (
    tasks = State.get("tasks")
    task = Map.get(tasks, task_id)
    transfered_amount = Map.get(transaction.uco_movements, contract.address)

    # Validate task exists and is active
    task != nil && 
    task.status == "active" &&
    Time.now() <= task.deadline &&
    # Check uco transferred > 0
    transfered_amount != nil && transfered_amount > 0
    
  )
]

# Contribute action
actions triggered_by: transaction, on: contribute(task_id) do
  tasks = State.get("tasks")
  task = Map.get(tasks, String.to_hex(task_id))
  
  # Get contribution amount
  uco_amount = Map.get(transaction.uco_movements, contract.address)
  contributor_genesis_address = Chain.get_genesis_address(transaction.address)

  # Update task amount
  task = Map.set(task, "uco_amount", task.uco_amount + uco_amount)
  
  # Update status if funded
  if task.uco_amount >= task.goal_amount do
    task = Map.set(task, "status", "funded")
  end
  
  # Store updated task
  tasks = Map.set(tasks, task_id, task)
  State.set("tasks", tasks)

  # Track contribution
  contributions = State.get("contributions")
  task_contributions = Map.get(contributions, task_id, Map.new())
  contributor_amount = Map.get(task_contributions, contributor, 0)
  
  task_contributions = Map.set(task_contributions, "contributor_amount", contributor_amount + task.uco_amount)
  contributions = Map.set(contributions, task_id, task_contributions)
  State.set("contributions", contributions)
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
    Chain.get_genesis_address(previous_address) == 0x000062de15543387313c7a9f650cade24afc05fb2a0c7f98574d6dcc876410aebb9e


    
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