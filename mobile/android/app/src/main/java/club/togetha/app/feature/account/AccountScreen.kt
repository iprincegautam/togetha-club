package club.togetha.app.feature.account

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.VerifiedBadge
import club.togetha.app.core.model.PaymentRecord
import club.togetha.app.core.model.Profile
import club.togetha.app.core.model.VerificationStatus
import club.togetha.app.core.state.AppState
import club.togetha.app.ui.theme.Success
import androidx.compose.material.icons.filled.Verified
import club.togetha.app.feature.discover.inr
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Danger
import club.togetha.app.ui.theme.Forest
import club.togetha.app.ui.theme.OffWhite
import club.togetha.app.ui.theme.Radii
import club.togetha.app.core.components.PrimaryButton
import kotlinx.coroutines.launch

@Composable
fun AccountScreen(
    onQueries: () -> Unit,
    onKyc: () -> Unit,
    onQuizProfile: () -> Unit = {},
    onVerification: () -> Unit = {},
    onLogin: () -> Unit = {},
) {
    club.togetha.app.core.analytics.TrackScreen("account")
    if (!AppState.signedIn) {
        SignedOutAccount(onLogin)
        return
    }
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = androidx.compose.runtime.rememberCoroutineScope()
    var profile by remember { mutableStateOf<Profile?>(null) }
    var payments by remember { mutableStateOf<List<PaymentRecord>>(emptyList()) }
    var tripUpdates by remember { mutableStateOf(true) }
    var screeningUpdates by remember { mutableStateOf(true) }
    var communityUpdates by remember { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }
    var confirmSignOut by remember { mutableStateOf(false) }
    var signedOutNote by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        profile = Api.client.fetchProfile()
        payments = Api.client.fetchPayments()
    }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
        Text("Account", style = MaterialTheme.typography.displayMedium)
        Spacer(Modifier.height(20.dp))

        val p = profile
        if (p != null) {
            Card(shape = RoundedCornerShape(Radii.card)) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        Modifier.size(56.dp).clip(CircleShape).background(Forest),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            p.fullName.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString(""),
                            style = MaterialTheme.typography.headlineSmall,
                            color = OffWhite,
                        )
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(p.fullName, style = MaterialTheme.typography.titleMedium)
                            if (AppState.isVerified) {
                                Spacer(Modifier.width(6.dp))
                                Icon(
                                    androidx.compose.material.icons.Icons.Filled.Verified,
                                    contentDescription = "Verified",
                                    tint = Success,
                                    modifier = Modifier.size(16.dp),
                                )
                            }
                        }
                        Text("${p.city} · ${p.age}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(p.email, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            Spacer(Modifier.height(20.dp))

            Text("Verification", style = MaterialTheme.typography.headlineSmall)
            Spacer(Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (p.idVerified) VerifiedBadge("ID verified")
                if (p.phoneVerified) VerifiedBadge("Phone verified")
                if (p.verified) VerifiedBadge("Screened member")
            }
            Spacer(Modifier.height(8.dp))
            Text(
                "Verification is what keeps every Togetha batch safe — it's required before any trip.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Spacer(Modifier.height(24.dp))
        Text("Profile & support", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(10.dp))
        Card(shape = RoundedCornerShape(Radii.card)) {
            Column {
                LinkRow(
                    "My quiz & compatibility",
                    if (AppState.quizCompleted) "${AppState.quizScore ?: 0}% · ${AppState.quizArchetype} — edit anytime."
                    else "Take the 13-question quiz — it decides your batch.",
                    onQuizProfile,
                )
                HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                LinkRow(
                    "Get verified ✓",
                    "LinkedIn, socials, ID — checked by a real person.",
                    onVerification,
                    trailing = { VerificationChip(AppState.verification) },
                )
                HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                LinkRow("Complete profile / KYC", "Bio, city, emergency contact — the screening team reads this.", onKyc)
                HorizontalDivider(Modifier.padding(horizontal = 16.dp))
                LinkRow("My queries & feedback", "Raise a query or track replies. Mon–Sat, 10 AM–7 PM IST.", onQueries)
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("Payments", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(10.dp))
        if (payments.isEmpty()) {
            Text(
                "No payments yet. Your deposit and balance receipts will show up here.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        } else {
            Card(shape = RoundedCornerShape(Radii.card)) {
                Column(Modifier.padding(16.dp)) {
                    payments.forEachIndexed { i, pay ->
                        if (i > 0) {
                            HorizontalDivider(Modifier.padding(vertical = 10.dp))
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(Modifier.weight(1f)) {
                                Text(pay.label, style = MaterialTheme.typography.bodyMedium)
                                Text("${pay.date} · ${pay.status}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(inr(pay.amountInr), style = MaterialTheme.typography.titleSmall)
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(24.dp))
        Text("Notifications", style = MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(6.dp))
        ToggleRow("Screening & decision updates", screeningUpdates) { screeningUpdates = it }
        ToggleRow("Trip updates", tripUpdates) { tripUpdates = it }
        ToggleRow("Community & feed", communityUpdates) { communityUpdates = it }

        Spacer(Modifier.height(24.dp))
        HorizontalDivider()
        TextButton(onClick = { confirmSignOut = true }) { Text("Log out") }
        TextButton(onClick = { confirmDelete = true }) { Text("Delete account", color = Danger) }
        signedOutNote?.let {
            Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(80.dp))
    }

    if (confirmSignOut) {
        AlertDialog(
            onDismissRequest = { confirmSignOut = false },
            title = { Text("Log out?") },
            text = { Text("You can log back in anytime — your quiz and application status are safe.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmSignOut = false
                    scope.launch { AppState.setSignedIn(context, false) }
                }) { Text("Log out") }
            },
            dismissButton = { TextButton(onClick = { confirmSignOut = false }) { Text("Cancel") } },
        )
    }
    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("Delete your account?") },
            text = { Text("This removes your profile, application, and photos permanently. Refundable deposits are returned first. This can't be undone.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmDelete = false
                    signedOutNote = "Deletion requested (mock — the live backend will process this)."
                }) { Text("Delete", color = Danger) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancel") } },
        )
    }
}

/** Polished signed-out state — no personal rows, just a clear way in. */
@Composable
private fun SignedOutAccount(onLogin: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(28.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("togetha.", style = MaterialTheme.typography.displayMedium, color = Amber)
        Spacer(Modifier.height(20.dp))
        Text("Log in or sign up", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            "Your quiz, screening status, and bookings live here.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
        Spacer(Modifier.height(28.dp))
        PrimaryButton("Log in or sign up", onClick = onLogin, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(16.dp))
        Text(
            "Signing in doesn't guarantee a seat — every traveller is screened by a human first.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
        )
    }
}

@Composable
private fun LinkRow(
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    trailing: (@Composable () -> Unit)? = null,
) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        trailing?.let {
            it()
            Spacer(Modifier.width(6.dp))
        }
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun VerificationChip(status: VerificationStatus) {
    val (label, color) = when (status) {
        VerificationStatus.UNVERIFIED -> "Not started" to MaterialTheme.colorScheme.onSurfaceVariant
        VerificationStatus.SUBMITTED -> "In review" to Amber
        VerificationStatus.VERIFIED -> "Verified ✓" to Success
    }
    androidx.compose.material3.Surface(shape = RoundedCornerShape(999.dp), color = color.copy(alpha = 0.14f)) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
            style = MaterialTheme.typography.labelSmall,
            color = color,
        )
    }
}

@Composable
private fun ToggleRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Switch(
            checked = checked,
            onCheckedChange = onChange,
            colors = SwitchDefaults.colors(checkedTrackColor = Amber),
        )
    }
}
