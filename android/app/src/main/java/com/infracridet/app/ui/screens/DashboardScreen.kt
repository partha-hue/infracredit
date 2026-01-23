package com.infracridet.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.infracridet.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    shopName: String,
    onAddCustomer: () -> Unit,
    onViewReports: () -> Unit,
    onProfileClick: () -> Unit
) {
    Scaffold(
        topBar = {
            Column(modifier = Modifier.background(Color.White)) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "InfraPay",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.Black
                        )
                        Text(
                            "Secure Recharge Service",
                            fontSize = 12.sp,
                            color = InfraPayPurple,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    IconButton(
                        onClick = onProfileClick,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(InfraPayPurple.copy(alpha = 0.1f))
                    ) {
                        Icon(Icons.Default.Person, contentDescription = null, tint = InfraPayPurple)
                    }
                }
            }
        },
        bottomBar = {
            InfraPayBottomNav()
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.White)
        ) {
            // Service Grid (InfraPay Style)
            item {
                Text(
                    "Services",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(start = 16.dp, top = 20.dp, bottom = 16.dp)
                )
                
                Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        InfraPayServiceCard("Mobile", Icons.Outlined.Smartphone, MobileBg, MobilePrimary, Modifier.weight(1f))
                        InfraPayServiceCard("DTH", Icons.Outlined.Tv, DthBg, DthPrimary, Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        InfraPayServiceCard("History", Icons.Outlined.ReceiptLong, HistoryBg, HistoryPrimary, Modifier.weight(1f))
                        InfraPayServiceCard("Help", Icons.Outlined.HelpOutline, HelpBg, HelpPrimary, Modifier.weight(1f))
                    }
                }
                
                // Trusted Service Banner
                Surface(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    color = Color(0xFFF7F8FF),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Verified, 
                            contentDescription = null, 
                            tint = Color(0xFF3F51B5),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text("Trusted Service", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("Secure payments and instant confirmation.", fontSize = 13.sp, color = WhatsAppDarkGray)
                        }
                    }
                }
            }

            // Chat Style Customer List (WhatsApp)
            item {
                Text(
                    "Recent Transactions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(start = 16.dp, top = 12.dp, bottom = 8.dp)
                )
            }

            val customers = listOf(
                "Rahul Kumar" to "Udhaar: ₹450",
                "Suresh Singh" to "Payment Done",
                "Amit Patel" to "Udhaar: ₹1,200"
            )
            
            items(customers) { (name, sub) ->
                WhatsAppChatItem(name, sub)
            }
        }
    }
}

@Composable
fun InfraPayServiceCard(title: String, icon: ImageVector, bgColor: Color, iconColor: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.height(110.dp),
        color = bgColor,
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(32.dp))
            Spacer(Modifier.height(12.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.Black)
        }
    }
}

@Composable
fun WhatsAppChatItem(name: String, subtitle: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(CircleShape)
                .background(WhatsAppGray),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Person, contentDescription = null, tint = WhatsAppDarkGray)
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(subtitle, color = WhatsAppDarkGray, fontSize = 13.sp)
        }
        Text("8:30 PM", color = WhatsAppDarkGray, fontSize = 11.sp)
    }
}

@Composable
fun InfraPayBottomNav() {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 0.dp,
        modifier = Modifier.height(80.dp)
    ) {
        NavigationBarItem(
            selected = true,
            onClick = {},
            icon = { 
                Surface(
                    color = ActiveNavBg,
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.padding(bottom = 4.dp)
                ) {
                    Icon(
                        Icons.Default.Home, 
                        contentDescription = null, 
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
                        tint = Color.Black
                    )
                }
            },
            label = { Text("Home", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
            colors = NavigationBarItemDefaults.colors(
                indicatorColor = Color.Transparent
            )
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.History, contentDescription = null) },
            label = { Text("History", fontSize = 12.sp) }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.Face, contentDescription = null) },
            label = { Text("Support", fontSize = 12.sp) }
        )
    }
}
