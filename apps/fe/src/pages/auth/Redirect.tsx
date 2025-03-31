import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Loading from "../../components/loading";
import { jwtDecode } from "jwt-decode";

export default function Redirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const jwtUser = searchParams.get("jwtUser");
    const token = searchParams.get("token");
    console.log("token is what ", token);

    if (jwtUser) {
      const userFromJwt = jwtDecode(jwtUser);
      if (userFromJwt) {
        if (token) localStorage.setItem("auth_token", token);
        navigate("/dashboard");
      }
    }
    navigate("/dashboard");
  }, [navigate, searchParams]);
  return <Loading />;
}
