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

        // Parse data
        val customerName = intent.getStringExtra("customerName") ?: "Unknown User"
        val amount = intent.getStringExtra("amount") ?: "0"
        val pickup = intent.getStringExtra("pickupAddress") ?: ""
        val drop = intent.getStringExtra("dropAddress") ?: ""
        val orderId = intent.getStringExtra("orderId")

        findViewById<TextView>(R.id.customerNameText).text = customerName
        findViewById<TextView>(R.id.amountText).text = "₹$amount"
        findViewById<TextView>(R.id.pickupText).text = "Pickup: $pickup"
        findViewById<TextView>(R.id.dropText).text = "Drop: $drop"

        val navigateTo = intent.getStringExtra("navigateTo")

        // Setup "Order Confirmed" button — opens dashboard directly
        findViewById<Button>(R.id.btnConfirm).setOnClickListener {
            confirmOrder(orderId, navigateTo)
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

    private fun confirmOrder(orderId: String?, navigateTo: String?) {
        stopRingtone()

        val path = navigateTo ?: "/provider/orders/$orderId"
        val fullUrl = if (path.startsWith("http")) path else "https://shirur-express.onrender.com$path"

        // Open Main Activity (WebView) deep linked to the order
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
