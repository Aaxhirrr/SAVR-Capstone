import ExpoModulesCore
import Vision

public class SavrOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SavrOcr")

    AsyncFunction("extractText") { (uri: String) -> [String] in
      guard let url = URL(string: uri), url.isFileURL else {
        throw Exception(name: "ERR_OCR", description: "Choose a local image.")
      }
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = true
      // The URL handler reads image orientation metadata as well as pixels.
      let handler = VNImageRequestHandler(url: url, options: [:])
      try handler.perform([request])
      return (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
    }.runOnQueue(.global(qos: .userInitiated))
  }
}
