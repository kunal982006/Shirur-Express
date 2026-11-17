package com.shirurexpress.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.os.SystemClock
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator

/**
 * The animated splash, drawn on top of the WebView inside MainActivity.
 *
 * It used to be a separate screen that always waited 4 seconds and only then
 * started loading the app. Now the app loads underneath while the logo
 * animates, and the splash lifts as soon as the first screen is ready: no fixed
 * wait and no blank screen in between.
 */
class SplashOverlay(private val root: View) {

    companion object {
        // Long enough for the logo to finish popping in, so it never just flickers past.
        private const val MIN_VISIBLE_MS = 1100L
    }

    private val logo: View = root.findViewById(R.id.splashLogo)
    private val glow: View = root.findViewById(R.id.splashGlow)
    private val ring1: View = root.findViewById(R.id.splashRing1)
    private val ring2: View = root.findViewById(R.id.splashRing2)
    private val appName: View = root.findViewById(R.id.splashAppName)
    private val tagline: View = root.findViewById(R.id.splashTagline)
    private val bar: View = root.findViewById(R.id.splashBar)
    private val barIndicator: View = root.findViewById(R.id.splashBarIndicator)

    // Endless animations (rings, glow, loading bar) are cancelled when the splash goes away
    private val loopingAnimators = mutableListOf<Animator>()
    private var shownAt = 0L
    private var dismissing = false

    val isShowing: Boolean get() = root.visibility == View.VISIBLE && !dismissing

    private fun dp(value: Float) = value * root.resources.displayMetrics.density

    fun show() {
        shownAt = SystemClock.uptimeMillis()
        root.visibility = View.VISIBLE
        // Touches must not fall through to the page loading underneath.
        root.isClickable = true

        // Logo pops in: grows from small with a slight spin and a springy overshoot
        logo.apply {
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
        glow.apply {
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
        startRingRipple(ring1, startDelay = 700)
        startRingRipple(ring2, startDelay = 1500)

        // Name and tagline slide up into place
        slideUp(appName, startDelay = 450)
        slideUp(tagline, startDelay = 650)

        // Loading bar fades in and its highlight sweeps back and forth
        bar.animate().alpha(1f).setStartDelay(900).setDuration(400).start()
        val travel = dp(140f - 56f)
        ObjectAnimator.ofFloat(barIndicator, View.TRANSLATION_X, 0f, travel).apply {
            duration = 900
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            interpolator = AccelerateDecelerateInterpolator()
            start()
            loopingAnimators += this
        }
    }

    /** Removes the splash at once, with no animation (app restored, or an error screen must show). */
    fun hideNow() {
        dismissing = true
        stopAnimations()
        root.visibility = View.GONE
    }

    /** Fades the splash away once it has been up for the minimum time. Safe to call more than once. */
    fun dismiss(onGone: () -> Unit = {}) {
        if (root.visibility != View.VISIBLE || dismissing) return
        dismissing = true
        val wait = (MIN_VISIBLE_MS - (SystemClock.uptimeMillis() - shownAt)).coerceAtLeast(0L)
        root.postDelayed({
            // Logo zooms slightly forward while the whole splash fades out
            logo.animate()
                .scaleX(1.15f).scaleY(1.15f)
                .setStartDelay(0)
                .setDuration(300)
                .setInterpolator(AccelerateInterpolator())
                .start()
            root.animate()
                .alpha(0f)
                .setDuration(300)
                .setListener(object : AnimatorListenerAdapter() {
                    override fun onAnimationEnd(animation: Animator) {
                        stopAnimations()
                        root.visibility = View.GONE
                        onGone()
                    }
                })
                .start()
        }, wait)
    }

    private fun stopAnimations() {
        loopingAnimators.forEach { it.cancel() }
        loopingAnimators.clear()
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
        if (dismissing) return
        ObjectAnimator.ofFloat(glow, View.ALPHA, 1f, 0.55f).apply {
            duration = 1200
            repeatCount = ValueAnimator.INFINITE
            repeatMode = ValueAnimator.REVERSE
            start()
            loopingAnimators += this
        }
    }
}
