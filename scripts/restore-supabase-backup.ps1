# Restore a Supabase dashboard backup (.backup = plain SQL after unzipping .gz) into a NEW project.
# Prerequisites:
#   1. PostgreSQL 17+ installed; psql on PATH (see https://www.postgresql.org/download/windows/)
#   2. Decompressed backup file (not .gz)
#   3. Session pooler or direct connection URI from new project: Dashboard -> Connect
#
# Usage (PowerShell):
#   $env:SUPABASE_DB_URL = "postgresql://postgres.[ref]:[password]@aws-0-....pooler.supabase.com:5432/postgres"
#   (Some projects use aws-1-<region> instead of aws-0; copy host from Dashboard -> Connect.)
#   .\scripts\restore-supabase-backup.ps1 -BackupPath "C:\path\to\backup.backup"
#
# Password special characters must be URL-encoded in the URI.

param(
    [Parameter(Mandatory = $true)]
    [string] $BackupPath,
    [string] $PsqlPath = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $BackupPath)) {
    Write-Error "Backup file not found: $BackupPath"
}

$uri = $env:SUPABASE_DB_URL
if (-not $uri) {
    Write-Error "Set SUPABASE_DB_URL to the full postgres connection string (new project)."
}

$psql = $PsqlPath
if (-not $psql) {
    $candidates = @(
        "psql",
        "${env:ProgramFiles}\PostgreSQL\17\bin\psql.exe",
        "${env:ProgramFiles}\PostgreSQL\16\bin\psql.exe"
    )
    foreach ($c in $candidates) {
        if ($c -eq "psql") {
            $cmd = Get-Command psql -ErrorAction SilentlyContinue
            if ($cmd) { $psql = $cmd.Source; break }
        } elseif (Test-Path -LiteralPath $c) {
            $psql = $c
            break
        }
    }
}

if (-not $psql) {
    Write-Error "psql not found. Install PostgreSQL 17+ and add bin to PATH, or pass -PsqlPath 'C:\Program Files\PostgreSQL\17\bin\psql.exe'"
}

& $psql --version
Write-Host "Restoring into new project (expect many 'already exists' errors on auth/storage - normal per Supabase docs)..." -ForegroundColor Cyan

# psql continues past SQL errors by default when running -f (needed for duplicate-object noise on auth/storage).
& $psql -d $uri -f $BackupPath

Write-Host "Done. Verify data in Supabase Dashboard -> Table Editor." -ForegroundColor Green
