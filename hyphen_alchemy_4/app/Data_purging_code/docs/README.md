# Database Purging Code
This project implements a Python-based system to automate the purging (deletion) of old data from databases (MySQL and PostgreSQL) based on configurable retention periods. 

## Table of Content
- [Project Overview]
- [Folder Structure]
- [Prerequisites]
- [Project Workflow]
- [Common Class]
- [Configuration]

## Folder Structure
- data base purging code
   - logs
   - lib
      - common_utility.py
   - config
      - config.ini
   - purging_code_db.py


## Prerequisites
- Python 3.11
- database credentials & details
  - type of database
  - database name
  - tables name and date columns of those tables
  - purging time period
- Required Python libraries (installable via requirements.txt)
  - pip install -r requirements.txt


## Project Workflow

1. **Purging Data from Databases**
    - The purging_code_db.py script handles the main purging functionality.
    - It performs the following tasks:
        - Reads retention configurations and database details (from config.ini) using `ConfigFileHandler` class present in common_utility module.

        - Creates mapping between database type , database , tables , column and retention period using `create_mapping` methof of `DatabasePurging` class. Thorugh this we can handle each database effieciently

        - Extract time and time unit using `extract_period_and_unit` method of `DatabasePurging` class
          - example :- if you have given time like 3day/days in config
          - time will be `3` and unit will be `days`

          Creating List of dictionaries Like This
          [
            {
                datbasetype:val,
                databaseName:val, 
                tableDetails:{
                    tableName1 : { columnName:val,retentionTime:val,retentionUnit:val} , 
                    tableName2 :{ columnName:val,retentionTime:val,retentionUnit:val}
                },
            },{  
            },
          ]

        - Iterates over each dictionary we got from above step
          - Establishes database connections based on configuration (supports MySQL and PostgreSQL) using `connect_to_db` method present in `common_utility` module.
          - Iterates over specified tables and deletes records older then the configured retention period.
          - For each table, it calculates the cutoff date(e.g. 30 days ago) based on the retention period.
            - if we want to delete data that is older then 2 days Mention it in config.ini 
            - it will calculates cutoff date 
              - example :- current time :- 16-12-2024 10:42:60 and retention period is 2 days
              - cutoff date:- cutoff date would be 16-12-2024 10:42:60 - 2days => 14-12-2024 10:42:60
              - search rows from database that are older then cutoff date and delete all of them 
    - The script logs each action, including the number of rows deleted and any errors encountered.
    - Command to run the file: python database_purging.py

### common-utility module

The project uses a `common.py` file that contains utility functions and classes used across the different scripts. This file ensures code reuse and simplifies the interaction between ServiceNow and ManageEngine APIs.

## Configuration

The project is driven by a configuration file, `config.ini`, that contains the necessary Information 
like database credtenials and purging information like database_type,database name,tables names
columns name and retention time

### Key Sections in `config.ini`

#### 1. **[mysql]**
   - Contains mysql database credentials
   - `host`=
   - `user`=
   - `passwd`=

#### 2. **[postgres]**
   - Contains postgres database credentials
   - `host`=
   - `user`=
   - `passwd`=
   - `port`=5432

#### 3. **[Purging_database]**
   - `db_type`=mysql|postgres
   - `databasename`=my_database|newdb
   - `tablename`=employees,projects|student
   - `columnname`=hire_date,start_date|inserted_date
   - `retentiondays`=1seconds,2seconds|1seconds

