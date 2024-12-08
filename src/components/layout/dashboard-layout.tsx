import { cn } from "@/lib/utils"
import { MainNav } from "@/components/layout/main-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/layout/user-nav"
import { WalletConnect } from "@/components/wallet/wallet-connect"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <WalletConnect />
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        {children}
      </div>
    </div>
  )
} 