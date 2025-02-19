import { useContext, useEffect, useState } from "react";
import AuthContext from "../contexts/auth.context.jsx";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Box,
  CardContent,
  Typography,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import "../styles/history.css";

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false); 
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  // Fetch meeting history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        setSnackbarMessage(
          "Failed to fetch meeting history. Please try again later."
        );
        setSnackbarOpen(true); 
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  // Close the Snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false); 
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Render a single meeting card
  const renderMeetingCard = (meeting, index) => (
    <Card key={index} variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Code: {meeting.meetingCode}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          Date: {formatDate(meeting.date)}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <IconButton onClick={() => navigate("/home")} sx={{ mb: 2 }}>
        <HomeIcon />
      </IconButton>

      {meetings.length > 0 ? (
        meetings.map((meeting, index) => renderMeetingCard(meeting, index))
      ) : (
        <Typography variant="body1" color="text.secondary">
          No meetings found.
        </Typography>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
