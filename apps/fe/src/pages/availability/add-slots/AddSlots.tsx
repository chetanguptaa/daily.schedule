import axios from "axios";
import { BACKEND_URL } from "@/constants";
import { useParams } from "react-router";
import { useQuery } from "react-query";
import { AddSlotsForm } from "@/components/add-slots-form";

async function getSlots(id: string) {
  const res = await axios.get(BACKEND_URL + "/calender/schedules/" + id + "/slots", {
    withCredentials: true,
  });
  return res.data;
}

export default function AddSlots() {
  const params = useParams();
  const { data, isLoading, isError } = useQuery(["getSlots"], () => getSlots(params.id || ""));
  if (isLoading) return <>Loading</>;
  if (isError) return <>Some error occured</>;
  if (data) {
    return <AddSlotsForm schedule={data} />;
  }
}
