// Tauri main file - minimal setup for static file serving
use tauri::Manager;

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    // Close all windows gracefully
    for window in app.webview_windows().values() {
        let _ = window.close();
    }
    
    // Try graceful exit
    app.exit(0);
    
    // If graceful exit doesn't work (returns/doesn't actually exit),
    // this code will execute and force a hard abort
    std::thread::sleep(std::time::Duration::from_millis(200));
    
    // At this point, if the process is still running, force termination
    std::process::abort();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![close_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


