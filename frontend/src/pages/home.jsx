import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton, Button, TextField } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import AuthContext from "../contexts/auth.context";
import "../styles/home.css";

export function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");

  const { addToUserHistory } = useContext(AuthContext);
  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <>
      <div className="nav-bar">
        <div className="nav-left">
          <h2
            onClick={() => {
              navigate("/");
            }}
          >
            MY VIDEO CALL
          </h2>
        </div>
        <div className="nav-right">
          <IconButton
            onClick={() => {
              navigate("/history");
            }}
          >
            <HistoryIcon fontSize="medium" />
          </IconButton>

          <Button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            <LogoutIcon />
          </Button>
        </div>
      </div>

      <div className="main-container">
        <div className="left-section">
          <div className="content-wrapper">
            <h2 className="heading">Providing Quality Video Calls</h2>
            <div className="input-wrapper">
              <TextField
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                id="outlined-basic"
                label="Meeting Code"
                variant="outlined"
                className="meeting-code-input"
              />
              <Button
                onClick={handleJoinVideoCall}
                variant="contained"
                className="join-button"
              >
                Join
              </Button>
            </div>
          </div>
        </div>
        <div className="right-section">
          <img
            src="/end.home.svg"
            alt="Video Call Illustration"
            className="illustration"
          />
        </div>
      </div>
    </>
  );
}

// export default withAuth(HomeComponent);
