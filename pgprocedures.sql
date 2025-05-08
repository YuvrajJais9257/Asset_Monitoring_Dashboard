CREATE OR REPLACE PROCEDURE public.update_report_name(

    IN old_report_name character varying,

    IN new_report_name character varying,

    IN old_report_type character varying,

    IN new_report_type character varying

)

LANGUAGE plpgsql

AS $$

DECLARE

    report_id INTEGER;

    report_data JSONB;

    updated_report_data JSONB;

    i INTEGER;

    rec RECORD;

BEGIN

    -- Loop over only those rows where any array element matches old_report_name or old_report_type

    FOR rec IN

        SELECT dashboard_report_id, dashboard_json_frame_data

        FROM dashboard_report_frame

        WHERE EXISTS (

            SELECT 1

            FROM jsonb_array_elements(dashboard_json_frame_data) AS elem

            WHERE elem ->> 'chartType' = old_report_name

               OR elem ->> 'reportType' = old_report_type

        )

    LOOP

        report_id := rec.dashboard_report_id;

        report_data := rec.dashboard_json_frame_data;

        updated_report_data := report_data;
 
        -- Loop over each array index

        FOR i IN 0 .. jsonb_array_length(report_data) - 1 LOOP

            -- Update chartType if it matches old_report_name

            IF (report_data -> i ->> 'chartType') = old_report_name THEN

                updated_report_data := jsonb_set(

                    updated_report_data,

                    ARRAY[i::text, 'chartType'],

                    to_jsonb(new_report_name)

                );

            END IF;
 
            -- Update reportType if it matches old_report_type

            IF (report_data -> i ->> 'reportType') = old_report_type THEN

                updated_report_data := jsonb_set(

                    updated_report_data,

                    ARRAY[i::text, 'reportType'],

                    to_jsonb(new_report_type)

                );

            END IF;

        END LOOP;
 
        -- Apply update to table

        UPDATE dashboard_report_frame

        SET dashboard_json_frame_data = updated_report_data

        WHERE dashboard_report_id = report_id;

    END LOOP;
 
    -- Update the detailed_report table fields

    UPDATE detailed_report

    SET master_report = new_report_name

    WHERE master_report = old_report_name;
 
    UPDATE detailed_report

    SET drilldown_report = new_report_name

    WHERE drilldown_report = old_report_name;

END;

$$;
 