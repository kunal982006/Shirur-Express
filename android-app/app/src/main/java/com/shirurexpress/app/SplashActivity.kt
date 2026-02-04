package com.shirurexpress.app

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AlphaAnimation
import android.view.animation.Animation
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    companion object {
        private const val SPLASH_DELAY = 4000L // 4 seconds
    }

    private lateinit var splashLogo: ImageView
    private lateinit var splashAppName: TextView
    private lateinit var splashProgress: ProgressBar
    private lateinit var splashLoadingText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        
        // Initialize views
        splashLogo = findViewById(R.id.splashLogo)
        splashAppName = findViewById(R.id.splashAppName)
        splashProgress = findViewById(R.id.splashProgress)
        splashLoadingText = findViewById(R.id.splashLoadingText)
        
        // Start fade-in animation for logo
        startLogoAnimation()
        
        // Delay then go to main activity with fade transition
        Handler(Looper.getMainLooper()).postDelayed({
            navigateToMainActivity()
        }, SPLASH_DELAY)
    }

    private fun startLogoAnimation() {
        // Fade in animation for logo
        val fadeIn = AlphaAnimation(0f, 1f).apply {
            duration = 800
            fillAfter = true
        }
        splashLogo.startAnimation(fadeIn)
        
        // Fade in app name with slight delay
        val fadeInName = AlphaAnimation(0f, 1f).apply {
            duration = 600
            startOffset = 400
            fillAfter = true
        }
        splashAppName.startAnimation(fadeInName)
        
        // Fade in loading indicator
        val fadeInLoading = AlphaAnimation(0f, 1f).apply {
            duration = 400
            startOffset = 800
            fillAfter = true
        }
        splashProgress.startAnimation(fadeInLoading)
        splashLoadingText.startAnimation(fadeInLoading)
    }

    private fun navigateToMainActivity() {
        // Fade out animation before transitioning
        val fadeOut = AlphaAnimation(1f, 0f).apply {
            duration = 300
            fillAfter = true
        }
        
        fadeOut.setAnimationListener(object : Animation.AnimationListener {
            override fun onAnimationStart(animation: Animation?) {}
            override fun onAnimationRepeat(animation: Animation?) {}
            override fun onAnimationEnd(animation: Animation?) {
                startActivity(Intent(this@SplashActivity, MainActivity::class.java))
                // Apply custom transition animation
                overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                finish()
            }
        })
        
        // Apply fade out to all views
        splashLogo.startAnimation(fadeOut)
        splashAppName.startAnimation(fadeOut)
        splashProgress.startAnimation(fadeOut)
        splashLoadingText.startAnimation(fadeOut)
    }
}
