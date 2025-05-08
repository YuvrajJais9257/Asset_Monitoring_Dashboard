import React, { useEffect, useMemo, useState } from 'react';
import Header from '../header';
import './../globalCSS/usermanagement/newuser.css';
import styles from './../globalCSS/usermanagement/newuser.module.css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { listofgroup } from '../../actions/newgroup'
import { saveUser, resetmessageshown } from '../../actions/usermanagement'
import { toast } from 'react-toastify';
import { decryptData } from '../utils/EncriptionStore';



function NewUser() {

  const history = useNavigate();


  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const dispatch = useDispatch();
  const apiData = useSelector((state) => state);

  const message = apiData?.usermanagement?.save_user?.message;
  const disposableDomains = process.env.REACT_APP_EMAIL_DOMAIN;
  // const disposableDomains = ["gmail.com","yahoo.com","erasmith.com","mphasis.com","wipro.com"]; // Example list

  function isDisposableEmail(email) {
    const domain = email.split("@")[1];
    return disposableDomains.includes(domain);
  }

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


  useMemo(() => {
    dispatch(resetmessageshown())
  }, [])


  useEffect(() => {
    dispatch(listofgroup({ email: user.user_email_id, database_type: "mysql" }))
  }, [])

  const userDetail = {
    groupname: "",
    date: "",
    new_user_email: "",
    email: user.user_email_id,
    database_type: "mysql",
    password: ""
  };

  const [userForm, setuserForm] = useState(userDetail);
  // const [selectReports, setSelectReports] = useState([]); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isDisposableEmail(userForm.new_user_email)) {
      toast.error("Not a valid email try with valid email adress", { position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light" });
      return;
    }

    if (!validatePassword(userForm.password).isValid) {
      const value = validatePassword(userForm.password);
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

    const group_id = listofallgroup && listofallgroup?.filter((groupid) => userForm.groupname === groupid.groupname)
    if (group_id) {
      const updated = {
        group_id: group_id[0].group_id,
        date: '',
        new_user_email: userForm.new_user_email,
        email: user.user_email_id,
        database_type: user.database_type,
        password: userForm.password,
      };
      dispatch(saveUser(updated, history));
      return;
    }
    // dispatch(saveUser(updated,history)); 
  };


  const listofallgroup =
    Array.isArray(apiData?.newgroup?.list_of_group) && apiData?.newgroup?.list_of_group.length > 0
      ? apiData?.newgroup.list_of_group.some((item) => item.groupname === "SuperAdmin" && user.groupname === "SuperAdmin") // Check if any item matches user.group_id
        ? apiData?.newgroup?.list_of_group // If a match is found, leave the array unchanged
        : apiData?.newgroup?.list_of_group.filter((item) => item.groupname !== "SuperAdmin") // Otherwise, filter out non-matching items
      : [];

  const handelChange = (e) => {

    setuserForm({ ...userForm, [e.target.name]: e.target.value });
  };


  const handleclickgotoUserManagement = () => {
    history("/UserManagementList");
  };

  return (
    <div className="new-user-page">
      <div className="side-nav">
        <Header />
      </div>
      <div className="New_user_management_page">
        <span
          className="fas fa-house-user"
          aria-hidden="true"
          onClick={() => history("/Dashboard")}
        ></span>
        <span>/</span>
        <span onClick={handleclickgotoUserManagement}>User Management</span>
        <span>/</span>
        <span>New User</span>
        {/* <Button onClick={() => history(-1)}>New User</Button> */}
        {/* {['Admin','Super Admin'].includes(user.groupname) && <Link to={`/UpdateGroup`} className='btn btn-default New_user_managemet_btn2'>Group Assignation</Link>} */}
      </div>
      <div className={styles.generalcontainer}>

        <div className={styles.generalsubcontainer}>
          {message && (<div className='new_user_message'>{message}

          </div>)}
          <div className={styles.title}>Register New User</div>
          <form onSubmit={handleSubmit}>


            <div className={styles.field}>
              <label htmlFor="new_user_email" className={styles.textfield}>User Name</label>
              <div className={styles.box}> <input
                className="form-control create-user-email"
                type="email"
                id="new_user_email"
                name="new_user_email"
                pattern="^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$"
                placeholder="Email Address"
                value={userForm.new_user_email}
                maxLength={45}
                onChange={(e) => handelChange(e)}
                required
              /></div>
            </div>
            <div className={styles.field}>
              <label htmlFor="groupname" className={styles.textfield}>Group Name/ID</label>
              <div className={styles.box}><select
                id="groupname"
                className='form-selector'
                name="groupname"
                aria-label="Default select example"
                value={userForm.groupname}
                onChange={handelChange}
                required
              >
                <option value="" disabled>Select Group Name</option>
                {listofallgroup && listofallgroup?.map(option => (
                  <option key={option.groupname} value={option.groupname}>{option.groupname}</option>
                ))}
              </select></div>
            </div>
            {/* Other form inputs go here */}
            {/* ... (similarly handle password and other fields) */}
            <div className={styles.field} >
              <label htmlFor="password" className={styles.textfield}>Password</label>
              <div className={styles.box}><input
                className="form-control create-user-password"
                type="password"
                name='password'
                id="password"
                placeholder="Password"
                value={userForm.password}
                onChange={handelChange}
                minLength={5}
                maxLength={10}
                required
              /></div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button class="btn-login" type="submit">Add User</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NewUser;
