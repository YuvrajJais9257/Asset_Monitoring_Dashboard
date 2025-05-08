#!/bin/bash
set -e

echo "Restoring database from custom-format dump..."
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/pgbackup.dump
echo "Database restored successfully."