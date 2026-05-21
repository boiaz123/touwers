// Tauri main file - save file I/O and app control

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

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
fn close_app(_app: tauri::AppHandle) {
    // Spawn a thread to exit after a small delay to allow window cleanup
    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(150));
        std::process::exit(0);
    });
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            close_app,
            write_save_file,
            read_save_file,
            delete_save_file,
            get_saves_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


