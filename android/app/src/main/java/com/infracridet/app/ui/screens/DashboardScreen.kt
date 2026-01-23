package com.infracridet.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.HelpOutline
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.infracridet.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onProfileClick: () -> Unit,
    onKhatasClick: () -> Unit
) {
    var showProfilePreview by remember { mutableStateOf<Pair<String, String>?>(null) }

    Scaffold(
        topBar = {
            Surface(shadowElevation = 2.dp) {
                Column(
                    modifier = Modifier
                        .background(Color.White)
                        .padding(bottom = 8.dp)
                ) {
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
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1B1B1F)
                            )
                            Text(
                                "Secure Recharge Service",
                                fontSize = 13.sp,
                                color = InfraPayPurple,
                                fontWeight = FontWeight.Medium
                            )
                        }
                        IconButton(
                            onClick = onProfileClick,
                            modifier = Modifier.size(44.dp)
                        ) {
                            Icon(
                                Icons.Default.AccountCircle, 
                                contentDescription = null, 
                                modifier = Modifier.size(36.dp),
                                tint = Color.Gray
                            )
                        }
                    }
                }
            }
        },
        bottomBar = {
            InfraPayBottomNav(onKhatasClick = onKhatasClick)
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.White)
        ) {
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
                        ServiceCard("Mobile", Icons.Outlined.Smartphone, MobileBg, MobilePrimary, Modifier.weight(1f))
                        ServiceCard("DTH", Icons.Outlined.Tv, DthBg, DthPrimary, Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        ServiceCard("History", Icons.AutoMirrored.Outlined.ReceiptLong, HistoryBg, HistoryPrimary, Modifier.weight(1f))
                        ServiceCard("Help", Icons.AutoMirrored.Outlined.HelpOutline, HelpBg, HelpPrimary, Modifier.weight(1f))
                    }
                }
                
                Surface(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    color = Color(0xFFF1F4FF),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.VerifiedUser, 
                            contentDescription = null, 
                            tint = Color(0xFF1976D2),
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text("Trusted Service", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("Secure payments and instant confirmation.", fontSize = 13.sp, color = Color.Gray)
                        }
                    }
                }
            }

            item {
                Text(
                    "Recent Transactions",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(start = 16.dp, top = 8.dp, bottom = 8.dp)
                )
            }

            val chats = listOf(
                "Akash" to "7797916160",
                "Ujjwal Prasad" to "9933082098",
                "Partha Chakraborty" to "8327692524"
            )
            
            items(chats) { (name, phone) ->
                WhatsAppChatStyleItem(
                    name = name, 
                    phone = phone,
                    onImageClick = { showProfilePreview = name to phone }
                )
            }
        }
    }

    showProfilePreview?.let { (name, phone) ->
        WhatsAppProfilePreview(
            name = name,
            phone = phone,
            onDismiss = { showProfilePreview = null }
        )
    }
}

@Composable
fun ServiceCard(title: String, icon: ImageVector, bgColor: Color, iconColor: Color, modifier: Modifier) {
    Surface(
        modifier = modifier.height(110.dp),
        color = bgColor,
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(34.dp))
            Spacer(Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp)
        }
    }
}

@Composable
fun WhatsAppProfilePreview(name: String, phone: String, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .width(280.dp)
                .wrapContentHeight(),
            shape = RoundedCornerShape(0.dp), // WhatsApp style is rectangular preview
            color = Color.White
        ) {
            Column {
                Box(modifier = Modifier.fillMaxWidth().height(280.dp).background(Color.LightGray)) {
                    Icon(
                        Icons.Default.Person, 
                        contentDescription = null, 
                        modifier = Modifier.fillMaxSize().padding(48.dp),
                        tint = Color.Gray
                    )
                    Text(
                        text = name,
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .background(Color.Black.copy(alpha = 0.3f))
                            .padding(8.dp)
                            .fillMaxWidth()
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    IconButton(onClick = {}) { Icon(Icons.Default.Message, contentDescription = null, tint = WhatsAppGreen) }
                    IconButton(onClick = {}) { Icon(Icons.Default.Call, contentDescription = null, tint = WhatsAppGreen) }
                    IconButton(onClick = {}) { Icon(Icons.Default.VideoCall, contentDescription = null, tint = WhatsAppGreen) }
                    IconButton(onClick = {}) { Icon(Icons.Default.Info, contentDescription = null, tint = WhatsAppGreen) }
                }
            }
        }
    }
}

@Composable
fun WhatsAppChatStyleItem(name: String, phone: String, onImageClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(WhatsAppGray)
                .clickable { onImageClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Person, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(30.dp))
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(name, fontWeight = FontWeight.SemiBold, fontSize = 17.sp)
            Text(phone, color = Color.Gray, fontSize = 14.sp)
        }
        Text("₹299", color = Color(0xFFE67E22), fontWeight = FontWeight.Bold)
    }
}

@Composable
fun InfraPayBottomNav(onKhatasClick: () -> Unit = {}) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 8.dp,
        modifier = Modifier.height(72.dp)
    ) {
        NavigationBarItem(
            selected = true,
            onClick = {},
            icon = { 
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(ActiveNavBg)
                        .padding(horizontal = 20.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Home, contentDescription = null, tint = Color.Black)
                }
            },
            label = { Text("Home", fontWeight = FontWeight.Bold, color = Color.Black) },
            colors = NavigationBarItemDefaults.colors(indicatorColor = Color.Transparent)
        )
        NavigationBarItem(
            selected = false,
            onClick = onKhatasClick,
            icon = { Icon(Icons.Default.Groups, contentDescription = null) },
            label = { Text("Khatas") }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.History, contentDescription = null) },
            label = { Text("History") }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.SupportAgent, contentDescription = null) },
            label = { Text("Support") }
        )
    }
}
