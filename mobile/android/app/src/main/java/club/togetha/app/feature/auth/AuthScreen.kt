package club.togetha.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.ui.theme.Amber

/**
 * Mock, polished sign up / log in. Phone → OTP → in. No real SMS is sent —
 * this is UI scaffolding for the live auth backend.
 */
@Composable
fun AuthScreen(onDone: () -> Unit) {
    TrackScreen("auth")
    var otpStage by remember { mutableStateOf(false) }
    var phone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }

    Column(
        Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
    ) {
        if (otpStage) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { otpStage = false; otp = "" }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                }
            }
        } else {
            Spacer(Modifier.height(48.dp))
        }
        Spacer(Modifier.height(24.dp))
        Text("togetha.", style = MaterialTheme.typography.displayMedium, color = Amber)
        Spacer(Modifier.height(8.dp))
        if (!otpStage) {
            Text("Sign up or log in", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(6.dp))
            Text(
                "One account for your quiz, application, and screening status.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(28.dp))
            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it.filter(Char::isDigit).take(10) },
                label = { Text("Phone number") },
                prefix = { Text("+91 ") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(16.dp))
            PrimaryButton(
                "Send OTP",
                enabled = phone.length == 10,
                onClick = { otpStage = true },
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(24.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                HorizontalDivider(Modifier.weight(1f))
                Text(
                    "  or  ",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                HorizontalDivider(Modifier.weight(1f))
            }
            Spacer(Modifier.height(24.dp))
            OutlinedButton(
                onClick = onDone,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
            ) {
                Text("G", style = MaterialTheme.typography.titleMedium, color = Amber)
                Spacer(Modifier.width(10.dp))
                Text("Continue with Google")
            }
        } else {
            Text("Enter the code", style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(6.dp))
            Text(
                "We sent a 6-digit code to +91 $phone.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(28.dp))
            OtpBoxes(otp, onChange = { otp = it })
            Spacer(Modifier.height(12.dp))
            TextButton(onClick = { otp = "" }) {
                Text("Resend code", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(12.dp))
            PrimaryButton(
                "Continue",
                enabled = otp.length == 6,
                onClick = onDone,
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Spacer(Modifier.weight(1f, fill = false))
        Spacer(Modifier.height(28.dp))
        Text(
            "Signing in doesn't guarantee a seat — every traveller is screened by a human first.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun OtpBoxes(value: String, onChange: (String) -> Unit) {
    BasicTextField(
        value = value,
        onValueChange = { onChange(it.filter(Char::isDigit).take(6)) },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
        textStyle = TextStyle(color = androidx.compose.ui.graphics.Color.Transparent),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(androidx.compose.ui.graphics.Color.Transparent),
        decorationBox = { inner ->
            Box {
                // Keep the (invisible) field in the layout so it stays focusable.
                Box(Modifier.size(1.dp)) { inner() }
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    repeat(6) { i ->
                        val filled = i < value.length
                        val active = i == value.length
                        Box(
                            Modifier
                                .weight(1f)
                                .height(56.dp)
                                .border(
                                    width = if (active || filled) 2.dp else 1.dp,
                                    color = if (active || filled) Amber else MaterialTheme.colorScheme.outline,
                                    shape = RoundedCornerShape(12.dp),
                                )
                                .background(
                                    MaterialTheme.colorScheme.surface,
                                    RoundedCornerShape(12.dp),
                                ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                value.getOrNull(i)?.toString() ?: "",
                                style = MaterialTheme.typography.headlineMedium,
                            )
                        }
                    }
                }
            }
        },
    )
}
