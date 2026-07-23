package club.togetha.app.feature.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import club.togetha.app.core.model.SupportQuery
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QueriesScreen(onBack: () -> Unit) {
    TrackScreen("queries")
    var queries by remember { mutableStateOf<List<SupportQuery>>(emptyList()) }
    var showSubmit by remember { mutableStateOf(false) }
    var subject by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) { queries = Api.client.fetchQueries() }

    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Text("My queries & feedback", style = MaterialTheme.typography.headlineSmall)
        }
        LazyColumn(
            Modifier.weight(1f),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Text(
                    "Support runs Monday–Saturday, 10:00 AM–7:00 PM IST. We answer every query.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (queries.isEmpty()) {
                item {
                    Text(
                        "No queries yet — raise one below and the team will get back to you.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            items(queries, key = { it.id }) { q ->
                Card(shape = RoundedCornerShape(Radii.card)) {
                    Column(Modifier.padding(16.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(q.subject, style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
                            Surface(
                                shape = RoundedCornerShape(999.dp),
                                color = if (q.status == "resolved") Success.copy(alpha = 0.14f) else Amber.copy(alpha = 0.16f),
                            ) {
                                Text(
                                    q.status,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (q.status == "resolved") Success else MaterialTheme.colorScheme.onSurface,
                                )
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(q.body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        q.reply?.let { reply ->
                            Spacer(Modifier.height(10.dp))
                            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
                                Column(Modifier.padding(12.dp)) {
                                    Text("Togetha Team", style = MaterialTheme.typography.labelSmall, color = Success)
                                    Text(reply, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(q.createdAt, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        Column(Modifier.padding(20.dp)) {
            PrimaryButton("Raise a query", onClick = { showSubmit = true; subject = ""; body = "" }, modifier = Modifier.fillMaxWidth())
        }
    }

    if (showSubmit) {
        ModalBottomSheet(
            onDismissRequest = { showSubmit = false },
            shape = RoundedCornerShape(topStart = Radii.sheet, topEnd = Radii.sheet),
        ) {
            Column(Modifier.padding(24.dp)) {
                Text("New query", style = MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(subject, { subject = it }, label = { Text("Subject") }, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(body, { body = it }, label = { Text("Tell us what's up") }, modifier = Modifier.fillMaxWidth().height(120.dp))
                Spacer(Modifier.height(16.dp))
                PrimaryButton(
                    "Submit",
                    enabled = subject.isNotBlank() && body.isNotBlank(),
                    onClick = {
                        scope.launch {
                            Api.client.submitQuery(subject.trim(), body.trim())
                            queries = Api.client.fetchQueries()
                            showSubmit = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                )
                TextButton(onClick = { showSubmit = false }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
                    Text("Cancel")
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}
