import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import "../App.css";

export default function LandingPage() {
  const router = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-page-container">
      <nav>
        <div className="nav-header">
          <h2>MY VIDEO CALL</h2>
          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <MenuIcon />
          </div>
        </div>
        <div className={`nav-list ${menuOpen ? "open" : ""}`}>
          <p onClick={() => router("/random")}>Join as Guest</p>
          <p onClick={() => router("/auth")}>Register</p>
          <div role="button">
            <p onClick={() => router("/auth")}>Login</p>
          </div>
        </div>
      </nav>

      <div className="landing-main-container">
        <div className="left-section">
          <h1>
            <span style={{ color: "#ff9839" }}>Connect</span> with your loved Ones
          </h1>
          <p>Cover a distance by My Video Call</p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>

        <div>
          <img src="/mobile.png" alt="Mobile Image" />
        </div>
      </div>
    </div>
  );
}
