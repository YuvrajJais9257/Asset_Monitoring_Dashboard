USE hyphenview_new_release_test;
DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateReportName`(
    IN old_report_name VARCHAR(255),
    IN new_report_name VARCHAR(255),
    IN old_report_type VARCHAR(255),
    IN new_report_type VARCHAR(255)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE report_id INT;
    DECLARE report_data JSON;
    DECLARE updated_report_data JSON;
    DECLARE cur CURSOR FOR
        SELECT dashboard_report_id, dashboard_json_frame_data
        FROM dashboard_report_frame
        WHERE JSON_CONTAINS(dashboard_json_frame_data, JSON_OBJECT('chartType', old_report_name))
           OR JSON_CONTAINS(dashboard_json_frame_data, JSON_OBJECT('reportType', old_report_type));
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Open the cursor
    OPEN cur;

    -- Loop through each row
    read_loop: LOOP
        FETCH cur INTO report_id, report_data;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Initialize updated_report_data with the original report_data
        SET updated_report_data = report_data;

        -- Ensure report_data is not NULL and iterate through JSON array
        SET @i = 0;
        WHILE report_data IS NOT NULL AND @i < JSON_LENGTH(report_data) DO
            -- Update chartType if it matches old_report_name
            IF JSON_UNQUOTE(JSON_EXTRACT(report_data, CONCAT('$[', @i, '].chartType'))) = old_report_name THEN
                SET updated_report_data = JSON_SET(updated_report_data, CONCAT('$[', @i, '].chartType'), new_report_name);
            END IF;

            -- Update reportType if it matches old_report_type
            IF JSON_UNQUOTE(JSON_EXTRACT(report_data, CONCAT('$[', @i, '].reportType'))) = old_report_type THEN
                SET updated_report_data = JSON_SET(updated_report_data, CONCAT('$[', @i, '].reportType'), new_report_type);
            END IF;

            SET @i = @i + 1;
        END WHILE;

        -- Update the table with the modified JSON
        UPDATE dashboard_report_frame
        SET dashboard_json_frame_data = updated_report_data
        WHERE dashboard_report_id = report_id;
    END LOOP;

    -- Close the cursor
    CLOSE cur;

    -- Update the detailed_report table for master_report and drilldown_report
    UPDATE detailed_report
    SET master_report = REPLACE(master_report, old_report_name, new_report_name)
    WHERE master_report = old_report_name;

    UPDATE detailed_report
    SET drilldown_report = REPLACE(drilldown_report, old_report_name, new_report_name)
    WHERE drilldown_report = old_report_name;
END$$

DELIMITER ;
