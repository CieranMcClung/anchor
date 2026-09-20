package com.anchorfloat.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.anchorfloat.app.ui.theme.AnchorFloatTheme
import com.anchorfloat.app.ui.theme.Paper
import com.anchorfloat.app.ui.timeline.TimelineRoute
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AnchorFloatTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Paper,
                ) {
                    TimelineRoute()
                }
            }
        }
    }
}
