package club.togetha.app.feature.account

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.model.KycForm
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import kotlinx.coroutines.launch

@Composable
fun KycScreen(onBack: () -> Unit) {
    TrackScreen("kyc")
    var bio by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var emergency by remember { mutableStateOf("") }
    var dietary by remember { mutableStateOf("") }
    var instagram by remember { mutableStateOf("") }
    var submitted by remember { mutableStateOf(false) }
    var submitting by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Complete profile / KYC", style = MaterialTheme.typography.headlineSmall)
        }
        Column(Modifier.padding(20.dp)) {
            if (submitted) {
                Card(
                    shape = RoundedCornerShape(Radii.card),
                    colors = CardDefaults.cardColors(containerColor = Success.copy(alpha = 0.12f)),
                ) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Filled.CheckCircle, null, tint = Success, modifier = Modifier.size(40.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("KYC submitted", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "The screening team reviews your profile alongside your application — status shows on your Journey.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                return@Column
            }
            Text(
                "This is what the screening team reads — the more real it is, the faster the review goes.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(16.dp))
            OutlinedTextField(bio, { bio = it }, label = { Text("Short bio") }, modifier = Modifier.fillMaxWidth().height(120.dp))
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(city, { city = it }, label = { Text("City") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(emergency, { emergency = it }, label = { Text("Emergency contact (name + phone)") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(dietary, { dietary = it }, label = { Text("Dietary notes (optional)") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(instagram, { instagram = it }, label = { Text("Instagram handle") }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(24.dp))
            PrimaryButton(
                if (submitting) "Submitting…" else "Submit for review",
                enabled = !submitting && bio.isNotBlank() && city.isNotBlank() && emergency.isNotBlank(),
                onClick = {
                    submitting = true
                    scope.launch {
                        Api.client.submitKyc(KycForm(bio.trim(), city.trim(), emergency.trim(), dietary.trim(), instagram.trim()))
                        submitting = false
                        submitted = true
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(40.dp))
        }
    }
}
