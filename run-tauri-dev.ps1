# Setup MSVC compiler environment for Tauri development
$vsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64"
$vcLibPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\lib\x64"
$includePath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.44.35207\include"
$windowsKitPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64"
$windowsKitLibPath = "C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\um\x64"

# Add paths to environment
$env:Path = $vsPath + ";" + $windowsKitPath + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:INCLUDE = $includePath + ";" + "C:\Program Files (x86)\Windows Kits\10\Include\10.0.22621.0\um"
$env:LIB = $vcLibPath + ";" + $windowsKitLibPath

# Run the dev server
cd c:\Users\boiaz\AppDev\touwers
npm run dev
