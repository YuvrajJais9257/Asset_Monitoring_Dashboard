import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { useNavigate } from "react-router-dom";
import { getDBdetails, assigndatasourcetogroup } from "../../actions/auth";
import { listofgroup } from "../../actions/newgroup";
import { useDispatch, useSelector } from "react-redux";
import "./../globalCSS/usermanagement/updategroup.css";
import Pagination from "../Pagination/Pagination";
import styles from "./../globalCSS/SearchTable/SearchTable.module.css";
import { Button } from "../globalCSS/Button/Button";
import ShowAlert from "../../actions/ShowAlert";
import { decryptData } from "../utils/EncriptionStore";

function DataSourceAccess() {
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const history = useNavigate();
  const apiData = useSelector((state) => state);

  useEffect(() => {
    dispatch(
      listofgroup({ email: user.user_email_id, database_type: user.database_type })
    );
    dispatch(
      getDBdetails({ customer_id: user.customer_id, database_type: user.database_type  })
    );
  }, []);

  const listofallgroup = apiData?.newgroup.list_of_group;
  const getSchema = apiData?.auth?.dbdetailsformap?.result;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handelclickgotoDashboard = () => {
    history("/Dashboard");
  };

  let PageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [checkboxes, setCheckboxes] = useState([]);

  useEffect(() => {
    if (getSchema) {
      const initialCheckboxes = getSchema?.map((user) => ({
        db_details_id: user?.db_details_id,
        group_id: user?.group_id,
      }));
      setCheckboxes(initialCheckboxes);
    }
  }, [getSchema]);

  const filteredData = useMemo(() => {
    if (!search) return getSchema;
    return getSchema?.filter((item) =>
      Object.values(item).some((value) =>
        String(value)
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [search, getSchema]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);

  const handelsave = async (e) => {
    try {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Are you sure want to save the details?",
        options: ["OK", "Cancel"],
      });
      if (userConfirmed === "OK") {
        const user_details = checkboxes.map((item) => ({
          db_details_id: item.db_details_id,
          group_id: item.group_id,
        }));

        dispatch(
          assigndatasourcetogroup(
            { customer_id: user.customer_id, user_details: user_details,database_type: user.database_type },
            history
          )
        );
      } else {
        console.log("User canceled the operation.");
      }
    } catch (error) {
      console.error("Error saving user details:", error);
    }
  };

  const handleCheckboxChange = (db_details_id, groupId) => {
    setCheckboxes((prev) => {
      const updatedCheckboxes = [...prev];
      const userIndex = updatedCheckboxes.findIndex(
        (item) => item.db_details_id === db_details_id
      );

      if (userIndex !== -1) {
        const userGroups = updatedCheckboxes[userIndex].group_id;
        if (userGroups.includes(groupId)) {
          updatedCheckboxes[userIndex].group_id = userGroups.filter(
            (id) => id !== groupId
          );
        } else {
          updatedCheckboxes[userIndex].group_id.push(groupId);
        }
      } else {
        updatedCheckboxes.push({
          db_details_id: db_details_id,
          group_id: [groupId],
        });
      }

      return updatedCheckboxes;
    });
  };

  const handleclickgotoUserManagement = () => {
    history("/UserManagementList");
  };

  return (
    <div>
      <div className={styles.side_nav}>
        <Header />
      </div>
      <div className={styles.Report_Assign_page}>
        <div className={styles.Page_Header}>
          <span
            className="fas fa-house-user"
            aria-hidden="true"
            onClick={handelclickgotoDashboard}
          ></span>
          <span>/</span>
          <span onClick={handleclickgotoUserManagement}>User Management</span>
          <span>/</span>
          <span>Assign Source to the Group</span>
        </div>

        <div className={styles.Save_Reset_button_search_container}>
          <div className={styles.Save_Reset_button_cnt}>
            <Button onClick={handelsave}>Save</Button>
          </div>
        </div>
        <div className={styles.UpdateGroup_table_sub_container}>
          <table className={styles.responsive_table} style={{ width: "100%" }}>
            <div>
              <thead className={styles.table_header}>
                <tr style={{ backgroundColor: "rgb(104, 168, 229)" }}>
                  <th
                    style={{
                      borderStartStartRadius: "1rem",
                      borderEndStartRadius: "1rem",
                      borderStartEndRadius: "0rem",
                      borderEndEndRadius: "0rem",
                    }}
                  >
                    <div className={styles.UpdateGroup_search}>
                      <span
                        className={`fa fa-search ${styles.form_control_feedback}`}
                      ></span>
                      <input
                        type="text"
                        className={styles.input_search}
                        placeholder="Search"
                        value={search}
                        maxLength={120}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Data rows */}
                {paginatedData &&
                  paginatedData.map((user, userIndex) => (
                    <tr key={userIndex}>
                      <td
                        style={{
                          borderStartEndRadius: "0rem",
                          borderEndEndRadius: "0rem",
                        }}
                      >
                        {user.db_schema_name}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </div>
            <div className={styles.group_check}>
              <thead className={styles.table_header}>
                <tr>
                  {listofallgroup
                    ?.filter((colname) => colname.groupname !== "SuperAdmin")
                    .map((colname, index) => (
                      <th
                        style={{
                          textAlign: "center",
                          borderStartStartRadius: "0rem",
                          borderEndStartRadius: "0rem",
                        }}
                        key={index}
                      >
                        {colname.groupname}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {/* Data rows */}
                {paginatedData &&
                  paginatedData.map((user, userIndex) => (
                    <tr key={userIndex}>
                      {listofallgroup &&
                        listofallgroup
                          ?.filter(
                            (colname) => colname.groupname !== "SuperAdmin"
                          )
                          .map((colname, colIndex) => (
                            <td
                              key={colIndex}
                              style={{
                                textAlign: "center",
                                borderStartStartRadius: "0rem",
                                borderEndStartRadius: "0rem",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checkboxes.some(
                                  (item) =>
                                    item.db_details_id === user.db_details_id &&
                                    item.group_id.includes(colname.group_id)
                                )}
                                onChange={() =>
                                  handleCheckboxChange(
                                    user.db_details_id,
                                    colname.group_id
                                  )
                                }
                                className={
                                  colname.group_id ? "checked" : "unchecked"
                                }
                                id={`customCheck_${userIndex}_${colIndex + 1}`}
                              />
                            </td>
                          ))}
                    </tr>
                  ))}
              </tbody>
            </div>
          </table>
        </div>
        <div>
          <Pagination
            className="pagination-bar"
            currentPage={currentPage}
            totalCount={filteredData ? filteredData.length : 1}
            pageSize={PageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
}

export default DataSourceAccess;
