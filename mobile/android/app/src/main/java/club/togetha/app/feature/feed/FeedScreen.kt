package club.togetha.app.feature.feed

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import club.togetha.app.core.api.Api
import club.togetha.app.core.components.PhotoCard
import club.togetha.app.core.components.PrimaryButton
import club.togetha.app.core.model.TripPhoto
import club.togetha.app.ui.theme.Amber
import club.togetha.app.ui.theme.Radii
import kotlinx.coroutines.launch

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen() {
    var photos by remember { mutableStateOf<List<TripPhoto>>(emptyList()) }
    var reportTarget by remember { mutableStateOf<TripPhoto?>(null) }
    var showUpload by remember { mutableStateOf(false) }
    var photoPicked by remember { mutableStateOf(false) }
    var caption by remember { mutableStateOf("") }
    var consent by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        photos = Api.client.fetchFeed()
        loaded = true
    }

    val grouped = photos.groupBy { it.batchName }

    Column(Modifier.fillMaxSize()) {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item(span = { GridItemSpan(2) }) {
                Column {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("From the trips", style = MaterialTheme.typography.displayMedium)
                        TextButton(onClick = { showUpload = true; photoPicked = false; caption = ""; consent = false }) {
                            Icon(Icons.Filled.AddAPhoto, null, tint = Amber)
                            Spacer(Modifier.padding(2.dp))
                            Text("Share", color = Amber)
                        }
                    }
                    Text(
                        "Every photo here was approved by our team. Long-press any photo to report it.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (loaded && photos.isEmpty()) {
                item(span = { GridItemSpan(2) }) {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .padding(vertical = 64.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Icon(
                            Icons.Filled.AddAPhoto,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(12.dp))
                        Text("No trip photos yet", style = MaterialTheme.typography.headlineSmall)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "The first batch is packing. Photos land here once trips roll and our team approves them.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }
            grouped.forEach { (batchName, batchPhotos) ->
                item(span = { GridItemSpan(2) }) {
                    Text(
                        batchName,
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
                items(batchPhotos, key = { it.id }) { photo ->
                    PhotoCard(
                        photo = photo,
                        modifier = Modifier.combinedClickable(
                            onClick = {},
                            onLongClick = { reportTarget = photo },
                        ),
                    )
                }
            }
        }
        SnackbarHost(snackbar)
    }

    reportTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { reportTarget = null },
            title = { Text("Report this photo?") },
            text = { Text("Our team reviews every report. The photo stays hidden for you while we look into it.") },
            confirmButton = {
                TextButton(onClick = {
                    photos = photos.filterNot { it.id == target.id }
                    reportTarget = null
                    scope.launch { snackbar.showSnackbar("Reported — our team will review it.") }
                }) { Text("Report") }
            },
            dismissButton = { TextButton(onClick = { reportTarget = null }) { Text("Cancel") } },
        )
    }

    if (showUpload) {
        ModalBottomSheet(
            onDismissRequest = { showUpload = false },
            shape = RoundedCornerShape(topStart = Radii.sheet, topEnd = Radii.sheet),
        ) {
            Column(Modifier.padding(24.dp)) {
                Text("Share a trip photo", style = MaterialTheme.typography.headlineMedium)
                Spacer(Modifier.height(12.dp))
                if (!photoPicked) {
                    Text(
                        "Pick a photo from your trip. It goes to our team for review before anyone sees it.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Spacer(Modifier.height(20.dp))
                    PrimaryButton("Choose photo", onClick = { photoPicked = true }, modifier = Modifier.fillMaxWidth())
                } else {
                    OutlinedTextField(caption, { caption = it }, label = { Text("Caption") }, modifier = Modifier.fillMaxWidth())
                    Spacer(Modifier.height(16.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = consent, onCheckedChange = { consent = it })
                        Text(
                            "Everyone in these photos is okay being shared",
                            style = MaterialTheme.typography.bodyMedium,
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    PrimaryButton(
                        "Send for review",
                        enabled = consent && caption.isNotBlank(),
                        onClick = {
                            Api.mock.addPendingUpload(caption)
                            showUpload = false
                            scope.launch {
                                photos = Api.client.fetchFeed()
                                snackbar.showSnackbar("Sent — you'll see it once it's approved.")
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}
