import axios from "axios";
import { BACKEND_URL } from "@/constants";
import { useParams } from "react-router";
import { useQuery } from "react-query";
import { AddSlotsForm } from "@/components/add-slots-form";
import Loading from "@/components/loading";
import RootLayout from "@/layout/root-layout";

async function getSlots(id: string) {
  const res = await axios.get(BACKEND_URL + "/calender/schedules/" + id + "/slots", {
    withCredentials: true,
  });
  return res.data;
}

export default function AddSlots() {
  const params = useParams();
  const { data, isLoading, isError } = useQuery(["getSlots"], () => getSlots(params.id || ""));
  if (isLoading)
    return (
      <div className="flex justify-center items-center w-full h-[100vh]">
        <Loading />
      </div>
    );
  if (isError) return <>Some error occured</>;
  if (data) {
    return (
      <RootLayout>
        <AddSlotsForm schedule={data} />;
      </RootLayout>
    );
  }
}
