import React from "react";
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
    <>
      {layout && (
        <div
          onClick={onClick}
          id="boxTemplate"
          className={`${styles.card} ${styles[`layout${layoutValue}`]}`}
          style={{ height: height }}
        >
          <div
            className={styles.content}
            style={{ display: "flex", position: "relative" }}
          >
            {Icon && (
              <div className={styles.iconContainer}>
                <img
                  src={Icon}
                  className={styles.logo}
                  alt="logo"
                  width="50px"
                  height="50px"
                />
              </div>
            )}
            <div
            style={{wordWrap: "break-word", overflowWrap: "break-word"}}
              className={styles.details}
              // style={{ textAlign: textAlignment }}
            >
              <p
                className={styles.title}
                style={{
                  fontSize: titleSize,
                  fontWeight: "800",
                  color: fontColor,
                }}
              >
                {title}
              </p>
              {subtitle && (
                <p
                  className={styles.status}
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
              <p
                className={styles.value}
                style={{
                  fontSize: contentSize,
                  fontWeight: "800",
                  color: fontColor,
                }}
              >
                {value}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BoxTemplate;
