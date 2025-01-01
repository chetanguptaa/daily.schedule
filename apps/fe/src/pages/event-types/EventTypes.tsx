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
import { Textarea } from "@/components/ui/textarea";
import { BACKEND_URL } from "@/constants";
import queryClient from "@/lib/queryClient";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { Clock, Ellipsis, Link, Pencil, PlusIcon, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router";
import { useRecoilValue } from "recoil";
import { toast } from "sonner";

async function createEvents(data: { title: string; description: string; duration: number; url: string }) {
  const res = await axios.post(BACKEND_URL + "/events", data, { withCredentials: true });
  return res.data;
}

async function getEvents() {
  const res = await axios.get(BACKEND_URL + "/events", {
    withCredentials: true,
  });
  return res.data;
}

export default function EventTypes() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(15);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const user = useRecoilValue(userAtom);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery(["getEvents"], getEvents);
  const createEventMutation = useMutation(createEvents, {
    onSuccess: (data) => {
      if (data.success) {
        toast(data.message);
      }
      queryClient.invalidateQueries(["getEvents"]);
    },
  });

  const isFormFull = () => {
    if (title.length === 0 || url.length === 0 || duration < 15) {
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (title.length === 0) {
      toast("Title can't be empty");
      return;
    }
    if (url.length === 0) {
      toast("Url can't be empty");
      return;
    }
    if (duration < 15) {
      toast("Duration can't be less than 15");
      return;
    }
    createEventMutation.mutate({
      title,
      description,
      duration,
      url,
    });
  };

  useEffect(() => {
    const newUrl = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setUrl(newUrl);
  }, [title]);

  if (isError) return <>error.</>;

  return (
    <div className="p-6 w-full">
      <div className="flex flex-col justify-between">
        <div className="flex justify-between w-full">
          <div>
            <p className="text-lg font-medium text-gray-900">Event Types</p>
            <p className="text-sm font-normal text-gray-600">
              Create events to share for people to book on your calendar.
            </p>
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
                <Input
                  type="text"
                  required={true}
                  onChange={(e) => setTitle(e.target.value)}
                  id="title"
                  placeholder="Title"
                  value={title}
                />
              </div>
              <div className="grid w-full max-w-full items-center gap-1.5">
                <Label htmlFor="title">URL</Label>
                <div
                  dir="ltr"
                  className="focus-within:ring-brand-default group relative mb-1 flex items-center rounded-md transition focus-within:outline-none focus-within:ring-2"
                >
                  <div className="addon-wrapper border-default [input:hover_+_&amp;]:border-emphasis [input:hover_+_&amp;]:border-l-default [&amp;:has(+_input:hover)]:border-emphasis [&amp;:has(+_input:hover)]:border-r-default h-9 border px-3 transition bg-subtle ltr:rounded-l-md rtl:rounded-r-md">
                    <div className="min-h-9 flex flex-col justify-center text-sm leading-7 text-default">
                      <span className="flex max-w-2xl overflow-y-auto whitespace-nowrap">
                        <span className="max-w-24 md:max-w-56" data-state="closed">
                          https://daily.schedule/{user.user?.id}/
                        </span>
                      </span>
                    </div>
                  </div>
                  <input
                    id=":r23:"
                    placeholder=""
                    className="hover:border-emphasis dark:focus:border-emphasis border-default bg-default placeholder:text-muted text-emphasis focus:ring-brand-default focus:border-subtle mb-2 block h-9 rounded-md border px-3 py-2 text-sm leading-4 transition focus:outline-none focus:ring-2 w-full disabled:bg-subtle disabled:hover:border-subtle disabled:cursor-not-allowed rounded-l-none border-l-0 !my-0 !ring-0"
                    name="slug"
                    onChange={(e) => setUrl(e.target.value)}
                    value={url}
                  />
                </div>
              </div>
              <div className="grid w-full max-w-full items-center gap-1.5">
                <Label htmlFor="title">Description</Label>
                <Textarea placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid w-full max-w-full items-center gap-1.5">
                <Label htmlFor="duration">Duration</Label>
                <div
                  dir="ltr"
                  className="focus-within:ring-brand-default group relative mb-1 flex items-center rounded-md transition focus-within:outline-none focus-within:ring-2"
                >
                  <input
                    id=":r25:"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="hover:border-emphasis dark:focus:border-emphasis border-default bg-default placeholder:text-muted text-emphasis focus:ring-brand-default focus:border-subtle mb-2 block h-9 rounded-md border px-3 py-2 text-sm leading-4 transition focus:outline-none focus:ring-2 w-full pr-4 disabled:bg-subtle disabled:hover:border-subtle disabled:cursor-not-allowed rounded-r-none border-r-0 !my-0 !ring-0"
                    required={true}
                    min="15"
                    name="length"
                  />
                  <div className="addon-wrapper border-default [input:hover_+_&amp;]:border-emphasis [input:hover_+_&amp;]:border-l-default [&amp;:has(+_input:hover)]:border-emphasis [&amp;:has(+_input:hover)]:border-r-default h-9 border px-3 transition bg-subtle ltr:rounded-r-md rtl:rounded-l-md">
                    <div className="min-h-9 flex flex-col justify-center text-sm leading-7 text-default">
                      <span className="flex max-w-2xl overflow-y-auto whitespace-nowrap">Minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={!isFormFull()}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {isLoading ?
          <>Loading...</>
        : <div className="border-subtle bg-default overflow-hidden rounded-md border mt-8">
            <ul className="divide-subtle divide-y relative">
              {data.map((s: { id: string; title: string; description: string; duration: string; link: string }) => (
                <li key={s.id}>
                  <div className="hover:bg-muted flex items-center justify-between py-5 transition ltr:pl-4 rtl:pr-4 sm:ltr:pl-0 sm:rtl:pr-0">
                    <div className="flex flex-col justify-between items-start px-6">
                      <div className="group flex w-full items-center justify-between">
                        <a
                          className="flex-grow truncate text-sm"
                          title="Working Hours"
                          href={"/event-types/" + s.id + "?tab=event-setup"}
                        >
                          <div className="space-x-2 rtl:space-x-reverse">
                            <span className="capitalize truncate font-medium text-lg">{s.title}</span>
                            <span className="text-xs text-gray-400">
                              /{user.user?.id}/{s.link}
                            </span>
                          </div>
                        </a>
                      </div>
                      <div className="flex justify-start items-center space-x-2 bg-gray-100 rounded-sm p-1 text-xs mt-2">
                        <Clock className="w-3 h-3" />
                        <p>{s.duration} m</p>
                      </div>
                    </div>
                    <div className="flex">
                      <Button
                        className="bg-white hover:bg-white rounded-r-none border-none hover:bg-gray-100"
                        onClick={() => {
                          navigator.clipboard.writeText("localhost:5173/" + user.user?.id + "/" + s.link);
                          toast("Link copied successfully");
                        }}
                      >
                        <Link className="text-black" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="bg-white mr-2 hover:bg-white rounded-l-none border-none hover:bg-gray-100">
                            <Ellipsis className="text-black" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-32 mr-4">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => navigate("/event-types/" + s.id + "?tab=event-setup")}>
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        }
      </div>
    </div>
  );
}
