/*created by yuvraj jaiswal
feb 11,2025 created a form for reset password
*/
import React, { useState, useEffect } from "react";
import styles from "./LoginFormNew.module.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { resetPasswordnew } from '../../actions/usermanagement';

const ResetPasswordNew = () => {
  const apiData = useSelector((state) => state);

  const global_username = apiData ? apiData?.auth?.username?.username : null;

  const message = apiData?.usermanagement?.reset_password?.message;
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const newLoginState = {
    new_password: "",
    email: "",
  };
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newLoginForm, setNewLoginForm] = useState(newLoginState);

  useEffect(() => {
    setNewLoginForm({ ...newLoginForm, email: global_username });
  }, [global_username]);

  function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password);

    if (password.length < minLength) {
      return {
        isValid: false,
        message: `Password must be at least ${minLength} characters long.`,
      };
    }

    if (!hasUpperCase) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter.",
      };
    }

    if (!hasLowerCase) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter.",
      };
    }

    if (!hasNumber) {
      return {
        isValid: false,
        message: "Password must contain at least one number.",
      };
    }
    if (containsSequentialNumbers(password)) {
      return {
        isValid: false,
        message: "Password is weak, can you try with a strong password?",
      };
    }

    if (!hasSpecialChar) {
      return {
        isValid: false,
        message: "Password must contain at least one special character.",
      };
    }

    return { isValid: true, message: "Password is valid." };
  }

  function isSequential(number) {
    if (number.length < 3) return false; // Sequential patterns need at least 3 digits
    const digits = number.split("").map((n) => parseInt(n));
  
    // Check if the numbers are increasing or decreasing sequentially
    let increasing = true;
    let decreasing = true;
  
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] !== digits[i - 1] + 1) {
        increasing = false;
      }
      if (digits[i] !== digits[i - 1] - 1) {
        decreasing = false;
      }
    }
  
    return increasing || decreasing;
  }

  function containsSequentialNumbers(password) {
    // Extract all sequences of numeric characters from the password
    const numbers = password.match(/\d+/g);
    if (!numbers) return false;

    for (let number of numbers) {
      if (isSequential(number)) {
        return true;
      }
    }

    return false;
  }



  const handleNewloginChange = (e) => {
    setNewLoginForm({ ...newLoginForm, [e.target.name]: e.target.value });
  };

  const handelChangeNewpassword = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();



    const passwordValidation = validatePassword(newLoginForm?.new_password);
    if (!passwordValidation?.isValid) {
      toast.error(passwordValidation.message, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }


    if (newLoginForm?.new_password !== confirmPassword) {
      setError("New password and Confirm new password do not match.");
      return;
    }

    const newObj = {
      database_type: "postgres",
      email: newLoginForm?.email,
      new_password: newLoginForm?.new_password,
    };

    try {
      try {
        await dispatch(resetPasswordnew(newObj, navigate));
      } catch (error) {
        console.error("Error resetting password:", error);
        toast.error(
          error?.response?.data?.message || "Failed to reset password."
        );
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(
        error?.response?.data?.message || "Failed to reset password."
      );
    }
  };

  useEffect(() => {
    setError("");
  }, []);

  return (
    <div className={styles.resetLoginFormContainer}>
      <div className={styles.resetLoginPassword}>
        <div className={styles.restLoginTitle}>Reset Your Password</div>
        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
        <form
          className={styles.resetLoginForm}
          onSubmit={handleNewPasswordSubmit}
        >
          <div className={`${styles.formGroup} ${styles.resetLoginFormGroup}`}>
            <label className={styles.resetLoginLabel} htmlFor="username">
              Username
            </label>
            <input
              className={styles.resetLoginFormInput}
              type="email"
              placeholder="Username"
              value={newLoginForm?.email}
              onChange={handleNewloginChange}
              name="email"
              readOnly
              autoComplete="off"
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.resetLoginFormGroup}`}>
            <label className={styles.resetLoginLabel} htmlFor="new_password">
              New Password
            </label>
            <input
              className={styles.resetLoginFormInput}
              type="password"
              placeholder="New Password"
              value={newLoginForm?.new_password}
              onChange={handleNewloginChange}
              name="new_password"
              autoComplete="off"
              maxLength={15}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.resetLoginFormGroup}`}>
            <label
              className={styles.resetLoginLabel}
              htmlFor="confirm_password"
            >
              Confirm Password
            </label>
            <input
              className={styles.resetLoginFormInput}
              type="password"
              value={confirmPassword}
              placeholder="Confirm Password"
              onChange={handelChangeNewpassword}
              name="confirm_password"
              autoComplete="off"
              maxLength={15}
              required
            />
          </div>
          <button className={`${styles.resetLoginButton}`} type="submit">
            Reset
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordNew;
