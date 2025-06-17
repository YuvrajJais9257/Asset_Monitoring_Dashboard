import React, { useRef, useEffect, useMemo, useState } from "react";
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
  imageSize,
  titleSize,
  contentSize,
  fontColor,
  textAlignment,
  subtitle,
  subtitleText,
  subtitleSize,
  subtitleColor,
}) => {
  const numericHeight = parseInt(height, 10);
  const newHeight = numericHeight + 12;

  const boxRef = useRef(null);
  const [responsiveScale, setResponsiveScale] = useState(1);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;

        // Scale based on width — you can tweak the divisor for different sensitivity
        const scale = Math.max(0.5, Math.min(2, width / 300));
        setResponsiveScale(scale);
      }
    });

    if (boxRef.current) {
      resizeObserver.observe(boxRef.current);
    }

    return () => {
      if (boxRef.current) {
        resizeObserver.unobserve(boxRef.current);
      }
    };
  }, []);

  const scaleSize = (sizeStr, scale, unit = "rem") => {
    if (!sizeStr) return null;

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)(px|rem)?$/);
    if (!match) return null;

    const [, numberStr, unitFromProp] = match;
    const number = parseFloat(numberStr);
    const finalUnit = unitFromProp || unit;

    return `${number * scale}${finalUnit}`;
  };

  return (
    <div
      onClick={onClick}
      className="preview-box"
      style={{ background: background_colour, height: newHeight }}
      ref={boxRef}
    >
      <div className="preview-content-wrapper">
        {Icon && (
          <div
            className="preview-image-container"
            style={{
              width: scaleSize(imageSize || "40px", responsiveScale, "px"),
              height: scaleSize(imageSize || "40px", responsiveScale, "px"),
              marginBottom: "8px",
            }}
          >
            <img
              src={Icon}
              alt="logo"
              className="preview-image"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        )}

        <div className="preview-text-container">
          <h2
            className="preview-title"
            style={{
              color: fontColor,
              fontSize: scaleSize(
                titleSize || "1.2rem",
                responsiveScale,
                "rem"
              ),
              margin: 0,
            }}
          >
            {title}
          </h2>

          {subtitle && (
            <p
              className="preview-subtitle"
              style={{
                color: subtitleColor,
                fontSize: scaleSize(
                  subtitleSize || "1rem",
                  responsiveScale,
                  "rem"
                ),
                margin: 0,
              }}
            >
              {subtitleText}
            </p>
          )}
        </div>
      </div>
      <div className="preview-value-wrapper">
        <div
          className="preview-value"
          style={{
            color: fontColor,
            fontSize: scaleSize(
              contentSize || "1.4rem",
              responsiveScale,
              "rem"
            ),
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
};

export default DefaultBox;
