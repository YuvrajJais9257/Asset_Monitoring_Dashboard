//modified by Yuvraj Jaiswal
//modified payload to pass box customization data under box customization options object instead
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../globalCSS/reportmanagement/previewpage.css";
import PreviewHighchart from "../PreviewHighchart/PreviewHighchart";
import PreviewReportTable from "../PreviewHighchart/PreviewReportTable";
import Box from "../PreviewHighchart/Box";
import { savereportTemplate } from "../../actions/auth";
import { updateReportdetail } from "../../actions/reportmanagement";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "./../globalCSS/Button/Button";
import Header from "../header";
import { decryptData } from "../utils/EncriptionStore";

function PreviewPage() {
  const insitialstateofcomp = {
    report_name: "",
    report_type: "",
    chart_type: "",
    query: "",
    enable_drilldown: "",
    auto_update_interval: "",
    time_period: "",
    start_date: "",
    end_date: "",
    background_colour: "",
    chart_react_colour: "",
    font_size_title: "",
    font_size_value: "",
    upload_logo: "",
    layout: "",
    layout_value: "",
    gradient_mode: "",
    subtitle_size: "",
    subtitle: "",
    subtitle_text: "",
    subtitle_color:"",
    text_alignment: "",
    chart_colours: "",
    email: "",
    database_type: "",
    connection_type: "",
    schema: "",
    display_order: 1,
    chart_subtitle: "",
    enable_labels: "",
  };

  const [CustomDetail, setCustomDetail] = useState(insitialstateofcomp);
  const [customizationOptionsPreview, setCustomizationOptionsPreview] =
    useState({
      background_colour: "#ffffff",
      chart_react_colour: "#000000",
      font_size_title: "",
      font_size_value: "",
      layout: "",
      layout_value: "1",
      gradient_mode: "",
      subtitle_size: "",
      subtitle: "",
      subtitle_text: "",
      subtitle_color:"",
      text_alignment: "center",
      chart_colours: {},
      chart_subtitle: "",
      enable_labels: "no",
    });

  const [storedetailtoback, setStoredetailtoback] = useState();
  const [dragMe, setDragMe] = useState(false);
  const dispatch = useDispatch();
  const history = useNavigate();
  const apiData = useSelector((state) => state); // Redux state
  const reportdetail = apiData?.auth.box_color_data; // Report detail from Redux store
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })(); // User data from localStorage
  const CustomeDetailOfReport = JSON.parse(
    localStorage.getItem("customeDetailOfReport")
  ); // Custom detail from localStorage
  const selectedShemasection = JSON.parse(
    localStorage.getItem("SelectedSchema")
  ); // Selected schema from localStorage

  useEffect(() => {
    let newstateofcomp;
    const CustomeDetailOfReport = JSON.parse(
      localStorage.getItem("customeDetailOfReport")
    );
    const reportdetail = apiData?.auth?.box_color_data;
    if (CustomeDetailOfReport != null) {
      newstateofcomp = {
        report_template_name: CustomeDetailOfReport?.title,
        report_type: CustomeDetailOfReport?.type,
        chart_type: CustomeDetailOfReport?.chart_type,
        defined_query: CustomeDetailOfReport?.query,
        enable_drilldown: CustomeDetailOfReport?.enable_drilldown,
        auto_update_interval: CustomeDetailOfReport?.update_interval,
        time_period: CustomeDetailOfReport?.time_period,
        start_date: CustomeDetailOfReport?.start_date,
        end_date: CustomeDetailOfReport?.end_date,
        email: user.user_email_id,
        database_type: user.database_type,
        connection_type: CustomeDetailOfReport?.connection_type,
        schema: CustomeDetailOfReport?.schema,
        display_order: 1,
      };
      if (
        !CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Box"
      ) {
        const boxSettingsNewObj = {
          background_colour: customizationOptionsPreview?.background_colour,
          chart_react_colour: customizationOptionsPreview?.chart_react_colour,
          font_size_title: customizationOptionsPreview?.font_size_title,
          font_size_value: customizationOptionsPreview?.font_size_value,
          layout: customizationOptionsPreview?.layout,
          layout_value: customizationOptionsPreview?.layout_value,
          gradient_mode: customizationOptionsPreview?.gradient_mode,
          subtitle_size: customizationOptionsPreview?.subtitle_size,
          subtitle: customizationOptionsPreview?.subtitle,
          subtitle_text: customizationOptionsPreview?.subtitle_text,
          subtitle_color: customizationOptionsPreview?.subtitle_color,
          text_alignment: customizationOptionsPreview?.text_alignment,
        };

        const newObj = {
          ...newstateofcomp,
          ...boxSettingsNewObj,
        };
        const base64String = localStorage.getItem("uploadLogo");
        let formData = new FormData();
        if (base64String) {
          fetch(base64String)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], "logo.png", { type: "image/png" });
              formData.append("file", file);
              formData.append("report_template_name", JSON.stringify(newObj));
              setStoredetailtoback({
                ...newstateofcomp,
                ...boxSettingsNewObj,
                upload_logo: null,
              });
            });
        } else {
          formData.append("report_template_name", JSON.stringify(newObj));
          setStoredetailtoback({
            ...newstateofcomp,
            ...boxSettingsNewObj,
            upload_logo: null,
          });
        }
        setCustomDetail(formData);
      } else if (
        !CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Table"
      ) {
        let formData = new FormData();
        formData.append("report_template_name", JSON.stringify(newstateofcomp));
        setStoredetailtoback(newstateofcomp);
        setCustomDetail(formData);
      } else if (
        !CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Chart"
      ) {
        const newObj = {
          ...newstateofcomp,

          chart_colours: customizationOptionsPreview.chart_colours,
          chart_subtitle: customizationOptionsPreview.chart_subtitle,
          enable_labels: customizationOptionsPreview.enable_labels,
        };
        let formData = new FormData();

        formData.append("report_template_name", JSON.stringify(newObj));
        setStoredetailtoback(newObj);
        setCustomDetail(formData);
      } else if (
        CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Box"
      ) {
        const boxSettingsOldObj = {
          background_colour: CustomeDetailOfReport?.background_colour,
          chart_react_colour: CustomeDetailOfReport?.chart_react_colour,
          font_size_title: CustomeDetailOfReport?.font_size_title,
          font_size_value: CustomeDetailOfReport?.font_size_value,
          layout: CustomeDetailOfReport?.layout,
          layout_value: CustomeDetailOfReport?.layout_value,
          gradient_mode: CustomeDetailOfReport?.gradient_mode,
          subtitle_size: CustomeDetailOfReport?.subtitle_size,
          subtitle: CustomeDetailOfReport?.subtitle,
          subtitle_text: CustomeDetailOfReport?.subtitle_text,
          text_alignment: CustomeDetailOfReport?.text_alignment,
        };

        const boxSettingsNewObj = {
          background_colour: customizationOptionsPreview?.background_colour,
          chart_react_colour: customizationOptionsPreview?.chart_react_colour,
          font_size_title: customizationOptionsPreview?.font_size_title,
          font_size_value: customizationOptionsPreview?.font_size_value,
          layout: customizationOptionsPreview?.layout,
          layout_value: customizationOptionsPreview?.layout_value,
          gradient_mode: customizationOptionsPreview?.gradient_mode,
          subtitle_size: customizationOptionsPreview?.subtitle_size,
          subtitle: customizationOptionsPreview?.subtitle,
          subtitle_text: customizationOptionsPreview?.subtitle_text,
          subtitle_color: customizationOptionsPreview?.subtitle_color,
          text_alignment: customizationOptionsPreview?.text_alignment,
        };

        let localnewObj = {
          ...newstateofcomp,
          report_id: CustomeDetailOfReport?.report_id,
          box_customization_options: boxSettingsOldObj,
        };
        const base64String = localStorage.getItem("uploadLogo");

        let formData = new FormData();
        if (base64String) {
          fetch(base64String)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], "logo.png", { type: "image/png" });
              formData.append("file", file);
              formData.append("details", JSON.stringify(localnewObj));
              setStoredetailtoback({
                ...newstateofcomp,
                report_id: CustomeDetailOfReport?.report_id,
                box_customization_options: boxSettingsNewObj,
                upload_logo: CustomeDetailOfReport?.upload_logo,
              });
              setCustomDetail(formData);
            });
        } else {
          localnewObj = {
            ...newstateofcomp,
            report_id: CustomeDetailOfReport?.report_id,
            box_customization_options: boxSettingsOldObj,
            upload_logo: CustomeDetailOfReport?.upload_logo,
          };
          formData.append("details", JSON.stringify(localnewObj));
          setStoredetailtoback({
            ...newstateofcomp,
            report_id: CustomeDetailOfReport?.report_id,
            box_customization_options: boxSettingsNewObj,
            upload_logo: CustomeDetailOfReport?.upload_logo,
          });
          setCustomDetail(formData);
        }
      } else if (
        CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Table"
      ) {
        const newObj = {
          ...newstateofcomp,
          report_id: CustomeDetailOfReport.report_id,
        };
        let formData = new FormData();
        formData.append("details", JSON.stringify(newObj));
        setCustomDetail(formData);
        setStoredetailtoback(newObj);
      } else if (
        CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Chart"
      ) {
        const newObj = {
          ...newstateofcomp,
          report_id: CustomeDetailOfReport.report_id,

          chart_customizations_options: {
            chart_colours: customizationOptionsPreview.chart_colours,
            chart_subtitle: customizationOptionsPreview.chart_subtitle,
          },
          enable_labels: customizationOptionsPreview.enable_labels,
        };

        let formData = new FormData();

        formData.append("details", JSON.stringify(newObj));
        setCustomDetail(formData);
        setStoredetailtoback(newObj);
      }
    }
  }, [customizationOptionsPreview]);

  useEffect(() => {
    let newstateofcomp;
    const CustomeDetailOfReport = JSON.parse(
      localStorage.getItem("customeDetailOfReport")
    );

    if (CustomeDetailOfReport != null) {
      newstateofcomp = {
        report_template_name: CustomeDetailOfReport?.title,
        report_type: CustomeDetailOfReport?.type,
        chart_type: CustomeDetailOfReport?.chart_type,
        defined_query: CustomeDetailOfReport?.query,
        enable_drilldown: CustomeDetailOfReport?.enable_drilldown,
        auto_update_interval: CustomeDetailOfReport?.update_interval,
        time_period: CustomeDetailOfReport?.time_period,
        start_date: CustomeDetailOfReport?.start_date,
        end_date: CustomeDetailOfReport?.end_date,
        email: user.user_email_id,
        database_type: user.database_type,
        connection_type: CustomeDetailOfReport?.connection_type,
        schema: CustomeDetailOfReport?.schema,
        display_order: 1,
      };
      if (
        !CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Box"
      ) {
        const boxSettingsNewObj = {
          background_colour: customizationOptionsPreview?.background_colour,

          chart_react_colour: customizationOptionsPreview?.chart_react_colour,

          font_size_title: customizationOptionsPreview?.font_size_title,

          font_size_value: customizationOptionsPreview?.font_size_value,

          layout: customizationOptionsPreview?.layout,

          layout_value: customizationOptionsPreview?.layout_value,

          gradient_mode: customizationOptionsPreview?.gradient_mode,

          subtitle_size: customizationOptionsPreview?.subtitle_size,

          subtitle: customizationOptionsPreview?.subtitle,

          subtitle_text: customizationOptionsPreview?.subtitle_text,

          subtitle_color: customizationOptionsPreview?.subtitle_color,

          text_alignment: customizationOptionsPreview?.text_alignment,
        };

        const newObj = {
          ...newstateofcomp,
          ...boxSettingsNewObj,
        };
        const base64String = localStorage.getItem("uploadLogo");
        let formData = new FormData();
        if (base64String) {
          fetch(base64String)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], "logo.png", { type: "image/png" });
              formData.append("file", file);
              formData.append("report_template_name", JSON.stringify(newObj));
              setStoredetailtoback({
                ...newstateofcomp,
                ...boxSettingsNewObj,
                upload_logo: file,
              });
            });
        } else {
          formData.append("report_template_name", JSON.stringify(newObj));
          setStoredetailtoback({
            ...newstateofcomp,
            box_customization_options: boxSettingsNewObj,
            upload_logo: null,
          });
        }
        setCustomDetail(formData);
      } else if (
        CustomeDetailOfReport.report_id &&
        CustomeDetailOfReport.type === "Box"
      ) {
        const base64String = localStorage.getItem("uploadLogo");
        const boxSettingsNewObj = {
          background_colour: customizationOptionsPreview?.background_colour,
          chart_react_colour: customizationOptionsPreview?.chart_react_colour,
          font_size_title: customizationOptionsPreview?.font_size_title,
          font_size_value: customizationOptionsPreview?.font_size_value,
          layout: customizationOptionsPreview?.layout,
          layout_value: customizationOptionsPreview?.layout_value,
          gradient_mode: customizationOptionsPreview?.gradient_mode,
          subtitle_size: customizationOptionsPreview?.subtitle_size,
          subtitle: customizationOptionsPreview?.subtitle,
          subtitle_text: customizationOptionsPreview?.subtitle_text,
          subtitle_color: customizationOptionsPreview?.subtitle_color,
          text_alignment: customizationOptionsPreview?.text_alignment,
        };
        const newobj = {
          ...newstateofcomp,
          report_id: CustomeDetailOfReport.report_id,
          box_customization_options: boxSettingsNewObj,
        };

        let formData = new FormData();
        if (base64String) {
          fetch(base64String)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], "logo.png", { type: "image/png" });
              formData.append("file", file);
              formData.append("details", JSON.stringify(newobj));
              setStoredetailtoback({
                ...newstateofcomp,
                report_id: CustomeDetailOfReport.report_id,
                box_customization_options: boxSettingsNewObj,
                upload_logo: CustomeDetailOfReport.upload_logo,
              });
              setCustomDetail(formData);
            });
        } else {
          formData.append("details", JSON.stringify(newobj));
          setStoredetailtoback({
            ...newstateofcomp,
            report_id: CustomeDetailOfReport.report_id,
            box_customization_options: boxSettingsNewObj,
            upload_logo: CustomeDetailOfReport.upload_logo,
          });
          setCustomDetail(formData);
        }
      }
    }
  }, [customizationOptionsPreview]);

  const handelSaveChart = async () => {
    try {
      // Check if the report is being created or updated
      if (!CustomeDetailOfReport.report_id) {
        await dispatch(savereportTemplate(CustomDetail, history));
      } else {
        localStorage.removeItem("uploadLogo");
        await dispatch(updateReportdetail(CustomDetail, history));
      }
    } catch (error) {
      console.error("Error while saving the report:", error);
      alert("An error occurred while saving the report. Please try again.");
    }
  };

  const handelbackbuttonchange = async () => {
    localStorage.setItem(
      "backcustomeDetailOfReport",
      JSON.stringify(storedetailtoback)
    );
    history("/DataFromBackPage");
  };

  return (
    <div>
      <div className="side-nav">
        <Header />
      </div>

      <div className="preview-page-container">
        <div className="high-chart-type">
          <div className="preview-chart-content">
            {CustomeDetailOfReport?.type === "Table" ? (
              <PreviewReportTable />
            ) : CustomeDetailOfReport?.type === "Box" ? (
              <Box
                customizationOptionsPreview={customizationOptionsPreview}
                setCustomizationOptionsPreview={setCustomizationOptionsPreview}
              />
            ) : CustomeDetailOfReport?.type === "Chart" ? (
              <PreviewHighchart
                customizationOptionsPreview={customizationOptionsPreview}
                setCustomizationOptionsPreview={setCustomizationOptionsPreview}
                dragMe={dragMe}
                setDragMe={setDragMe}
              />
            ) : null}

            <div className="preview-button-container">
              <Button
                className="preview-page-back"
                type="button"
                onClick={handelbackbuttonchange}
              >
                Back
              </Button>

              <Button className="preview-page-save" onClick={handelSaveChart}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PreviewPage;
