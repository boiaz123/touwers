// Tauri mobile/desktop entry point - save file I/O and app control

use std::fs;
use std::path::PathBuf;
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

// Steamworks App Admin -> this app's App ID.
const STEAM_APP_ID: u32 = 5132600;

// Holds the initialized Steam client, if Steam was available at startup. `None`
// on a non-Steam build/machine (missing steam_api64.dll, Steam client not
// running, no license, etc.) - every command below treats that as a silent
// no-op rather than an error, since achievements still work locally either way.
struct SteamState(Option<steamworks::Client>);

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

// Unlocks a Steam achievement by its API Name — see apps/desktop/STEAM_ACHIEVEMENTS.md
// for the full id -> API Name mapping. `id` must match an achievement configured
// in Steamworks App Admin exactly (case-sensitive); an unrecognized id, or Steam
// being unavailable, is logged and swallowed rather than surfaced as an error,
// since the in-game achievement system already tracks unlocks locally regardless.
#[tauri::command]
fn steam_unlock_achievement(state: tauri::State<SteamState>, id: String) -> Result<(), String> {
    let Some(client) = state.0.as_ref() else {
        println!("[steam] Steam unavailable, skipping achievement unlock: {}", id);
        return Ok(());
    };

    let user_stats = client.user_stats();
    if user_stats.achievement(&id).set().is_err() {
        println!("[steam] failed to set achievement (unrecognized API Name?): {}", id);
        return Ok(());
    }
    if user_stats.store_stats().is_err() {
        println!("[steam] failed to store stats after unlocking: {}", id);
        return Ok(());
    }
    println!("[steam] unlocked achievement: {}", id);
    Ok(())
}

// Tries to bring up the Steamworks API for STEAM_APP_ID. Returns `None` (instead
// of erroring the whole app) when Steam isn't available - e.g. running outside
// the Steam client during development, or a non-Steam build missing steam_api64.dll -
// so the rest of the app works identically either way.
fn init_steam() -> Option<steamworks::Client> {
    match steamworks::Client::init_app(STEAM_APP_ID) {
        Ok(client) => {
            // The Steamworks API needs its callbacks pumped periodically to process
            // async results (stat/achievement stores, etc.); once per frame is
            // Valve's guidance for games, but this app has no render loop to hook
            // into, so a lightweight background thread stands in for one.
            let callback_client = client.clone();
            std::thread::spawn(move || loop {
                callback_client.run_callbacks();
                std::thread::sleep(Duration::from_millis(100));
            });
            println!("[steam] initialized for app {}", STEAM_APP_ID);
            Some(client)
        }
        Err(e) => {
            println!("[steam] unavailable, achievements will be local-only: {}", e);
            None
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            app.manage(SteamState(init_steam()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            close_app,
            write_save_file,
            read_save_file,
            delete_save_file,
            get_saves_path,
            open_external_url,
            steam_unlock_achievement
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
