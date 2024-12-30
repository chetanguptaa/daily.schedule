import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { useNavigate } from "react-router";

export default function LogoutBtn() {
  const navigate = useNavigate();
  return (
    <button
      onClick={async () => {
        const res = await axios.get(BACKEND_URL + "/auth/logout", {
          withCredentials: true,
        });
        if (res.status === 200) {
          navigate("/auth/signin");
        }
      }}
    >
      Log out
    </button>
  );
}
