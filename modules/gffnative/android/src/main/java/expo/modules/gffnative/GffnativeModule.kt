package expo.modules.gffnative

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Build
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class GffnativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("Gffnative")

    // --- Home-screen widget pinning ---------------------------------------

    // True if the current launcher supports the "pin widget" system prompt.
    Function("isPinSupported") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@Function false
      val awm = context.getSystemService(Context.APPWIDGET_SERVICE) as AppWidgetManager
      awm.isRequestPinAppWidgetSupported
    }

    // Shows the system dialog asking the user to add the given widget to the
    // home screen. widgetName is "Clock" | "Featured" | "ClockFeatured".
    Function("pinWidget") { widgetName: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@Function false
      val awm = context.getSystemService(Context.APPWIDGET_SERVICE) as AppWidgetManager
      if (!awm.isRequestPinAppWidgetSupported) return@Function false
      val provider = ComponentName(context.packageName, "${context.packageName}.widget.$widgetName")
      awm.requestPinAppWidget(provider, null, null)
    }

    // --- Launcher helpers --------------------------------------------------

    // Is GoodForFree currently the default home app?
    Function("isDefaultLauncher") {
      val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
      val res = context.packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY)
      res?.activityInfo?.packageName == context.packageName
    }

    // Opens the system "Default apps / Home app" settings so the user can pick us.
    Function("openHomeSettings") {
      val intent = Intent(Settings.ACTION_HOME_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try {
        context.startActivity(intent)
      } catch (e: Exception) {
        context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    }

    // Launch another installed app by package name.
    Function("launchApp") { packageName: String ->
      val intent = context.packageManager.getLaunchIntentForPackage(packageName)
      if (intent != null) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        true
      } else {
        false
      }
    }

    // All launchable apps (label + package + small base64 icon), minus ourselves.
    AsyncFunction("getInstalledApps") {
      val pm = context.packageManager
      val mainIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      val activities = pm.queryIntentActivities(mainIntent, 0)
      val seen = HashSet<String>()
      val apps = ArrayList<Map<String, Any?>>()
      for (info in activities) {
        val pkg = info.activityInfo.packageName
        if (pkg == context.packageName || !seen.add(pkg)) continue
        val label = info.loadLabel(pm).toString()
        var icon: String? = null
        try {
          icon = drawableToBase64(info.loadIcon(pm))
        } catch (e: Exception) {
          // Some apps fail to load an icon — leave it null.
        }
        apps.add(mapOf("packageName" to pkg, "label" to label, "icon" to icon))
      }
      apps.sortedBy { (it["label"] as String).lowercase() }
    }
  }

  private fun drawableToBase64(drawable: Drawable, size: Int = 96): String {
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)
    val baos = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos)
    bitmap.recycle()
    return "data:image/png;base64," + Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
  }
}
