'use client'
import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex items-center", className)} {...props}>
      <Link 
        href="/" 
        className="mr-6 flex items-center space-x-2"
      >
        <span className="font-sans text-3xl font-bold">
          un<span className="text-primary underline decoration-4 underline-offset-[6px]">T</span>ink
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-4 lg:space-x-6">
        <Link 
          href="/" 
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Tinkershop
        </Link>
        <Link 
          href="/tasks" 
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === "/tasks" ? "text-primary" : "text-muted-foreground"
          )}
        >
          Backroom
        </Link>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem asChild>
              <Link href="/">Tinkershop</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/tasks">Backroom</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
} 