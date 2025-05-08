import React, { useEffect, useState } from 'react';
import { CloseIcon } from "../../assets/Icons";
import { addGroup, listofgroup, resertgroupmessage } from '../../actions/newgroup';
import './../globalCSS/usermanagement/popupaddgroup.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from './../globalCSS/Button/Button';
import ShowAlert from '../../actions/ShowAlert';
import { decryptData } from '../utils/EncriptionStore';

function Popupaddparameter({ setpopupaddateparameter }) {
  const [AddGroup, setAddGroup] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const dispatch = useDispatch();
  const history = useNavigate();

  const apiData = useSelector((state) => state.newgroup);
  const response = apiData?.addgroupmessage;
  useEffect(()=>{
    if(response?.status==='success'){
      setpopupaddateparameter(false)
    }
  },[response])

  const handlecreateGroup = async (e) => {
    e.preventDefault();
    try {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Are you sure you want to Add new group?",
        options: ["OK", "Cancel"]
      });
      if (userConfirmed === "OK") {
        dispatch(addGroup({ email: user.user_email_id, customer_id: user.customer_id, database_type: user.database_type, group_name: AddGroup }, history));
        dispatch(listofgroup({ email: user.user_email_id, database_type: user.database_type }));
      }
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  // useEffect(() => {
  //   dispatch(resertgroupmessage());
  // }, [dispatch]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    if (/^[a-zA-Z_]*$/.test(inputValue)) {
      setAddGroup(inputValue);
      setErrorMessage('');
    } else {
      setErrorMessage('Only alphabet values are allowed');
    }
  };

  return (
    <div className='Add_Group_container'>
      <div className='popup__box'>
        {response && <div><p style={{ textAlign: "center", color: "red" }}>{response?.message}</p></div>}
        <div className="mb-3" style={{ textAlign: "center" }}>
          <CloseIcon onClick={() => setpopupaddateparameter(false)} />
        </div>
        <form onSubmit={handlecreateGroup}>
          <div className="form-group">
            <label htmlFor="exampleFormControlTextarea1" className="form-label">Add New Group</label>
            <div className="col-md-12 inputGroupContainer">
              <div className="input-group flex-nowrap">
                <input
                  type="text"
                  name="groupname"
                  maxLength={25}
                  minLength={5}
                  value={AddGroup}
                  className="form-control"
                  placeholder={errorMessage || "Group Name"}
                  aria-label="Group Name"
                  aria-describedby="addon-wrapping"
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", margin: "10px" }}><Button>Save</Button></div>
        </form>
      </div>
    </div>
  );
}

export default Popupaddparameter;
