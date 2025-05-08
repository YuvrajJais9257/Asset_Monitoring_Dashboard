import React, { useEffect, useState } from 'react'
import {toast } from 'react-toastify';
import DefaultBox from "../PreviewHighchart/DefaultBox";
import BoxTemplate from "../PreviewHighchart/BoxTemplate";

function BoxPreview({ Boxdata, height, width,flagvalue }) {
  const BoxdataBoxCustomizationOptions = Boxdata?.box_customization_options
    ? JSON.parse(Boxdata?.box_customization_options)
    : {};
  const [imageSrc, setImageSrc] = useState('');
  const [widthNeeded, setWidthNeeded] = useState(null);

  const convertBase64ToImageSrc = (base64) => {
    return `data:image/png;base64,${base64}`;
  };

  useEffect(() => {
    if (Boxdata?.logo_path) {
      const febase64data = convertBase64ToImageSrc(Boxdata.logo_path)
      fetch(febase64data)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "logo.png", { type: "image/png" });
          setImageSrc(URL.createObjectURL(file))
        });
    }
  }, [Boxdata]);


  const handleClick = () => {
    if (Boxdata?.drilldown === 'yes') {
      const databox = { report_title: Boxdata?.report_title };
      openNewWindow(databox);
    } else {
      toast.success("drilldown is not enabled !", {position: "top-right",autoClose: 5000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
    }
  };

  let drilldownWindow = null;

  const openNewWindow = (datav) => {
    const queryString = new URLSearchParams(datav).toString();
    const url = `/drillDown?${queryString}`;

    if (drilldownWindow && !drilldownWindow.closed) {
      drilldownWindow.location.href = url;
      drilldownWindow.focus();
    } else {
      drilldownWindow = window.open(url, '_blank', 'width=600,height=400');
    }
  };

  useEffect(() => {
    const percentageWidthComing = parseFloat(width.replace("%", "")); // Extract numeric value
    const widthRequired = percentageWidthComing / 4 + "%"; // Divide by 4 and append '%'
    setWidthNeeded(widthRequired); // Set the width as "100%"
  }, [width]);

  

  return Boxdata ? (
    BoxdataBoxCustomizationOptions?.layout ? (
      <BoxTemplate
        onClick={flagvalue !== "diabledrilldown" ? handleClick : null}
        height={height}
        width={widthNeeded}
        layout={BoxdataBoxCustomizationOptions?.layout}
        layoutValue={BoxdataBoxCustomizationOptions?.layout_value}
        title={Boxdata?.report_title || "Default Title"}
        value={Boxdata?.box_value == null ? "N/A" : Boxdata?.box_value}

        Icon={imageSrc}
        titleSize={BoxdataBoxCustomizationOptions?.font_size_title || "16px"}
        contentSize={BoxdataBoxCustomizationOptions?.font_size_value || "24px"}
        fontColor={BoxdataBoxCustomizationOptions?.chart_react_colour || "#fff"}
        textAlignment={
          BoxdataBoxCustomizationOptions?.text_alignment || "center"
        }
        subtitle={
          BoxdataBoxCustomizationOptions?.subtitle || "Default Subtitle"
        }
        subtitleText={BoxdataBoxCustomizationOptions?.subtitle_text || ""}
        subtitleColor={BoxdataBoxCustomizationOptions?.subtitle_color || "#000000"}
        subtitleSize={BoxdataBoxCustomizationOptions?.subtitle_size || "16px"}
      />
    ) : (
      <DefaultBox
        onClick={flagvalue !== "diabledrilldown" ? handleClick : null}
        height={height}
        width={widthNeeded}
        background_colour={
          BoxdataBoxCustomizationOptions?.background_colour || "#9c27b0"
        }
        gradientMode={BoxdataBoxCustomizationOptions?.gradientMode || false}
        layout={BoxdataBoxCustomizationOptions?.layout || "default"}
        title={Boxdata?.report_title || "Default Title"}
        value={Boxdata?.box_value == null ? "N/A" : Boxdata?.box_value}

        Icon={imageSrc}
        titleSize={BoxdataBoxCustomizationOptions?.font_size_title || "16px"}
        contentSize={BoxdataBoxCustomizationOptions?.font_size_value || "24px"}
        fontColor={BoxdataBoxCustomizationOptions?.chart_react_colour || "#fff"}
        textAlignment={
          BoxdataBoxCustomizationOptions?.text_alignment || "center"
        }
        subtitle={
          BoxdataBoxCustomizationOptions?.subtitle || "Default Subtitle"
        }
        subtitleText={BoxdataBoxCustomizationOptions?.subtitle_text || ""}
        subtitleColor={BoxdataBoxCustomizationOptions?.subtitle_color || "#000000"}
        subtitleSize={BoxdataBoxCustomizationOptions?.subtitle_size || "16px"}
      />
    )
  ) : null;
}
export default BoxPreview