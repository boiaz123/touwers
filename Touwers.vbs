' Touwers - Tower Defense Game
' This VBS script launches the game without showing the console window

Set objFSO = CreateObject("Scripting.FileSystemObject")
Set objShell = CreateObject("WScript.Shell")

' Get the directory where this script is located
strScriptPath = WScript.ScriptFullName
strScriptDir = objFSO.GetParentFolderName(strScriptPath)

' Change to the script directory
objShell.CurrentDirectory = strScriptDir

' Run the batch file with hidden window
strCommand = "cmd /c """ & strScriptDir & "\Touwers.bat"""
objShell.Run strCommand, 0, False
