import React, { useState, useEffect } from "react";
import styles from "./LoginFormNew.module.css";
import logo from '../Assets/Hyphen.png';
import { FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import {toast } from 'react-toastify';
import {
  login,
  loginmessage,
  requestOTP,
  verifyOTP,
  resendOTP,
  setUserName,
} from "../../actions/auth";
import { fetchLoginLogo } from "../../actions/logowhitelisting";
const LoginFormNew = () => {
  const initialState = {
    username: "",
    password: "",
    database_type:"postgres"
  };

  const otpValidationState = {
    emailOTP: "",
    otp: "",
  };
  const [otpValidationForm, setOtpValidationForm] = useState(otpValidationState);
  const [form, setForm] = useState(initialState);
  const [isSwapped, setIsSwapped] = useState(false);
  const [message, setMessage] = useState("Welcome to the login page!");
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const messages = [
    "Welcome to the login page!",
    "Secure your system, log in now.",
    "Your journey starts here, log in to continue.",
    "Happy to see you here! Log in to proceed.",
    "Login to access all features.",
  ];

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const apiData = useSelector((state) => state?.auth);
  const loginmess = apiData?.authData?.status_code === 200 ? null : apiData?.authData;

  const handleSwap = () => {
    setIsSwapped(!isSwapped);
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
  };

  const global_username = apiData ? apiData?.username?.username : null;

  useEffect(() => {
    setOtpValidationForm({ ...otpValidationForm, emailOTP: global_username });
  }, [global_username]);

  const { login_logo} = useSelector(
    (state) => state?.logowhitelisting?.images || {}
  );



  const handleChange = (e) => {
    if (e.target.name === "password") {
      dispatch(loginmessage());
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOTPchange = (e) => {
    setOtpValidationForm({
      ...otpValidationForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await dispatch(login(form,navigate));
    if (response === false) {
      if (loginmess && loginmess?.message.includes("not registered")) {
        toast.error("Username is not registered.");
      } else {
        setShowForgotPassword(true);
        dispatch(setUserName({ username: form?.username }));
      }
    }else if(response === true){
      navigate('/Dashboard')
    }
  };
   useEffect(() => {
    dispatch(fetchLoginLogo(1));
  },[])
  useEffect(() => {
    dispatch(loginmessage());
    navigate("/", { state: {} });
  }, [dispatch, navigate]);

  useEffect(() => {
    const container = document.querySelector(`.${styles.loginContainer}`);
    container.classList.add(styles.fadeIn);
  }, []);

  const handleRequestOtp = async () => {
    const success = await dispatch(
      requestOTP({
        email: otpValidationForm?.emailOTP,
        database_type: "postgres",
      })
    );

    if (success) {
      setOtpSent(true);
      startResendTimer();
    }
  };

  const handleVerifyOtp = async () => {
    const success = await dispatch(
      verifyOTP({
        email: otpValidationForm?.emailOTP,
        otp: otpValidationForm?.otp,
        database_type: "postgres",
      })
    );

    if (success) {
      toast.success("OTP verified successfully!");
      setShowOtpForm(false);
      navigate("/resetNew");
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };
  const handleResendOtp = async () => {
    if (!isTimerRunning) {
      const success = await dispatch(
        resendOTP({
          email: otpValidationForm?.emailOTP,
          database_type: "postgres",
        })
      );

      if (success) {
        toast.success("OTP resent successfully!");
        startResendTimer();
      }
    }
  };
  const startResendTimer = () => {
    setIsTimerRunning(true);
    setResendTimer(60);
    const timerId = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  };

  const handleForgotPassword = () => {
    setShowOtpForm(true);
  };


  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginContainer} ${isSwapped ? styles.swapped : ""}`}>
        <div className={`${styles.loginForm} ${isSwapped ? styles.moveLeft : ""}`}>
          <div className={styles.formContent}>
            {login_logo ? (
              <img src={login_logo} alt="Logo" className={styles.logo} />
            ) : (
              <img src={logo} alt="Logo" className={styles.logo} />
            )}
            <p>This is a secure site. Please enter your login information to access</p>
            {showOtpForm ? (
              <div className={styles.formGroup}>
                <div className={styles.formGroupOtp}>
                  <input
                    type="email"
                    name="emailOTP"
                    value={otpValidationForm?.emailOTP}
                    onChange={handleOTPchange}
                    readOnly
                    placeholder="Enter your registered email"
                    required
                  />
                  <button
                    className={`${styles.btnLogin}`}
                    onClick={handleRequestOtp}
                    disabled={otpSent}
                  >
                    Send OTP
                  </button>
                </div>
                {otpSent && (
                  <div
                    className={styles.formGroup}
                    style={{ transform: "translate(-9px, -35px);" }}
                  >
                    <div className={styles.formGroupBtnContainer}>
                      <input
                        name="otp"
                        type="password"
                        value={otpValidationForm?.otp}
                        onChange={handleOTPchange}
                        placeholder="Enter OTP"
                        disabled={!otpSent}
                      />
                      <button
                        className={`${styles.btnLogin}`}
                        onClick={handleVerifyOtp}
                      >
                        Verify OTP
                      </button>
                    </div>
                    {!isTimerRunning ? (
                      <p className={styles.resendtext}>
                        Don’t receive the OTP ?{" "}
                        <span
                          className={styles.resendOtpLink}
                          onClick={handleResendOtp}
                        >
                          RESEND OTP
                        </span>
                      </p>
                    ) : (
                      <p>
                        Please wait {Math.floor(resendTimer / 60)}:
                        {resendTimer % 60} to resend.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {" "}
                <form onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <input
                      type="email"
                      value={form?.username}
                      placeholder="Username"
                      pattern="^([a-zA-Z0-9_\\-.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)$"
                      onChange={handleChange}
                      name="username"
                      maxLength={45}
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      placeholder="Password"
                      type="password"
                      value={form?.password}
                      onChange={handleChange}
                      name="password"
                      autoComplete="off"
                      maxLength={15}
                      required
                    />
                  </div>
                  <div
                    className={styles.formGroupBtnContainer}
                    style={{
                      justifyContent: showForgotPassword
                        ? "space-between"
                        : "center",
                    }}
                  >
                    <button className={`${styles.btnLogin}`} type="submit">
                      Log in
                    </button>

                    {loginmess && (
                      <p
                        style={{
                          marginTop: "1rem",
                          margin: "2.2rem",
                          fontSize: "13px",
                          color: "green",
                          textAlign: "center",
                        }}
                      >
                        {loginmess?.message}
                      </p>
                    )}
                    {showForgotPassword && (
                      <p
                        className={styles.forgotPasswordText}
                        onClick={handleForgotPassword}
                      >
                        Forgot Password?
                      </p>
                    )}
                  </div>
                </form>
                {showForgotPassword && (
                  <p
                    style={{
                      marginTop: "1rem",
                      margin: "2.2rem",
                      fontSize: "13px",
                      color: "red",
                      textAlign: "center",
                    }}
                  >
                    Incorrect email or password. Please try again.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className={`${styles.loginInfo} ${isSwapped ? styles.moveRight : ""}`}>
          <h2>{message}</h2>
          <button className={`${styles.swapButton}`} onClick={handleSwap}>
            <FaLightbulb /> Tip Of the Day
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginFormNew;