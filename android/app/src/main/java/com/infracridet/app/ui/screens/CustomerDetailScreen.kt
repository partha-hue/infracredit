package com.infracridet.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.infracridet.app.ui.theme.WhatsAppGreen

data class Transaction(
    val amount: String,
    val date: String,
    val isCredit: Boolean,
    val note: String = ""
)

val dummyTransactions = listOf(
    Transaction("₹500", "22 Oct, 10:30 AM", true, "Rice and Daal"),
    Transaction("₹200", "21 Oct, 05:15 PM", false, "G-Pay received"),
    Transaction("₹150", "20 Oct, 11:00 AM", true, "Mobile Recharge")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerDetailScreen(
    customerName: String,
    phoneNumber: String,
    currentBalance: String,
    onBackClick: () -> Unit,
    onAddTransaction: (type: String) -> Unit
) {
    Scaffold(
        topBar = {
            Surface(shadowElevation = 4.dp) {
                TopAppBar(
                    title = {
                        Column {
                            Text(customerName, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Text(phoneNumber, fontSize = 12.sp, color = Color.Gray)
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = onBackClick) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { /* Link to Call API */ }) {
                            Icon(Icons.Default.Call, contentDescription = "Call", tint = WhatsAppGreen)
                        }
                        IconButton(onClick = { /* Link to WhatsApp API */ }) {
                            Icon(Icons.Default.Share, contentDescription = "Share", tint = WhatsAppGreen)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
                )
            }
        },
        bottomBar = {
            Surface(shadowElevation = 16.dp, color = Color.White) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .navigationBarsPadding(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { onAddTransaction("Payment") },
                        modifier = Modifier.weight(1f).height(54.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("YOU GOT ₹", fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = { onAddTransaction("Credit") },
                        modifier = Modifier.weight(1f).height(54.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("YOU GAVE ₹", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).background(Color(0xFFF8F9FA)),
            contentPadding = PaddingValues(16.dp)
        ) {
            item {
                BalanceCard(currentBalance)
                Spacer(Modifier.height(24.dp))
                Text("TRANSACTION HISTORY", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
                Spacer(Modifier.height(8.dp))
            }

            items(dummyTransactions) { txn ->
                TimelineItem(txn)
            }
        }
    }
}

@Composable
fun BalanceCard(balance: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Net Balance", fontSize = 14.sp, color = Color.Gray)
            Text(
                balance,
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = if (balance.contains("-")) Color(0xFFD32F2F) else Color(0xFF2E7D32)
            )
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedButton(
                onClick = {},
                shape = RoundedCornerShape(8.dp),
                border = ButtonDefaults.outlinedButtonBorder.copy(width = 0.5.dp)
            ) {
                Icon(Icons.Default.PictureAsPdf, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("DOWNLOAD REPORT", fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun TimelineItem(txn: Transaction) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(txn.date, fontSize = 11.sp, color = Color.Gray)
                Text(txn.note.ifEmpty { if (txn.isCredit) "Items Sold" else "Payment Received" }, fontWeight = FontWeight.SemiBold)
            }
            Text(
                txn.amount,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = if (txn.isCredit) Color(0xFFD32F2F) else Color(0xFF2E7D32)
            )
        }
    }
}
