import { atom } from "recoil";

const selectedCameraAtom = atom<{
    selectedCamera: string,
}>({
  key: "selectedCameraAtom",
  default: {
    selectedCamera: "Please select a camera",
  },
});

export default selectedCameraAtom