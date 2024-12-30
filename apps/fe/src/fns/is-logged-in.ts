import axios from "axios";
import { BACKEND_URL } from "../constants";

export async function isLoggedIn() {
  return await axios.get(BACKEND_URL + "/auth/is-logged-in", {
    withCredentials: true,
  });
}
