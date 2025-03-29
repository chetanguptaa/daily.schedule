import { atom } from "recoil";

const videoLibAtom = atom<{
  cameras: MediaDeviceInfo[],
  microphones: MediaDeviceInfo[],
  speakers: MediaDeviceInfo[],
}>({
  key: "videoLibAtom",
  default: {
    cameras: [],
    microphones: [],
    speakers: [],
  },
});

export default videoLibAtom;
