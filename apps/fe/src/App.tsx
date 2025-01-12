import { BrowserRouter, Route, Routes } from "react-router";
import Redirect from "./pages/auth/Redirect";
import Signin from "./pages/auth/Signin";
import Dashboard from "./pages/dashboard/Dashboard";
import Landing from "./pages/landing/Landing";
import Availability from "./pages/availability/Availability";
import EventTypes from "./pages/event-types/EventTypes";
import AddSlots from "./pages/availability/add-slots/AddSlots";
import EditEvents from "./pages/event-types/edit-events/edit-events";
import BookEvent from "./pages/app/book-event/BookEvent";
import CallPage from "./pages/app/call/call";
import Booking from "./pages/booking/Booking";
import VideoPage from "./pages/app/video/Video";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth/redirect" element={<Redirect />} />
        <Route path="/auth/signin" element={<Signin />} />
        <Route path="/bookings" element={<Booking />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/availability/:id" element={<AddSlots />} />
        <Route path="/event-types" element={<EventTypes />} />
        <Route path="/event-types/:id" element={<EditEvents />} />
        <Route path="/:userId/:eventLink" element={<BookEvent />} />
        <Route path="/video/:bookingId" element={<VideoPage />} />
        <Route path="/video/:bookingId/call" element={<CallPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
