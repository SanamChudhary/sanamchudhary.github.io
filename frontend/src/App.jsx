import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing.jsx";
import Authentication from "./pages/authentication.jsx";
import { AuthProvider } from "./contexts/auth.context.jsx";
import VideoMeetComponent from "./pages/video.meet.jsx";
import { HomeComponent } from "./pages/home.jsx";
import History from "./pages/history.jsx";
import NotFoundComponent from "./pages/not.found.component.jsx";
function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/:meetingCode" element={<VideoMeetComponent />} />
            <Route path="/home" element={<HomeComponent />} />
            <Route path="/history" element={<History />}></Route>
            <Route path="*" element={<NotFoundComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
