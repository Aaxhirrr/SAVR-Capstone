package expo.modules.savrocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SavrOcrModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SavrOcr")

    AsyncFunction("extractText") { uriString: String, promise: Promise ->
      try {
        val context = appContext.reactContext
          ?: throw IllegalStateException("The app is not ready to scan an image.")
        val uri = Uri.parse(uriString)
        require(uri.scheme == "file" || uri.scheme == "content") { "Choose a local image." }
        val image = InputImage.fromFilePath(context, uri)
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        recognizer.process(image)
          .addOnSuccessListener { result ->
            promise.resolve(result.textBlocks.map { it.text })
          }
          .addOnFailureListener { error ->
            promise.reject("ERR_OCR", "Could not read this image.", error)
          }
          .addOnCompleteListener { recognizer.close() }
      } catch (error: Exception) {
        promise.reject("ERR_OCR", "Could not open this image.", error)
      }
    }
  }
}
