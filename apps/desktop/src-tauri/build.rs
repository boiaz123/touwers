fn main() {
  // tauri_build::build() embeds frontendDist (../../../public) into the binary at
  // compile time, but it doesn't tell Cargo that directory is a build input - so
  // editing JS/HTML/CSS alone doesn't invalidate the cached build and stale frontend
  // code keeps getting bundled. Force Cargo to recompile whenever it changes.
  println!("cargo:rerun-if-changed=../../../public");
  tauri_build::build()
}
