import { atom } from "recoil";

const videoLibAtom = atom<{
  cameras: MediaDeviceInfo[],
  microphones: MediaDeviceInfo[],
  speakers: MediaDeviceInfo[],
  camera: MediaDeviceInfo | null,
  microphone: MediaDeviceInfo | null,
  speaker: MediaDeviceInfo | null,
}>({
  key: "videoLibAtom",
  default: {
    cameras: [],
    microphones: [],
    speakers: [],
    camera: null,
    microphone: null,
    speaker: null,
  },
});

export default videoLibAtom;
