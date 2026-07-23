package club.togetha.app.feature.account

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HourglassTop
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.model.VerificationStatus
import club.togetha.app.core.state.AppState
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import kotlinx.coroutines.launch

/** Letters render as X while digits stay visible — the PAN never shows in the clear. */
private object PanMaskTransformation : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val masked = text.text.map { if (it.isLetter()) 'X' else it }.joinToString("")
        return TransformedText(AnnotatedString(masked), OffsetMapping.Identity)
    }
}

@Composable
fun VerificationScreen(onBack: () -> Unit) {
    TrackScreen("verification")
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var linkedin by remember { mutableStateOf("") }
    var instagram by remember { mutableStateOf("") }
    var work by remember { mutableStateOf("") }
    var idLast4 by remember { mutableStateOf("") }
    var idPhotoPicked by remember { mutableStateOf(false) }
    var pan by remember { mutableStateOf("") }

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("Get verified ✓", style = MaterialTheme.typography.headlineMedium)
        }
        Spacer(Modifier.height(8.dp))

        when (AppState.verification) {
            VerificationStatus.VERIFIED -> {
                Spacer(Modifier.height(24.dp))
                Card(
                    shape = RoundedCornerShape(Radii.card),
                    colors = CardDefaults.cardColors(containerColor = Success.copy(alpha = 0.12f)),
                ) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Filled.Verified, null, tint = Success, modifier = Modifier.size(40.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("You're verified", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "The ✓ badge now shows next to your name across the club — in the feed, in chats, and on your profile. Your documents stay private, always.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
            VerificationStatus.SUBMITTED -> {
                Spacer(Modifier.height(24.dp))
                Card(
                    shape = RoundedCornerShape(Radii.card),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                ) {
                    Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Filled.HourglassTop, null, tint = Amber, modifier = Modifier.size(36.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Submitted", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.height(6.dp))
                        Text(
                            "A real person reviews your file — 24–36 hours.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                if (club.togetha.app.BuildConfig.DEBUG) {
                    Spacer(Modifier.height(16.dp))
                    TextButton(onClick = {
                        scope.launch { AppState.setVerification(context, VerificationStatus.VERIFIED) }
                    }) {
                        Text("Demo: simulate the team verifying you", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            VerificationStatus.UNVERIFIED -> {
                Text(
                    "Verified members get a ✓ next to their name across the club. A real human checks everything you submit here.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(20.dp))

                OutlinedTextField(
                    linkedin, { linkedin = it },
                    label = { Text("LinkedIn URL") },
                    placeholder = { Text("linkedin.com/in/you") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    instagram, { instagram = it.removePrefix("@") },
                    label = { Text("Instagram handle") },
                    prefix = { Text("@") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    work, { work = it },
                    label = { Text("Work / company") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(20.dp))

                Text("Government ID", style = MaterialTheme.typography.titleSmall)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        idLast4, { idLast4 = it.filter(Char::isDigit).take(4) },
                        label = { Text("Last 4 digits") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                    )
                    OutlinedButton(onClick = { idPhotoPicked = true }) {
                        if (idPhotoPicked) {
                            Icon(Icons.Filled.CheckCircle, null, tint = Success, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.size(6.dp))
                            Text("Photo added")
                        } else {
                            Text("Upload photo")
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    pan, { pan = it.filter(Char::isLetterOrDigit).uppercase().take(10) },
                    label = { Text("PAN") },
                    placeholder = { Text("ABCDE1234F") },
                    visualTransformation = PanMaskTransformation,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(Radii.button),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                ) {
                    Text(
                        "Used only to verify you — never shared, never public.",
                        modifier = Modifier.padding(12.dp),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(Modifier.height(24.dp))
                PrimaryButton(
                    "Submit for review",
                    enabled = linkedin.isNotBlank() && instagram.isNotBlank() && work.isNotBlank() &&
                        idLast4.length == 4 && idPhotoPicked && pan.length == 10,
                    onClick = {
                        scope.launch { AppState.setVerification(context, VerificationStatus.SUBMITTED) }
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(10.dp))
                Text(
                    "A real person reviews your file — 24–36 hours. No instant approvals.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Spacer(Modifier.height(40.dp))
    }
}
