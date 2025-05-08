

import React, { useEffect, useState } from 'react';
import Header from '../header';
import './../globalCSS/usermanagement/resetpassword.css';
import { resetPassword, resetmessagePassword } from '../../actions/usermanagement';
import { useDispatch, useSelector } from 'react-redux';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { decryptData } from '../utils/EncriptionStore';
import { toast } from 'react-toastify';

function ResetPassword() {

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  function validatePassword(password) {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long.",
      };
    }
  
    let hasSpecialChar = false;
    let hasAlpha = false;
    let hasNumeric = false;
    const specialChars = "!@#$%^&*()_+[]{}|;:',.<>?`~\"\\/=-"; // Define special characters
  
    // Loop through each character in the password
    for (let char of password) {
      if (specialChars.includes(char)) {
        hasSpecialChar = true;
      } else if (/[a-zA-Z]/.test(char)) {
        hasAlpha = true;
      } else if (/[0-9]/.test(char)) {
        hasNumeric = true;
      }
  
      // If all conditions are met, break early
      if (hasSpecialChar && hasAlpha && hasNumeric) {
        break;
      }
    }
  
    if (!hasSpecialChar) {
      return {
        isValid: false,
        message: "Password must contain at least one special character.",
      };
    }
  
    if (!hasAlpha) {
      return {
        isValid: false,
        message: "Password must contain at least one alphabetic character.",
      };
    }
  
    if (!hasNumeric) {
      return {
        isValid: false,
        message: "Password must contain at least one numeric character.",
      };
    }

    if (containsSequentialNumbers(password)) {
      return { 
        isValid: false,
        message: "Password is weak, can you try with a strong password?",
      };
    }
  
    return {
      isValid: true,
      message: "Password is valid.",
    };
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

  
  const dispatch = useDispatch();
  const history = useNavigate();

  const [conformpassword, setconformpassword] = useState('');
  const [newpasstype, setnewPasswordType] = useState('password');
  const [error, setError] = useState('');

  const queryParameters = new URLSearchParams(window.location.search);
  const user_email_id = queryParameters.get('user_email_id');
  const redirectpage = queryParameters.get('updateemail_pass');

  

  const initialState = {
    new_password: '',
    database_type: user.database_type,
    email: user_email_id,
  };

  const [formdata, setformdata] = useState(initialState);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validatePassword(formdata.new_password).isValid) {
        const value = validatePassword(formdata.new_password);
        toast.error(value.message, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        return; // Exit the function early if validation fails
      }
    if (formdata.new_password !== conformpassword) {
      setError('New password and Confirm new password do not match.');
    } else {
      dispatch(resetPassword(formdata, history));
    }
  };

  const apiData = useSelector((state) => state);

  const message = apiData?.usermanagement?.reset_password?.message;
  const resetpass = apiData?.usermanagement?.reset_password;
  

  useEffect(() => {
    dispatch(resetmessagePassword())
  }, [])

  const handelChange = (e) => {
    setformdata({ ...formdata, [e.target.name]: e.target.value });
    setError('');
  };

  const handelChangeNewpassword = (e) => {
    setconformpassword(e.target.value);
    setError('');
  };
  const handleClickGoBackToUserManagement = () => {
    if (user_email_id && redirectpage === "profile") {
      history("/Dashboard");
    } else if (user_email_id && redirectpage === "usermanagement") {
      history("/UserManagementList");
    }else{
      history("/Dashboard");
    }
  };

  const [headerHeight, setHeaderHeight] = useState(0);
 
  const updateHeaderHeight = () => {
    const headerDiv = document.getElementById("header-of-the-page");
    if (headerDiv) {
      const rect = headerDiv.getBoundingClientRect();
      setHeaderHeight(rect.height);
    }
  };
 
  useEffect(() => {
    updateHeaderHeight(); // Initial height calculation
    window.addEventListener("resize", updateHeaderHeight); // Add event listener for window resize
 
    return () => {
      window.removeEventListener("resize", updateHeaderHeight); // Clean up event listener on unmount
    };
  }, []);
 

  useEffect(() => {
    setError('');
  }, []);

  return (
    <div>
      <div className="">
        <Header />
      </div>
      <div className="intairconatiner">
      
        <div className="resetpassword">
          <div className="title">Update Password</div>
          {message && <p>{message}</p>}
          {error && <p>{error}</p>}
          <form className="row g-3 reset-password-form"  onSubmit={handleSubmit}>
            <div className="field">
              <label className="textfield" htmlFor="staticEmail2">
                Email
              </label>
              <div className="box">
                <input className="form-control reset-password-input" type="email" readOnly value={user_email_id} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="inputPassword1" className="textfield">
                New Password
              </label>
              <div className="box">
                <input
                  type={newpasstype}
                  name="new_password"
                  className="form-control reset-password-input"
                  maxLength={10}
                  minLength={5}
                  id="inputPassword2"
                  placeholder="New Password"
                  value={formdata.new_password}
                  required
                  onChange={handelChange}
                />
                <span className="eye" onClick={() => setnewPasswordType(newpasstype === 'password' ? 'text' : 'password')}>
                  {newpasstype === 'password' ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div className="field">
              <label htmlFor="inputPassword3" className="textfield">
                Confirm Password
              </label>
              <div className="box">
                <input
                  name="conform_password"
                  className="form-control reset-password-input"
                  type="password"
                  id="inputPassword4"
                  placeholder="Confirm Password"
                  value={conformpassword}
                  maxLength={10}
                  minLength={5}
                  required
                  onChange={handelChangeNewpassword}
                />
              </div>
            </div>

            <div style={{ textAlign: "center" }}>


              <button type="submit" className="btn reset-password-btn" >
                Confirm
              </button>
         
            <button
          className="go-back-to-user-management btn reset-password-btn"
          onClick={handleClickGoBackToUserManagement}
          style={{ margin: "1%", top: `${headerHeight}px` }}
        >
          Back
        </button>
        </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;

