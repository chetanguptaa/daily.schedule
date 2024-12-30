import { LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import LogoutBtn from "./logout-btn";

export default function Header({
  user,
}: {
  user: {
    name: string;
    picture: string;
    email: string;
  };
}) {
  return (
    <div className="h-[20%] sm:h-[10%] flex justify-center items-center text-black">
      <div className="flex justify-between items-center container mx-auto sm:max-w-7xl max-w-xl">
        <p className="text-lg">daily.schedule</p>
        <div className="flex justify-between items-center space-x-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex justify-between items-center space-x-8 px-4 py-2 rounded-xl hover:cursor-pointer">
                <Avatar>
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback className="text-black">{user.name[0]}</AvatarFallback>
                </Avatar>
                <p className="text-sm">{user.name}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className="text-lg">{user.name}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs mt-[-2px]">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut />
                <LogoutBtn />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
