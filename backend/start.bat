@echo off
echo Starting ZAID Backend on http://127.0.0.1:8000
echo Docs at http://127.0.0.1:8000/api/docs
echo.
cd /d "%~dp0"
call .venv\Scripts\activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
