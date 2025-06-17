import React, { useRef, useEffect, useMemo, useState } from "react";
import styles from "../globalCSS/previewhighcharts/NewBox.module.css";
const BoxTemplate = ({
  onClick,
  height,
  width,
  layout,
  layoutValue,
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
    <div>
      {layout && (
        <div
          onClick={onClick}
          // id="boxTemplate"
          className={`${styles.card} ${styles[`layout${layoutValue}`]}`}
          style={{ height: newHeight }}
          ref={boxRef}
        >
          <div className={styles.preview_content_wrapper}>
            {Icon && (
              <div
                className={styles.preview_image_container}
                style={{
                  width: scaleSize(imageSize || "40px", responsiveScale, "px"),
                  height: scaleSize(imageSize || "40px", responsiveScale, "px"),
                  marginBottom: "8px",
                }}
              >
                <img
                  src={Icon}
                  alt="logo"
                  className={styles.preview_image}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            )}

            <div className={styles.preview_text_container}>
              <h2
                className={styles.preview_title}
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
                  className={styles.preview_subtitle}
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
          <div className={styles.preview_value_wrapper}>
            <div
              className={styles.preview_value}
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
      )}
    </div>
  );
};

export default BoxTemplate;
