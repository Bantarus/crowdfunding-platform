import Archethic from "@archethicjs/sdk";

export class CrowdfundingContract {
  private archethic: Archethic;
  private contractAddress: string;

  constructor(contractAddress: string) {
    this.archethic = new Archethic("https://testnet.archethic.net");
    this.contractAddress = contractAddress;
  }

  async createTask(task: {
    title: string;
    description: string;
    goalAmount: number;
    deadline: number;
    category: string;
  }) {
    try {
      const result = await this.archethic.transaction.new()
        .setType("transfert")
        .setContent("create_task")
        .addUCOTransfer(0)
        .addRecipient(this.contractAddress)
        .setArgs([
          task.title,
          task.description,
          task.goalAmount,
          task.deadline,
          task.category
        ])
        .build()
        .send();
      
      return result.transactionAddress;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async contributeToTask(taskId: string, amount: number) {
    try {
      const result = await this.archethic.transaction.new()
        .setType("contract_call")
        .setContent("contribute") 
        .addUCOTransfer(amount)
        .addRecipient(this.contractAddress)
        .setArgs([taskId])
        .build()
        .send();
      
      return result.transactionAddress;
    } catch (error) {
      console.error("Error contributing to task:", error);
      throw error;
    }
  }

  async getTask(taskId: string) {
    try {
      return await this.archethic.callFunction(
        this.contractAddress,
        "get_task",
        [taskId]
      );
    } catch (error) {
      console.error("Error getting task:", error);
      throw error;
    }
  }

  async listTasks() {
    try {
      return await this.archethic.callFunction(
        this.contractAddress,
        "list_tasks",
        []
      );
    } catch (error) {
      console.error("Error listing tasks:", error);
      throw error;
    }
  }
} 