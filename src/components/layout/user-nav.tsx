import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UserNav() {
  return (
    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
      <Avatar className="h-8 w-8">
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </Button>
  )
} 