import React, { useState, useRef, useEffect } from "react";
import "../globalCSS/NewDashboard/CustomDropDownNew.css";


const CustomDropdownNew = ({
  firstSideBarDivItemHeight,
  sideBarWidth,
  isSidebarCollapsed,
  options,
  selectedOption,
  onOptionSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  const handleMouseEnter = (index) => {
    setHighlightedIndex(index);
  };
  const dropdownRef = useRef(null);
  const handleMouseLeave = () => {
    setHighlightedIndex(null);
  };

  const handleOptionClick = (option) => {
    onOptionSelect(option.value);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-dropdown">
      <span id="dashboard-icon-container" onClick={() => setIsOpen(!isOpen)}>
        {" "}
        <img
          src="/featureIcon/1_Dashboardimg.png"
          className="Dashboard_logo on-dashboard-icons"
        />
      </span>
      {isOpen && (
        <div
          className="dropdown_content"
          style={{
            left: sideBarWidth - 10,
            top: firstSideBarDivItemHeight + 15,
          }} ref={dropdownRef}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={`dropdown-item ${highlightedIndex === index ? "highlightedGroupOption" : ""
                } ${selectedOption === option.value ? "selectedGroupOption" : ""
                }`}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleOptionClick(option)}
            >
              <img
                src={option.icon}
                alt={option.label}
                className="dropdown-icon"
              />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdownNew;
