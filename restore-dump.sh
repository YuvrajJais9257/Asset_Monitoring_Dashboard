#!/bin/bash
set -e

echo "Restoring database from custom-format dump..."
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/pgbackup.dump
echo "Database restored successfully."