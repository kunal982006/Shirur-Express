package com.shirurexpress.app

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.util.TypedValue
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.animation.OvershootInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

/**
 * The bottom tab bar, drawn natively so taps answer instantly (ripple and a
 * light vibration) even while the page is busy. It looks like a floating
 * frosted "island" in the page's own background colour, with a name under each
 * icon and a soft bubble that slides to the selected tab - the same design as
 * IslandBottomNav on the website.
 *
 * The website stays in charge of what the bar shows: it sends the list of tabs
 * (they depend on who is logged in), which one is selected, and whether the bar
 * should be showing at all - see NativeBottomNavSlot in
 * client/src/components/layout/header.tsx. Tapping a tab asks the website to
 * open that page.
 */
class BottomNavBar(
    private val container: View,
    private val island: View,
    private val indicator: View,
    private val row: LinearLayout,
    private val onNavigate: (href: String) -> Unit,
) {
    private val icons = mapOf(
        "home" to R.drawable.ic_nav_home,
        "bookings" to R.drawable.ic_nav_bookings,
        "deliveries" to R.drawable.ic_nav_deliveries,
        "dashboard" to R.drawable.ic_nav_dashboard,
        // The settings tab is shown as "Profile", so it gets the person icon.
        "settings" to R.drawable.ic_nav_login,
        "login" to R.drawable.ic_nav_login,
    )

    private class Tab(val href: String, val view: View, val icon: ImageView, val label: TextView)

    private var tabs = listOf<Tab>()
    private var itemsKey = ""
    private var active: String? = null
    private var indicatorPlaced = false
    private var activeColor = Color.parseColor("#2563EB")
    private var inactiveColor = Color.parseColor("#0F172A")

    // The bar shows only when the website wants it and nothing native is in the way.
    private var wantedByWeb = false
    var blocked = false
        set(value) {
            field = value
            applyVisibility()
        }

    init {
        // Tab widths are only known after layout; keep the bubble sized to them.
        row.addOnLayoutChangeListener { _, left, _, right, _, oldLeft, _, oldRight, _ ->
            if (right - left != oldRight - oldLeft) {
                indicatorPlaced = false
                applySelection()
            }
        }
    }

    private fun dp(value: Float) = (value * container.resources.displayMetrics.density).toInt()

    private fun withAlpha(color: Int, alpha: Int) =
        Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color))

    private fun parseColor(value: String?, fallback: Int) = try {
        if (value.isNullOrEmpty()) fallback else Color.parseColor(value)
    } catch (e: IllegalArgumentException) {
        fallback
    }

    /** Applies the state the website sent through AndroidApp.setBottomNav(json). */
    fun update(json: String) {
        val state = try {
            JSONObject(json)
        } catch (e: Exception) {
            return
        }

        state.optJSONObject("colors")?.let { colors ->
            // Mostly see-through, so the page behind tints the pill.
            val background = parseColor(colors.optString("background"), Color.WHITE)
            (island.background.mutate() as? GradientDrawable)
                ?.setColor(withAlpha(background, 0xC8))
            activeColor = parseColor(colors.optString("active"), activeColor)
            inactiveColor = parseColor(colors.optString("inactive"), inactiveColor)
            (indicator.background.mutate() as? GradientDrawable)
                ?.setColor(withAlpha(activeColor, 0x26))
        }

        val items = state.optJSONArray("items")
        val newKey = items?.toString() ?: ""
        if (items != null && newKey != itemsKey) {
            itemsKey = newKey
            row.removeAllViews()
            indicatorPlaced = false
            tabs = (0 until items.length()).mapNotNull { index ->
                val item = items.optJSONObject(index) ?: return@mapNotNull null
                createTab(item.optString("href"), item.optString("label"), item.optString("icon"))
            }
        }

        active = if (state.isNull("active")) null else state.optString("active")
        applySelection()

        wantedByWeb = state.optBoolean("visible", false) && tabs.isNotEmpty()
        applyVisibility()
    }

    private fun createTab(href: String, labelText: String, iconName: String): Tab {
        val context = row.context
        val icon = ImageView(context).apply {
            setImageResource(icons[iconName] ?: R.drawable.ic_nav_dashboard)
            layoutParams = LinearLayout.LayoutParams(dp(20f), dp(20f))
        }
        val label = TextView(context).apply {
            text = labelText
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10f)
            maxLines = 1
            includeFontPadding = false
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = dp(3f) }
        }
        val view = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = true
            contentDescription = labelText
            val ripple = TypedValue()
            context.theme.resolveAttribute(android.R.attr.selectableItemBackgroundBorderless, ripple, true)
            foreground = context.getDrawable(ripple.resourceId)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
            addView(icon)
            addView(label)
            setOnTouchListener { v, event ->
                // Small press-in, like the website's active:scale-90.
                when (event.actionMasked) {
                    android.view.MotionEvent.ACTION_DOWN ->
                        v.animate().scaleX(0.9f).scaleY(0.9f).setDuration(100).start()
                    android.view.MotionEvent.ACTION_UP, android.view.MotionEvent.ACTION_CANCEL ->
                        v.animate().scaleX(1f).scaleY(1f).setDuration(150).start()
                }
                false
            }
            setOnClickListener {
                it.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                // Highlight straight away; the website confirms the selection a moment later.
                active = href.takeIf { target -> target != "/login" }
                applySelection()
                onNavigate(href)
            }
        }
        row.addView(view)
        return Tab(href, view, icon, label)
    }

    private fun applySelection() {
        var selectedIndex = -1
        tabs.forEachIndexed { index, tab ->
            val selected = tab.href == active
            if (selected) selectedIndex = index
            val color = if (selected) activeColor else withAlpha(inactiveColor, 0xBF)
            tab.icon.imageTintList = ColorStateList.valueOf(color)
            tab.label.setTextColor(color)
            tab.label.typeface = Typeface.create(
                if (selected) "sans-serif" else "sans-serif-medium",
                if (selected) Typeface.BOLD else Typeface.NORMAL,
            )
            tab.view.isSelected = selected
        }

        if (tabs.isEmpty() || row.width == 0) return
        if (selectedIndex < 0) {
            indicator.animate().alpha(0f).setDuration(150).start()
            return
        }

        val tabWidth = row.width / tabs.size
        val inset = dp(2f)
        val params = indicator.layoutParams
        if (params.width != tabWidth - inset * 2) {
            params.width = tabWidth - inset * 2
            indicator.layoutParams = params
        }
        val targetX = (tabWidth * selectedIndex + inset).toFloat()
        indicator.visibility = View.VISIBLE
        if (!indicatorPlaced) {
            // First placement (or new tabs): jump there instead of sliding in from the side.
            indicator.animate().cancel()
            indicator.translationX = targetX
            indicator.alpha = 1f
            indicatorPlaced = true
        } else {
            indicator.animate()
                .translationX(targetX)
                .alpha(1f)
                .setInterpolator(OvershootInterpolator(1.2f))
                .setDuration(300)
                .start()
        }
    }

    private fun applyVisibility() {
        container.visibility = if (wantedByWeb && !blocked) View.VISIBLE else View.GONE
    }
}
