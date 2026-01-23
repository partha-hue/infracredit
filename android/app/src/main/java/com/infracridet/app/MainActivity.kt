package com.infracridet.app

import android.os.Bundle
import android.graphics.Color
import android.view.WindowManager
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.core.view.WindowCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.getcapacitor.BridgeActivity
import com.infracridet.app.ui.screens.*
import com.infracridet.app.ui.theme.InfraCreditTheme

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 1. Enable modern edge-to-edge UI
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.apply {
            addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            statusBarColor = Color.TRANSPARENT
            navigationBarColor = Color.TRANSPARENT
        }

        // 2. Launch your Full Setup App with the new UI UX
        setContent {
            val navController = rememberNavController()
            InfraCreditTheme {
                NavHost(navController = navController, startDestination = "dashboard") {
                    composable("dashboard") {
                        DashboardScreen(
                            onProfileClick = { navController.navigate("settings") },
                            onKhatasClick = { navController.navigate("customers") }
                        )
                    }
                    composable("customers") {
                        CustomerListScreen(
                            onBackClick = { navController.popBackStack() },
                            onAddFromContacts = { /* Your Backend API Logic here */ },
                            onManualAdd = { /* Your Backend API Logic here */ }
                        )
                    }
                    composable("settings") {
                        SettingsScreen(
                            onBackClick = { navController.popBackStack() },
                            onLogoutClick = { /* Clear local storage & Navigate to login */ }
                        )
                    }
                }
            }
        }
    }
}
