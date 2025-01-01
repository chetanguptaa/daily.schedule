import { BrowserRouter, Route, Routes } from "react-router";
import Redirect from "./pages/auth/Redirect";
import Signin from "./pages/auth/Signin";
import Dashboard from "./pages/dashboard/Dashboard";
import RootLayout from "./layout/root-layout";
import Landing from "./pages/landing/Landing";
import Availability from "./pages/availability/Availability";
import EventTypes from "./pages/event-types/EventTypes";
import AddSlots from "./pages/availability/add-slots/AddSlots";
import EditEvents from "./pages/event-types/edit-events/edit-events";
import BookEvent from "./pages/app/book-event/BookEvent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <RootLayout>
              <Dashboard />
            </RootLayout>
          }
        />
        <Route
          path="/availability"
          element={
            <RootLayout>
              <Availability />
            </RootLayout>
          }
        />
        <Route
          path="/availability/:id"
          element={
            <RootLayout>
              <AddSlots />
            </RootLayout>
          }
        />
        <Route
          path="/event-types"
          element={
            <RootLayout>
              <EventTypes />
            </RootLayout>
          }
        />
        <Route
          path="/event-types/:id"
          element={
            <RootLayout>
              <EditEvents />
            </RootLayout>
          }
        />
        <Route path="/:userId/:eventLink" element={<BookEvent />} />
        <Route path="/" element={<Landing />} />
        <Route path="/auth/redirect" element={<Redirect />} />
        <Route path="/auth/signin" element={<Signin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
