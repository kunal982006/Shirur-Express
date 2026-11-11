package com.shirurexpress.app

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothClass
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Base64
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.util.UUID
import java.util.concurrent.Executors

/**
 * Prints receipts on cheap 58mm Bluetooth thermal printers (PeriPeri POS58 and
 * similar). These use Classic Bluetooth SPP and understand ESC/POS commands.
 *
 * The website decides what the receipt looks like and sends a list of lines;
 * this class only turns them into ESC/POS bytes. That way the bill layout can
 * change with a website deploy instead of a new app release.
 *
 * Callers must check BLUETOOTH_CONNECT permission (Android 12+) first.
 */
class PrinterManager(context: Context) {

    class PrinterException(val code: String, message: String) : Exception(message)

    companion object {
        private const val TAG = "PrinterManager"
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val PREFS = "printer_prefs"
        private const val KEY_ADDRESS = "printer_address"
        private const val KEY_NAME = "printer_name"

        private val ESC_INIT = byteArrayOf(0x1B, 0x40)
        private fun escAlign(n: Int) = byteArrayOf(0x1B, 0x61, n.toByte())
        private fun escBold(on: Boolean) = byteArrayOf(0x1B, 0x45, if (on) 1 else 0)
        private fun gsSize(n: Int) = byteArrayOf(0x1D, 0x21, n.toByte())
        private fun escFeed(lines: Int) = byteArrayOf(0x1B, 0x64, lines.coerceIn(0, 10).toByte())
    }

    private val appContext = context.applicationContext
    private val prefs = appContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    // One print at a time: the printer cannot take two connections at once.
    private val executor = Executors.newSingleThreadExecutor()

