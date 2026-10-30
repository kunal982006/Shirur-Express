package com.shirurexpress.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.enableEdgeToEdge

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    companion object {
        private const val SPLASH_DELAY = 4000L // 4 seconds
    }

    private lateinit var splashRoot: View
    private lateinit var splashLogo: View
    private lateinit var splashGlow: View
    private lateinit var splashRing1: View
    private lateinit var splashRing2: View
    private lateinit var splashAppName: View
    private lateinit var splashTagline: View
    private lateinit var splashBar: View
    private lateinit var splashBarIndicator: View

    private val handler = Handler(Looper.getMainLooper())
    // Endless animations (rings, glow, loading bar) are cancelled when leaving
    private val loopingAnimators = mutableListOf<Animator>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_splash)

        // Initialize views
        splashRoot = findViewById(R.id.splashRoot)
        splashLogo = findViewById(R.id.splashLogo)
        splashGlow = findViewById(R.id.splashGlow)
        splashRing1 = findViewById(R.id.splashRing1)
        splashRing2 = findViewById(R.id.splashRing2)
        splashAppName = findViewById(R.id.splashAppName)
        splashTagline = findViewById(R.id.splashTagline)
        splashBar = findViewById(R.id.splashBar)
        splashBarIndicator = findViewById(R.id.splashBarIndicator)

        startIntroAnimation()

        // Delay then go to main activity with fade transition
        handler.postDelayed({ navigateToMainActivity() }, SPLASH_DELAY)
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        loopingAnimators.forEach { it.cancel() }
        super.onDestroy()
    }

    private fun dp(value: Float) = value * resources.displayMetrics.density

    private fun startIntroAnimation() {
        // Logo pops in: grows from small with a slight spin and a springy overshoot
        splashLogo.apply {
            scaleX = 0.3f
            scaleY = 0.3f
            rotation = -30f
            animate()
                .alpha(1f).scaleX(1f).scaleY(1f).rotation(0f)
                .setDuration(900)
                .setInterpolator(OvershootInterpolator(1.6f))
                .start()
        }

        // Soft glow fades in behind the logo, then breathes
        splashGlow.apply {
            scaleX = 0.6f
            scaleY = 0.6f
            animate()
                .alpha(1f).scaleX(1f).scaleY(1f)
                .setStartDelay(300)
                .setDuration(700)
                .setInterpolator(DecelerateInterpolator())
                .withEndAction { startGlowBreathing() }
                .start()
        }

        // Two rings ripple outward from the logo, one after the other
        startRingRipple(splashRing1, startDelay = 700)
        startRingRipple(splashRing2, startDelay = 1500)

        // Name and tagline slide up into place
        slideUp(splashAppName, startDelay = 450)
        slideUp(splashTagline, startDelay = 650)

        // Loading bar fades in and its highlight sweeps back and forth
        splashBar.animate().alpha(1f).setStartDelay(900).setDuration(400).start()
        val travel = dp(140f - 56f)
        ObjectAnimator.ofFloat(splashBarIndicator, View.TRANSLATION_X, 0f, travel).apply {
            duration = 900
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            start()
            loopingAnimators += this
        }
    }

    private fun slideUp(view: View, startDelay: Long) {
        view.translationY = dp(24f)
        view.animate()
            .alpha(1f).translationY(0f)
            .setStartDelay(startDelay)
            .setDuration(600)
            .setInterpolator(DecelerateInterpolator(1.5f))
            .start()
    }

    private fun startRingRipple(ring: View, startDelay: Long) {
        val scaleX = ObjectAnimator.ofFloat(ring, View.SCALE_X, 1f, 1.55f)
        val scaleY = ObjectAnimator.ofFloat(ring, View.SCALE_Y, 1f, 1.55f)
        val fade = ObjectAnimator.ofFloat(ring, View.ALPHA, 0.8f, 0f)
        listOf(scaleX, scaleY, fade).forEach {
            it.repeatCount = ValueAnimator.INFINITE
            it.duration = 1600
        }
        AnimatorSet().apply {
            playTogether(scaleX, scaleY, fade)
            interpolator = DecelerateInterpolator()
            this.startDelay = startDelay
            start()
            loopingAnimators += this
        }
    }

    private fun startGlowBreathing() {
        if (isFinishing) return
        ObjectAnimator.ofFloat(splashGlow, View.ALPHA, 1f, 0.55f).apply {
            duration = 1200
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            start()
            loopingAnimators += this
        }
    }

    private fun navigateToMainActivity() {
        // Logo zooms slightly forward while the whole screen fades out
        splashLogo.animate()
            .scaleX(1.15f).scaleY(1.15f)
            .setStartDelay(0)
            .setDuration(350)
            .setInterpolator(AccelerateInterpolator())
            .start()

        splashRoot.animate()
            .alpha(0f)
            .setDuration(350)
            .setListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    startActivity(Intent(this@SplashActivity, MainActivity::class.java))
                    // Apply custom transition animation
                    overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
                    finish()
                }
            })
            .start()
    }
}
