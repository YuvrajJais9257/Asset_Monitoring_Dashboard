import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import  "./../globalCSS/NewDashboard/NewSidebar.css";
import Logo from '../Images/hyphenwhite.png'
import CustomDropdownNew from "./CustomDropDownNew";
import { listofgroup } from "../../actions/newgroup";
import { canvashframedataformodification } from "../../actions/canvascreation";
import userGroupIcons from "./UserGroupIcons";
import MenuButton from '@mui/joy/MenuButton';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListDivider from '@mui/joy/ListDivider';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import Dropdown from '@mui/joy/Dropdown';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckIcon from '@mui/icons-material/Check';
import SwitchAccessShortcutIcon from '@mui/icons-material/SwitchAccessShortcut';
import { decryptData, encryptData } from "../utils/EncriptionStore";
import { fetchNavIcon } from "../../actions/logowhitelisting";

const NewSidebar = ({ sideBarWidth, setSideBarWidth, isOpen }) => {
  const history = useNavigate();
  const dispatch = useDispatch();
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();
  const [selectedUserGroup, setSelectedUserGroup] = useState(null);
  const [showGroups, setShowGroups] = useState(false);
  const [featurename, setFeaturename] = useState([]);
  const [firstSideBarDivItemHeight, setFirstSideBarDivItemHeight] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0 });

  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const toggleGroupDropdown = (event) => {
    event.stopPropagation();
    setShowGroupDropdown(!showGroupDropdown);
  };

  useEffect(() => {
    const sideBarDiv = document.getElementById("sidebarContainerId");
    const firstSideBarDivItem = document.querySelector(
      ".firstSideBarDivItemtId"
    );

    if (firstSideBarDivItem) {
      const firstSideBarDivItemRect =
        firstSideBarDivItem.getBoundingClientRect();
      setFirstSideBarDivItemHeight(firstSideBarDivItemRect.height);
    }

    if (sideBarDiv) {
      const resizeObserver = new ResizeObserver(() => {
        const rect = sideBarDiv.getBoundingClientRect();
        setSideBarWidth(rect.width);
      });

      resizeObserver.observe(sideBarDiv);

      // Cleanup observer on component unmount
      return () => {
        resizeObserver.unobserve(sideBarDiv);
        resizeObserver.disconnect();
      };
    }
  }, []);


  useEffect(() => {
    if (user) {
      dispatch(fetchNavIcon(user.customer_id));
      setFeaturename(user.features.filter((feturedetail) => user.group_id === feturedetail.group_id));
      setSelectedUserGroup(user.group_id);
    }
  }, []);


  const handleUserGroupChange = (value) => {
    dispatch(
      canvashframedataformodification({
        customer_id: user.customer_id,
        group_id: value,
        database_type: user.database_type,
      })
    );
    setSelectedUserGroup(value);

  };

  useEffect(() => {
    dispatch(
      canvashframedataformodification({
        customer_id: user.customer_id,
        group_id: user.group_id,
        database_type: user.database_type,
      })
    );
    dispatch(
      listofgroup({ email: user.user_email_id, database_type: user.database_type })
    );
  }, []);

  const getRandomIcon = () => {
    const randomIndex = Math.floor(Math.random() * userGroupIcons.length);
    return userGroupIcons[randomIndex];
  };

  const dropdownOptions = [...new Map(
    user.features.map((groupdetail) => [groupdetail.group_id, groupdetail])
  ).values()].map((groupdetail) => {
    const icon = getRandomIcon();
    return {
      value: groupdetail.group_id,
      label: groupdetail.groupname,
      icon: icon,
      userfeature: user.features
        .filter((item) => user.group_id === item.group_id)
        .map((item) => item.group_id),
    };
  });

  const handleClickFeature = (feature) => {
    if (feature === 'User Management') {
      history('/UserManagementList')
    } else if (feature === 'Report Management') {
      history('/ListOfReports')
    } else if (feature === 'Report Scheduler') {
      history('/ReportSchedulerList')
    } else if (feature === 'Dashboard Management') {
      history('/ListOfDashboardCanvas')
    }
  }

  const handelClicklogout = () => {
    history("/profile");
  };

  const onViewGroupIconClick = (e) => {
    e.stopPropagation();
    setShowGroups(!showGroups);
  };

  const [screenHeight, setScreenHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  const handelGroupSwitch = (newGroupName, newGroupId, index) => {

    const userData = (() => {
      const encryptedData = localStorage.getItem("profile");
      return encryptedData ? decryptData(encryptedData) : null;
    })();

    if (userData) {
      userData.groupname = newGroupName;
      userData.group_id = newGroupId;
      const encryptedProfile = encryptData(userData);
      if (encryptedProfile) {
        localStorage.setItem("profile", encryptedProfile);
      } 
      setFeaturename([]); 
      setTimeout(() => {
        const updatedFeatures = userData.features.filter((feature) => feature.group_id === newGroupId);
        setFeaturename(updatedFeatures);
      }, 0);
      dispatch(
        canvashframedataformodification({
          customer_id: user.customer_id,
          group_id: newGroupId,
          database_type: user.database_type,
        })
      );
      setSelectedUserGroup(newGroupId);
      setHighlightedIndex(index)
    } else {
      console.log('No user data found in localStorage');
    }
  };

  const handleTooltip = (e, content) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipContent(content);
    setTooltipPosition({ top: rect.top + window.scrollY });
    setTooltipVisible(true);
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
  };

  const {nav_icon } = useSelector(
    (state) => state.logowhitelisting?.images || {}
  );

  return (
    <div id="sidebarContainerId" className={`sidebarcnt ${isOpen ? "open" : "closed"}`}>
      <div className="listofall-feature">
        <div className="sidebar-content">
          {isOpen ? (
            <div className='New_SideBar_item'>
              {nav_icon ? (
                <img src={nav_icon} alt="Logo" className="nav-icon-logo" />
              ) : (
                <img src={Logo} alt="Logo" className="navbar-logo" />
              )}
            </div>
          ) : (
            <div className='New_SideBar_item' style={{ height: "64px", transition: "width 0.3s ease" }}>
            {nav_icon ? (
                <img src={nav_icon} alt="Logo" className="nav-icon-logo" />
              ) : (
                <img src={Logo} alt="Logo" className="navbar-logo" />
              )}
            </div>
          )}
          <hr className='line_drow'></hr>
          {(user.user_email_id === "superadmin@erasmith.com") ?
            <div id="dashboard" className="New_SideBar_item">
              <CustomDropdownNew
                firstSideBarDivItemHeight={firstSideBarDivItemHeight}
                sideBarWidth={sideBarWidth}
                isSidebarCollapsed={!isOpen}
                options={dropdownOptions}
                selectedOption={selectedUserGroup}
                onOptionSelect={handleUserGroupChange}
              />
            </div> : (
              <div
                className="New_SideBar_item"
                onMouseEnter={(e) => handleTooltip(e, "Dashboard")}
                onMouseLeave={hideTooltip}
              >
                <img
                  src="/featureIcon/1_Dashboardimg.png"
                  className="dashboard_sidebar_icons"
                />
              </div>
            )
          }
          {(featurename != 'undefined') && featurename?.map((feature, index) => (
            <div
              key={feature.group_id}
              onClick={() => handleClickFeature(feature.featurename)}
              className="New_SideBar_item"
              onMouseEnter={(e) => handleTooltip(e, feature.featurename)}
              onMouseLeave={hideTooltip}
            >
              {isOpen ? (
                <span className="dashboard_sidebar_icons_fixed">
                  <img
                    className="dashboard_sidebar_icons"
                    src={feature.feature_logo}
                    title={feature.featurename}
                    alt="userManagementLogo"
                  />
                  <span>{feature.featurename}</span>
                </span>
              ) : (
                <img
                  className="dashboard_sidebar_icons"
                  src={feature.feature_logo}
                  // title={feature.featurename}
                  alt={feature.featurename}
                />
              )}
            </div>
          ))}
        </div>
        <div className="user-profile-section">
          <div
            className="New_SideBar_item only-for-user-profile"
            onMouseEnter={(e) => handleTooltip(e, "User Profile")}
            onMouseLeave={hideTooltip}
          >
            <Dropdown>
              <MenuButton
                sx={{
                  cursor: "pointer", display: "flex", alignItems: "center", border: "none",
                  marginLeft: "0",
                  paddingLeft: "0",
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                  '&:focus': {
                    backgroundColor: 'transparent',
                  },
                }}
              ><img src="/featureIcon/1_logout.png" className="profile_logo" alt="Logout Icon" style={{ cursor: 'pointer' }} /></MenuButton>
              <Menu sx={{ minWidth: 120, border: 'none', '--ListItemDecorator-size': '24px' }}>
                <MenuItem onClick={handelClicklogout}>
                  <ListItemDecorator sx={{ marginRight: '5px' }}>
                    <PersonIcon />
                  </ListItemDecorator>
                  {user.user_email_id}
                </MenuItem>
                <ListDivider />
                {user.features
                  ?.filter((item, index, self) =>
                    index === self.findIndex((t) => t.group_id === item.group_id)
                  ).length > 1 && (<div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 8px',
                      margin: '4px 0',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupDropdown(e);
                    }}>
                    <ListItemDecorator sx={{ marginRight: '5px' }}>
                      <SwitchAccessShortcutIcon />
                    </ListItemDecorator>
                    <span style={{ marginLeft: "10px" }}>Switch Group</span>
                    <ListItemDecorator sx={{ marginRight: '5px' }}>
                      <ArrowDropDown />
                    </ListItemDecorator>
                  </div>)}
                {showGroupDropdown && (
                  <ListItem nested>
                    <List aria-label="Group names">
                      {user.features
                        ?.filter((item, index, self) =>
                          index === self.findIndex((t) => t.group_id === item.group_id)
                        )
                        .map((item, index) => (
                          <MenuItem
                            key={item.group_id}
                            onClick={() => { handelGroupSwitch(item.groupname, item.group_id, index) }}
                          // className={`dropdown-item ${highlightedIndex === index ? "highlightedGroupOption" : ""
                          //   } ${selectedUserGroup === item.group_id ? "selectedGroupOption" : ""
                          //   }`}
                          >
                            <ListItemDecorator sx={{ marginLeft: '15px' }}>
                              {<img src={getRandomIcon()} className="sidebar-dropdown-icon" />}
                            </ListItemDecorator>
                            <span style={{ marginLeft: "15px" }}>{item.groupname}</span>
                            {selectedUserGroup === item.group_id && (
                              <CheckIcon />
                            )}
                          </MenuItem>
                        ))}
                    </List>
                  </ListItem>

                )}
                {user.features
                  ?.filter((item, index, self) =>
                    index === self.findIndex((t) => t.group_id === item.group_id)
                  ).length > 1 && (<ListDivider />)}
                <MenuItem onClick={() => { localStorage.clear(); history("/"); }}>
                  <ListItemDecorator sx={{ marginRight: '5px' }}>
                    <LogoutIcon />
                  </ListItemDecorator>
                  Logout
                </MenuItem>
              </Menu>
            </Dropdown>
          </div>
        </div>
      </div>
      {tooltipVisible && (
        <div
          className="custom-tooltip-feature"
          style={{
            top: `${tooltipPosition.top}px`,
            opacity: tooltipVisible ? 1 : 0,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default NewSidebar;
