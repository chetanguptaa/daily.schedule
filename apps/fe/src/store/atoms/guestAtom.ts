import { atom } from "recoil";

export interface IGuestAtom {
  exists: boolean;
  username: string | null;
  id: string | null;
}

const getGuestInfo = () => {
  try {
    const guestInfo = localStorage.getItem("guestInfo") || "{}";
    const guestInfoObj = JSON.parse(guestInfo) as {
      username: string | null,
      id: string | null,
    };
    return {
      ...guestInfoObj,
      exists: true
    }
  } catch (error) {
    console.log("error ", error);
    return {
      id: null,
      username: null,
      exists: false
    }
  }
}

const guestAtom = atom<{
  guest: IGuestAtom | null;
}>({
  key: "guestAtom",
  default: {
    guest: {
      exists: getGuestInfo().exists,
      id: getGuestInfo().exists ? getGuestInfo().id : null,
      username: getGuestInfo().exists ? getGuestInfo().username : null,
    },
  }
});

export default guestAtom;
