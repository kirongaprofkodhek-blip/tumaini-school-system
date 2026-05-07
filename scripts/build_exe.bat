@echo off
setlocal

cd /d "%~dp0\.."

echo [1/3] Installing dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo [2/3] Building executable...
pyinstaller --noconfirm --onefile --windowed ^
  --name TumainiAcademyLMS ^
  --add-data "docs\User_Manual.pdf;docs" ^
  --add-data "docs\User_Manual.md;docs" ^
  app.py

echo [3/3] Build complete.
echo Output: dist\TumainiAcademyLMS.exe
endlocal
