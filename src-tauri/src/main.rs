// Tauri main file - minimal setup for static file serving

#[tauri::command]
fn close_app(_app: tauri::AppHandle) {
    // Spawn a thread to exit after a small delay to allow window cleanup
    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(150));
        std::process::exit(0);
    });
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![close_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


