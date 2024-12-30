import { BrowserRouter, Route, Routes } from "react-router";
import Redirect from "./pages/auth/Redirect";
import Signin from "./pages/auth/Signin";
import Dashboard from "./pages/dashboard/Dashboard";
import RootLayout from "./layout/root-layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <RootLayout>
              <Dashboard />
            </RootLayout>
          }
        />
        <Route path="/auth/redirect" element={<Redirect />} />
        <Route path="/auth/signin" element={<Signin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
