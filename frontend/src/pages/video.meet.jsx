import { useEffect, useRef, useState, useCallback } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from "@mui/material";
import {
  Videocam,
  VideocamOff,
  CallEnd,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  Chat,
} from "@mui/icons-material";
import "../styles/video.meet.css";

const server_url = "http://localhost:8000";
const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  const connections = useRef({});

  // Function to generate a silent audio track
  const silence = useCallback(() => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  }, []);

  // Function to generate a black video track
  const black = useCallback(({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  }, []);

  const getPermissions = useCallback(async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setVideoAvailable(!!videoPermission);

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setAudioAvailable(!!audioPermission);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.error("Error getting permissions:", error);
    }
  }, [videoAvailable, audioAvailable]);

  useEffect(() => {
    getPermissions();

    // Capture the current ref
    const currentRef = localVideoRef.current;

    return () => {
      if (currentRef.srcObject) {
        currentRef.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [getPermissions]);

  // Handle successful getUserMedia
  const getUserMediaSuccess = useCallback(
    async (stream) => {
      try {
        window.localStream?.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.error("Error stopping existing tracks:", e);
      }

      window.localStream = stream;
      localVideoRef.current.srcObject = stream;

      for (const id of Object.keys(connections.current)) {
        if (id === socketIdRef.current) continue;

        try {
          connections.current[id].addStream(window.localStream);
          const description = await connections.current[id].createOffer();
          await connections.current[id].setLocalDescription(description);

          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({
                sdp: connections.current[id].localDescription,
              })
            );
          } else {
            console.error("Socket is not connected.");
          }
        } catch (e) {
          console.error("Error creating or setting offer:", e);
        }
      }

      stream.getTracks().forEach((track) => {
        track.onended = async () => {
          setVideo(false);
          setAudio(false);

          try {
            localVideoRef.current.srcObject
              ?.getTracks()
              .forEach((track) => track.stop());
          } catch (e) {
            console.error("Error stopping tracks:", e);
          }

          const blackSilence = new MediaStream([black(), silence()]);
          window.localStream = blackSilence;
          localVideoRef.current.srcObject = window.localStream;

          for (const id of Object.keys(connections.current)) {
            try {
              connections.current[id].addStream(window.localStream);
              const description = await connections.current[id].createOffer();
              await connections.current[id].setLocalDescription(description);

              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit(
                  "signal",
                  id,
                  JSON.stringify({
                    sdp: connections.current[id].localDescription,
                  })
                );
              } else {
                console.error("Socket is not connected.");
              }
            } catch (e) {
              console.error("Error updating peer connection:", e);
            }
          }
        };
      });
    },
    [black, silence]
  );

  // Handle getUserMedia
  const getUserMedia = useCallback(async () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video,
          audio,
        });
        getUserMediaSuccess(stream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setVideoAvailable(false);
        setAudioAvailable(false);
      }
    } else {
      try {
        localVideoRef.current.srcObject
          ?.getTracks()
          .forEach((track) => track.stop());
      } catch (error) {
        console.error("Error stopping tracks:", error);
      }
    }
  }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio, getUserMedia]);

  // Handle successful getDisplayMedia
  const getDisplayMediaSuccess = useCallback(
    (stream) => {
      try {
        window.localStream?.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.error(e);
      }

      window.localStream = stream;
      localVideoRef.current.srcObject = stream;

      Object.keys(connections.current).forEach((id) => {
        if (id === socketIdRef.current) return;

        connections.current[id].addStream(window.localStream);

        connections.current[id].createOffer().then((description) => {
          connections.current[id]
            .setLocalDescription(description)
            .then(() => {
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({
                  sdp: connections.current[id].localDescription,
                })
              );
            })
            .catch((e) => console.error(e));
        });
      });

      stream.getTracks().forEach((track) => {
        track.onended = () => {
          setScreen(false);

          try {
            localVideoRef.current.srcObject
              .getTracks()
              .forEach((track) => track.stop());
          } catch (e) {
            console.error(e);
          }

          const blackSilence = new MediaStream([black(), silence()]);
          window.localStream = blackSilence;
          localVideoRef.current.srcObject = window.localStream;

          getUserMedia();
        };
      });
    },
    [black, silence, getUserMedia]
  );

  // Handle getDisplayMedia
  const getDisplayMedia = useCallback(() => {
    if (screen && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch((e) => console.error(e));
    }
  }, [screen, getDisplayMediaSuccess]);

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen, getDisplayMedia]);

  // Handle incoming WebRTC signals
  const gotMessageFromServer = useCallback(async (fromId, message) => {
    const signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      try {
        if (signal.sdp) {
          await connections.current[fromId].setRemoteDescription(
            new RTCSessionDescription(signal.sdp)
          );

          if (signal.sdp.type === "offer") {
            const description = await connections.current[
              fromId
            ].createAnswer();
            await connections.current[fromId].setLocalDescription(description);

            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit(
                "signal",
                fromId,
                JSON.stringify({
                  sdp: connections.current[fromId].localDescription,
                })
              );
            } else {
              console.error("Socket is not connected.");
            }
          }
        }

        if (signal.ice) {
          await connections.current[fromId].addIceCandidate(
            new RTCIceCandidate(signal.ice)
          );
        }
      } catch (e) {
        console.error("Error handling signal:", e);
      }
    }
  }, []);

  // Connect to Socket.IO server
  const connectToSocketServer = useCallback(() => {
    if (socketRef.current) return;

    socketRef.current = io.connect(server_url, {
      secure: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const handleConnectError = (err) => {
      console.error("Connection error:", err);
    };

    const handleDisconnect = (reason) => {
      console.warn("Disconnected:", reason);
      if (reason === "io server disconnect") {
        socketRef.current.connect();
      }
    };

    socketRef.current.on("connect_error", handleConnectError);
    socketRef.current.on("disconnect", handleDisconnect);
    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);
      socketRef.current.on("user-left", handleUserLeft);
      socketRef.current.on("user-joined", handleUserJoined);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect_error", handleConnectError);
        socketRef.current.off("disconnect", handleDisconnect);
        socketRef.current.off("signal", gotMessageFromServer);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [gotMessageFromServer]);

  const handleUserLeft = (id) => {
    setVideos((videos) => videos.filter((video) => video.socketId !== id));
  };

  const handleUserJoined = (id, clients) => {
    clients.forEach((socketListId) => {
      if (!connections.current[socketListId]) {
        connections.current[socketListId] = new RTCPeerConnection(
          peerConfigConnections
        );
        connections.current[socketListId].onicecandidate =
          handleICECandidate(socketListId);
        connections.current[socketListId].onaddstream =
          handleAddStream(socketListId);
      }

      if (window.localStream) {
        connections.current[socketListId].addStream(window.localStream);
      } else {
        const blackSilence = new MediaStream([black(), silence()]);
        window.localStream = blackSilence;
        connections.current[socketListId].addStream(window.localStream);
      }
    });

    if (id === socketIdRef.current) {
      establishPeerConnections();
    }
  };

  const handleICECandidate = (socketListId) => (event) => {
    if (event.candidate) {
      socketRef.current.emit(
        "signal",
        socketListId,
        JSON.stringify({ ice: event.candidate })
      );
    }
  };

  const handleAddStream = (socketListId) => (event) => {
    setVideos((videos) => {
      const videoExists = videos.some(
        (video) => video.socketId === socketListId
      );
      return videoExists
        ? videos.map((video) =>
            video.socketId === socketListId
              ? { ...video, stream: event.stream }
              : video
          )
        : [
            ...videos,
            {
              socketId: socketListId,
              stream: event.stream,
              autoplay: true,
              playsinline: true,
            },
          ];
    });
  };

  const establishPeerConnections = () => {
    Object.keys(connections.current).forEach((id2) => {
      if (
        id2 === socketIdRef.current ||
        !connections.current[id2] ||
        !window.localStream
      )
        return;

      try {
        connections.current[id2].addStream(window.localStream);
        connections.current[id2]
          .createOffer()
          .then((description) =>
            connections.current[id2].setLocalDescription(description)
          )
          .then(() => {
            if (socketRef.current?.connected) {
              socketRef.current.emit(
                "signal",
                id2,
                JSON.stringify({
                  sdp: connections.current[id2].localDescription,
                })
              );
            }
          })
          .catch((e) => console.error("Error creating offer:", e));
      } catch (e) {
        console.error("Error adding stream to connection:", e);
      }
    });
  };

  const handleVideo = useCallback(() => setVideo((prev) => !prev), []);

  const handleAudio = useCallback(() => setAudio((prev) => !prev), []);

  const handleScreen = useCallback(() => setScreen((prev) => !prev), []);

  const handleEndCall = useCallback(() => {
    try {
      localVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/home";
  }, []);

  const openChat = useCallback(() => {
    setIsChatVisible((prev) => !prev);
    if (!isChatVisible) {
      setNewMessages(0);
    }
  }, [isChatVisible]);

  const handleMessage = useCallback((e) => setMessage(e.target.value), []);

  const addMessage = useCallback((data, sender, socketIdSender) => {
    setMessages((prevMessages) => [...prevMessages, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  }, []);

  const sendMessage = useCallback(() => {
    if (!message.trim()) return;

    socketRef.current.emit(
      "chat-message",
      message,
      username,
      socketIdRef.current
    );
    setMessage("");
  }, [message, username]);

  // Connect to the call
  const connect = useCallback(() => {
    setAskForUsername(false);
    connectToSocketServer();
    getUserMedia();
  }, [connectToSocketServer, getUserMedia]);

  return (
    <div>
      {askForUsername ? (
        <div className="lobby-container">
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="User Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            className="username-input"
          />
          <Button
            variant="contained"
            onClick={connect}
            className="connect-button"
          >
            Connect
          </Button>
          <div className="local-video-preview">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="video-preview"
            ></video>
          </div>
        </div>
      ) : (
        <div className="video-meet-container">
          <div className="local-video">
            <video
              className="user-meet-video"
              ref={localVideoRef}
              autoPlay
            ></video>
          </div>

          {/* Remote Videos */}
          <div className="remote-videos">
            {videos.map((video) => (
              <div key={video.socketId} className="remote-video">
                <video
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  className="video-element"
                ></video>
              </div>
            ))}
          </div>

          {/* Chat Modal */}
          {isChatVisible && (
            <div className="chat-modal">
              <h1>Chat</h1>
              <div className="chat-messages">
                {messages.map((item, index) => (
                  <div key={index} className="chat-message">
                    <p className="sender">{item.sender}</p>
                    <p className="message">{item.data}</p>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <TextField
                  value={message}
                  onChange={handleMessage}
                  label="Enter Your chat"
                  variant="outlined"
                  className="chat-textfield"
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  className="send-button"
                >
                  Send
                </Button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="controls">
            <IconButton onClick={handleVideo} className="control-button">
              {video ? <Videocam /> : <VideocamOff />}
            </IconButton>
            <IconButton
              onClick={handleEndCall}
              className="control-button end-call"
            >
              <CallEnd />
            </IconButton>
            <IconButton onClick={handleAudio} className="control-button">
              {audio ? <Mic /> : <MicOff />}
            </IconButton>
            {screenAvailable && (
              <IconButton onClick={handleScreen} className="control-button">
                {screen ? <ScreenShare /> : <StopScreenShare />}
              </IconButton>
            )}
            <Badge badgeContent={newMessages} max={99} color="orange">
              <IconButton onClick={openChat} className="control-button">
                <Chat />
              </IconButton>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
