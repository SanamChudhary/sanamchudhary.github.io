import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing.jsx";
import Authentication from "./pages/authentication.jsx";
import { AuthProvider } from "./contexts/auth.context.jsx";
import VideoMeetComponent from "./pages/video.meet.jsx";
import { HomeComponent } from "./pages/home.jsx";
import History from "./pages/history.jsx";
function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/:url" element={<VideoMeetComponent />} />
            <Route path="/home" element={<HomeComponent />} />
            <Route path="/history" element={<History />}></Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;
