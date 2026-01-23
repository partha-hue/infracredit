package com.infracridet.app

import android.os.Bundle
import android.graphics.Color
import android.view.WindowManager
import androidx.core.view.WindowCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Use modern Edge-to-Edge UI
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            statusBarColor = Color.TRANSPARENT
            navigationBarColor = Color.TRANSPARENT
        }
    }

    // Handle back button navigation
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (bridge.webView.canGoBack()) {
            bridge.webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
