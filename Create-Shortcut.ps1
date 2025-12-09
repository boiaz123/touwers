$ErrorActionPreference = "SilentlyContinue"

# Create desktop shortcut for Touwers
$desktopPath = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'))
$projectPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$targetPath = [System.IO.Path]::Combine($projectPath, "Touwers.bat")
$shortcutPath = [System.IO.Path]::Combine($desktopPath, "Touwers.lnk")

$WshShell = New-Object -ComObject WScript.Shell
$shortcut = $WshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $projectPath
$shortcut.IconLocation = "C:\Windows\System32\cmd.exe,0"
$shortcut.Description = "Touwers - Tower Defense Game"
$shortcut.Save()

Write-Host "Desktop shortcut created: $shortcutPath"
Write-Host ""
Write-Host "You can now double-click Touwers on your desktop to play the game!"
