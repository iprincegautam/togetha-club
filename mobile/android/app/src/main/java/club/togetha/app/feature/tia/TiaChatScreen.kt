package club.togetha.app.feature.tia

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.SuggestionChip
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import club.togetha.app.core.api.Api
import club.togetha.app.core.model.ChatMessage
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Ink
import kotlinx.coroutines.launch

@Composable
fun TiaChatScreen(onBack: () -> Unit) {
    val messages = remember {
        mutableStateListOf(
            ChatMessage(
                "tia-0", "tia",
                "Hi, I'm Tia — the Togetha concierge. Ask me anything about the trips, screening, deposits, or safety. I'll always give you the honest version.",
                System.currentTimeMillis(),
            )
        )
    }
    var input by remember { mutableStateOf("") }
    var thinking by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(messages.size) {
        listState.animateScrollToItem((messages.size - 1).coerceAtLeast(0))
    }

    Column(Modifier.fillMaxSize().imePadding()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Column {
                Text("Tia", style = MaterialTheme.typography.headlineSmall)
                Text(
                    "Honest answers, human screening",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            items(messages, key = { it.id }) { msg ->
                val mine = msg.role == "user"
                Box(Modifier.fillMaxWidth(), contentAlignment = if (mine) Alignment.CenterEnd else Alignment.CenterStart) {
                    Surface(
                        shape = RoundedCornerShape(
                            topStart = 18.dp, topEnd = 18.dp,
                            bottomStart = if (mine) 18.dp else 4.dp,
                            bottomEnd = if (mine) 4.dp else 18.dp,
                        ),
                        color = if (mine) Amber else MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.widthIn(max = 300.dp),
                    ) {
                        Text(
                            msg.text,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            style = MaterialTheme.typography.bodyMedium,
                            color = if (mine) Ink else MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }
            if (thinking) {
                item {
                    Text(
                        "Tia is typing…",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }

        fun send(text: String) {
            if (text.isEmpty() || thinking) return
            messages += ChatMessage("u-${System.currentTimeMillis()}", "user", text, System.currentTimeMillis())
            input = ""
            thinking = true
            scope.launch {
                val reply = Api.client.sendTiaMessage(messages.toList(), text)
                messages += reply
                thinking = false
            }
        }

        Row(
            Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            listOf("My booking status", "Upcoming departures", "How screening works", "My queries").forEach { chip ->
                SuggestionChip(onClick = { send(chip) }, label = { Text(chip) })
            }
        }

        Column(Modifier.background(MaterialTheme.colorScheme.surface).padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Ask Tia anything…") },
                    shape = RoundedCornerShape(24.dp),
                    maxLines = 3,
                )
                IconButton(
                    onClick = { send(input.trim()) },
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = Amber)
                }
            }
            Spacer(Modifier.height(6.dp))
            Text(
                "Tia is read-only — she can look things up but can't change bookings or promise approvals.",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
        }
    }
}
