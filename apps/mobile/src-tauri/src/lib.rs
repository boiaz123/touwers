// Tauri mobile/desktop entry point - save file I/O and app control

use std::fs;
use std::path::PathBuf;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

fn get_saves_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir()
        .map_err(|e| e.to_string())?;
    let saves_dir = app_data.join("saves");
    if !saves_dir.exists() {
        fs::create_dir_all(&saves_dir)
            .map_err(|e| format!("Failed to create saves directory: {}", e))?;
    }
    Ok(saves_dir)
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    // app.exit() requests a graceful runtime exit (fires RunEvent::ExitRequested/Exit)
    // instead of hard-killing the process, which matters on Android where the
    // process also hosts the Activity - a raw std::process::exit there looks like
    // a crash rather than the app closing normally.
    app.exit(0);
}

#[tauri::command]
fn write_save_file(app: tauri::AppHandle, slot: u32, content: String) -> Result<(), String> {
    if slot < 1 || slot > 3 {
        return Err("Invalid save slot".to_string());
    }
    let saves_dir = get_saves_dir(&app)?;
    let file_path = saves_dir.join(format!("slot_{}.sav", slot));
    fs::write(&file_path, content.as_bytes())
        .map_err(|e| format!("Failed to write save file: {}", e))
}

#[tauri::command]
fn read_save_file(app: tauri::AppHandle, slot: u32) -> Result<String, String> {
    if slot < 1 || slot > 3 {
        return Err("Invalid save slot".to_string());
    }
    let saves_dir = get_saves_dir(&app)?;
    let file_path = saves_dir.join(format!("slot_{}.sav", slot));
    if !file_path.exists() {
        return Err("Save file not found".to_string());
    }
    fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read save file: {}", e))
}

#[tauri::command]
fn delete_save_file(app: tauri::AppHandle, slot: u32) -> Result<(), String> {
    if slot < 1 || slot > 3 {
        return Err("Invalid save slot".to_string());
    }
    let saves_dir = get_saves_dir(&app)?;
    let file_path = saves_dir.join(format!("slot_{}.sav", slot));
    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Failed to delete save file: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn get_saves_path(app: tauri::AppHandle) -> Result<String, String> {
    let saves_dir = get_saves_dir(&app)?;
    Ok(saves_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn open_external_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.shell()
        .open(url, None)
        .map_err(|e| format!("Failed to open URL: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            close_app,
            write_save_file,
            read_save_file,
            delete_save_file,
            get_saves_path,
            open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
