import { atom } from "recoil";

export interface IGuestAtom {
  username: string;
}

const guestAtom = atom<{
  guest: IGuestAtom | null;
}>({
  key: "guestAtom",
  default: {
    guest: {
      username: localStorage.getItem("username") || ""
    },
  },
});

export default guestAtom;
