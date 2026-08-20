fn main() {
  // tauri_build::build() embeds frontendDist (../../../public) into the binary at
  // compile time, but it doesn't tell Cargo that directory is a build input - so
  // editing JS/HTML/CSS alone doesn't invalidate the cached build and stale frontend
  // code keeps getting bundled. Force Cargo to recompile whenever it changes.
  println!("cargo:rerun-if-changed=../../../public");
  tauri_build::build();

  copy_steam_dll_next_to_exe();
}

// steam_api64.dll is what the Steamworks API dynamically loads at process start -
// it has to sit next to the built exe, not just somewhere on the linker's search
// path. `bundle.resources` in tauri.conf.json handles that for the installed/NSIS
// build; this handles plain `cargo build` / `cargo tauri dev`, where resources are
// never copied. Windows-only since that's the only vendored copy we keep in-repo
// (steamworks-sys itself vendors the mac/linux equivalents already).
fn copy_steam_dll_next_to_exe() {
  if std::env::var("TARGET").map(|t| t.contains("windows")) != Ok(true) {
    return;
  }
  let dll_src = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("steam_api64.dll");
  if !dll_src.exists() {
    return;
  }
  let out_dir = std::env::var("OUT_DIR").expect("OUT_DIR not set");
  // OUT_DIR is target/<profile>/build/<pkg>-<hash>/out - the exe itself lives
  // three levels up, at target/<profile>/. Not a documented Cargo guarantee, but
  // a long-standing, widely relied-on layout for exactly this kind of build step.
  let Some(target_dir) = std::path::Path::new(&out_dir).ancestors().nth(3) else {
    return;
  };
  let _ = std::fs::copy(&dll_src, target_dir.join("steam_api64.dll"));
}
