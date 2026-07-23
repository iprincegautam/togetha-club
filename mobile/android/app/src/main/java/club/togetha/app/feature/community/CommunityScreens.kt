package club.togetha.app.feature.community

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import club.togetha.app.core.analytics.TrackScreen
import club.togetha.app.core.api.Api
import club.togetha.app.core.model.ChatGroup
import club.togetha.app.core.model.GroupMessage
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Ink
import club.togetha.app.ui.theme.Radii
import club.togetha.app.ui.theme.Success
import kotlinx.coroutines.launch

@Composable
fun GroupsScreen(onGroupClick: (String) -> Unit) {
    TrackScreen("chat_groups")
    var groups by remember { mutableStateOf<List<ChatGroup>>(emptyList()) }
    var loaded by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { groups = Api.client.fetchChatGroups(); loaded = true }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Column {
                Text("Community", style = MaterialTheme.typography.displayMedium)
                Spacer(Modifier.height(6.dp))
                Text(
                    "Interested groups are open to everyone eyeing a batch. Travelers groups unlock automatically once your deposit is in.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (loaded && groups.isEmpty()) {
            item {
                Text(
                    "No groups yet — open a batch on Discover to join its Interested group.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        items(groups, key = { it.id }) { group ->
            GroupCard(group, onClick = { onGroupClick(group.id) })
        }
    }
}

@Composable
private fun GroupCard(group: ChatGroup, onClick: () -> Unit) {
    val travelers = group.kind == "travelers"
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(Radii.card),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.size(48.dp).clip(CircleShape).background(Color(group.tint)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (travelers) Icons.Filled.Verified else Icons.Filled.Groups,
                    null, tint = Color.White, modifier = Modifier.size(24.dp),
                )
            }
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(group.name, style = MaterialTheme.typography.titleSmall)
                Text(
                    group.lastMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                )
                Spacer(Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(999.dp),
                    color = if (travelers) Success.copy(alpha = 0.14f) else MaterialTheme.colorScheme.surfaceVariant,
                ) {
                    Text(
                        if (travelers) "Deposit-paid members · ${group.memberCount}" else "${group.memberCount} interested",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (travelers) Success else MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
        }
    }
}

@Composable
fun GroupChatScreen(groupId: String, onBack: () -> Unit) {
    TrackScreen("chat_group")
    var group by remember { mutableStateOf<ChatGroup?>(null) }
    var messages by remember { mutableStateOf<List<GroupMessage>>(emptyList()) }
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    LaunchedEffect(groupId) {
        group = Api.client.fetchChatGroups().firstOrNull { it.id == groupId }
        messages = Api.client.fetchGroupMessages(groupId)
    }
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    Column(Modifier.fillMaxSize().imePadding()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            Column {
                Text(group?.name ?: "Group", style = MaterialTheme.typography.titleMedium, maxLines = 1)
                Text(
                    "${group?.memberCount ?: 0} members",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (group?.kind == "travelers") {
            Surface(color = Success.copy(alpha = 0.12f), modifier = Modifier.fillMaxWidth()) {
                Row(Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Verified, null, tint = Success, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "You're in — everyone here has paid their deposit.",
                        style = MaterialTheme.typography.labelMedium,
                        color = Success,
                    )
                }
            }
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).fillMaxWidth(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            var lastDay: String? = null
            messages.forEach { msg ->
                if (msg.day != lastDay) {
                    lastDay = msg.day
                    item(key = "day-${msg.id}") { DaySeparator(msg.day) }
                }
                item(key = msg.id) { MessageBubble(msg) }
            }
        }

        Row(
            Modifier.background(MaterialTheme.colorScheme.surface).padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Message the group…") },
                shape = RoundedCornerShape(24.dp),
                maxLines = 3,
            )
            IconButton(onClick = {
                val text = input.trim()
                if (text.isEmpty()) return@IconButton
                input = ""
                scope.launch {
                    Api.client.sendGroupMessage(groupId, text)
                    messages = Api.client.fetchGroupMessages(groupId)
                }
            }) { Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = Amber) }
        }
    }
}

@Composable
private fun DaySeparator(day: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        HorizontalDivider(Modifier.weight(1f))
        Text(
            day,
            modifier = Modifier.padding(horizontal = 12.dp),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        HorizontalDivider(Modifier.weight(1f))
    }
}

@Composable
private fun MessageBubble(msg: GroupMessage) {
    val mine = msg.sender == "You"
    val team = msg.sender == "Togetha Team"
    Box(Modifier.fillMaxWidth(), contentAlignment = if (mine) Alignment.CenterEnd else Alignment.CenterStart) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 16.dp, topEnd = 16.dp,
                bottomStart = if (mine) 16.dp else 4.dp,
                bottomEnd = if (mine) 4.dp else 16.dp,
            ),
            color = when {
                mine -> Amber
                team -> MaterialTheme.colorScheme.secondaryContainer
                else -> MaterialTheme.colorScheme.surfaceVariant
            },
            modifier = Modifier.widthIn(max = 300.dp),
        ) {
            Column(Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                if (!mine) {
                    Text(
                        msg.sender,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (team) Success else Amber,
                    )
                } else if (club.togetha.app.core.state.AppState.isVerified) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("You", style = MaterialTheme.typography.labelSmall, color = Ink.copy(alpha = 0.7f))
                        Spacer(Modifier.width(3.dp))
                        Icon(
                            Icons.Filled.Verified,
                            contentDescription = "Verified",
                            tint = Ink.copy(alpha = 0.7f),
                            modifier = Modifier.size(12.dp),
                        )
                    }
                }
                Text(
                    msg.text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (mine) Ink else MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    msg.time,
                    style = MaterialTheme.typography.labelSmall,
                    color = if (mine) Ink.copy(alpha = 0.6f) else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.align(Alignment.End),
                )
            }
        }
    }
}
