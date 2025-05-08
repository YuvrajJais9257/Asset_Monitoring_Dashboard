import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { useDispatch, useSelector } from "react-redux";
import { schemametaData } from "../../actions/auth";
import "./../globalCSS/querytype/querybuildernew.css";
import { Link } from "react-router-dom";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { decryptData } from "../utils/EncriptionStore";

export default function BuildQueryNew() {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  useEffect(() => {
    const user = (() => {
      const encryptedData = localStorage.getItem("profile");
      return encryptedData ? decryptData(encryptedData) : null;
    })();
    const shemaDetail = JSON.parse(localStorage.getItem("SelectedSchema"));
    dispatch(
      schemametaData({
        schema_name: shemaDetail?.selectedSchema,
        email: user?.user_email_id,
        database_type: user?.database_type,
      })
    );
  }, []);
  const apiData = useSelector((state) => state?.auth);
  const tableData = apiData?.SchemaMetadata;
  var tableMap = new Map();

  tableData?.map((column) => {
    const tableName = column?.TABLE_NAME;

    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, { name: tableName, columns: [] });
    }
    tableMap.get(tableName).columns.push(column.COLUMN_NAME);
  });

  var transformedData = Array.from(tableMap.values());
  const sqlFunctions = ["COUNT", "SUM", "AVG", "MIN", "MAX"];
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTables, setSelectedTables] = useState([]);
  const [Addingcolumn, setAddingcolumn] = useState([]);
  const [whereConditions, setWhereConditions] = useState([]);
  const [joinConditions, setJoinConditions] = useState([]);
  const [activeButton, setActiveButton] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedColumns1, setSelectedColumns1] = useState([]);
  const [selectedColumns2, setSelectedColumns2] = useState([]);
  const [selectedOperators, setSelectedOperators] = useState([]);
  const [inputValues, setInputValues] = useState({
    inputtext: [],
    inputdate: [],
  });
  const [logicalOperators, setLogicalOperators] = useState([]);
  const [joinClause, setJoinClause] = useState([]);
  const [groupByColumns, setGroupByColumns] = useState([]);
  const [selectColumn, setselectColumn] = useState([]);
  const [query, setquery] = useState("");
  const [orderByColumnDirection, setOrderByColumnDirection] = useState([]);
  const [sqlFunctionsByColumn, setSqlFunctionsByColumn] = useState([]);
  const [commonColumns, setCommonColumns] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  const [tableSearchTerms, setTableSearchTerms] = useState({});
  let results;
  if (search) {
    results =
      transformedData &&
      transformedData.columns?.filter((item) => {
        let found = false;
        Object.entries(item).map(([key, value]) => {
          if (String(value).toLowerCase().includes(search.toLowerCase())) {
            found = true;
          }
        });
        return found;
      });
  }

  // useEffect(()=>{
  //   if(joinConditions && joinConditions.length>0){
  //         alert("Please add at least one join condition.")
  //   } },[query])

  const filteredTables = transformedData?.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTableSearch = (tableName, searchTerm) => {
    setTableSearchTerms((prevState) => ({
      ...prevState,
      [tableName]: searchTerm,
    }));
  };

  const handleTableSelection = (table) => {
    setSelectedTables((prevSelectedTables) => {
      const isTableSelected = prevSelectedTables.some(
        (item) => item.name === table.name
      );

      if (isTableSelected) {
        // Deselecting the table
        // Remove columns related to the table
        setselectColumn((prevSelectColumn) =>
          prevSelectColumn.filter((col) => !col.startsWith(`${table.name}.`))
        );
        return prevSelectedTables.filter((item) => item.name !== table.name);
      }
      // Selecting the table
      return [...prevSelectedTables, table];
    });
  };

  const addTable = (table) => {
    setSelectedTables((prevSelectedTables) => {
      const isTableSelected = prevSelectedTables?.find(
        (item) => item?.name === table?.name
      );
      if (isTableSelected) {
        const updatedSelectedTables = prevSelectedTables.filter(
          (selectedTable) => selectedTable.name !== table.name
        );
        const removedColumns = table.columns.map(
          (column) => `${table.name}.${column}`
        );
        setAddingcolumn((prevAddingColumn) =>
          prevAddingColumn.filter((column) => !removedColumns.includes(column))
        );
        return updatedSelectedTables;
      } else {
        const updatedSelectedTables = [...prevSelectedTables, table];
        const addedColumns = table.columns.map(
          (column) => `${table.name}.${column}`
        );
        setAddingcolumn((prevAddingColumn) => [
          ...prevAddingColumn,
          ...addedColumns,
        ]);
        return updatedSelectedTables;
      }
    });
  };

  const handleColumnSelection = (tableName, column) => {
    setselectColumn((prevSelectColumn) => {
      const columnIdentifier = `${tableName}.${column}`;
      if (prevSelectColumn.includes(columnIdentifier)) {
        return prevSelectColumn.filter((col) => col !== columnIdentifier);
      }
      return [...prevSelectColumn, columnIdentifier];
    });

    if (groupByColumns?.length > 0) {
      const columnIdentifier = `${tableName}.${column}`;
      setGroupByColumns((previewdata) => {
        if (previewdata !== "undefined") {
          if (previewdata?.length > 0) {
            return previewdata?.filter((col) => col !== columnIdentifier);
          }
        }
        return [...column, columnIdentifier];
      });
    }

    if (orderByColumnDirection?.length > 0) {
      const columnIdentifier = `${tableName}.${column}`;
      setOrderByColumnDirection((previewdata) => {
        if (previewdata !== "undefined") {
          if (previewdata?.length > 0) {
            return previewdata?.filter(
              (col) => col.column !== columnIdentifier
            );
          }
        }
        return [...column, columnIdentifier];
      });
    }

    if (sqlFunctionsByColumn?.length > 0) {
      const columnIdentifier = `${tableName}.${column}`;
      setSqlFunctionsByColumn((previewdata) => {
        if (previewdata !== "undefined") {
          if (previewdata?.length > 0) {
            return previewdata?.filter(
              (col) => col.column !== columnIdentifier
            );
          }
        }
        return [...column, columnIdentifier];
      });
    }
  };

  const addWhereContainer = () => {
    const newCondition = { id: whereConditions.length + 1 };
    setWhereConditions([...whereConditions, newCondition]);
  };

  const removeWhereCondition = (index) => {
    // Copy the current inputValues
    const newInputValues = {
      inputtext: [...inputValues.inputtext],
      inputdate: [...inputValues.inputdate],
    };

    // Remove the element at the specified index for both inputtext and inputdate
    if (newInputValues.inputtext[index] !== undefined) {
      newInputValues.inputtext.splice(index, 1);
    }
    if (newInputValues.inputdate[index] !== undefined) {
      newInputValues.inputdate.splice(index, 1);
    }

    // Update inputValues state
    setInputValues(newInputValues);

    // Copy and update the selectedColumns
    const newSelectedColumns = [...selectedColumns];
    newSelectedColumns.splice(index, 1);
    setSelectedColumns(newSelectedColumns);

    // Copy and update the selectedOperators
    const newSelectedOperators = [...selectedOperators];
    newSelectedOperators.splice(index, 1);
    setSelectedOperators(newSelectedOperators);

    // Copy and update the logicalOperators
    const newLogicalOperators = [...logicalOperators];
    newLogicalOperators.splice(index, 1);
    setLogicalOperators(newLogicalOperators);

    // Copy and update the whereConditions
    const newWhereConditions = [...whereConditions];
    newWhereConditions.splice(index, 1);
    setWhereConditions(newWhereConditions);
  };

  const addJoinContainer = () => {
    const newCondition1 = { id: joinConditions.length + 1 };
    setJoinConditions([...joinConditions, newCondition1]);
  };

  const removeJoinCondition = (index) => {
    setJoinConditions(joinConditions.filter((_, i) => i !== index));
    if (index > -1) {
      selectedColumns1.splice(index, 1);
      selectedColumns2.splice(index, 1);
      joinClause.splice(index, 1);
      setSelectedColumns1([...selectedColumns1]);
      setSelectedColumns2([...selectedColumns2]);
      setJoinClause([...joinClause]);
    }
  };

  const handleColumnChange = (newColumn, index) => {
    const columnMeta = tableData.find((col) => col.COLUMN_NAME === newColumn);

    // Create a copy of the current input values
    const newInputValues = { ...inputValues };

    // Clear input values for the changed column
    if (columnMeta?.COLUMN_TYPE?.includes("datetime")) {
      // Reset to an empty object for datetime values
      newInputValues.inputdate[index] = { startDate: "", endDate: "" };
      newInputValues.inputtext[index] = ""; // Clear input text as it's no longer relevant
    } else {
      // Reset to an empty string for text inputs
      newInputValues.inputtext[index] = "";
      newInputValues.inputdate[index] = { startDate: "", endDate: "" }; // Clear inputdate as it's no longer relevant
    }

    // Update input values state
    setInputValues(newInputValues);

    // Update selected columns
    const newSelectedColumns = [...selectedColumns];
    newSelectedColumns[index] = newColumn;
    setSelectedColumns(newSelectedColumns);
  };

  const handleColumnChange1 = (e, index) => {
    const newSelectedColumns1 = [...selectedColumns1];
    newSelectedColumns1[index] = e.target.value;
    setSelectedColumns1(newSelectedColumns1);
  };

  const handleColumnChange2 = (e, index) => {
    const newSelectedColumns2 = [...selectedColumns2];
    newSelectedColumns2[index] = e.target.value;
    setSelectedColumns2(newSelectedColumns2);
  };

  const handleOperatorChange = (e, index) => {
    const newSelectedOperators = [...selectedOperators];
    newSelectedOperators[index] = e.target.value;
    setSelectedOperators(newSelectedOperators);
  };

  // Handle text input changes
  const handleInputChange = (e, index) => {
    const value = e.target.value;
    const newInputValues = { ...inputValues };

    // Update inputtext at the specified index
    newInputValues.inputtext[index] = value;

    setInputValues(newInputValues);
  };

  const handleLogicalOperatorChange = (e, index) => {
    const newLogicalOperators = [...logicalOperators];
    newLogicalOperators[index] = e.target.value;
    setLogicalOperators(newLogicalOperators);
  };

  const handleJoinClauseChange = (e, index) => {
    const newJoinClause = [...joinClause];
    newJoinClause[index] = e.target.value;
    setJoinClause(newJoinClause);
  };

  const addWhereCondition = (column) => {
    setselectColumn((prevSelectColumn) => {
      if (prevSelectColumn.includes(column)) {
        return prevSelectColumn.filter(
          (selectedColumn) => selectedColumn !== column
        );
      } else {
        return [...prevSelectColumn, column];
      }
    });
  };

  const handleButtonClick = (button) => {
    setActiveButton(activeButton === button ? "" : button);
  };

  const getColumnsFromWhereConditions = () => {
    return selectColumn.map((condition) => condition);
  };

  const handleGroupByColumnChange = (column) => {
    setGroupByColumns((prevState) => {
      if (prevState.includes(column)) {
        return prevState.filter((c) => c !== column);
      } else {
        return [...prevState, column];
      }
    });
  };

  const handleOrderByColumnChange = (column) => {
    setOrderByColumnDirection((prevSelections) => {
      // Check if the column is already selected
      const isSelected = prevSelections.some((item) => item.column === column);
      if (isSelected) {
        // If selected, remove it from the list
        return prevSelections.filter((item) => item.column !== column);
      } else {
        // If not selected, add it with undefined order
        return [...prevSelections, { column, order: undefined }];
      }
    });
  };

  const handleOrderByDirectionChange = (column, order) => {
    setOrderByColumnDirection((prevSelections) => {
      // Find if the column is already selected
      const existingColumn = prevSelections.find(
        (item) => item.column === column
      );
      if (existingColumn) {
        // Update the order if the column is already in the list
        existingColumn.order = order === "DESC" ? "DESC" : "ASC";
        return [...prevSelections];
      } else {
        // Add the column with order if it is not in the list
        return [...prevSelections, { column, order }];
      }
    });
  };


  // Handle date-time changes
  const handleDateTimeChange = (formattedDate, index, isStart = true) => {
    // Copy inputValues
    const newInputValues = { ...inputValues };

    // Ensure `inputdate` has an object at the specified index
    if (!newInputValues.inputdate[index]) {
      newInputValues.inputdate[index] = { startDate: "", endDate: "" };
    }

    // Update start or end date
    if (isStart) {
      newInputValues.inputdate[index].startDate = formattedDate;
    } else {
      newInputValues.inputdate[index].endDate = formattedDate;
    }

    setInputValues(newInputValues);
  };

  const handleGroupByColumnChangeforSQLFunction = (column) => {
    const isSelected = sqlFunctionsByColumn.find(
      (item) => item.column === column
    );
    if (isSelected) {
      setSqlFunctionsByColumn((prevSelections) =>
        prevSelections.filter((item) => item.column !== column)
      );
    } else {
      setSqlFunctionsByColumn((prevSelections) => [
        ...prevSelections,
        { column, func: undefined },
      ]);
    }
  };

  const handleSqlFunctionChange = (index, func) => {
    setSqlFunctionsByColumn((prevSelections) => {
      const updatedSelections = [...prevSelections];

      // Ensure the index is within bounds and initialize if necessary
      if (!updatedSelections[index]) {
        updatedSelections[index] = {};
      }

      updatedSelections[index].func = func;
      return updatedSelections;
    });
  };

  const findCommonColumns = (table1, table2) => {
    const columnsTable1 = transformedData.filter(
      (table) => table.name == table1
    );
    const columnsTable2 = transformedData.filter(
      (table) => table.name == table2
    );
    // get table1 and table2 all column array in columns variable
    return columnsTable1[0].columns.filter((column) =>
      columnsTable2[0].columns.includes(column)
    );
  };

  const buildWhereClause = (whereClause) => {
    var whereClauseString = "";
    var hasCondition = false;

    whereClause.map((item, index) => {
      if (typeof item === "object") {
        if (hasCondition) {
          whereClauseString += " AND ";
        }
        whereClauseString +=
          item.column + " " + item.operator + " '" + item.value + "'";
        hasCondition = true;
      } else if (item === "OR" || item === "AND") {
        if (index < whereClause.length - 1) {
          // Check if there's a next item
          whereClauseString += " " + item + " ";
          hasCondition = false;
        }
      } else if (item === "JOIN") {
        const table1 = whereClause[0].column.split(".")[0];
        const table2 = whereClause[3].column.split(".")[0];
        const common = findCommonColumns(table1, table2);
        setCommonColumns(common);
      }
    });
    return whereClauseString;
  };

  // Group columns by their table names
  const groupedColumns = Addingcolumn.reduce((acc, column) => {
    const [tableName, columnName] = column.split(".");
    if (!acc[tableName]) {
      acc[tableName] = [];
    }
    acc[tableName].push(columnName);
    return acc;
  }, {});

  const handleGenerateQuery = () => {
    
    try {
      setquery("");
      let selectedColumnstostirefun = [];
      let query = "SELECT ";
      let sqlFunctions = [];

      // Iterate over selectColumn and add each column to selectedColumnstostirefun
      selectColumn.forEach((calitem) => {
        selectedColumnstostirefun.push(calitem);
      });

      // Check if sqlFunctionsByColumn has any items
      if (sqlFunctionsByColumn.length > 0) {
        // Iterate over sqlFunctionsByColumn and construct SQL function strings
        sqlFunctionsByColumn.forEach((item) => {
          if (
            item &&
            item.column &&
            item.func &&
            item.func !== "Select SQL Function"
          ) {
            sqlFunctions.push(`${item.func}(${item.column})`);
          }
        });
      }
      if (sqlFunctions.length > 0) {
        if (groupByColumns.length > 0) {
          selectedColumnstostirefun = selectedColumnstostirefun.filter((item) =>
            groupByColumns.includes(item)
          );
        }
        selectedColumnstostirefun =
          selectedColumnstostirefun.concat(sqlFunctions);
        query += selectedColumnstostirefun.join(", ") + " ";
      } else {
        query += selectColumn.length > 0 ? selectColumn.join(", ") : "* ";
      }
      if (
        joinConditions.length >= 1 &&
        selectedColumns1.length === 0 &&
        selectedColumns2.length === 0
      ) {
        alert(
          "Please fill out all required fields in join condition or remove it."
        );
      }

      // Construct the FROM part of the query
      if (joinConditions.length > 0) {
        query += " FROM " + selectedColumns1[0].split(".")[0];
      } else {
        query += " FROM " + selectedTables.map((tab) => tab.name).join(", ");
      }
      
      // Handle JOIN conditions
      if (joinConditions.length > 0) {
        let incompleteConditionFound = false; // Track if there's an incomplete condition
        let allConditionsEmpty = true; // Track if all fields in all conditions are empty

        joinConditions.forEach((_, index) => {
          const dropdown4 = selectedColumns1[index]; // Column 1
          const dropdown5 = selectedColumns2[index]; // Column 2
          const dropdown6 = joinClause[index]; // Join type

          // Check if all fields are empty
          if (!dropdown4 && !dropdown5 && !dropdown6) {
            allConditionsEmpty = true; // All fields are empty
          } else {
            allConditionsEmpty = false; // At least one field is filled
          }

          // Check if the condition is incomplete
          if (!dropdown4 || !dropdown5 || !dropdown6) {
            incompleteConditionFound = true; // At least one field is missing in this condition
          }
        });

        // Show alert if all fields are empty for all join conditions
        if (allConditionsEmpty) {
          alert(
            "Please add at least one join condition or remove incomplete conditions."
          );
        }
        // Show alert if any condition is incomplete
        else if (incompleteConditionFound) {
          alert(
            "Please fill out all required fields in join condition or remove it."
          );
        } else {
          // If all conditions are valid, construct the join string
          joinConditions.forEach((condition, index) => {
            const conditionString = `${joinClause[index]} ${
              selectedColumns2[index].split(".")[0]
            } ON ${selectedColumns1[index]} = ${selectedColumns2[index]} `;
            query += ` ${conditionString}`;
          });
        }
      }

      

      // Handle WHERE conditions
      if (whereConditions.length > 0) {
        let whereClause = [];

        whereConditions.forEach((_, index) => {
          const column = selectedColumns[index];
          const operator = selectedOperators[index];
          const logicalOperator = logicalOperators[index];

          // Retrieve the column metadata to identify the type
          const columnMeta = tableData.find(
            (col) => col.COLUMN_NAME === column?.split(".")[1]
          );
          const columnType = columnMeta?.COLUMN_TYPE || "";

          // Check if column, operator, and input values are defined
          if (column && operator) {
            if (columnType.includes("datetime")) {
              // Handle BETWEEN operator for datetime fields
              if (operator.toUpperCase() === "BETWEEN") {
                const startDate = inputValues.inputdate[index]?.startDate;
                const endDate = inputValues.inputdate[index]?.endDate;

                if (startDate && endDate) {
                  whereClause.push(
                    `${column} BETWEEN '${startDate}' AND '${endDate}'`
                  );
                }
              } else {
                // Handle other operators for datetime fields
                const formattedDate = inputValues.inputdate[index]?.startDate;
                if (formattedDate) {
                  whereClause.push(`${column} ${operator} '${formattedDate}'`);
                }
              }
            } else {
              // Handle non-datetime fields
              const inputValue = inputValues.inputtext[index];
              if (inputValue) {
                whereClause.push(`${column} ${operator} '${inputValue}'`);
              }
            }

            // Add logical operator (AND/OR) if present and it's not the last condition
            if (logicalOperator && index < whereConditions.length - 1) {
              whereClause.push(logicalOperator);
            }
          }
        });

        if (whereClause.length > 0) {
          query += " WHERE " + whereClause.join(" ");
        }
      }

      // Handle GROUP BY clause
      if (groupByColumns.length > 0) {
        query += " GROUP BY " + groupByColumns.join(", ");
      }

      // Handle ORDER BY clause
      if (orderByColumnDirection.length > 0) {
        const orderByClauses = orderByColumnDirection
          .filter((item) => item && item.column && item.order) // Ensure both column and order are selected
          .map((item) => `${item.column} ${item.order}`);
        if (orderByClauses.length > 0) {
          query += " ORDER BY " + orderByClauses.join(", ");
        }
      }

      setquery(query);
    } catch (error) {
      setquery(""); // Clear query on error
    }
  };

  return (
    <div>
      <div className="QueryBuilder_Container">
        <div className="side-nav">
          <Header />
        </div>
        <div className="mainConatiner">
          <div className="BuildQuery_left">
            <div className="pannel_header">
              <h4>Search Table</h4>
            </div>
            <div className="table_search">
              <input
                className="search"
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="tables-of-list">
              {filteredTables?.map((table) => {
                return (
                  <div key={table.name} className="table_item">
                    <input
                      type="checkbox"
                      checked={
                        !!selectedTables?.find(
                          (item) => item?.name === table?.name
                        )
                      }
                      onClick={() => addTable(table)}
                    ></input>
                    <span>{table.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="BuildQuery_right">
            <div className="cardConatiner">
              <div className="cardWrapper">
                {selectedTables.map((table) => (
                  <div className="QueryBuilder_card" key={table.name}>
                    <div className="card-header">{table.name}</div>
                    <input
                      className="search"
                      type="text"
                      placeholder="Search columns..."
                      value={tableSearchTerms[table.name] || ""}
                      onChange={(e) =>
                        handleTableSearch(table.name, e.target.value)
                      }
                    />
                    {table.columns
                      .filter((column) => {
                        const searchTerm = tableSearchTerms[table.name] || "";
                        return column
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase());
                      })
                      .map((column) => (
                        <div key={column} className="column-item">
                          <input
                            className="column-checkbox"
                            type="checkbox"
                            checked={selectColumn.includes(
                              `${table.name}.${column}`
                            )}
                            onChange={() =>
                              handleColumnSelection(table.name, column)
                            }
                          />
                          <span>{`${column}`}</span>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="where_conditanal_container"
              style={{ display: "flex" }}
            >
              <div className="where_header">
                <h2>Where Conditions</h2>
                <button
                  className="add_condition_btn"
                  type="button"
                  onClick={addWhereContainer}
                >
                  +
                </button>
              </div>
              {whereConditions.map((condition, index) => (
                <div key={condition.id} className="where_conatiner">
                  <div className="roww">
                    <select
                      value={selectedColumns[index]}
                      onChange={(e) =>
                        handleColumnChange(e.target.value, index)
                      }
                      className="where-select"
                    >
                      <option
                        value=""
                        disabled
                        selected
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#ecf0f2",
                          color: "#000",
                        }}
                      >
                        Column
                      </option>
                      {Object.entries(groupedColumns).map(
                        ([tableName, columns]) => (
                          <React.Fragment key={tableName}>
                            <option
                              value=""
                              disabled
                              className="disabled-table-name"
                              style={{
                                fontWeight: "bold",
                                backgroundColor: "#f0f0f0",
                              }}
                            >
                              {tableName}
                            </option>
                            {/* Render the columns of the table */}
                            {columns.map((columnName) => (
                              <option
                                key={`${tableName}.${columnName}`}
                                value={`${tableName}.${columnName}`}
                              >
                                {columnName}
                              </option>
                            ))}
                          </React.Fragment>
                        )
                      )}
                    </select>
                    <select
                      value={selectedOperators[index]}
                      onChange={(e) => handleOperatorChange(e, index)}
                      className="where-select"
                    >
                      <option
                        value=""
                        selected
                        disabled
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#f0f0f0",
                        }}
                      >
                        Operator
                      </option>
                      {tableData
                        .find(
                          (column) =>
                            column.COLUMN_NAME ===
                            selectedColumns[index]?.split(".")[1]
                        )
                        ?.COLUMN_TYPE?.startsWith("datetime") ? (
                        <>
                          <option value="=">{"equals"}</option>
                          <option value="!=">{"does not equal"}</option>
                          <option value="<">{"before"}</option>
                          <option value=">">{"after"}</option>
                          <option value="BETWEEN">{"between"}</option>
                        </>
                      ) : (
                        <>
                          <option value="=">{"equal to"}</option>
                          <option value="!=">{"not equal to"}</option>
                          <option value="<">{"smaller than"}</option>
                          <option value=">">{"greater than"}</option>
                          <option value=">=">{"greater than equal to"}</option>
                          <option value="<=">{"smaller than equal to"}</option>
                        </>
                      )}
                    </select>
                    {tableData
                      .find(
                        (column) =>
                          column.COLUMN_NAME ===
                          selectedColumns[index]?.split(".")[1]
                      )
                      ?.COLUMN_TYPE?.startsWith("datetime") ? (
                      selectedOperators[index] === "BETWEEN" ? (
                        <div className="date-time-pickers">
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                              className="dateField"
                              value={
                                inputValues.inputdate[index]?.startDate
                                  ? dayjs(
                                      inputValues.inputdate[index].startDate
                                    )
                                  : null
                              }
                              onChange={(date) => {
                                const formattedDate = dayjs(date).format(
                                  "YYYY-MM-DD HH:mm:ss"
                                );
                                handleDateTimeChange(
                                  formattedDate,
                                  index,
                                  true
                                );
                              }}
                            />
                            <DateTimePicker
                              className="dateField"
                              value={
                                inputValues.inputdate[index]?.endDate
                                  ? dayjs(inputValues.inputdate[index].endDate)
                                  : null
                              }
                              onChange={(date) => {
                                const formattedDate = dayjs(date).format(
                                  "YYYY-MM-DD HH:mm:ss"
                                );
                                handleDateTimeChange(
                                  formattedDate,
                                  index,
                                  false
                                );
                              }}
                            />
                          </LocalizationProvider>
                        </div>
                      ) : (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DateTimePicker
                            className="dateField"
                            value={
                              inputValues.inputdate[index]?.startDate
                                ? dayjs(inputValues.inputdate[index].startDate)
                                : null
                            }
                            onChange={(date) => {
                              const formattedDate = dayjs(date).format(
                                "YYYY-MM-DD HH:mm:ss"
                              );
                              handleDateTimeChange(formattedDate, index, true);
                            }}
                          />
                        </LocalizationProvider>
                      )
                    ) : (
                      <input
                        placeholder="Value"
                        type="text"
                        value={inputValues.inputtext[index] || ""} // Persist text value
                        onChange={(e) => handleInputChange(e, index)}
                        className="where-value-input"
                      />
                    )}

                    <select
                      value={logicalOperators[index]}
                      onChange={(e) => handleLogicalOperatorChange(e, index)}
                      className="where-select"
                    >
                      <option
                        value=""
                        selected
                        disabled
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#f0f0f0",
                        }}
                      >
                        Select Logical Operator
                      </option>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>

                    <button
                      className="where-remove-button"
                      onClick={() => removeWhereCondition(index)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="where_conditanal_container"
              style={{ display: "flex" }}
            >
              <div className="where_header">
                <h2>Join Conditions</h2>
                <button
                  className="add_condition_btn"
                  type="button"
                  onClick={addJoinContainer}
                >
                  +
                </button>
              </div>
              {joinConditions.map((condition, index) => (
                <div key={condition.id} className="where_conatiner">
                  <div className="roww">
                    <select
                      value={selectedColumns1[index]}
                      onChange={(e) => handleColumnChange1(e, index)}
                      className="where-select"
                    >
                      <option
                        value=""
                        disabled
                        selected
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#ecf0f2",
                          color: "#000",
                        }}
                      >
                        Column 1
                      </option>
                      {Object.entries(groupedColumns).map(
                        ([tableName, columns]) => (
                          <React.Fragment key={tableName}>
                            <option
                              value=""
                              disabled
                              className="disabled-table-name"
                              style={{
                                fontWeight: "bold",
                                backgroundColor: "#f0f0f0",
                              }}
                            >
                              {tableName}
                            </option>
                            {columns.map((columnName) => (
                              <option
                                key={`${tableName}.${columnName}`}
                                value={`${tableName}.${columnName}`}
                              >
                                {columnName}
                              </option>
                            ))}
                          </React.Fragment>
                        )
                      )}
                    </select>

                    <select
                      value={selectedColumns2[index]}
                      onChange={(e) => handleColumnChange2(e, index)}
                      className="where-select"
                    >
                      <option
                        value=""
                        disabled
                        selected
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#ecf0f2",
                          color: "#000",
                        }}
                      >
                        Column 2
                      </option>
                      {Object.entries(groupedColumns).map(
                        ([tableName, columns]) => (
                          <React.Fragment key={tableName}>
                            <option
                              value=""
                              disabled
                              className="disabled-table-name"
                              style={{
                                fontWeight: "bold",
                                backgroundColor: "#f0f0f0",
                              }}
                            >
                              {tableName}
                            </option>
                            {columns.map((columnName) => (
                              <option
                                key={`${tableName}.${columnName}`}
                                value={`${tableName}.${columnName}`}
                              >
                                {columnName}
                              </option>
                            ))}
                          </React.Fragment>
                        )
                      )}
                    </select>
                    <select
                      value={joinClause[index]}
                      onChange={(e) => handleJoinClauseChange(e, index)}
                      className="where-select"
                    >
                      <option
                        value=""
                        selected
                        disabled
                        style={{
                          fontWeight: "bold",
                          backgroundColor: "#f0f0f0",
                        }}
                      >
                        Select Join
                      </option>
                      <option value="INNER JOIN">INNER JOIN</option>
                      <option value="LEFT JOIN">LEFT JOIN</option>
                      <option value="RIGHT JOIN">RIGHT JOIN</option>
                      <option value="FULL JOIN">FULL JOIN</option>
                    </select>
                    <button
                      className="where-remove-button"
                      onClick={() => removeJoinCondition(index)}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="query_builder_contaier"
              style={{ display: "block" }}
            >
              <div className="query_builder_header">
                <button
                  onClick={() => handleButtonClick("Group By")}
                  className={`action-button ${
                    activeButton === "Group By" ? "active" : ""
                  } butt`}
                >
                  Group By
                </button>
                <button
                  onClick={() => handleButtonClick("Order By")}
                  className={`action-button ${
                    activeButton === "Order By" ? "active" : ""
                  } butt`}
                >
                  Order By
                </button>
                <button
                  onClick={() => handleButtonClick("SQL Functions")}
                  className={`action-button ${
                    activeButton === "SQL Functions" ? "active" : ""
                  } butt`}
                >
                  SQL Functions
                </button>
              </div>
              <div className="query_builder_content">
                <div className="section_of_container">
                  <div className="section_ontent" placeholder="Piyush">
                    {activeButton === "Group By" && (
                      <div className="group-by-section">
                        {getColumnsFromWhereConditions().map(
                          (column, index) => (
                            <div key={index} className="divClass">
                              <input
                                type="checkbox"
                                checked={groupByColumns.includes(column)}
                                onChange={() => {
                                  handleGroupByColumnChange(column);
                                }}
                              />
                              <span className="spanClass">{column}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="section_ontent">
                    {getColumnsFromWhereConditions().map((column, index) => (
                      <div key={index} className="divClass">
                        <div className="inputColumns">
                          <input
                            type="checkbox"
                            checked={orderByColumnDirection.some(
                              (item) => item.column === column
                            )}
                            onChange={() => handleOrderByColumnChange(column)}
                          />
                          <span className="show">{column}</span>
                        </div>
                        <div className="inputOrders">
                          <FormControl
                            sx={{ m: 1, minWidth: 100 }}
                            size="small"
                          >
                            <InputLabel id="demo-select-small-label">
                              Order
                            </InputLabel>
                            <Select
                              labelId="demo-select-small-label"
                              id="demo-select-small"
                              label="Order"
                              className="topmargin"
                              value={
                                (
                                  orderByColumnDirection.find(
                                    (item) => item.column === column
                                  ) || {}
                                ).order || ""
                              }
                              onChange={(e) =>
                                handleOrderByDirectionChange(
                                  column,
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value="" disabled>
                                Select Order
                              </MenuItem>
                              <MenuItem value="ASC">ASC</MenuItem>
                              <MenuItem value="DESC">DESC</MenuItem>
                            </Select>
                          </FormControl>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="section_ontent">
                    {activeButton === "SQL Functions" && (
                      <div className="sql-functions-section">
                        {getColumnsFromWhereConditions().map(
                          (column, index) =>
                            !groupByColumns.includes(column) && (
                              <div key={index} className="divClass">
                                <input
                                  type="checkbox"
                                  checked={sqlFunctionsByColumn.find(
                                    (item) => item.column === column
                                  )}
                                  onChange={() =>
                                    handleGroupByColumnChangeforSQLFunction(
                                      column
                                    )
                                  }
                                />
                                <span className="spanClass">{column}</span>
                              </div>
                            )
                        )}
                        <select
                          onChange={(e) =>
                            handleSqlFunctionChange(
                              sqlFunctionsByColumn.length - 1,
                              e.target.value
                            )
                          }
                          multiple={true}
                          size="3"
                        >
                          <option value="" disabled>
                            Select SQL Function
                          </option>
                          {sqlFunctions.map((func, index) => (
                            <option
                              key={index}
                              value={func}
                              selected={
                                sqlFunctionsByColumn[
                                  sqlFunctionsByColumn.length - 1
                                ]?.func === func
                              } // Highlight the selected option
                            >
                              {func}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="query_generator_container">
              <div className="query_generator_header">
                <h2>Generated Query</h2>
              </div>
              <div className="query_generator_content">
                <div className="query_generator_outer">
                  <textarea
                    rols="5"
                    cols="50"
                    readOnly
                    value={query}
                  ></textarea>
                </div>
              </div>
              <div className="query_controls">
                <button
                  className="generatorQueryBtn"
                  onClick={handleGenerateQuery}
                >
                  {" "}
                  Generate Query{" "}
                </button>
                <Link
                  className="generatorQueryBtn2"
                  to={`/CustomQuery?Query=${query}`}
                >
                  Next{" "}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