    private val adapter: BluetoothAdapter?
        get() = (appContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

    fun savedPrinter(): JSONObject? {
        val address = prefs.getString(KEY_ADDRESS, null) ?: return null
        return JSONObject().put("address", address).put("name", prefs.getString(KEY_NAME, "") ?: "")
    }

    fun savePrinter(address: String, name: String) {
        prefs.edit().putString(KEY_ADDRESS, address).putString(KEY_NAME, name).apply()
    }

    fun clearPrinter() {
        prefs.edit().remove(KEY_ADDRESS).remove(KEY_NAME).apply()
    }

    private fun requireAdapter(): BluetoothAdapter {
        val a = adapter ?: throw PrinterException("NO_BLUETOOTH", "This phone does not support Bluetooth.")
        if (!a.isEnabled) throw PrinterException("BLUETOOTH_OFF", "Bluetooth is off. Please turn it on.")
        return a
    }

    /** Paired devices, printers first. Pairing itself happens in Android Bluetooth settings. */
    @SuppressLint("MissingPermission")
    fun pairedDevices(): JSONArray {
        val list = requireAdapter().bondedDevices.orEmpty().map { d ->
            val major = try { d.bluetoothClass?.majorDeviceClass } catch (e: Exception) { null }
            val name = try { d.name } catch (e: Exception) { null } ?: d.address
            val looksLikePrinter = major == BluetoothClass.Device.Major.IMAGING ||
                Regex("print|pos|mpt|rpp|pt-|58|thermal|peri", RegexOption.IGNORE_CASE).containsMatchIn(name)
            Triple(d, name, looksLikePrinter)
        }.sortedByDescending { it.third }

        val result = JSONArray()
        list.forEach { (d, name, isPrinter) ->
            result.put(JSONObject().put("address", d.address).put("name", name).put("likelyPrinter", isPrinter))
        }
        return result
    }

    /** Runs the print on a background thread and reports back through [onDone]. */
    fun print(payloadJson: String, onDone: (JSONObject) -> Unit) {
        executor.execute {
            val result = try {
                val payload = JSONObject(payloadJson)
                val address = payload.optString("address").ifBlank { prefs.getString(KEY_ADDRESS, null) }
                    ?: throw PrinterException("NO_PRINTER", "No printer selected. Please select your printer first.")
                val lines = payload.getJSONArray("lines")
                val bytes = buildEscPos(lines, payload.optInt("feed", 4))
                val copies = payload.optInt("copies", 1).coerceIn(1, 3)
                val hasImage = (0 until lines.length()).any { lines.optJSONObject(it)?.has("image") == true }
                sendToPrinter(address, bytes, copies, slow = hasImage)
                JSONObject().put("ok", true)
            } catch (e: PrinterException) {
                Log.w(TAG, "Print failed: ${e.code} ${e.message}")
                JSONObject().put("ok", false).put("code", e.code).put("message", e.message)
            } catch (e: Exception) {
                Log.e(TAG, "Print failed", e)
                JSONObject().put("ok", false).put("code", "PRINT_FAILED")
                    .put("message", "Printing failed. Check that the printer is on and try again.")
            }
            onDone(result)
        }
    }

    /**
     * Each line: { text, align: left|center|right, bold, size: normal|tall|wide|large }
     * Text must already be plain ASCII (the website does that); anything else prints as '?'.
     *
     * An image line instead carries { image: { data, width, height } }: a 1-bit raster
     * (1 = black, rows packed MSB first, ceil(width/8) bytes per row) as base64.
     * The website does the resizing and black/white conversion.
     */
    private fun buildEscPos(lines: JSONArray, feed: Int): ByteArray {
        val out = ByteArrayOutputStream()
        out.write(ESC_INIT)
        for (i in 0 until lines.length()) {
            val line = lines.optJSONObject(i) ?: continue
            val image = line.optJSONObject("image")
            if (image != null) {
                writeRasterImage(out, image)
                continue
            }
            out.write(escAlign(when (line.optString("align")) { "center" -> 1; "right" -> 2; else -> 0 }))
            out.write(escBold(line.optBoolean("bold", false)))
            out.write(gsSize(when (line.optString("size")) { "tall" -> 0x01; "wide" -> 0x10; "large" -> 0x11; else -> 0x00 }))
            out.write(line.optString("text").toByteArray(Charsets.US_ASCII))
            out.write(0x0A)
        }
        out.write(escBold(false))
        out.write(gsSize(0))
        out.write(escAlign(0))
        out.write(escFeed(feed))
        return out.toByteArray()
    }

    /** GS v 0 raster, sent in bands so small printer buffers are not overrun. */
    private fun writeRasterImage(out: ByteArrayOutputStream, image: JSONObject) {
        val width = image.optInt("width")
        val height = image.optInt("height")
        if (width <= 0 || width > 576 || height <= 0 || height > 2000) return
        val widthBytes = (width + 7) / 8
        val data = try {
            Base64.decode(image.optString("data"), Base64.DEFAULT)
        } catch (e: IllegalArgumentException) {
            return
        }
        if (data.size < widthBytes * height) return

        out.write(escAlign(1))
        var row = 0
        while (row < height) {
            val rows = minOf(32, height - row)
            out.write(
                byteArrayOf(
                    0x1D, 0x76, 0x30, 0x00,
                    (widthBytes and 0xFF).toByte(), ((widthBytes shr 8) and 0xFF).toByte(),
                    (rows and 0xFF).toByte(), ((rows shr 8) and 0xFF).toByte(),
                )
            )
            out.write(data, row * widthBytes, rows * widthBytes)
            row += rows
        }
        out.write(escAlign(0))
    }

    @SuppressLint("MissingPermission")
    private fun sendToPrinter(address: String, data: ByteArray, copies: Int, slow: Boolean = false) {
        val a = requireAdapter()
        val device = try {
            a.getRemoteDevice(address)
        } catch (e: IllegalArgumentException) {
            throw PrinterException("NO_PRINTER", "Saved printer is invalid. Please select your printer again.")
        }
        try { a.cancelDiscovery() } catch (e: Exception) { }

        val socket = connect(device)
        try {
            val stream = socket.outputStream
            repeat(copies) {
                // Small chunks: cheap printers have tiny buffers and drop data if flooded.
                var offset = 0
                while (offset < data.size) {
                    val len = minOf(512, data.size - offset)
                    stream.write(data, offset, len)
                    stream.flush()
                    offset += len
                    // Images print slower than text arrives; give the printer time to keep up.
                    Thread.sleep(if (slow) 60 else 20)
                }
            }
            // Closing right after the write can cut off the end of the bill.
            Thread.sleep(1200L + data.size * copies / (if (slow) 10 else 20))
        } catch (e: IOException) {
            throw PrinterException("PRINT_FAILED", "Connection to the printer was lost while printing. Please try again.")
        } finally {
            try { socket.close() } catch (e: Exception) { }
        }
    }

    /** Tries the normal SPP socket first, then the fallbacks many cheap printers need. */
    @SuppressLint("MissingPermission")
    private fun connect(device: BluetoothDevice): BluetoothSocket {
        val attempts: List<() -> BluetoothSocket> = listOf(
            { device.createRfcommSocketToServiceRecord(SPP_UUID) },
            { device.createInsecureRfcommSocketToServiceRecord(SPP_UUID) },
            {
                device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                    .invoke(device, 1) as BluetoothSocket
            },
        )
        var lastError: Exception? = null
        for (create in attempts) {
            var socket: BluetoothSocket? = null
            try {
                socket = create()
                socket.connect()
                return socket
            } catch (e: Exception) {
                lastError = e
                try { socket?.close() } catch (ignored: Exception) { }
            }
        }
        Log.w(TAG, "Could not connect to ${device.address}", lastError)
        throw PrinterException(
            "CONNECT_FAILED",
            "Could not connect to the printer. Make sure it is switched on, nearby, and not connected to another phone."
        )
    }
}
