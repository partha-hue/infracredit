package com.infracridet.app

import android.os.Bundle
import android.graphics.Color
import android.view.View
import android.view.WindowManager
import androidx.core.view.WindowCompat
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Enable Edge-to-Edge for a more modern Android look
        WindowCompat.setDecorFitsSystemWindows(window, false)
        
        // Make Status Bar and Navigation Bar transparent
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BAR_BACKGRNDS)
            statusBarColor = Color.TRANSPARENT
            navigationBarColor = Color.TRANSPARENT
        }
    }
}
