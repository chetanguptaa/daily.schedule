import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Loading from "../../components/loading";
import { jwtDecode } from "jwt-decode";

export default function Redirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const jwtUser = searchParams.get("jwtUser");
    if (jwtUser) {
      const userFromJwt = jwtDecode(jwtUser);
      if (userFromJwt) {
        navigate("/");
      }
    }
    navigate("/");
  }, [navigate, searchParams]);
  return <Loading />;
}
