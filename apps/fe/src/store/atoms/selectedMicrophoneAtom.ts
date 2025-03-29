import { atom } from "recoil";

const selectedMicrophoneAtom = atom<{
    selectedCamera: string,
}>({
  key: "selectedMicrophoneAtom",
  default: {
    selectedCamera: "Please select a microphone",
  },
});

export default selectedMicrophoneAtom