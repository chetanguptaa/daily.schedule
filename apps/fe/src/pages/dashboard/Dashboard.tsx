import userAtom from "@/store/atoms/userAtom";
import { useRecoilValue } from "recoil";

export default function Dashboard() {
  const user = useRecoilValue(userAtom);
  if (user.isLoggedIn && user.user)
    return (
      <div className="flex justify-between h-[100vh]">
        <div className="w-[85%] bg-white h-full"></div>
      </div>
    );
}
