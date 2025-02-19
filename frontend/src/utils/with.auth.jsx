import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthWrapper = (props) => {
    const navigate = useNavigate();

    const checkAuthentication = () => {
      return !!localStorage.getItem("token");
    };

    useEffect(() => {
      if (!checkAuthentication()) {
        navigate("/auth");
      }
    }, [navigate]);

    return <WrappedComponent {...props} />;
  };

  return AuthWrapper;
};

export default withAuth;
