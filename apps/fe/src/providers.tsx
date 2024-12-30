import React from "react";
import { QueryClientProvider } from "react-query";
import queryClient from "./lib/queryClient";
import { RecoilRoot } from "recoil";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    </RecoilRoot>
  );
}
