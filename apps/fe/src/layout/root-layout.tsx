import { AppSidebar } from "@/components/app-sidebar";
import { BACKEND_URL } from "@/constants";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useRecoilState } from "recoil";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useRecoilState(userAtom);
  const navigate = useNavigate();
  useEffect(() => {
    const getResponse = async () => {
      try {
        const res = await axios.get(BACKEND_URL + "/user", {
          withCredentials: true,
        });
        if (!res.data.user) navigate("/auth/signin");
        setUser({
          isLoggedIn: true,
          user: {
            id: res.data.user.id,
            email: res.data.user.email,
            name: res.data.user.name,
            picture: res.data.user.picture,
          },
        });
      } catch (error) {
        console.log(error);
        navigate("/auth/signin");
      }
    };
    if (!user.isLoggedIn) {
      getResponse();
    }
  }, [user.isLoggedIn]);
  return (
    <div className="flex h-screen w-full">
      <div className="h-full w-64 overflow-y-auto bg-white">
        <AppSidebar />
      </div>
      <main className="w-full h-full overflow-y-auto bg-white">{children}</main>
    </div>
  );
}
