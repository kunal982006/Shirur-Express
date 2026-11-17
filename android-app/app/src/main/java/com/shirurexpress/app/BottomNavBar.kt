package com.shirurexpress.app

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.util.TypedValue
import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONObject

/**
 * The bottom tab bar, drawn natively so taps answer instantly (ripple and a
 * light vibration) even while the page is busy.
 *
 * The website stays in charge of what the bar shows: it sends the list of tabs
 * (they depend on who is logged in), which one is selected, the colours, and
 * whether the bar should be showing at all - see NativeBottomNavSlot in
 * client/src/components/layout/header.tsx. Tapping a tab asks the website to
 * open that page.
 */
class BottomNavBar(
    private val container: View,
    private val row: LinearLayout,
    private val border: View,
    private val onNavigate: (href: String) -> Unit,
) {
    private val icons = mapOf(
        "home" to R.drawable.ic_nav_home,
        "bookings" to R.drawable.ic_nav_bookings,
        "deliveries" to R.drawable.ic_nav_deliveries,
        "dashboard" to R.drawable.ic_nav_dashboard,
        "settings" to R.drawable.ic_nav_settings,
        "login" to R.drawable.ic_nav_login,
    )

    private class Tab(val href: String, val view: View, val icon: ImageView, val label: TextView)

    private var tabs = listOf<Tab>()
    private var itemsKey = ""
    private var active: String? = null
    private var activeColor = Color.parseColor("#2563EB")
    private var inactiveColor = Color.parseColor("#0F172A")

    // The bar shows only when the website wants it and nothing native is in the way.
    private var wantedByWeb = false
    var blocked = false
        set(value) {
            field = value
            applyVisibility()
        }

    private fun dp(value: Float) = (value * container.resources.displayMetrics.density).toInt()

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
            container.setBackgroundColor(parseColor(colors.optString("background"), Color.WHITE))
            border.setBackgroundColor(parseColor(colors.optString("border"), Color.parseColor("#E2E8F0")))
            activeColor = parseColor(colors.optString("active"), activeColor)
            inactiveColor = parseColor(colors.optString("inactive"), inactiveColor)
        }

        val items = state.optJSONArray("items")
        val newKey = items?.toString() ?: ""
        if (items != null && newKey != itemsKey) {
            itemsKey = newKey
            row.removeAllViews()
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
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.5f)
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            maxLines = 1
            includeFontPadding = false
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = dp(4f) }
        }
        val view = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = true
            contentDescription = labelText
            val ripple = TypedValue()
            context.theme.resolveAttribute(android.R.attr.selectableItemBackground, ripple, true)
            setBackgroundResource(ripple.resourceId)
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f)
            addView(icon)
            addView(label)
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
        for (tab in tabs) {
            val selected = tab.href == active
            val color = if (selected) activeColor else inactiveColor
            tab.icon.imageTintList = ColorStateList.valueOf(color)
            tab.label.setTextColor(color)
            tab.view.isSelected = selected
        }
    }

    private fun applyVisibility() {
        container.visibility = if (wantedByWeb && !blocked) View.VISIBLE else View.GONE
    }
}
