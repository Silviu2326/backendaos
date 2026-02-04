@echo off
echo Running migration 006: Add LinkedIn fields...
psql -U postgres -d aos_studio -f migrations/006_add_linkedin_fields.sql
echo Migration completed!
pause
