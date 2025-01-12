import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BACKEND_URL } from "@/constants";
import RootLayout from "@/layout/root-layout";
import queryClient from "@/lib/queryClient";
import userAtom from "@/store/atoms/userAtom";
import axios from "axios";
import { Link as LinkIcon, MoveLeft, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useRecoilValue } from "recoil";
import { toast } from "sonner";

async function getSingleEvent(id: string) {
  const res = await axios.get(BACKEND_URL + "/events/" + id, {
    withCredentials: true,
  });
  return res.data;
}

async function updateEvent(data: {
  title: string;
  description: string;
  id: string;
  link: string;
  duration: number;
  platform: {
    id: string;
  };
  schedule: string;
}) {
  const res = await axios.put(
    BACKEND_URL + "/events/" + data.id,
    {
      title: data.title,
      description: data.description,
      link: data.link,
      duration: data.duration,
      platformId: data.platform.id,
    },
    {
      withCredentials: true,
    }
  );
  return res.data;
}

export default function EditEvents() {
  const [selectedTab, setSelectedTab] = useState(0);
  const user = useRecoilValue(userAtom);
  const [event, setEvent] = useState({
    title: "",
    description: "",
    id: "",
    link: "",
    duration: 15,
    platform: {
      name: "",
      id: "",
    },
    schedule: "",
  });
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery(["getSingleEvent"], () => getSingleEvent(params.id || ""));

  useEffect(() => {
    const tabName = searchParams.get("tab");
    if (!tabName) {
      return;
    }
    if (tabName === "event-setup") {
      setSelectedTab(0);
    } else {
      setSelectedTab(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (data && !isLoading && !isError) {
      setEvent({
        title: data.title,
        description: data.description,
        id: data.id,
        link: data.link,
        duration: data.duration,
        platform: {
          name: data.platform.name,
          id: data.platform.id,
        },
        schedule: data.schedule,
      });
    }
  }, [data, isError, isLoading]);

  const updateEventMutation = useMutation(updateEvent, {
    onSuccess: (data) => {
      if (data.success) {
        toast(data.message);
      }
      queryClient.invalidateQueries(["getSingleEvent"]);
    },
  });

  const handleSubmit = () => {
    if (event.title.length === 0) {
      toast("Title can't be empty");
      return;
    }
    if (event.link.length === 0) {
      toast("Url can't be empty");
      return;
    }
    if (event.duration < 15) {
      toast("Duration can't be less than 15");
      return;
    }
    if (event.platform.id.length === 0) {
      toast("Platform is required");
      return;
    }
    updateEventMutation.mutate({
      title: event.title,
      description: event.description,
      duration: event.duration,
      link: event.link,
      platform: {
        id: event.platform.id,
      },
      schedule: event.schedule,
      id: event.id,
    });
  };

  const handlePlatformChange = (platform: string) => {
    try {
      const platformJSON = JSON.parse(platform) as { id: string; name: string };
      setEvent({ ...event, platform: { name: platformJSON.name, id: platformJSON.id } });
    } catch (error) {
      console.log(error);
      return;
    }
  };

  useEffect(() => {
    const newUrl = event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setEvent({
      ...event,
      link: newUrl,
    });
  }, [event.title]);

  if (data && !isError && !isLoading) {
    return (
      <RootLayout>
        <div className="p-6 w-full">
          <div className="flex flex-col justify-between">
            <div className="flex justify-between w-full">
              <div className="flex space-x-4 items-center text-gray-700">
                <MoveLeft className="w-4 cursor-pointer" onClick={() => navigate(-1)} />
                <p className="text-lg font-medium text-gray-900">30 Min Meeting</p>
              </div>
              <div className="flex space-x-4">
                <div className="flex">
                  <Button
                    className="bg-white hover:bg-white rounded-r-none border-none hover:bg-gray-100"
                    onClick={() => {
                      navigator.clipboard.writeText("localhost:5173/" + user.user?.id + "/" + event.link);
                      toast("Link copied successfully");
                    }}
                  >
                    <LinkIcon className="text-black" />
                  </Button>
                  <Button className="hover:bg-red-100 bg-white rounded-l-none text-black">
                    <Trash />
                  </Button>
                </div>
                <Separator className="w-[2px] h-full" orientation="vertical" />
                <Button onClick={handleSubmit}>
                  <span>Save</span>
                </Button>
              </div>
            </div>
            <div className="flex space-x-4 w-full mt-8">
              <div>
                <nav
                  className="no-scrollbar flex flex-col space-y-0.5 overflow-scroll primary-navigation sticky top-0 -mt-7"
                  aria-label="Tabs"
                >
                  <div className="pt-6"></div>
                  <Link
                    className={
                      "text-default text-sm font-medium leading-none min-h-7 hover:bg-subtle [&amp;[aria-current='page']]:bg-emphasis [&amp;[aria-current='page']]:text-emphasis group-hover:text-default group flex w-64 flex-row rounded-md px-3 py-2 transition h-auto items-start " +
                      (selectedTab === 0 && " bg-gray-300")
                    }
                    data-testid="vertical-tab-event_setup_tab_title"
                    to={"/event-types/" + params.id + "?tab=event-setup"}
                  >
                    <LinkIcon className="w-4 h-4 mr-4" />
                    <div className="h-fit">
                      <span className="flex items-center space-x-2 rtl:space-x-reverse">
                        <p className="max-w-36 min-h-4 truncate" title="Event Setup">
                          Event Setup
                        </p>
                      </span>
                      <p className="max-w-44 mt-1 truncate text-xs font-normal" data-testid="apps-info" title="21 mins">
                        {event.duration} mins
                      </p>
                    </div>
                  </Link>
                  {/* <Link
                  className={
                    "text-default text-sm font-medium leading-none min-h-7 hover:bg-subtle [&amp;[aria-current='page']]:bg-emphasis [&amp;[aria-current='page']]:text-emphasis group-hover:text-default group flex w-64 flex-row rounded-md px-3 py-2 transition h-auto items-start " +
                    (selectedTab === 1 && " bg-gray-300")
                  }
                  data-testid="vertical-tab-availability"
                  to={"/event-types/" + params.id + "?tab=availability"}
                >
                  <Calendar className="w-4 h-4 mr-4" />
                  <div className="h-fit">
                    <span className="flex items-center space-x-2 rtl:space-x-reverse">
                      <p className="max-w-36 min-h-4 truncate" title="Availability">
                        Availability
                      </p>
                    </span>
                    <p className="max-w-44 mt-1 truncate text-xs font-normal" title={event.schedule}>
                      {event.schedule}
                    </p>
                  </div>
                </Link> */}
                </nav>
              </div>
              {selectedTab === 0 && (
                <Card className="w-full py-4">
                  <CardContent>
                    <form>
                      <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={event.title}
                            onChange={(e) => setEvent({ ...event, title: e.target.value })}
                            placeholder="Title"
                          />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={event.description}
                            placeholder="A quick video meeting."
                            onChange={(e) => setEvent({ ...event, description: e.target.value })}
                          />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                          <Label htmlFor="url">URL</Label>
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
                              value={event.link}
                              onChange={(e) => setEvent({ ...event, link: e.target.value })}
                            />
                          </div>
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
                              className="hover:border-emphasis dark:focus:border-emphasis border-default bg-default placeholder:text-muted text-emphasis focus:ring-brand-default focus:border-subtle mb-2 block h-9 rounded-md border px-3 py-2 text-sm leading-4 transition focus:outline-none focus:ring-2 w-full pr-4 disabled:bg-subtle disabled:hover:border-subtle disabled:cursor-not-allowed rounded-r-none border-r-0 !my-0 !ring-0"
                              required={true}
                              min="15"
                              name="length"
                              value={event.duration}
                              onChange={(e) => setEvent({ ...event, duration: parseInt(e.target.value) })}
                            />
                            <div className="addon-wrapper border-default [input:hover_+_&amp;]:border-emphasis [input:hover_+_&amp;]:border-l-default [&amp;:has(+_input:hover)]:border-emphasis [&amp;:has(+_input:hover)]:border-r-default h-9 border px-3 transition bg-subtle ltr:rounded-r-md rtl:rounded-l-md">
                              <div className="min-h-9 flex flex-col justify-center text-sm leading-7 text-default">
                                <span className="flex max-w-2xl overflow-y-auto whitespace-nowrap">Minutes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1.5">
                          <Label htmlFor="platform">Platform</Label>
                          <Select
                            value={JSON.stringify({ id: event.platform.id, name: event.platform.name })}
                            onValueChange={handlePlatformChange}
                          >
                            <SelectTrigger id="platform">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value={JSON.stringify({ id: event.platform.id, name: event.platform.name })}>
                                {event.platform.name}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }
}
