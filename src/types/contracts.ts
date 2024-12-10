export interface ContractDeploymentResponse {
  address: string
  status: 'pending' | 'deployed' | 'failed'
}

export interface TaskContractParams {
  MASTER_ADDRESS: string
  MIN_VOTES: number
  CREATOR_ADDRESS: string
} 