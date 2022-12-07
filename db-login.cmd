echo >/dev/null # >nul & GOTO WINDOWS & rem ^

# This is a database login script that can run in both Windows and Unix environments.
# You must be on the TAMU network such that this script can run properly.

echo
echo "Added users:"

i=0

while read line || [ -n "$line" ]; do
    if [ $i -gt 0 ]; then
        echo "[$i] $line" | cut -d "," -f 1
    fi

    i=$((i+1))
done < users.csv

echo
echo -n "Enter the number corresponding to the user you want to log in as: "

read num

num=$((num+1))

line=$(sed -n "${num}p" users.csv)

user=$(echo $line | cut -d "," -f 1)
pass=$(echo $line | cut -d "," -f 2)

echo "Connecting to the database..."

PGPASSWORD=$pass psql -h csce-315-db.engr.tamu.edu -U $user -d csce315_907_71

exit 0

:WINDOWS

@echo off
setlocal ENABLEDELAYEDEXPANSION

cls

echo.
echo Added users:

set /a c=0

for /f "usebackq tokens=1-2 delims=," %%a in ("users.csv") do (
    if !c! GTR 0 (
        echo [!c!] %%a
    )

    set /a c=c+1
)

echo.

set /p num="Enter the number corresponding to the user you want to log in as: "
set /a c=0

for /f "usebackq tokens=1-2 delims=," %%a in ("users.csv") do (
    if !c!==%num% (
        set user=%%a
        set pass=%%b
    )

    set /a c=c+1
)

echo Connecting to the database...

cmd /V /C "set PGPASSWORD=%pass%&& psql -h csce-315-db.engr.tamu.edu -U %user% -d csce315_907_71"