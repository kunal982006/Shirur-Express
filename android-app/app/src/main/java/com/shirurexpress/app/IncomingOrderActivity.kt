package com.shirurexpress.app

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.enableEdgeToEdge

class IncomingOrderActivity : AppCompatActivity() {

    private var ringtone: Ringtone? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Unlock screen and wake up device
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
            keyguardManager.requestDismissKeyguard(this, null)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            )
        }

        setContentView(R.layout.activity_incoming_order)

        // Parse data from notification
        val customerName = intent.getStringExtra("customerName") ?: "New Customer"
        val amount = intent.getStringExtra("amount") ?: "0"
        val drop = intent.getStringExtra("dropAddress") ?: ""
        val itemsSummary = intent.getStringExtra("itemsSummary") ?: ""
        val navigateTo = intent.getStringExtra("navigateTo")

        // Populate UI
        findViewById<TextView>(R.id.customerNameText).text = customerName
        findViewById<TextView>(R.id.amountText).text = "₹$amount"
        findViewById<TextView>(R.id.dropText).text = if (drop.isNotEmpty()) "📍 $drop" else ""
        
        val itemsText = findViewById<TextView>(R.id.itemsSummaryText)
        if (itemsSummary.isNotEmpty()) {
            itemsText.text = "🛒 $itemsSummary"
        } else {
            itemsText.text = ""
        }

        // "View Order" button — navigates to the correct dashboard
        findViewById<Button>(R.id.btnViewOrder).setOnClickListener {
            viewOrder(navigateTo)
        }

        // Start Ringing
        playRingtone()
    }

    private fun playRingtone() {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ringtone = RingtoneManager.getRingtone(applicationContext, uri)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                ringtone?.isLooping = true
            }
            ringtone?.play()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun stopRingtone() {
        try {
            ringtone?.stop()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun viewOrder(navigateTo: String?) {
        stopRingtone()

        // Use the navigateTo path from the notification (set by server)
        // - Provider accounts get "/provider/dashboard"
        // - Admin accounts get "/admin"
        // - Delivery partners get "/delivery-partner/dashboard"
        // Fallback to "/provider/dashboard" if not specified
        val path = navigateTo ?: "/provider/dashboard"
        val fullUrl = "https://shirur-express.onrender.com$path"

        // Open Main Activity (WebView) deep linked to the dashboard
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data = Uri.parse(fullUrl)
        }
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRingtone()
    }
}
