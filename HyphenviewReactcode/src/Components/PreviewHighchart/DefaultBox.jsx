import React from "react";
import "../globalCSS/previewhighcharts/box.css";

const DefaultBox = ({
  onClick,
  height,
  width,
  background_colour,
  layout,
  title,
  value,
  Icon,
  titleSize,
  contentSize,
  fontColor,
  textAlignment,
  subtitle,
  subtitleText,
  subtitleSize,
  subtitleColor,

}) => {

  return (
    <div
      onClick={onClick}
      className="preview-box"
      style={{
        background: background_colour,
        height: height,
      }}
    >
      {Icon && (
        <div className="preview-image-container">
          <img
            src={Icon}
            alt="logo"
            style={{
              width: "50px",
              height: "50px",
            }}
          />
        </div>
      )}
      <div className="preview-content" style={{ textAlign: textAlignment, wordWrap: "break-word", overflowWrap: "break-word" }}>
        <h2
          className="preview-title"
          style={{
            fontSize: titleSize,
            fontWeight: "800",
            color: fontColor,
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className="preview-subtitle"
            style={{
              fontSize: subtitleSize,
              fontWeight: "800",
              color: subtitleColor,
              opacity: 0.8,
            }}
          >
            {subtitleText}
          </p>
        )}

        <div
          className="preview-value"
          style={{
            fontSize: contentSize,
            fontWeight: "800",
            color: fontColor,
          }}
        >
          {value}
        </div>

         
      </div>

      {/* <style>
        {`
      .preview-content {
        text-align: ${textAlignment} !important;
      }
      .preview-subtitle {
        text-align: ${textAlignment} !important;
      }
      .preview-title {
        text-align: ${textAlignment} !important;
      }
      .preview-value {
        text-align: ${textAlignment} !important;
      }
    `}
      </style> */}
    </div>
  );
};

export default DefaultBox;
