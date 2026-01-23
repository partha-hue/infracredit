package com.infracridet.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ContactPage
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.infracridet.app.ui.theme.WhatsAppGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerListScreen(
    onBackClick: () -> Unit,
    onAddFromContacts: () -> Unit,
    onManualAdd: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var showProfilePreview by remember { mutableStateOf<Pair<String, String>?>(null) }

    Scaffold(
        topBar = {
            Surface(shadowElevation = 3.dp) {
                TopAppBar(
                    title = { 
                        Column {
                            Text("My Customers", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                            Text("Manage your digital khata", fontSize = 12.sp, color = Color.Gray)
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBackClick) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    actions = {
                        // Advanced Top Action Button
                        IconButton(
                            onClick = onManualAdd,
                            modifier = Modifier
                                .padding(end = 8.dp)
                                .background(WhatsAppGreen.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                        ) {
                            Icon(Icons.Default.PersonAdd, contentDescription = "Add Manual", tint = WhatsAppGreen)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )
            }
        },
        floatingActionButton = {
            // New Feature: Advanced Floating Action Button for Contacts
            ExtendedFloatingActionButton(
                onClick = onAddFromContacts,
                containerColor = WhatsAppGreen,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp),
                elevation = FloatingActionButtonDefaults.elevation(8.dp),
                icon = { Icon(Icons.Default.ContactPage, contentDescription = null) },
                text = { Text("Add from Contacts", fontWeight = FontWeight.Bold) }
            )
        },
        bottomBar = {
            // Reusing the attractive Bottom Nav from Dashboard for consistency
            InfraPayBottomNav()
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Color(0xFFF8F9FA)) // Light background for better contrast
        ) {
            // Advanced Search Section with Spacing
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                color = Color.White,
                shadowElevation = 2.dp
            ) {
                TextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search name or phone number", color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = WhatsAppGreen) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        disabledContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                    ),
                    singleLine = true
                )
            }

            Spacer(modifier = Modifier.height(8.dp)) // Spacing between Search and List

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White, RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .padding(top = 8.dp)
            ) {
                // Mock Data - In production, this would come from your Backend API
                val customers = listOf(
                    "Rahul Kumar" to "9876543210",
                    "Suresh Singh" to "8877665544",
                    "Amit Patel" to "7766554433",
                    "Priya Sharma" to "9988776655"
                ).filter { it.first.contains(searchQuery, ignoreCase = true) || it.second.contains(searchQuery) }

                items(customers) { (name, phone) ->
                    WhatsAppChatStyleItem(
                        name = name,
                        phone = phone,
                        onImageClick = { showProfilePreview = name to phone }
                    )
                    HorizontalDivider(
                        modifier = Modifier.padding(horizontal = 72.dp),
                        thickness = 0.5.dp,
                        color = Color.LightGray.copy(alpha = 0.5f)
                    )
                }
                
                item { Spacer(modifier = Modifier.height(80.dp)) } // Space for FAB
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
