// Tauri main file - minimal setup for static file serving
use tauri::Manager;

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    // Close all windows
    for window in app.webview_windows().values() {
        let _ = window.close();
    }
    // Force exit the application immediately
    std::process::exit(0);
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![close_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
