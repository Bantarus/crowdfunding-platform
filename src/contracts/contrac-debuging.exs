@version 1

condition triggered_by: transaction, as: []
actions triggered_by: transaction do
  Contract.set_content "Hello world!"


end

# Create task condition
condition triggered_by: transaction, on: create_task(title, description, goal_amount, deadline, category), as: [
  content: (
    # Validate inputs
    #is_binary(title) && 
    #is_binary(description) && 
    #is_number(goal_amount) && 
    #is_binary(category) && 
    goal_amount > 0
  )
]

# Create task action
actions triggered_by: transaction, on: create_task(title, description, goal_amount, deadline, category) do
  # Generate task ID from transaction
  task_id = transaction
  creator_genesis_address = Chain.get_genesis_address(transaction.address)

  # Create task structure
  task = [
    id: task_id,
    title: title,
    description: description,
    goal_amount: goal_amount,
    current_amount: 0,
    deadline: deadline,
    category: category,
    creator: creator_genesis_address,
    status: "active",
    created_at: Time.now()
  ]

  # Store task
  tasks = State.get("tasks",Map.new())
  tasks = Map.set(tasks, task_id, task)
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
  task = Map.get(tasks, task_id)
  
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
