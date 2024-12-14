import { create } from 'zustand'
import { api } from "@/lib/api"
import { ConnectionState } from "@archethicjs/sdk"

export interface WalletStore {
  walletAddress: string | null
  genesisAddress: string | null
  isConnected: boolean
  isQuorumMember: boolean
  connectionState: ConnectionState
  setConnectionState: (state: ConnectionState) => void
  setWalletState: (address: string | null, genesisAddress: string | null, isConnected: boolean) => void
  setQuorumMembership: (isMember: boolean) => void
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  walletAddress: null,
  genesisAddress: null,
  isConnected: false,
  isQuorumMember: false,
  connectionState: ConnectionState.Closed,
  
  setConnectionState: (state) => 
    set({ connectionState: state }),
    
  setWalletState: (address, genesisAddress, isConnected) => 
    set({ walletAddress: address, genesisAddress, isConnected }),
    
  setQuorumMembership: (isMember) => 
    set({ isQuorumMember: isMember }),
})) 