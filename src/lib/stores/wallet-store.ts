import { create } from 'zustand'

interface WalletStore {
  walletAddress: string | null
  genesisAddress: string | null
  isConnected: boolean
  isQuorumMember: boolean
  setWalletState: (address: string | null, genesisAddress: string | null, isConnected: boolean) => void
  setQuorumMembership: (isMember: boolean) => void
}

export const useWalletStore = create<WalletStore>((set) => ({
  walletAddress: null,
  genesisAddress: null,
  isConnected: false,
  isQuorumMember: false,
  setWalletState: (address, genesisAddress, isConnected) => 
    set({ walletAddress: address, genesisAddress, isConnected }),
  setQuorumMembership: (isMember) => 
    set({ isQuorumMember: isMember })
})) 