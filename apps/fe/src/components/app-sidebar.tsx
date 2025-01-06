import { Calendar, Clock, Link as LinkIcon, LogOut, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useRecoilValue } from "recoil";
import userAtom from "@/store/atoms/userAtom";
import LogoutBtn from "./logout-btn";
import { useState } from "react";
import { Link } from "react-router";

const items = [
  {
    title: "Event Types",
    url: "/event-types",
    icon: LinkIcon,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: Calendar,
  },
  {
    title: "Availabilty",
    url: "/availability",
    icon: Clock,
  },
];

export function AppSidebar() {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <Sidebar collapsible="none" className="min-w-36 max-h-[100vh] h-[100vh] hidden sm:flex max-w-48">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>daily.schedule</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item, i) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      onClick={() => setSelectedTab(i)}
                      className={selectedTab === i ? "bg-black text-white hover:text-white hover:bg-black" : ""}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}

function UserMenu() {
  const user = useRecoilValue(userAtom);
  if (user.isLoggedIn && user.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            <span>{user.user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut />
            <LogoutBtn />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
