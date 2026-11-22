package com.shirurexpress.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        // TODO: Send this token to your server to associate it with the logged-in provider
        // You can use a local broadcast or shared preferences to save it until the user logs in
        getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "From: ${remoteMessage.from}")

        // Check if message contains a data payload.
        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            handleNow(remoteMessage.data)
        }

        // Check if message contains a notification payload.
        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            // Typically we ignore standard notification payloads if we want custom "ringing" behavior
            // because simple notifications are handled by the system tray automatically when backgrounded.
        }
    }

    private fun handleNow(data: Map<String, String>) {
        val type = data["type"]
        
        if (type == "ORDER_REQUEST") {
            // This is the "Ring" trigger!
            showIncomingOrderScreen(data)
        } else if (type == "ORDER_STATUS") {
            // Customer's pinned live order status (accepted → preparing → ready → on the way → delivered)
            showOrderStatusNotification(data)
        } else {
            // Regular notification
            sendNotification(data["title"] ?: "New Message", data["body"] ?: "", data["navigateTo"], type == "ADMIN_BROADCAST")
        }
    }

    private fun showIncomingOrderScreen(data: Map<String, String>) {
        val intent = Intent(this, IncomingOrderActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
            // Pass data to the activity
            putExtra("orderId", data["orderId"])
            putExtra("customerName", data["customerName"])
            putExtra("amount", data["amount"])
            putExtra("pickupAddress", data["pickupAddress"])
            putExtra("dropAddress", data["dropAddress"])
            putExtra("navigateTo", data["navigateTo"])
        }
        
        // For Android 10+ (API 29+) we need to use a full-screen intent notification
        // so the system can decide whether to show the UI or a heads-up notification
        // depending on whether the device is in use.
        
        val fullScreenIntent = PendingIntent.getActivity(
            this, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = getString(R.string.incoming_order_channel_id)
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("New Order Request")
            .setContentText("Tap to view order details")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setFullScreenIntent(fullScreenIntent, true) // This triggers the "Ringing" screen
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(longArrayOf(0, 1000, 1000, 1000, 1000)) // Start immediately
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Since android Oreo notification channel is needed.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Incoming Orders (Ringing)",
                NotificationManager.IMPORTANCE_HIGH // MAX is deprecated for channels, HIGH is capable of sound/heads-up
            ).apply {
                description = "Notifications for new incoming orders with ringing sound"
                setSound(defaultSoundUri, AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build())
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 1000, 1000, 1000)
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                setBypassDnd(true) // Try to bypass DND if possible/permitted
            }
            notificationManager.createNotificationChannel(channel)
        }

        val notification = notificationBuilder.build()
        // FLAG_INSISTENT makes the sound loop continuously until the user interacts with the notification
        notification.flags = notification.flags or android.app.Notification.FLAG_INSISTENT
        
        notificationManager.notify(0, notification)
    }

    /**
     * One notification per order that stays pinned and updates in place until the order is
     * delivered or cancelled, like Blinkit. Status changes make a sound; arrival-time
     * refreshes ("Arriving in 6 min") update silently.
     */
    private fun showOrderStatusNotification(data: Map<String, String>) {
        val orderId = data["orderId"] ?: return
        val title = data["title"] ?: "Order update"
        val body = data["body"] ?: ""
        val isFinal = data["final"] == "1"
        val makeSound = data["alert"] == "1"
        val step = data["step"]?.toIntOrNull() ?: 0
        val steps = data["steps"]?.toIntOrNull() ?: 5
        val status = data["status"] ?: ""
        val notificationId = ORDER_STATUS_ID_BASE + (orderId.hashCode() and 0xFFFFF)

        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
            putExtra("navigateTo", data["navigateTo"] ?: "/order/$orderId/track")
        }
        val pendingIntent = PendingIntent.getActivity(
            this, notificationId, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        createOrderStatusChannel(this)

        val builder = NotificationCompat.Builder(this, ORDER_STATUS_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setSubText(data["shopName"])
            .setContentIntent(pendingIntent)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setShowWhen(true)
            .setOnlyAlertOnce(!makeSound)
            .setSilent(!makeSound)

        if (isFinal) {
            builder.setOngoing(false)
                .setAutoCancel(true)
                .setTimeoutAfter(60 * 60 * 1000L) // clears itself an hour after delivery
            if (status == "delivered") builder.setProgress(steps, steps, false)
        } else {
            builder.setOngoing(true)
                .setAutoCancel(false)
                .setProgress(steps, step.coerceIn(0, steps), false)
            // Android 16+: ask for a "Live Update" (status-bar chip, top of the shade, like
            // Blinkit). Older Android versions ignore this extra.
            builder.addExtras(android.os.Bundle().apply { putBoolean("android.requestPromotedOngoing", true) })
        }

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(notificationId, builder.build())
    }

    private fun sendNotification(title: String, messageBody: String, navigateTo: String? = null, isBroadcast: Boolean = false) {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        if (navigateTo != null) intent.putExtra("navigateTo", navigateTo)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Offers and announcements: own channel, normal message tone, never the order ringtone.
        val channelId = if (isBroadcast) ANNOUNCEMENTS_CHANNEL_ID else getString(R.string.default_notification_channel_id)
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (isBroadcast) {
            createAnnouncementsChannel(this)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "General Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(0 /* ID of notification */, notificationBuilder.build())
    }

    companion object {
        private const val TAG = "MyFirebaseMsgService"
        const val ANNOUNCEMENTS_CHANNEL_ID = "announcements_channel"
        const val ORDER_STATUS_CHANNEL_ID = "order_status_channel"
        private const val ORDER_STATUS_ID_BASE = 0x4000000

        fun createOrderStatusChannel(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val channel = NotificationChannel(
                ORDER_STATUS_CHANNEL_ID,
                "Order Status",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Live status of your order until it is delivered"
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            }
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }

        // Made at app start too, so broadcasts shown by Android while the app is closed use it.
        fun createAnnouncementsChannel(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val channel = NotificationChannel(
                ANNOUNCEMENTS_CHANNEL_ID,
                "Offers & Announcements",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Offers and news from Shirur Express"
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
            }
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }
}
