import RootLayout from "@/layout/root-layout";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/event-types");
  }, []);
  return (
    <RootLayout>
      <></>
    </RootLayout>
  );
}
