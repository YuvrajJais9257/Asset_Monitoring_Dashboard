import json
import mysql.connector
import psycopg2
from psycopg2.extras import RealDictCursor
 
 
def func():
    try:
        print("Connecting to postresql database")
        # conn = mysql.connector.connect(
        #     host="localhost",
        #     user="root",
        #     port=3306,
        #     password="Admin123*",
        #     database="hyphenview"
        # )
        conn = psycopg2.connect(
            host="10.83.100.254",
            user="postgres",
            port=5432,
            password="Admin123*",
            database="hyphenview_new"
        )
        # cursor = conn.cursor(dictionary=True)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
 
        # Fetch report templates
        cursor.execute("select report_template_name, report_type , chart_type FROM report_template ")
        report_templates = {row["report_template_name"]: (row["report_type"], row["chart_type"]) for row in cursor.fetchall()}
 
 
        # print(report_templates)
 
        cursor.execute("select dashboard_report_id, dashboard_json_frame_data FROM dashboard_report_frame")
        dashboard_records = cursor.fetchall()
 
        # print(dashboard_records)
 
        for record in dashboard_records:
            dashboard_id = record["dashboard_report_id"]
 
            json_data = {}
 
            if record["dashboard_json_frame_data"]:
                # json_data = json.loads(record["dashboard_json_frame_data"])
                json_data = record["dashboard_json_frame_data"]
            else:
                json_data = []
           
 
            for item in json_data:
                chart_type = item.get("chartType")
                # report_type = item.get("reportType")
                if chart_type in report_templates:
                    item["reportType"] = report_templates[chart_type][0]
                    item['chart_type'] = report_templates[chart_type][1]
           
            updated_json = json.dumps(json_data)
           
 
            cursor.execute(
                """
                UPDATE dashboard_report_frame
                SET dashboard_json_frame_data = %s
                WHERE dashboard_report_id = %s
                """,
                (updated_json, dashboard_id)
            )
 
 
        conn.commit()
        cursor.close()
        conn.close()
        print("Dashboard JSON data updated successfully.")
    except Exception as e:
        print(e)
 
func()
 