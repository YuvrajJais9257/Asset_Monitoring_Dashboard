//modified By Yuvraj Jaiswal
//modified on 28/11/2024
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { customPreviewChartData } from "../../actions/auth";
import { Accordion } from "react-bootstrap";
import "./../globalCSS/previewhighcharts/box.css";
import ColorPicker, { useColorPicker } from "react-best-gradient-color-picker";
import BoxTemplate from "./BoxTemplate";
import DefaultBox from "./DefaultBox";
import { decryptData } from "../utils/EncriptionStore";

function Box({ customizationOptionsPreview, setCustomizationOptionsPreview }) {
  const dispatch = useDispatch();

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const handleSetSubtitle = () => {
    updateCustomizationOptions({
      subtitle: !customizationOptionsPreview?.subtitle,
    });
  };

  const handleSetLayout = () => {
    updateCustomizationOptions({
      layout: !customizationOptionsPreview?.layout,
    });
  };

  const handleSubtitleText = (e) => {
    updateCustomizationOptions({ subtitle_text: e.target.value });
  };

  /*today cahnge */
  const imageSizeOptions = [
    { label: "very small (32x32)", value: "32px" },
    { label: "small (40x40)", value: "40px" },
    { label: "medium (48x48)", value: "48px" },
    { label: "large (56x56)", value: "56px" },
    { label: "extra large (64x64)", value: "64px" },
  ];

  const handleChangeImageSize = (selectedSize) => {
    updateCustomizationOptions({ image_size: selectedSize });
  };

  const handleSubtitleColor = (e) => {
    updateCustomizationOptions({ subtitle_color: e.target.value });
  };

  const CustomeDetailOfReport = JSON.parse(
    localStorage.getItem("customeDetailOfReport")
  );

  const [imageUrl, setImageUrl] = useState("");
  const [imagefromid, setImagefromid] = useState("");
  const [imageSrc, setImageSrc] = useState("");

  const listOfTextSize = ["5px", "10px", "15px", "20px"];
  const listOfValueSize = [
    "5px",
    "10px",
    "15px",
    "20px",
    "25px",
    "30px",
    "35px",
    "40px",
    "45px",
  ];

  const fontAlignments = ["left", "center", "right", "justify"];

  const [color, setColor] = useState(
    customizationOptionsPreview?.background_colour
      ? customizationOptionsPreview?.background_colour
      : "linear-gradient(90deg, rgba(96,93,93,1) 0%, rgba(255,255,255,1) 100%)"
  );

  useEffect(() => {
    setColor(customizationOptionsPreview.background_colour);
  }, [customizationOptionsPreview.background_colour]);

  const { setSolid, setGradient } = useColorPicker(color, setColor);

  const handleSetGradientMode = (mode) => {
    updateCustomizationOptions({ gradient_mode: mode });
    if (mode === "SOLID") {
      setSolid();
    } else if (mode === "GRADIENT") {
      setGradient();
    }
  };

  const convertBase64ToImageSrc = (base64) => {
    return `data:image/png;base64,${base64}`;
  };

  useEffect(() => {
    const CustomeDetailOfReport = JSON.parse(
      localStorage.getItem("customeDetailOfReport")
    );

    if (
      CustomeDetailOfReport &&
      Object.keys(CustomeDetailOfReport)?.length > 0
    ) {
      const base64String = localStorage.getItem("uploadLogo");
      const initialCustomizationOptions = {
        background_colour:
          CustomeDetailOfReport?.background_colour || "#ffffff",

        chart_react_colour:
          CustomeDetailOfReport?.chart_react_colour || "#000000",

        font_size_title: CustomeDetailOfReport?.font_size_title || "",

        font_size_value: CustomeDetailOfReport?.font_size_value || "",

        gradient_mode: CustomeDetailOfReport?.gradient_mode || "",

        layout: CustomeDetailOfReport?.layout || false,

        layout_value: CustomeDetailOfReport?.layout_value || "1",

        subtitle: CustomeDetailOfReport?.subtitle || false,

        subtitle_text: CustomeDetailOfReport?.subtitle_text || "",

        subtitle_size: CustomeDetailOfReport?.subtitle_size || "",

        text_alignment: CustomeDetailOfReport?.text_alignment || "center",

        subtitle_color: CustomeDetailOfReport?.subtitle_color || "#000000",

        image_size: CustomeDetailOfReport?.image_size || "",
      };

      setCustomizationOptionsPreview((prev) => ({
        ...prev,
        ...initialCustomizationOptions,
      }));

      if (CustomeDetailOfReport?.report_id) {
        const febase64data = convertBase64ToImageSrc(
          CustomeDetailOfReport?.upload_logo
        );
        if (CustomeDetailOfReport?.upload_logo) {
          fetch(febase64data)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], "logo.png", { type: "image/png" });
              setImagefromid(file);
            });
        }
      }

      if (base64String) {
        fetch(base64String)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], "logo.png", { type: "image/png" });
            setImageUrl(file);
          });
      }
    } else {
      console.error("CustomeDetailOfReport is null or undefined.");
    }
  }, []);

  useEffect(() => {
    dispatch(
      customPreviewChartData({
        report_name: CustomeDetailOfReport.title,
        report_type: CustomeDetailOfReport.type,
        chart_type: CustomeDetailOfReport.chart_type,
        query: CustomeDetailOfReport.query,
        email: user.user_email_id,
        database_type: user.database_type,
        connection_type: CustomeDetailOfReport.connection_type,
        schema: CustomeDetailOfReport.schema,
      })
    );
  }, []);

  useEffect(() => {
    let url;
    if (imageUrl) {
      url = URL.createObjectURL(imageUrl);
      setImageSrc(url);
    } else if (imagefromid) {
      url = URL.createObjectURL(imagefromid);
      setImageSrc(url);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imageUrl, imagefromid]);

  const apiData = useSelector((state) => state?.auth);

  const [PreviewchartData, setPreviewchartData] = useState({});
  useEffect(() => {
    const dataToSet = apiData?.custom_preview_box;
    setPreviewchartData(dataToSet);
  }, [apiData]);

  const updateCustomizationOptions = (data) => {
    setCustomizationOptionsPreview((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const layoutValueOptions = ["1", "2", "3", "4", "5", "6", "7"];

  const handleChangeLayoutValue = (layoutNum) => {
    updateCustomizationOptions({ layout_value: layoutNum });
  };

  return (
    <div className="customizer-container">
      <div className="preview-section">
        {/*today change */}
        <div className="preview-subSection">
          {PreviewchartData ? (
            customizationOptionsPreview?.layout ? (
              <BoxTemplate
                layout={customizationOptionsPreview?.layout}
                layoutValue={customizationOptionsPreview?.layout_value}
                title={CustomeDetailOfReport?.title}
                value={PreviewchartData?.box_value}
                Icon={imageSrc}
                imageSize={customizationOptionsPreview?.image_size}
                titleSize={customizationOptionsPreview?.font_size_title}
                contentSize={customizationOptionsPreview?.font_size_value}
                fontColor={customizationOptionsPreview?.chart_react_colour}
                textAlignment={customizationOptionsPreview?.text_alignment}
                subtitle={customizationOptionsPreview?.subtitle}
                subtitleText={customizationOptionsPreview?.subtitle_text}
                subtitleSize={customizationOptionsPreview?.subtitle_size}
                subtitleColor={customizationOptionsPreview?.subtitle_color}
              />
            ) : (
              <DefaultBox
                background_colour={
                  customizationOptionsPreview?.background_colour
                }
                gradientMode={customizationOptionsPreview?.gradientMode}
                layout={customizationOptionsPreview?.layout}
                title={CustomeDetailOfReport?.title}
                value={PreviewchartData?.box_value}
                Icon={imageSrc}
                imageSize={customizationOptionsPreview?.image_size}
                titleSize={customizationOptionsPreview?.font_size_title}
                contentSize={customizationOptionsPreview?.font_size_value}
                fontColor={customizationOptionsPreview?.chart_react_colour}
                textAlignment={customizationOptionsPreview?.text_alignment}
                subtitle={customizationOptionsPreview?.subtitle}
                subtitleText={customizationOptionsPreview?.subtitle_text}
                subtitleSize={customizationOptionsPreview?.subtitle_size}
                subtitleColor={customizationOptionsPreview?.subtitle_color}
              />
            )
          ) : null}
        </div>
      </div>

      <div className="settings-panel">
        <div className="settings-section">
          <h3 className="settings-heading">Box Layout</h3>
          <label className="layout-toggle">
            <input
              type="checkbox"
              checked={customizationOptionsPreview?.layout}
              onChange={handleSetLayout}
            />
            <span>Enable Layout</span>
          </label>
        </div>

        {/*today change */}
        {customizationOptionsPreview?.layout ? (
          <>
            <div className="settings-section">
              <h3 className="settings-heading">Layout Options</h3>
              <div className="layout-options">
                {layoutValueOptions.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleChangeLayoutValue(num)}
                    className="layout-option"
                  >
                    <img
                      src={require(`../../assets/images/BoxLayoutIcons/box${num}.png`)}
                      alt={`Layout ${num}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <h3 className="settings-heading">Image Size</h3>
              <select
                className="settings-select"
                value={customizationOptionsPreview?.image_size || ""}
                onChange={(e) => {
                  const selectedSize = e.target.value;
                  handleChangeImageSize(selectedSize);
                }}
              >
                <option value="">Set Image Size</option>
                {imageSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div className="settings-section">
              <h3 className="settings-heading">Image Size</h3>
              <select
                className="settings-select"
                value={customizationOptionsPreview?.image_size || ""}
                onChange={(e) => {
                  const selectedSize = e.target.value;
                  handleChangeImageSize(selectedSize);
                }}
              >
                <option value="">Set Image Size</option>
                {imageSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-section">
              <h3 className="settings-heading">Background Style</h3>
              <select
                className="settings-select"
                value={customizationOptionsPreview?.gradient_mode || ""}
                onChange={(e) => {
                  const selectedMode = e.target.value;
                  handleSetGradientMode(selectedMode);
                  if (selectedMode === "SOLID") {
                    setSolid();
                  } else if (selectedMode === "GRADIENT") {
                    setGradient();
                  }
                }}
              >
                <option value="">Set Background Style</option>
                <option value="SOLID">Solid</option>
                <option value="GRADIENT">Gradient</option>
              </select>
            </div>
            <Accordion defaultActiveKey="0" className="custom-accordion">
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <span style={{ flexGrow: 1 }}>Color Picker</span>
                  <span style={{ transform: "translateX(2rem)" }}>
                    <i className="fas fa-chevron-down"></i>
                  </span>
                </Accordion.Header>
                <Accordion.Body>
                  <ColorPicker
                    height={200}
                    value={color}
                    onChange={(selectedColor) => {
                      setColor(selectedColor);
                      updateCustomizationOptions({
                        background_colour: selectedColor,
                      });
                    }}
                  />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </>
        )}

        <div className="settings-section">
          <h3 className="settings-heading">Font Color</h3>
          <input
            type="color"
            className="color-picker"
            value={customizationOptionsPreview?.chart_react_colour}
            onChange={(e) =>
              updateCustomizationOptions({ chart_react_colour: e.target.value })
            }
          />
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Typography</h3>
          <label>Title Font Size:</label>
          <select
            className="settings-select"
            value={customizationOptionsPreview?.font_size_title}
            onChange={(e) =>
              updateCustomizationOptions({ font_size_title: e.target.value })
            }
          >
            <option value="" disabled>
              Title Font Size
            </option>
            {listOfTextSize.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <label>Value Font Size:</label>
          <select
            className="settings-select"
            value={customizationOptionsPreview?.font_size_value}
            onChange={(e) =>
              updateCustomizationOptions({ font_size_value: e.target.value })
            }
          >
            <option value="" disabled>
              Value Font Size
            </option>
            {listOfValueSize.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="settings-section">
          <h3 className="settings-heading">Subtitle</h3>
          <label className="subtitle-toggle">
            <input
              type="checkbox"
              checked={customizationOptionsPreview?.subtitle}
              onChange={handleSetSubtitle}
            />
            <span>Show Subtitle</span>
          </label>

          {/*today change */}
          {customizationOptionsPreview?.subtitle && (
            <input
              maxLength={45}
              type="text"
              className="settings-input"
              placeholder="Enter Subtitle"
              value={customizationOptionsPreview?.subtitle_text}
              onChange={handleSubtitleText}
            />
          )}
          {customizationOptionsPreview?.subtitle &&
            customizationOptionsPreview?.subtitle_text && (
              <select
                className="settings-select"
                value={customizationOptionsPreview?.subtitle_size}
                onChange={(e) =>
                  updateCustomizationOptions({ subtitle_size: e.target.value })
                }
              >
                <option value="" disabled>
                  Subtitle Size
                </option>
                {listOfTextSize.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            )}

          {customizationOptionsPreview?.subtitle &&
            customizationOptionsPreview?.subtitle_color && (
              <input
                maxLength={20}
                type="color"
                className="color-picker"
                value={customizationOptionsPreview?.subtitle_color}
                onChange={handleSubtitleColor}
              />
            )}
        </div>
      </div>
    </div>
  );
}
export default Box;
