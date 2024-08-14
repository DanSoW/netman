package com.main.netman.exec.exit

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.main.netman.R
import kotlin.system.exitProcess

class ExitAppActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_exit_app)

        finishAndRemoveTask()
        exitProcess(0)
    }
}