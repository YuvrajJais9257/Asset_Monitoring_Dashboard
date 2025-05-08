
import React, { useEffect, useMemo, useState } from 'react';
import { CloseIcon } from "../../assets/Icons";
import style from './../globalCSS/querytype/chatbotmodal.module.css';
import { Button } from './../globalCSS/Button/Button';
import { texttoquerychartbot, texttoquerychartbotreset } from '../../actions/reportmanagement';
import { useDispatch, useSelector } from 'react-redux';
import { decryptData } from '../utils/EncriptionStore';
import { toast } from 'react-toastify';

const ChatBotModal = ({ showModal, setShowModal, setformdata }) => {
  const [loading, setLoading] = useState(false);
  const [formdata, setFormdata] = useState({ query: '' });
  const [generatedQuery, setGeneratedQuery] = useState(''); // New state for the generated query
  const [errormessage, seterrormessage] = useState("");
  const selectedShemasection = JSON.parse(localStorage.getItem('SelectedSchema'));
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const dispatch = useDispatch();
  const apiData = useSelector((state) => state);
  const reportdetail = apiData?.reportmanagement?.texttochatbox;

  useEffect(() => {
    dispatch(texttoquerychartbotreset());
    setFormdata({ query: '' });
    setGeneratedQuery(''); // Reset the generated query
    seterrormessage('');
  }, []);

  useMemo(() => {
    if (reportdetail && Object.keys(reportdetail).length > 0) {
      if (reportdetail?.status === 200) {
        setGeneratedQuery(reportdetail?.data.query); // Set the generated query
        seterrormessage('');
      } else {
        seterrormessage(reportdetail?.data.query);
      }
    }
  }, [reportdetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormdata((prevFormdata) => ({
      ...prevFormdata,
      [name]: value
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // modified by kashish
  const handleGenerateQuery = async () => {
    if(formdata.query===""||formdata.query===" "){
        toast.error(`Please Write Some Text....`);
        return
    }
    setLoading(true);
    try {
      await dispatch(
        texttoquerychartbot({
          question: formdata.query,
          schema: selectedShemasection.selectedSchema,
          mode: "query",
          email: user.user_email_id,
          connection_type: selectedShemasection.databasename,
          database_type: user.database_type,
        })
      );
    } catch (error) {
      console.error("Error executing query:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmQuery = () => {
    setformdata((prevFormdata) => ({
      ...prevFormdata,
      query: generatedQuery // Confirm the generated query
    }));
    setShowModal(false);
  };

  return (
    <div className={style.recommended_adjustments}>
      <div className={style.popup__box}>
        <div className="mb-3">
          <label htmlFor="exampleFormControlTextarea1" style={{ textAlign: "center", fontWeight: "600" }} className="form-label">
            Type Text Below
          </label>
          <span>{errormessage}</span>
          <CloseIcon style={{ margin: "1px" }} onClick={handleCloseModal} />
          <div className="input-group flex-nowrap">
            <textarea
              className="form-control"
              id="exampleFormControlTextarea1"
              rows="3"
              name="query"
              placeholder="Type Text Here...."
              value={formdata.query}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        <div className={style.Add_remove_data}>
          <div className={style.save_changes_btn}>
          <Button type='button' onClick={handleGenerateQuery} >{loading ? (
              <span>
                creating...
              </span>):("Generate Query")}</Button>
          </div>
        </div>

        {generatedQuery && (
          <div className="mb-3">
            <label htmlFor="generatedQuery" style={{ textAlign: "center", fontWeight: "600" }} className="form-label">
              Generated Query
            </label>
            <div className="input-group flex-nowrap">
              <textarea
                className="form-control"
                id="generatedQuery"
                rows="3"
                name="generatedQuery"
                placeholder="Generated Query Here...."
                value={generatedQuery}
                readOnly
              ></textarea>
            </div>
            <div className={style.Add_remove_data}>
              <div className={style.save_changes_btn}>
                <Button type='button' style={{margin:"15px 0 10px 10px"}} onClick={handleConfirmQuery}>Confirm Query</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBotModal;