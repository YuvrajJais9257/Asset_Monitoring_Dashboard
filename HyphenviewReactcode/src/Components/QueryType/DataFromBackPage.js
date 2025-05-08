import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import "./../globalCSS/querytype/customquery.css";
import imageUrl1 from "../Images/area.png";
import imageUrl2 from "../Images/bar.png";
import imageUrl3 from "../Images/column.png";
import imageUrl4 from "../Images/line.png";
import imageUrl5 from "../Images/pie.png";
import imageUrl6 from "../Images/stacked-area.png";
import imageUrl7 from "../Images/stacked-bar.png";
import imageUrl8 from "../Images/stacked-column.png";
import imageUrl9 from "../Images/gauge.png";
import imageUrl14 from "../Images/gauge-circle-plus.png";
import imageUrl10 from "../Images/radial-bar.png";
import imageUrl11 from "../Images/pie-chart.png";
import imageUrl12 from "../Images/google-maps.png";
import imageUrl13 from "../Images/donut-chart.png";
import imageUrl15 from "../Images/3dDonut.png";
import imageUrl16 from "../Images/columndrilchart.png";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../header";
import Popupaddparameter from "./Popupaddparameter";
import PopupremoveDateParameter from "./PopupremoveDateParameter";
import {
  testquryonCustompage,
  resettestquryonCustompage,
  resetbacktocustomquerypagewithdata,
} from "../../actions/auth";
import { Button } from "./../globalCSS/Button/Button";
import Form from "react-bootstrap/Form";
import { toast } from "react-toastify";
import {
  getreporttitlefromondashbaord,
  texttoquerychartbotreset,
  getlistofcolumnformappingfirst,
  getlistofcolumnformappingsecond,
  removelistofcolumnformappingfirst,
  removelistofcolumnformappingsecond,
  getDrilldowndetailforupdated,
  updateMapDataForDrillDown,
  checkdrilldown,
} from "../../actions/reportmanagement";
import ChatBotModal from "./ChatBotModal";
import bot from "../Images/bot.png";
import Select from "react-select";
import { decryptData } from "../utils/EncriptionStore";

export default function ReportPage(props) {
  const insitialval = {
    title: "",
    query: "",
    start_date: "",
    end_date: "",
    type: "",
    chart_type: "",
    time_period: "",
    background_colour: "",
    chart_react_colour: "",
    font_size_title: "",
    font_size_value: "",
    layout: "",
    layout_value: "",
    gradient_mode: "",
    subtitle: "",
    subtitle_size: "",
    subtitle_color:"",
    text_alignment: "",
    upload_logo: "",
    chart_colours: "",
    enable_drilldown: "no",
    update_interval: "",
    report_id: "",
    connection_type: "",
    schema: "",
    chart_subtitle: "",
    enable_labels: "",
  };
  const charts = [
    {
      id: "area",
      value: "Area Chart",
      title: "Area Chart",
      imageUrl: imageUrl1,
    },
    { id: "bar", value: "Bar Chart", title: "Bar Chart", imageUrl: imageUrl2 },
    {
      id: "column",
      value: "Column Chart",
      title: "Column Chart",
      imageUrl: imageUrl3,
    },
    {
      id: "line",
      value: "Line Chart",
      title: "Line Chart",
      imageUrl: imageUrl4,
    },
    { id: "pie", value: "Pie Chart", title: "Pie Chart", imageUrl: imageUrl5 },
    {
      id: "stacked_area",
      value: "Stacked Area Chart",
      title: "Stacked Area Chart",
      imageUrl: imageUrl6,
    },
    {
      id: "stacked_bar",
      value: "Stacked Bar Chart",
      title: "Stacked Bar Chart",
      imageUrl: imageUrl7,
    },
    {
      id: "stacked_column",
      value: "Stacked Column Chart",
      title: "Stacked Column Chart",
      imageUrl: imageUrl8,
    },
    {
      id: "gauge",
      value: "Gauge Chart",
      title: "Gauge Chart",
      imageUrl: imageUrl9,
    },
    {
      id: "radial_bar",
      value: "Radial Bar Chart",
      title: "Radial Bar Chart",
      imageUrl: imageUrl10,
    },
    {
      id: "3d pie",
      value: "3d Pie Chart",
      title: "3d Pie Chart",
      imageUrl: imageUrl11,
    },
    {
      id: "3d donut",
      value: "3d Donut Chart",
      title: "3d Donut Chart",
      imageUrl: imageUrl15,
    },
    {
      id: "donut",
      value: "Donut Chart",
      title: "Donut Chart",
      imageUrl: imageUrl13,
    },
    {
      id: "3Darea",
      value: "3d Area Chart",
      title: "3d Area Chart",
      imageUrl: imageUrl1,
    },
    {
      id: "speedometer",
      value: "speedometer",
      title: "Speedometer Gauge",
      imageUrl: imageUrl14,
    },
    {
      id: "drillcolumn",
      value: "drillcolumn",
      title: "Column Drilldown",
      imageUrl: imageUrl16,
    },
  ];
  const [showModal, setShowModal] = useState(false);
  const handleClose = () => {
    dispatch(texttoquerychartbotreset());
    setShowModal(true);
  };
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const renderCharts = (chartList) =>
    chartList.map((chart) => (
      <div
        key={chart.id}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleChartClick}
        style={{ cursor: "pointer" }}
      >
        <input
          className="radBut"
          type="radio"
          id={chart.id}
          name="chart_type"
          value={chart.value}
          onChange={handleRadioChange}
          title={chart.title}
        />
        <label htmlFor={chart.id} className="radio-inline">
          <img className="charts_img" src={chart.imageUrl} alt={chart.title} />
        </label>
      </div>
    ));
  const [hideSecondSelect, setHideSecondSelect] = useState(false);
  const [show, setShow] = useState(false);
  const [showLogoSection, setShowLogoSection] = useState(false);
  const [reportType, setReportType] = useState("");
  const [formdata, setformdata] = useState(insitialval);
  const [enableDrilldown, setEnableDrilldown] = useState("no");
  const [popupaddateparameter, setpopupaddateparameter] = useState(false);
  const [popupremoveateparameter, setpopuppopupremoveateparameter] =
    useState(false);
  const [mappingTab, setMappingTab] = useState(false);
  const [popupremovedateparameter, setpopupremovedateparameter] = useState();
  const [isChartSelected, setIsChartSelected] = useState(false);
  const [isDrilldownSelected, setIsDrilldownSelected] = useState(false);
  const [ischeckstartdate, setischeckstartdate] = useState(true);
  const [checkuploadlogo, setCheckUploadLogo] = useState("");
  const [islogoselected, setIsLogoSelected] = useState(false);
  const [selectReportTitleDrilldown, setSelectReportTitleDrilldown] =
    useState();
  const [selectColumnForDrill, setSelectColumnForDrill] = useState([]);
  const [drilldownmessage, setDrillDownMessage] = useState("");
  const [columnCount, setcolumnCount] = useState();
  const [loading, setLoading] = useState(false);

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const selectedShemasection = JSON.parse(localStorage.getItem("SelectedSchema"));
  const datacomefromprviewpage = JSON.parse(localStorage.getItem("backcustomeDetailOfReport"));
  useEffect(() => {
    if (datacomefromprviewpage?.report_type === "Table") {
      setMappingTab(false);
    }
  }, [datacomefromprviewpage]);

  const history = useNavigate(props);
  const dispatch = useDispatch();
  const [normalCustomQueryInputWidth, setNormalCustomQueryInputWidth] =
    useState(0);
  useEffect(() => {
    const normalCustomQueryInputDiv = document.getElementById(
      "normalCustomQueryInputId"
    );
    if (normalCustomQueryInputDiv) {
      const resizeObserver = new ResizeObserver(() => {
        const rect = normalCustomQueryInputDiv.getBoundingClientRect();
        setNormalCustomQueryInputWidth(rect.width);
      });

      resizeObserver.observe(normalCustomQueryInputDiv);
      return () => {
        resizeObserver.unobserve(normalCustomQueryInputDiv);
        resizeObserver.disconnect();
      };
    }
  }, []);
  const handleUploadLogoChange = (event) => {
    const checklogouploaded = event.target.value;
    setCheckUploadLogo(checklogouploaded);
    setIsLogoSelected(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && file.type === "image/png" && file.size <= 1048576) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        localStorage.setItem("uploadLogo", base64String);
      };
      reader.readAsDataURL(file);
    } else {
      toast.success("Please select a PNG file with a maximum size of 1 MB.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }
  };

  useEffect(() => {
    setMappingTab(false);
    dispatch(
      getreporttitlefromondashbaord({
        database_type: user.database_type,
        email: user.user_email_id,
        customer_id: user.customer_id,
        group_id: user.group_id,
      })
    );
    dispatch(resettestquryonCustompage());
  }, []);

  const apiData = useSelector((state) => state);

  const reportdetail = apiData?.reportmanagement?.allReportDetail;

  const columndetailfirst = apiData?.reportmanagement?.getlistofcolumfirst;
  const columndetailsecond = apiData?.reportmanagement?.getlistofcolumsecond;
  const getDrilldowndataforupdated =
    apiData?.reportmanagement?.getdrildowndataforupdate;

  function handleSelectReportforlist(selectedOption) {
    setSelectReportTitleDrilldown(selectedOption?.value || ""); // Safe access
    setDrillDownMessage("");
  }

  const customStylesForSelect = {
    menu: (provided) => ({
      ...provided,
      zIndex: 9999, // Ensure this is above other elements
      position: "absolute", // Explicitly set the position
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999, // Ensure the portal has a high z-index
    }),
  };

  const [tagBtnClicked, setTagBtnClicked] = useState(false);
  const [mapBtnClicked, setMapBtnClicked] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageShown, setMessageShown] = useState(false);

  const handleSelectReportNamedropfirst = async (e) => {
    e.preventDefault();
    setTagBtnClicked(!tagBtnClicked);
    setMapBtnClicked(false);
    if (selectReportTitleDrilldown != null) {
      dispatch(
        getlistofcolumnformappingfirst({
          customer_id: user?.customer_id,
          connection_type: selectedShemasection?.databasename,
          schema: selectedShemasection?.selectedSchema,
          for_master_report: "yes",
          query: formdata.query,
          database_type: user.database_type,
        })
      );
      dispatch(
        getlistofcolumnformappingsecond({
          customer_id: user?.customer_id,
          connection_type: selectedShemasection?.databasename,
          schema: selectedShemasection?.selectedSchema,
          for_master_report: "no",
          report_title: selectReportTitleDrilldown,
          database_type: user.database_type,
        })
      );
    } else {
      toast.success("Any field is missing", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      setDrillDownMessage("Any of the field is missing");
    }
  };
  useEffect(() => {
    const datacomefromprviewpage = JSON.parse(
      localStorage.getItem("backcustomeDetailOfReport")
    );
    if (datacomefromprviewpage?.enable_drilldown === "yes") {
      dispatch(
        getDrilldowndetailforupdated({
          master_report: datacomefromprviewpage?.report_template_name,

          customer_id: user.customer_id,

          query: datacomefromprviewpage?.defined_query,

          type: datacomefromprviewpage?.report_type,

          db_type: datacomefromprviewpage?.connection_type,

          schema_name: datacomefromprviewpage?.schema,
          database_type: user.database_type,
        })
      );
      setEnableDrilldown("yes");
    } else {
      setEnableDrilldown("no");
      setMappingTab(false);
    }
    if (
      datacomefromprviewpage &&
      datacomefromprviewpage.report_type === "Chart"
    ) {
      setformdata((prevData) => ({
        ...prevData,
        title: datacomefromprviewpage?.report_template_name,
        query: datacomefromprviewpage?.defined_query,
        start_date: datacomefromprviewpage?.start_date,
        end_date: datacomefromprviewpage?.end_date,
        type: datacomefromprviewpage?.report_type,
        chart_type: datacomefromprviewpage?.chart_type,
        time_period: datacomefromprviewpage?.time_period,
        chart_colours: datacomefromprviewpage?.chart_colours,
        enable_drilldown: datacomefromprviewpage?.enable_drilldown,
        update_interval: datacomefromprviewpage?.auto_update_interval,
        connection_type: datacomefromprviewpage?.connection_type,
        report_id: datacomefromprviewpage?.report_id,
        schema: datacomefromprviewpage?.schema,
        chart_subtitle: datacomefromprviewpage?.chart_customizations_options?.chart_subtitle,
        enable_labels: datacomefromprviewpage?.enable_labels,
      }));
    } else if (
      datacomefromprviewpage &&
      datacomefromprviewpage.report_type === "Table"
    ) {
      setformdata((prevData) => ({
        ...prevData,
        title: datacomefromprviewpage?.report_template_name,
        query: datacomefromprviewpage?.defined_query,
        start_date: datacomefromprviewpage?.start_date,
        end_date: datacomefromprviewpage?.end_date,
        type: datacomefromprviewpage?.report_type,
        chart_type: datacomefromprviewpage?.chart_type,
        time_period: datacomefromprviewpage?.time_period,
        enable_drilldown: datacomefromprviewpage?.enable_drilldown,
        update_interval: datacomefromprviewpage?.auto_update_interval,
        connection_type: datacomefromprviewpage?.connection_type,
        report_id: datacomefromprviewpage?.report_id,
        schema: datacomefromprviewpage?.schema,
      }));
    } else if (
      datacomefromprviewpage &&
      datacomefromprviewpage.report_type === "Box"
    ) {
      setShowLogoSection(true);
      setIsLogoSelected(true);
      if (datacomefromprviewpage.upload_logo != null) {
        setCheckUploadLogo("yes");
      }
      setformdata((prevData) => ({
        ...prevData,
        title: datacomefromprviewpage?.report_template_name,
        query: datacomefromprviewpage?.defined_query,
        start_date: datacomefromprviewpage?.start_date,
        end_date: datacomefromprviewpage?.end_date,
        type: datacomefromprviewpage?.report_type,
        chart_type: datacomefromprviewpage?.chart_type,
        time_period: datacomefromprviewpage?.time_period,
        background_colour:
          datacomefromprviewpage?.box_customization_options?.background_colour,
        chart_react_colour:
          datacomefromprviewpage?.box_customization_options?.chart_react_colour,
        font_size_title: datacomefromprviewpage?.box_customization_options?.font_size_title,
        font_size_value: datacomefromprviewpage?.box_customization_options?.font_size_value,
        gradient_mode: datacomefromprviewpage?.box_customization_options?.gradient_mode,
        layout: datacomefromprviewpage?.box_customization_options?.layout,
        layout_value: datacomefromprviewpage?.box_customization_options?.layout_value,
        subtitle: datacomefromprviewpage?.box_customization_options?.subtitle,
        subtitle_size: datacomefromprviewpage?.box_customization_options?.subtitle_size,
        subtitle_color:datacomefromprviewpage?.box_customization_options?.subtitle_color,
        subtitle_text: datacomefromprviewpage?.box_customization_options?.subtitle_text,
        text_alignment: datacomefromprviewpage?.box_customization_options?.text_alignment,
        enable_drilldown: datacomefromprviewpage?.enable_drilldown,
        update_interval: datacomefromprviewpage?.auto_update_interval,
        report_id: datacomefromprviewpage?.report_id,
        connection_type: datacomefromprviewpage?.connection_type,
        schema: datacomefromprviewpage?.schema,
        upload_logo: datacomefromprviewpage?.upload_logo,
      }));
    }
  }, []);
  const blurOnQueryTextArea = () => {
    setMessageShown(!messageShown);
  };

  useEffect(() => {
    if (
      datacomefromprviewpage?.connection_type &&
      datacomefromprviewpage?.schema &&
      !isTyping &&
      formdata?.query
    ) {
      console.log(
        datacomefromprviewpage?.connection_type,
        datacomefromprviewpage?.schema,
        "datacomefromprviewpage?.database_type"
      );
    }
  }, [datacomefromprviewpage, formdata?.query, user?.user_email_id, isTyping]);

  useEffect(() => {
    if (getDrilldowndataforupdated !== "null") {
      if (getDrilldowndataforupdated?.drilldown === "yes") {
        const ColumnCount =
          getDrilldowndataforupdated?.column_mapping || 0;
        const drilldownreportname =
          getDrilldowndataforupdated?.drilldown_data.drilldown_report ||
          "";
        setcolumnCount(ColumnCount);
        setSelectReportTitleDrilldown(drilldownreportname);
        const drilldownColumns = JSON.parse(
          getDrilldowndataforupdated?.drilldown_data.drilldown_column.replace(
            /'/g,
            '"'
          ) || "[]"
        );
        const masterColumns = JSON.parse(
          getDrilldowndataforupdated?.drilldown_data.master_column.replace(
            /'/g,
            '"'
          ) || "[]"
        );

        setSelectColumnForDrill(
          Array.from({ length: ColumnCount }, (_, index) => ({
            Master_Column: masterColumns[index] || "",
            DrillDown_Column: drilldownColumns[index] || "",
          }))
        );

        setMappingTab(true);
      } else if (getDrilldowndataforupdated?.drilldown === "no") {
        setMappingTab(false);
      }
    } else if (getDrilldowndataforupdated === "null") {
      setMappingTab(false);
    }
  }, [getDrilldowndataforupdated]);

  useEffect(() => {
    const radButRadioButtons = document.querySelectorAll(
      '.radBut[type="radio"]'
    );
    const chartTypeTextArea = document.querySelector(
      'textarea[name="chart_type"]'
    );
    function handleRadioClick(event) {
      if (event.target.type === "radio" && event.target.checked) {
        chartTypeTextArea.value = event.target.value;

        setformdata((prevData) => ({
          ...prevData,
          chart_type: event.target.value,
        }));
      }
    }

    radButRadioButtons.forEach((radio) => {
      radio.addEventListener("click", handleRadioClick);
    });

    return () => {
      radButRadioButtons.forEach((radio) => {
        radio.removeEventListener("click", handleRadioClick);
      });
    };
  }, [show]);

  useEffect(() => {
    if (formdata.type === "Table" || formdata.type === "Box") {
      setformdata((prevData) => ({
        ...prevData,
        chart_type: "",
      }));
      if (isChartSelected) {
        setIsChartSelected(false);
      }
    }
    if (formdata.type === "Table") {
      setformdata((prevData) => ({
        ...prevData,
        enable_drilldown: "",
      }));
      if (isDrilldownSelected) {
        setEnableDrilldown("");
        setIsDrilldownSelected(false);
      }
    }
  }, [formdata.type, isChartSelected, isDrilldownSelected]);

  const updateintervalset = (interval) => {
    const updateinterval = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
    };
    return updateinterval[interval];
  };

  const handleRadioChange = (event) => {
    const chartTypes = {
      "Bar Chart": "bar",
      "Column Chart": "column",
      "Line Chart": "line",
      "Gauge Chart": "gauge",
      "Area Chart": "area",
      "Pie Chart": "pie",
      "Radial Bar Chart": "radialBar",
      "Stacked Area Chart": "stackarea",
      "Stacked Bar Chart": "stackbar",
      "Stacked Column Chart": "stackcolumn",
      "3d Pie Chart": "3Dpie",
      "3d Donut Chart": "3D Donut",
      "Donut Chart": "donut",
      "3d Area Chart": "3Darea",
      "speedometer": "speedometer",
      "drillcolumn": "drillcolumn"
    };
    const selectedChartType = chartTypes[event.target.value];

    if (selectedChartType) {
      setformdata({ ...formdata, [event.target.name]: selectedChartType });
      setShow(false);
      setIsChartSelected(true);
    }
  };
  const handleSubmit = (e) => {
    dispatch(resetbacktocustomquerypagewithdata());
    e.preventDefault();
    if (formdata.enable_drilldown != "no" && !mapBtnClicked && tagBtnClicked) {
      toast.success("Please click on the map button to map the column", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }
    if (isTyping) {
      toast.success("Please test the query before previewing.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }
    if (formdata.title && formdata.query && formdata.type) {
      localStorage.setItem("customeDetailOfReport", JSON.stringify(formdata));
    } else {
      toast.success("Please fill the missing field", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }

    history("/PreviewPage");
  };
  const handleTestQuery = async (e) => {
    e.preventDefault();
    setIsTyping(!isTyping);
    const query = formdata.query.trim().toLowerCase();
    if (query.startsWith("select") || query.startsWith("with")) {
      setLoading(true);
      try {
        dispatch(
          testquryonCustompage({
            query: formdata.query,
            schema: datacomefromprviewpage.schema,
            email: user.user_email_id,
            connection_type: datacomefromprviewpage.connection_type,
            database_type: user.database_type,
          })
        );
      } catch (error) {
        console.error("Error executing query:", error);
      } finally {
        setLoading(false);
      }
    } else {
      toast.success("Only Select Operation is allowed", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }
  };

  const validationQuery = apiData?.auth.test_custom_query;
  const focusOnQueryTextArea = () => {
    if (!messageShown) {
      setIsTyping(true);
      setShowMessage(true);
      setMessageShown(true);
      setTimeout(() => {
        setShowMessage(false);
      }, 5000);
    }
  };
  const renderConditionalCharts = () => {
    if (
      validationQuery?.statusCode === 200 &&
      validationQuery?.column_count === 1
    ) {
      const gaugeAndSpeedometerCharts = charts.filter(
        (chart) => chart.id === "gauge" || chart.id === "speedometer"
      );
      return (
        <div
          className="form-group radBut"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 50,
            justifyContent: "center",
          }}
        >
          {renderCharts(gaugeAndSpeedometerCharts)}
        </div>
      );
    } else {
      let chartList = charts.filter(
        (chart) => chart.id !== "gauge" && chart.id !== "speedometer"
      );

      const isPieChartAllowed =
        validationQuery?.statusCode === 200 &&
        validationQuery?.column_count === 2 &&
        ["TEXT", "VARCHAR"].includes(validationQuery?.column_type[1]) &&
        ["INT", "FLOAT"].includes(validationQuery?.column_type[2]);

      if (isPieChartAllowed) {
        const pieCharts = charts.filter(
          (chart) =>
            chart.id === "pie" &&
            chart.id === "3d pie" &&
            chart.id === "3d donut" &&
            chart.id === "donut" &&
            chart.id === "drillcolumn"
        );
        chartList = [...chartList, ...pieCharts];
      } else {
        chartList = chartList.filter(
          (chart) =>
            chart.id !== "pie" &&
            chart.id !== "3d pie" &&
            chart.id !== "3d donut" &&
            chart.id !== "donut" &&
            chart.id !== "drillcolumn"
        );
      }

      return (
        <div
          className="form-group radBut"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 50,
            justifyContent: "center",
          }}
        >
          {renderCharts(chartList)}
        </div>
      );
    }
  };
  function handleChangecharttype() {
    // setchartType(event.target.value)
    setShow((prev) => !prev);
  }
  const handleChange = (e) => {
    if (e.target.name === "query") {
      dispatch(resettestquryonCustompage());
      setformdata({ ...formdata, [e.target.name]: e.target.value });
    } else if (e.target.name === "update_interval") {
      const interval = updateintervalset(e.target.value);

      setformdata({ ...formdata, [e.target.name]: interval });
    } else {
      setformdata({ ...formdata, [e.target.name]: e.target.value });
    }
  };
  const handleChangechart = (event) => {
    setformdata({ ...formdata, chart_type: event.target.value });
  };
  const handleSelectColumnForDrillDownSecond = (index) => (selectedOptions) => {
    // Ensure selectedOptions is an array
    const selectedValues = Array.isArray(selectedOptions)
      ? selectedOptions.map((option) => option.value)
      : selectedOptions
        ? [selectedOptions.value]
        : [];

    setSelectColumnForDrill((prevState) => {
      const updatedColumns = [...prevState];
      if (!updatedColumns[index]) {
        updatedColumns[index] = { DrillDown_Column: [] };
      }
      updatedColumns[index].DrillDown_Column = selectedValues;
      return updatedColumns;
    });
  };
  const getDrillDownColumns = (index) => {
    const currentDrillDownColumn =
      selectColumnForDrill[index]?.DrillDown_Column;

    const drillDownColumn =
      typeof currentDrillDownColumn === "string"
        ? [currentDrillDownColumn] // Wrap string into an array
        : Array.isArray(currentDrillDownColumn) &&
          currentDrillDownColumn.length > 0
          ? currentDrillDownColumn
          : [];

    return drillDownColumn.map((value) => ({ value, label: value }));
  };
  const handleReportTypeChange = (event) => {
    setformdata({ ...formdata, chart_type: "" });
    setformdata({ ...formdata, type: event.target.value });

    if (event.target.value === "Table") {
      setShowLogoSection(true);
    } else {
      setShowLogoSection(false);
    }
  };

  const handleEnableDrilldownChange = (event) => {
    const enableDrilldownValue = event.target.value;
    setEnableDrilldown(enableDrilldownValue);
    if (enableDrilldownValue === "yes") {
      setSelectColumnForDrill({ Master_Column: [], DrillDown_Column: [] });
      dispatch(
        checkdrilldown({
          query: formdata?.query,
          type: formdata.type,
          db_type: datacomefromprviewpage?.connection_type,
          schema_name: datacomefromprviewpage?.schema,
          customer_id: user.customer_id,
          database_type: user.database_type,
        })
      );
      setMappingTab(true);
    } else if (enableDrilldownValue === "no") {
      setMappingTab(false);
    }
    setformdata((prevData) => ({
      ...prevData,
      enable_drilldown: enableDrilldownValue,
    }));
    setIsDrilldownSelected(true);
  };
  useEffect(() => {
    if (formdata.enable_drilldown !== "yes") {
      setMappingTab(false);
    }
  }, [formdata?.enable_drilldown]);

  const handleclickgotoDashboard = () => {
    history("/Dashboard");
  };

  const handleFocus = () => {
    setIsHovered(true);
    setShow(true);
  };
  const handleBlur = () => {
    setIsHovered(false);
    setTimeout(() => {
      if (!isHovered && !isClicked) {
        setShow(false);
      }
    }, 100);
  };
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTimeout(() => {
      if (!isHovered && !isClicked) {
        setShow(false);
      }
    }, 100);
  };
  const handleChartClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, 2000); // Reset click state after 2 seconds
  };

  const handleSelectMap = async (e) => {
    e.preventDefault();
    setMapBtnClicked((prev) => !prev);
    if (formdata.enable_drilldown === "yes" && !tagBtnClicked) {
      toast.success("Please click on the tag button to select the column", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }

    const payloadvalue = {
      Master_Column: Array.from(
        { length: columnCount },
        (v, i) => columndetailfirst && columndetailfirst[i]
      ),
      DrillDown_Column: Array.isArray(selectColumnForDrill)
        ? selectColumnForDrill.map((val) =>
          typeof val.DrillDown_Column === "string"
            ? val.DrillDown_Column
            : val.DrillDown_Column?.[0] || ""
        )
        : [],
    };
    const newobject = {
      ...payloadvalue,
      customer_id: user.customer_id,
      drilldown_report: selectReportTitleDrilldown,
      new_master_report: formdata.title,
      master_report: datacomefromprviewpage?.report_template_name,
      database_type: user.database_type,
    };
    if (formdata.type !== "Box") {
      dispatch(updateMapDataForDrillDown(newobject));
    } else {
      const emptyPayload = {
        Master_Column: [],
        DrillDown_Column: [],
      };
      const newobject2 = {
        ...emptyPayload,
        customer_id: user.customer_id,
        drilldown_report: selectReportTitleDrilldown,
        new_master_report: formdata.title,
        master_report: datacomefromprviewpage?.report_template_name,
        database_type: user.database_type,
      };
      dispatch(updateMapDataForDrillDown(newobject2));
    }
  };

  const options = reportdetail?.length
    ? reportdetail
      .filter((item) =>
        formdata?.chart_type !== 'drillcolumn'
          ? item.report_type === "Table"
          : item.report_type === "Chart"
      )
      .map((report) => ({
        value: report.report_name,
        label: report.report_name,
      }))
    : [];

  return (
    <div style={{ overflow: "clip" }}>
      {popupaddateparameter && (
        <Popupaddparameter
          formdata={formdata}
          setformdata={setformdata}
          setpopupaddateparameter={setpopupaddateparameter}
          setischeckstartdate={setischeckstartdate}
        />
      )}
      {popupremoveateparameter && (
        <PopupremoveDateParameter
          formdata={formdata}
          setformdata={setformdata}
          setpopuppopupremoveateparameter={setpopuppopupremoveateparameter}
        />
      )}
      {showModal && (
        <ChatBotModal
          setShowModal={setShowModal}
          handleClose={handleClose}
          setformdata={setformdata}
        />
      )}
      <div>
        <Header />
      </div>
      <div className="Custom_container">
        <div className="Custom_header_container">
          <span
            class="fas fa-house-user"
            aria-hidden="true"
            onClick={handleclickgotoDashboard}
          ></span>
          <span>/</span>
          <span>Create New Report</span>
        </div>
        <div className="customformpage">
          <form
            className="well form-horizontal"
            id="report_management"
            onSubmit={handleSubmit}
          >
            <fieldset>
              {/* <legend>
              <i className="glyphicon glyphicon-home"></i>Database Management
            </legend> */}

              <div class="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Title
                </label>
                <div className="col-md-5 inputGroupContainer">
                  <div className="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-heading"></i>
                    </span>
                    <input
                      name="title"
                      placeholder="e.g. Incident Severity"
                      className="form-control"
                      type="text"
                      value={formdata.title}
                      maxLength={38}
                      minLength={5}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Query
                </label>
                <div className="col-md-5 inputGroupContainer">
                  <div class="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-edit"></i>
                    </span>
                    <textarea
                      name="query"
                      placeholder="Query"
                      value={formdata.query}
                      className="form-control query-section-textarea"
                      onFocus={focusOnQueryTextArea}
                      onBlur={blurOnQueryTextArea}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
                <img
                  className="chart_bot_icon"
                  src={bot}
                  onClick={handleClose}
                  title="Write your query"
                />
                {showMessage && (
                  <div class="alert-for-update-custom-query">
                    <span class="alert-icon">⚠️</span>
                    <span class="alert-message">
                      Please click the test query button after typing to
                      validate your query.
                    </span>
                    <button class="close-btn" aria-label="Close alert">
                      &times;
                    </button>
                  </div>
                )}
              </div>
              <div className="mb-3 row col-md-5`input-group param_button">
                <Button
                  type="button"
                  disabled={validationQuery?.statusCode !== 200}
                  onClick={() => {
                    setpopupremovedateparameter();
                    setpopupaddateparameter(true);
                  }}
                >
                  Add Date Parameter
                </Button>

                <Button
                  type="button"
                  disabled={
                    !(
                      validationQuery?.statusCode === 200 &&
                      formdata.start_date !== "" &&
                      formdata.end_date !== ""
                    )
                  }
                  onClick={() => {
                    setpopupremovedateparameter();
                    setpopuppopupremoveateparameter(true);
                  }}
                >
                  Remove Date Parameter
                </Button>
                <Button type="button" onClick={handleTestQuery} >
                  {loading ? (
                    <span>
                      Testing...
                    </span>
                  ) : (
                    "Test Query"
                  )}
                </Button>
              </div>
              <div style={{ textAlign: "center" }}>
                {!isTyping &&
                  validationQuery &&
                  validationQuery?.detail === "Valid Query" ? (
                  <p>
                    <i
                      style={{
                        backgroundColor: "green",
                        fontSize: "18px",
                        width: "25px",
                        height: "15px",
                        borderRadius: "50%",
                      }}
                      class="fa-solid fa-check"
                    ></i>
                    {validationQuery?.detail}
                  </p>
                ) : validationQuery?.statusCode === 400 ||
                  validationQuery?.statusCode === 401 ? (
                  !isTyping &&
                  validationQuery && (
                    <p>
                      <i
                        style={{
                          backgroundColor: "red",
                          fontSize: "18px",
                          width: "25px",
                          height: "15px",
                          borderRadius: "50%",
                        }}
                        class="fa-solid fa-smark"
                      ></i>
                      <span>{validationQuery?.detail}</span>
                    </p>
                  )
                ) : (
                  !isTyping &&
                  validationQuery && (
                    <p>
                      <i
                        style={{
                          backgroundColor: "yellow",
                          fontSize: "18px",
                          width: "25px",
                          height: "15px",
                          borderRadius: "50%",
                        }}
                        class="fa-solid fa-smark"
                      ></i>
                      {validationQuery?.detail}
                    </p>
                  )
                )}
              </div>
              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Start Date
                </label>
                <div
                  className="col-md-5 inputGroupContainer"
                  id="normalCustomQueryInputId"
                >
                  <div class="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-calendar"></i>
                    </span>
                    <input
                      type="date"
                      name="start_date"
                      class="form-control"
                      disabled={ischeckstartdate}
                      placeholder="Start Date"
                      aria-label="Username"
                      aria-describedby="addon-wrapping"
                      value={formdata.start_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  End Date
                </label>
                <div className="col-md-5 inputGroupContainer">
                  <div class="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-calendar"></i>
                    </span>
                    <input
                      type="date"
                      name="end_date"
                      class="form-control"
                      disabled={ischeckstartdate}
                      placeholder="end_date"
                      aria-label="Username"
                      aria-describedby="addon-wrapping"
                      value={formdata.end_date}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Type
                </label>
                <div className="col-md-5 selectContainer">
                  <div class="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-file-alt"></i>
                    </span>
                    <select
                      name="type"
                      className="form-control selectpicker"
                      disabled={validationQuery?.statusCode != 200}
                      onChange={handleReportTypeChange}
                      value={formdata.type}
                      required
                    >
                      <option value="" disabled selected hidden>
                        Report Type
                      </option>
                      {validationQuery?.statusCode === 200 &&
                        validationQuery?.column_count > 1 && (
                          <option>Table</option>
                        )}
                      <option>Chart</option>
                      {validationQuery?.statusCode === 200 &&
                        validationQuery?.column_count === 1 && (
                          <option>Box</option>
                        )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Chart Type
                </label>
                <div className="col-md-5 selectContainer">
                  <div className="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-chart-bar"></i>
                    </span>
                    <div style={{ minWidth: normalCustomQueryInputWidth - 56 }}>
                      <textarea
                        name="chart_type"
                        value={formdata.chart_type}
                        className="form-control textArea-chart-type"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onClick={handleChangecharttype}
                        placeholder="Chart Type"
                        required={
                          formdata.type !== "Table" && formdata.type !== "Box"
                        }
                        disabled={
                          validationQuery?.statusCode !== 200 ||
                          formdata.type !== "Chart"
                        }
                        style={{
                          height: "34px",
                          resize: true,
                          width: "100%",
                          borderTopLeftRadius: "0",
                          borderBottomLeftRadius: "0",
                        }}
                      ></textarea>
                      {show && <div> {renderConditionalCharts()}</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Enable Drilldown
                </label>
                <div className="radio col-md-2">
                  <label className="radio-inline">
                    <input
                      type="radio"
                      name="enableDrilldown"
                      value="yes"
                      onChange={handleEnableDrilldownChange}
                      checked={
                        enableDrilldown === "yes" ||
                        formdata.enable_drilldown === "yes"
                      }
                      disabled={
                        !formdata?.query.toLowerCase().includes("group by") &&
                        formdata.type !== "Box"
                      }
                    />{" "}
                    Yes
                  </label>
                  <label className="radio-inline">
                    <input
                      type="radio"
                      name="enableDrilldown"
                      value="no"
                      onChange={handleEnableDrilldownChange}
                      checked={
                        enableDrilldown === "no" ||
                        formdata.enable_drilldown === "no"
                      }
                      disabled={
                        !formdata?.query?.toLowerCase().includes("group by") &&
                        formdata.type !== "Box"
                      }
                    />{" "}
                    No
                  </label>
                </div>
              </div>
              {mappingTab && (
                <div
                  style={{ minWidth: normalCustomQueryInputWidth }}
                  className="custome-mapping-container"
                >
                  <div className="sampledrilldownquery-sub-cnt">
                    {drilldownmessage != null ? (
                      <p>{drilldownmessage}</p>
                    ) : null}
                    <div className="sampledrilldownquery-well form-horizon">
                      <div className="custome-container-column">
                        <Form.Group
                          controlId="formBasicEmail"
                        >
                          <Form.Control
                            type="text"
                            value={formdata.title}
                            disabled
                            required
                            placeholder="Report Name"
                          />
                        </Form.Group>
                        <div className="reportMappinAndTaggingDiv">
                          <Select
                            className="ReportNameForMapping columnSelectCustomQuery"
                            value={{
                              value: selectReportTitleDrilldown || "",
                              label:
                                selectReportTitleDrilldown ||
                                "Select report name",
                            }}
                            onChange={handleSelectReportforlist}
                            options={options}
                            isSearchable
                            placeholder="Select report name"
                            styles={customStylesForSelect}
                            menuPortalTarget={document.body} // Render menu in a portal
                            menuPosition="fixed"
                          />
                          <div className="reportTaggingButton">
                            <Button
                              style={{ margin: "5px" }}
                              onClick={handleSelectReportNamedropfirst}
                            >
                              Tag
                            </Button>
                          </div>
                        </div>
                      </div>
                      {formdata?.type &&
                        Array.from({ length: columnCount }, (v, i) => (
                          <div className="custome-container-column" key={i}>
                            <Form.Group
                              controlId="formBasicEmail"
                            >
                              <Form.Control
                                type="text"
                                value={
                                  // Check if there is saved data; otherwise use columndetailfirst
                                  getDrilldowndataforupdated
                                    ?.drilldown_data?.master_column
                                    ? JSON.parse(
                                      getDrilldowndataforupdated?.drilldown_data.master_column.replace(
                                        /'/g,
                                        '"'
                                      )
                                    )[i]
                                    : columndetailfirst && columndetailfirst[i]
                                }
                                disabled
                                required
                                placeholder="Select Master Column"
                              />
                            </Form.Group>
                            <div
                              style={{
                                flex: 1,
                                float: "right",
                                maxWidth: "72% !important",
                              }}
                            >
                              <Select
                                className="adjustment-style"
                                isSearchable
                                options={
                                  columndetailsecond?.map((column) => ({
                                    value: column,
                                    label: column,
                                  })) || []
                                }
                                value={getDrillDownColumns(i)}
                                onChange={handleSelectColumnForDrillDownSecond(
                                  i
                                )}
                                placeholder="Select DrillDown Column"
                                menuPortalTarget={document.body} // Render menu in a portal
                                menuPosition="fixed"
                                styles={customStylesForSelect}
                              />
                            </div>
                          </div>
                        ))}
                      <div>
                        <Button
                          style={{ margin: "5px" }}
                          onClick={handleSelectMap}
                        >
                          Map
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showLogoSection && formdata.type === "Box" && (
                <div className="mb-3 row">
                  <label className="col-md-4 control-label testalinritemval">
                    Upload logo
                  </label>
                  <div className="radio col-md-2">
                    <label className="radio-inline">
                      <input
                        type="radio"
                        checked={checkuploadlogo === "yes"}
                        name="hosting3"
                        value="yes"
                        onChange={handleUploadLogoChange}
                      />{" "}
                      Yes
                    </label>
                    <label className="radio-inline">
                      <input
                        type="radio"
                        name="hosting3"
                        checked={checkuploadlogo === "no"}
                        value="no"
                        onChange={handleUploadLogoChange}
                      />{" "}
                      No
                    </label>
                    {checkuploadlogo === "yes" && (
                      <label style={{ margin: "20px 20px 20px 40px" }}>
                        <input
                          name="file"
                          onChange={handleFileChange}
                          type="file"
                          accept="image/png"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* {formdata.type === ("Chart" || "Box") && ( */}
              <div className="mb-3 row">
                <label className="col-md-4 control-label testalinritemval">
                  Auto Update Interval
                </label>
                <div className="col-md-5 selectContainer">
                  <div className="input-group flex-nowrap">
                    <span class="input-group-text" id="addon-wrapping">
                      <i class="fas fa-hourglass-half"></i>
                    </span>

                    <select
                      name="update_interval"
                      required
                      className="form-control selectpicker"
                      disabled={validationQuery?.statusCode != 200}
                      value={formdata.update_interval}
                      onChange={handleChange}
                    >
                      <option value="" disabled hidden>
                        Minute(s)
                      </option>
                      <option value="1">1 minute</option>
                      <option value="2">2 minutes</option>
                      <option value="3">3 minutes</option>
                      <option value="4">4 minutes</option>
                      <option value="5">5 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* )} */}

              <div className="mb-3 row" style={{ justifyContent: "center" }}>
                <div className="col-md-4" style={{ paddingLeft: "125px" }}>
                  <Button
                    disabled={validationQuery?.statusCode != 200}
                    type="submit"
                  >
                    Preview
                  </Button>
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}
