import { useContext, useState, createContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";
import httpStatus from "http-status";

const AuthContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    let request = await client.post("/register", {
      name: name,
      username: username,
      password: password,
    });

    if (request.status === httpStatus.CREATED) {
      return request.data.message;
    }
  };

  const handleLogin = async (username, password) => {
    let request = await client.post("/login", {
      username: username,
      password: password,
    });

    if (request.status === httpStatus.OK) {
      localStorage.setItem("token", request.data.token);
      router("/home");
    }
  };

  const getHistoryOfUser = async () => {
    let request = await client.get("/get_all_activities", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    return request.data;
  };

  const addToUserHistory = async (meetingCode) => {
    let request = await client.post(
      "/add_to_activity",
      { meeting_code: meetingCode },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return request;
  };

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
