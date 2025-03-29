import { BACKEND_URL } from "@/constants";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { useEffect } from "react";
import { useSetRecoilState } from "recoil";

export default function CallLayout({ children }: { children: React.ReactNode }) {
  const setUser = useSetRecoilState(userAtom);
  useEffect(() => {
    const getResponse = async () => {
      try {
        const res = await axios.get(BACKEND_URL + "/user", {
          withCredentials: true,
        });
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
      }
    };
    getResponse()
  }, []);
  return <>{children}</>;
}
