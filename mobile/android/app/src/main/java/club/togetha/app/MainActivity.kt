package club.togetha.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import club.togetha.app.nav.TogethaRoot
import club.togetha.app.ui.theme.TogethaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            TogethaTheme {
                TogethaRoot()
            }
        }
    }
}
