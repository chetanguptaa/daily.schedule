import React from "react";
import { QueryClientProvider } from "react-query";
import queryClient from "./lib/queryClient";
import { RecoilRoot } from "recoil";
import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          {children}
          <Toaster />
        </SidebarProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}
