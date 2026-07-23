import { signInWithPopup, signOut } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import {
  getCurrentLocation,
  isSouthernState,
  shouldUseDarkTheme,
} from "./location";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authFlow, setAuthFlow] = useState({ stage: "idle" });
  const [pendingAuth, setPendingAuth] = useState(null);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) localStorage.setItem("authToken", token);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    setPendingAuth(null);
    setAuthFlow({ stage: "idle" });
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handlegooglesignin = async () => {
    try {
      setAuthFlow({ stage: "loading", loading: true });
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      setPendingAuth({ idToken });

      try {
        const location = await getCurrentLocation();
        setPendingAuth({ idToken, location });
        if (isSouthernState(location.state)) {
          await requestOtpWithToken(idToken, location);
        } else {
          setAuthFlow({ stage: "phone", location });
        }
      } catch {
        setAuthFlow({
          stage: "location",
          error:
            "Location permission is required. You can enter your exact city and state manually.",
        });
      }
    } catch (error) {
      console.error(error);
      setAuthFlow({
        stage: "idle",
        error: "Google sign-in could not be completed",
      });
    }
  };

  const requestOtpWithToken = async (idToken, location, phone) => {
    setAuthFlow({ stage: "loading", loading: true });
    try {
      const response = await axiosInstance.post("/user/auth/start", {
        idToken,
        location,
        phone,
      });
      setPendingAuth({ idToken, location, phone });
      setAuthFlow({
        stage: "otp",
        challengeId: response.data.challengeId,
        method: response.data.method,
        destination: response.data.destination,
      });
    } catch (error) {
      setAuthFlow({
        stage: phone ? "phone" : "location",
        location,
        error: error.response?.data?.message || "Unable to send OTP",
      });
    }
  };

  const submitLocation = async (location) => {
    if (isSouthernState(location.state)) {
      await requestOtpWithToken(pendingAuth.idToken, location);
    } else {
      setPendingAuth((current) => ({ ...current, location }));
      setAuthFlow({ stage: "phone", location });
    }
  };

  const submitPhone = async (phone) =>
    requestOtpWithToken(
      pendingAuth.idToken,
      pendingAuth.location || authFlow.location,
      phone
    );

  const verifyOtp = async (otp) => {
    setAuthFlow((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await axiosInstance.post("/user/auth/verify", {
        challengeId: authFlow.challengeId,
        otp,
      });
      login(response.data.result, response.data.token);
      setPendingAuth(null);
      setAuthFlow({ stage: "idle" });
    } catch (error) {
      setAuthFlow((current) => ({
        ...current,
        loading: false,
        error: error.response?.data?.message || "OTP verification failed",
      }));
    }
  };

  const cancelAuth = async () => {
    setPendingAuth(null);
    setAuthFlow({ stage: "idle" });
    await signOut(auth);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      axiosInstance
        .get("/user/me")
        .then((response) => updateUser(response.data.result))
        .catch(() => logout());
    }

  }, []);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.toggle(
        "dark",
        shouldUseDarkTheme(user?.state)
      );
    };
    applyTheme();
    const timer = window.setInterval(applyTheme, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user?.state]);

  return (
    <UserContext.Provider
      value={{
        user,
        authFlow,
        login,
        logout,
        updateUser,
        handlegooglesignin,
        submitLocation,
        submitPhone,
        verifyOtp,
        cancelAuth,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
