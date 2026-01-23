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
            Column(modifier = Modifier.background(WhatsAppGreen)) {
                TopAppBar(
                    title = { 
                        Text(
                            "InfraPay", 
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        ) 
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = WhatsAppGreen
                    ),
                    actions = {
                        IconButton(onClick = {}) { Icon(Icons.Outlined.QrCodeScanner, contentDescription = null, tint = Color.White) }
                        IconButton(onClick = {}) { Icon(Icons.Outlined.PhotoCamera, contentDescription = null, tint = Color.White) }
                        IconButton(onClick = onProfileClick) { Icon(Icons.Default.MoreVert, contentDescription = null, tint = Color.White) }
                    }
                )
                
                // WhatsApp Style Search Bar
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(24.dp),
                    color = WhatsAppGray
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Search, contentDescription = null, tint = WhatsAppDarkGray, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(12.dp))
                        Text("Ask Meta AI or Search", color = WhatsAppDarkGray, fontSize = 14.sp)
                    }
                }

                // Filter Chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, bottom = 12.dp, top = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    WhatsAppChip("All", isSelected = true)
                    WhatsAppChip("Unread")
                    WhatsAppChip("Favorites")
                    WhatsAppChip("Groups")
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddCustomer,
                containerColor = WhatsAppLightGreen,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp)
            ) {
                Icon(Icons.Default.AddComment, contentDescription = null)
            }
        },
        bottomBar = {
            WhatsAppBottomNav()
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color.White)
        ) {
            // Service Grid (Image 2 style)
            item {
                Text(
                    "Services",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(16.dp)
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ServiceCard("Mobile", Icons.Outlined.Smartphone, Color(0xFFE3F2FD), Color(0xFF1976D2), Modifier.weight(1f))
                    ServiceCard("DTH", Icons.Outlined.Tv, Color(0xFFF3E5F5), Color(0xFF7B1FA2), Modifier.weight(1f))
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    ServiceCard("History", Icons.Outlined.ReceiptLong, Color(0xFFE8F5E9), Color(0xFF388E3C), Modifier.weight(1f))
                    ServiceCard("Help", Icons.Outlined.HelpOutline, Color(0xFFFFF3E0), Color(0xFFF57C00), Modifier.weight(1f))
                }
                
                // Trusted Service Banner
                Surface(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    color = Color(0xFFF5F6FF),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF3F51B5))
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text("Trusted Service", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Secure payments and instant confirmation.", fontSize = 12.sp, color = WhatsAppDarkGray)
                        }
                    }
                }
            }

            item {
                Text(
                    "Your Khatas",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            // Chat Style Customer List (Image 1 style)
            val customers = listOf(
                "Rahul Kumar" to "Udhaar: ₹450",
                "Suresh Singh" to "Cleared",
                "Amit Patel" to "Udhaar: ₹1,200",
                "Vikram Seth" to "Pending: ₹890"
            )
            
            items(customers) { (name, sub) ->
                WhatsAppChatItem(name, sub)
            }
        }
    }
}

@Composable
fun WhatsAppChip(text: String, isSelected: Boolean = false) {
    Surface(
        color = if (isSelected) Color(0xFFE7FCE3) else WhatsAppGray,
        shape = RoundedCornerShape(16.dp),
        border = if (isSelected) null else null
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            fontSize = 12.sp,
            color = if (isSelected) Color(0xFF008069) else WhatsAppDarkGray,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
fun ServiceCard(title: String, icon: ImageVector, bgColor: Color, iconColor: Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.height(100.dp),
        color = bgColor,
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(28.dp))
            Spacer(Modifier.height(8.dp))
            Text(title, fontWeight = FontWeight.Medium, fontSize = 14.sp, color = Color.Black)
        }
    }
}

@Composable
fun WhatsAppChatItem(name: String, subtitle: String) {
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
                .background(Color(0xFFE1E1E1)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(32.dp))
        }
        Spacer(Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(subtitle, color = WhatsAppDarkGray, fontSize = 14.sp)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text("Yesterday", color = WhatsAppDarkGray, fontSize = 12.sp)
            if (subtitle.contains("Udhaar")) {
                Icon(Icons.Default.PushPin, contentDescription = null, tint = WhatsAppDarkGray, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun WhatsAppBottomNav() {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 0.dp
    ) {
        NavigationBarItem(
            selected = true,
            onClick = {},
            icon = { 
                Box {
                    Icon(Icons.Default.Chat, contentDescription = null)
                    Surface(
                        color = WhatsAppLightGreen,
                        shape = CircleShape,
                        modifier = Modifier.align(Alignment.TopEnd).offset(x = 4.dp, y = (-4).dp)
                    ) {
                        Text("21", color = Color.White, fontSize = 8.sp, modifier = Modifier.padding(2.dp))
                    }
                }
            },
            label = { Text("Chats", fontWeight = FontWeight.Bold) },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color.Black,
                selectedTextColor = Color.Black,
                indicatorColor = Color(0xFFD9FDD3)
            )
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.Update, contentDescription = null) },
            label = { Text("Updates") }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.PeopleOutline, contentDescription = null) },
            label = { Text("Communities") }
        )
        NavigationBarItem(
            selected = false,
            onClick = {},
            icon = { Icon(Icons.Outlined.Call, contentDescription = null) },
            label = { Text("Calls") }
        )
    }
}
