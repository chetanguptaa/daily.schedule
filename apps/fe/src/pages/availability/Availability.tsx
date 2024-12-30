import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Availability() {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async () => {
    const res = await axios.post(
      BACKEND_URL + "/calender/schedules",
      {
        title,
      },
      {
        withCredentials: true,
      }
    );
    toast(res.data.message);
    if (res.data.success) {
      navigate(`/availability/${res.data.id}`);
    }
  };
  return (
    <div className="p-6 w-full">
      <div className="flex justify-between w-full">
        <div>
          <p className="text-lg font-medium text-gray-900">Availability</p>
          <p className="text-sm font-normal text-gray-600">Configure times when you are available for bookings.</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>
              <PlusIcon />
              <span>New </span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Add a new Schedule</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="grid w-full max-w-full items-center gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input type="text" id="title" placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
