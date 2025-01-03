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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_URL } from "@/constants";
import queryClient from "@/lib/queryClient";
import axios from "axios";
import { Ellipsis, Globe, PlusIcon, Trash } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

async function getSchedules() {
  const res = await axios.get(BACKEND_URL + "/calender/schedules", {
    withCredentials: true,
  });
  return res.data;
}

async function createSchedule(title: string) {
  const res = await axios.post(BACKEND_URL + "/calender/schedules", { title }, { withCredentials: true });
  return res.data;
}

async function deleteSchedule(id: string) {
  const res = await axios.delete(BACKEND_URL + "/calender/schedules/" + id, {
    withCredentials: true,
  });
  return res.data;
}

export default function Availability() {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery(["getAvailability"], getSchedules);
  const createScheduleMutation = useMutation(createSchedule, {
    onSuccess: (data) => {
      toast(data.message);
      if (data.success) {
        navigate(`/availability/${data.id}`);
      }
      queryClient.invalidateQueries(["getAvailability"]);
    },
  });
  const deleteScheduleMutation = useMutation(deleteSchedule, {
    onSuccess: (data) => {
      toast(data.message);
      queryClient.invalidateQueries(["getAvailability"]);
    },
  });
  const handleSubmit = () => {
    createScheduleMutation.mutate(title);
  };
  const handleDelete = (id: string) => {
    deleteScheduleMutation.mutate(id);
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
      {isError && <p>Some error occured, please try again later</p>}
      {isLoading ?
        <p>loading..</p>
      : <div className="border-subtle bg-default overflow-hidden rounded-md border mt-8">
          <ul className="divide-subtle divide-y relative">
            {data.map(
              (s: {
                id: string;
                availability: {
                  id: string;
                  scheduleId: string;
                  dayOfWeek: string;
                  startTime: string;
                  endTime: string;
                }[];
                title: string;
                timezone: string;
                default: boolean;
              }) => (
                <li>
                  <div className="hover:bg-muted flex items-center justify-between py-5 transition ltr:pl-4 rtl:pr-4 sm:ltr:pl-0 sm:rtl:pr-0">
                    <div className="group flex w-full items-center justify-between sm:px-6">
                      <a className="flex-grow truncate text-sm" title="Working Hours" href={"/availability/" + s.id}>
                        <div className="space-x-2 rtl:space-x-reverse">
                          <span className="capitalize truncate font-medium">{s.title}</span>
                          {s.default && (
                            <div className="font-medium inline-flex items-center justify-center rounded gap-x-1 bg-green-100 text-success py-1 px-1.5 text-xs">
                              Default
                            </div>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1">
                          <p className="my-1 flex items-center first-letter:text-xs">
                            <Globe className="w-4 h-4" />
                            &nbsp;{s.timezone}
                          </p>
                        </p>
                      </a>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="bg-white mr-2 hover:bg-white">
                          <Ellipsis className="text-black" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-32 mr-4">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => handleDelete(s.id)}>
                            <Trash />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      }
    </div>
  );
}
