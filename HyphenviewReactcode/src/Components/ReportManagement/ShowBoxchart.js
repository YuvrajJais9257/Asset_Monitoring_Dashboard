//modified by Yuvraj Jaiswal
//used and have create two components BoxTemplate and DefaultBox
import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { useDispatch, useSelector } from "react-redux";
import { generateBoxTypeReport } from "../../actions/reportmanagement";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../globalCSS/Button/Button";
import BoxTemplate from "../PreviewHighchart/BoxTemplate";
import DefaultBox from "../PreviewHighchart/DefaultBox";
import "../globalCSS/reportmanagement/ShowBoxChart.css";
import { decryptData } from "../utils/EncriptionStore";
import { Box } from "lucide-react";
import { CircularProgress } from "@mui/material";

function ShowBoxchart() {
  const dispatch = useDispatch();
  const history = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);


  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const queryParameters = new URLSearchParams(location.search);
  const report_id = queryParameters.get("report_id");
  const access_mask = queryParameters.get("access_mask");

  const apiData = useSelector((state) => state);
  const generatboxreportdetail =
    apiData?.reportmanagement.getboxtypeofreportdetail;



  const generatboxreportdetailBoxCustomizationOptions =
    generatboxreportdetail?.box_customization_options
      ? JSON.parse(generatboxreportdetail?.box_customization_options)
      : {};



  const [imageUrl, setImageUrl] = useState("");
  const [imageSrc, setImageSrc] = useState("");

  const convertBase64ToImageSrc = (base64) => {
    return `data:image/png;base64,${base64}`;
  };

  useEffect(() => {
    if (report_id) {
      const febase64data = convertBase64ToImageSrc(
        generatboxreportdetail?.logo_path
      );

      if (generatboxreportdetail?.logo_path) {
        fetch(febase64data)
          .then((res) => res.blob())

          .then((blob) => {
            const file = new File([blob], "logo.png", { type: "image/png" });

            setImageUrl(file);
          });
      }
    }
  }, [generatboxreportdetail]);

  useEffect(() => {
    if (imageUrl) {
      setImageSrc(URL.createObjectURL(imageUrl));
    }
  }, [imageUrl]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Start the loader
        await dispatch(
          generateBoxTypeReport({
            report_id: report_id,
            email: user.user_email_id,
            database_type: user.database_type,
          })
        );
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false); // Stop the loader
      }
    };

    fetchData();

  }, [report_id]);

  return (
    <div className="show_box_container">
      <div className="show_box_header">
        <Header />
      </div>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <CircularProgress />
        </Box>
      ) : (
        generatboxreportdetail && (
          <div className="show_box_detail">
            {generatboxreportdetailBoxCustomizationOptions?.layout ? (
              <BoxTemplate
                layout={generatboxreportdetailBoxCustomizationOptions?.layout}
                layoutValue={
                  generatboxreportdetailBoxCustomizationOptions?.layout_value
                }
                title={generatboxreportdetail?.report_title || "Default Title"}
                value={
                  generatboxreportdetail?.box_value_id == null
                    ? "N/A"
                    : generatboxreportdetail?.box_value_id
                }
                Icon={imageSrc}
                titleSize={
                  generatboxreportdetailBoxCustomizationOptions?.font_size_title ||
                  "16px"
                }
                contentSize={
                  generatboxreportdetailBoxCustomizationOptions?.font_size_value ||
                  "24px"
                }
                fontColor={
                  generatboxreportdetailBoxCustomizationOptions?.chart_react_colour ||
                  "#fff"
                }
                textAlignment={
                  generatboxreportdetailBoxCustomizationOptions?.text_alignment ||
                  "center"
                }
                subtitle={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle ||
                  "Default Subtitle"
                }
                subtitleText={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle_text ||
                  ""
                }
                subtitleColor={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle_color ||
                  ""
                }
                subtitleSize={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle_size ||
                  "16px"
                }
              />
            ) : (
              <DefaultBox
                background_colour={
                  generatboxreportdetailBoxCustomizationOptions?.background_colour ||
                  "#9c27b0"
                }
                gradientMode={
                  generatboxreportdetailBoxCustomizationOptions?.gradientMode ||
                  false
                }
                layout={
                  generatboxreportdetailBoxCustomizationOptions?.layout ||
                  "default"
                }
                title={generatboxreportdetail?.report_title || "Default Title"}
                value={
                  generatboxreportdetail?.box_value_id == null
                    ? "N/A"
                    : generatboxreportdetail?.box_value_id
                }
                Icon={imageSrc}
                titleSize={
                  generatboxreportdetailBoxCustomizationOptions?.font_size_title ||
                  "16px"
                }
                contentSize={
                  generatboxreportdetailBoxCustomizationOptions?.font_size_value ||
                  "24px"
                }
                fontColor={
                  generatboxreportdetailBoxCustomizationOptions?.chart_react_colour ||
                  "#fff"
                }
                textAlignment={
                  generatboxreportdetailBoxCustomizationOptions?.text_alignment ||
                  "center"
                }
                subtitle={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle ||
                  "Default Subtitle"
                }
                subtitleText={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle_text ||
                  ""
                }
                subtitleColor={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle_color ||
                  ""
                }
                subtitleSize={
                  generatboxreportdetailBoxCustomizationOptions?.subtitle_size ||
                  "16px"
                }
              />
            )}
          </div>
        ))}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Button
          type="button"
          style={{ marginRight: "3px" }}
          onClick={() => {
            history(-1);
          }}
        >
          Back
        </Button>
      </div>
    </div>
  );
}

export default ShowBoxchart;
