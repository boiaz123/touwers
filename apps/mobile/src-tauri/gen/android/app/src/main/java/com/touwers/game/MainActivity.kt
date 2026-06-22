package com.touwers.game

import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  private var gameWebView: WebView? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    hideSystemBars()
  }

  // WRY's RustWebView never claims Android view focus on its own, so when JS calls
  // .focus() on the hidden mobile-keyboard input, InputMethodManager rejects the
  // resulting showSoftInput() request with "Ignoring showSoftInput() ... is not
  // served" - the keyboard silently fails to open even though the JS side did
  // everything right. Making the WebView focusable and explicitly requesting focus
  // on touch is the standard fix for Android WebViews not serving the soft keyboard.
  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    gameWebView = webView
    webView.isFocusable = true
    webView.isFocusableInTouchMode = true
    webView.setOnTouchListener { v, event ->
      if (event.action == MotionEvent.ACTION_DOWN && !v.hasFocus()) {
        v.requestFocus()
      }
      false
    }
  }

  // Re-hide the status/navigation bars whenever the window regains focus,
  // since BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE only hides them again on
  // re-focus, not automatically after the user's edge swipe ends.
  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    if (hasFocus) {
      hideSystemBars()
    }
  }

  // Hides the status bar and navigation/gesture bar so the game canvas
  // covers the full physical screen instead of being letterboxed by them.
  // enableEdgeToEdge() (called in onCreate) already handles
  // WindowCompat.setDecorFitsSystemWindow(window, false) - only the actual
  // bar-hiding needs to happen here.
  private fun hideSystemBars() {
    val controller = WindowCompat.getInsetsController(window, window.decorView)
    controller.hide(WindowInsetsCompat.Type.systemBars())
    controller.systemBarsBehavior =
      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
  }

  // The game intercepts the hardware/gesture back action and asks the JS
  // layer whether it handled it (closing a panel/menu) before letting the
  // Activity finish, so back doesn't unexpectedly exit the app mid-game.
  override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
    if (keyCode == KeyEvent.KEYCODE_BACK) {
      val webView = gameWebView
      if (webView == null) {
        finish()
        return true
      }
      webView.evaluateJavascript(
        "(window.__ANDROID_BACK__ ? String(window.__ANDROID_BACK__()) : 'false')"
      ) { result ->
        if (result != "true" && result != "\"true\"") {
          runOnUiThread { finish() }
        }
      }
      return true
    }
    return super.onKeyDown(keyCode, event)
  }
}
