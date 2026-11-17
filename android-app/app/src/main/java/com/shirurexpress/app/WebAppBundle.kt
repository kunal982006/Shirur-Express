package com.shirurexpress.app

import android.content.Context
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Serves the website's own files (HTML, JS, CSS, icons) from inside the APK
 * instead of downloading them on every launch.
 *
 * The WebView still loads https://shirur-express.onrender.com, so cookies, the
 * login session, saved cart, payments and the API all behave exactly as before.
 * Only requests for the app's static files are answered from the phone; every
 * /api call and every image from the menu still goes to the server.
 *
 * Staying up to date: the bundled copy is what the app shows first. In the
 * background the app asks the server for its current page; if the server has a
 * newer version, that page is saved and used from then on (its script files are
 * taken from the APK when they match and from the network when they are new).
 * A web deploy therefore still reaches app users without a Play Store release.
 *
 * The files are copied in by `npm run android:bundle`. Without them the app
 * simply loads everything from the server, as older versions did.
 */
class WebAppBundle(context: Context) {

    companion object {
        const val HOST = "shirur-express.onrender.com"
        const val ORIGIN = "https://$HOST"
        private const val TAG = "WebAppBundle"
        private const val ASSET_ROOT = "web"
        private const val MAX_SHELL_BYTES = 512 * 1024

        private val MIME_TYPES = mapOf(
            "html" to "text/html",
            "js" to "text/javascript",
            "mjs" to "text/javascript",
            "css" to "text/css",
            "json" to "application/json",
            "map" to "application/json",
            "xml" to "application/xml",
            "txt" to "text/plain",
            "svg" to "image/svg+xml",
            "png" to "image/png",
            "jpg" to "image/jpeg",
            "jpeg" to "image/jpeg",
            "webp" to "image/webp",
            "gif" to "image/gif",
            "ico" to "image/x-icon",
            "woff" to "font/woff",
            "woff2" to "font/woff2",
            "ttf" to "font/ttf",
            "wasm" to "application/wasm",
        )
        private val TEXT_TYPES = setOf("html", "js", "mjs", "css", "json", "map", "xml", "txt", "svg")
    }

    private val assets = context.applicationContext.assets
    private val savedShellFile = File(context.applicationContext.filesDir, "web-shell/index.html")

    private val bundledShell: ByteArray? = try {
        assets.open("$ASSET_ROOT/index.html").use { it.readBytes() }
    } catch (e: IOException) {
        null
    }

    /** False when the APK was built without the website files. */
    val isAvailable: Boolean get() = bundledShell != null

    /** Set when the bundled files failed to start; the server is then used directly. */
    @Volatile
    var networkOnly: Boolean = false

    // The page handed to the WebView: the server's newer one if we have it, else the bundled one.
    @Volatile
    private var shell: ByteArray? = readSavedShell() ?: bundledShell

    private fun readSavedShell(): ByteArray? = try {
        if (bundledShell != null && savedShellFile.isFile) savedShellFile.readBytes() else null
    } catch (e: IOException) {
        null
    }

    /** Answers a WebView (or service worker) request from the phone, or null to let it use the network. */
    fun intercept(request: WebResourceRequest): WebResourceResponse? {
        if (networkOnly || bundledShell == null) return null
        if (!request.method.equals("GET", ignoreCase = true)) return null
        val url = request.url
        if (url.scheme != "https" || url.host != HOST) return null

        val path = url.path?.takeIf { it.isNotEmpty() } ?: "/"
        if (path.contains("..")) return null
        // The API, the service worker file and Android's app-link file always come from the server.
        if (path.startsWith("/api/") || path == "/sw.js" || path.startsWith("/.well-known/")) return null

        val lastSegment = path.substringAfterLast('/')
        val isFile = lastSegment.contains('.') && path != "/index.html"
        if (isFile) return openAsset(path)

        // Any other address is a screen of the app; they all start from the same page.
        val wantsHtml = request.isForMainFrame ||
            request.requestHeaders?.entries?.any { (name, value) ->
                name.equals("Accept", ignoreCase = true) && value.contains("text/html")
            } == true
        if (!wantsHtml) return null
        val page = shell ?: return null
        return response("text/html", "utf-8", "no-cache", ByteArrayInputStream(page))
    }

    private fun openAsset(path: String): WebResourceResponse? {
        val extension = path.substringAfterLast('.').lowercase()
        val stream = try {
            assets.open(ASSET_ROOT + path)
        } catch (e: IOException) {
            return null // not bundled (menu photos, files from a newer web version): use the network
        }
        val cacheControl = if (path.startsWith("/assets/")) "public, max-age=31536000, immutable" else "no-cache"
        return response(
            MIME_TYPES[extension] ?: "application/octet-stream",
            if (extension in TEXT_TYPES) "utf-8" else null,
            cacheControl,
            stream,
        )
    }

    private fun response(mimeType: String, encoding: String?, cacheControl: String, body: java.io.InputStream) =
        WebResourceResponse(mimeType, encoding, 200, "OK", mapOf("Cache-Control" to cacheControl), body)

    /**
     * Asks the server for its current page and keeps it if it differs from what
     * the app is using. Blocking: call from a background thread.
     * @return true when a different version was saved (it applies on the next page load).
     */
    fun checkForUpdate(): Boolean {
        val bundled = bundledShell ?: return false
        val latest = downloadShell() ?: return false
        if (latest.contentEquals(shell)) return false
        return try {
            if (latest.contentEquals(bundled)) {
                savedShellFile.delete()
            } else {
                savedShellFile.parentFile?.mkdirs()
                val temp = File(savedShellFile.parentFile, "index.html.tmp")
                temp.writeBytes(latest)
                if (!temp.renameTo(savedShellFile)) {
                    savedShellFile.delete()
                    if (!temp.renameTo(savedShellFile)) return false
                }
            }
            shell = latest
            true
        } catch (e: IOException) {
            Log.w(TAG, "Could not save the newer page", e)
            false
        }
    }

    /** Forgets the server's page and goes back to the bundled one. */
    fun discardSavedShell() {
        savedShellFile.delete()
        shell = bundledShell
    }

    val isUsingSavedShell: Boolean get() = shell !== bundledShell

    private fun downloadShell(): ByteArray? {
        var connection: HttpURLConnection? = null
        return try {
            connection = (URL("$ORIGIN/").openConnection() as HttpURLConnection).apply {
                connectTimeout = 8000
                readTimeout = 8000
                useCaches = false
                setRequestProperty("Accept", "text/html")
                setRequestProperty("Cache-Control", "no-cache")
            }
            if (connection.responseCode != 200) return null
            if (connection.contentType?.contains("text/html") != true) return null
            val bytes = connection.inputStream.use { input ->
                val buffer = java.io.ByteArrayOutputStream()
                val chunk = ByteArray(16 * 1024)
                while (true) {
                    val read = input.read(chunk)
                    if (read < 0) break
                    buffer.write(chunk, 0, read)
                    if (buffer.size() > MAX_SHELL_BYTES) return null
                }
                buffer.toByteArray()
            }
            // Only accept something that is recognisably this app's page (not an
            // error page from the host while the server is restarting).
            val text = String(bytes, Charsets.UTF_8)
            if (text.contains("id=\"root\"") && text.contains("/assets/")) bytes else null
        } catch (e: Exception) {
            Log.d(TAG, "Update check skipped: ${e.message}")
            null
        } finally {
            connection?.disconnect()
        }
    }
}
