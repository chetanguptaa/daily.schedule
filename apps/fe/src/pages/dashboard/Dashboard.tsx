import Header from "@/components/header";
import userAtom from "@/store/atoms/userAtom";
import { useRecoilValue } from "recoil";

export default function Dashboard() {
  const user = useRecoilValue(userAtom);
  if (user.user)
    return (
      <div className="min-h-screen h-screen pb-2 min-h-screen">
        <Header user={user.user} />
      </div>
    );
}
