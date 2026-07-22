; Tauri resolves the installerHooks path to an absolute path before including
; it, so ${__FILEDIR__} here reliably points at this installer/ folder even
; though installer.nsi itself gets copied elsewhere before makensis compiles it.
!define TOUWERS_INSTALLER_DIR "${__FILEDIR__}"
