import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case requestFailed(
        statusCode: Int,
        message: String?,
        responseBody: String?,
        requestURL: String?,
        method: String?
    )
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The server URL is invalid."
        case .invalidResponse:
            return "The server returned an invalid response."
        case let .requestFailed(_, message, _, _, _) where !(message?.isEmpty ?? true):
            return message
        case let .requestFailed(statusCode, _, _, _, _):
            return "Request failed with status code \(statusCode)."
        case .decodingFailed:
            return "The server response could not be decoded."
        }
    }

    var debugSummary: String {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response"
        case let .requestFailed(statusCode, message, responseBody, requestURL, method):
            var lines: [String] = []
            lines.append("Request: \(method ?? "REQUEST") \(requestURL ?? "unknown URL")")
            lines.append("Status: \(statusCode)")
            if let message, !message.isEmpty {
                lines.append("Message: \(message)")
            }
            if let responseBody, !responseBody.isEmpty {
                lines.append("Body: \(responseBody)")
            }
            return lines.joined(separator: "\n")
        case .decodingFailed:
            return "Decoding failed"
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL?
    private let session: URLSession

    init(session: URLSession = .shared, baseURL: URL? = URL(string: "https://savr.app/api")) {
        self.session = session
        self.baseURL = baseURL
    }

    func send<Response: Decodable>(
        path: String,
        method: String,
        headers: [String: String] = [:],
        queryItems: [URLQueryItem] = [],
        body: Data? = nil,
        timeout: TimeInterval = 30
    ) async throws -> Response {
        guard var url = baseURL?.appendingPathComponent(path) else {
            throw APIError.invalidURL
        }

        if !queryItems.isEmpty {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = queryItems
            guard let composedURL = components?.url else {
                throw APIError.invalidURL
            }
            url = composedURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = timeout

        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if httpResponse.statusCode == 401, headers["Authorization"] != nil {
                await MainActor.run { NotificationCenter.default.post(name: .savrSessionExpired, object: nil) }
            }
            let responseText = String(data: data, encoding: .utf8) ?? "<non-utf8 response>"
            #if DEBUG
            print("API error [\(httpResponse.statusCode)] \(request.httpMethod ?? "REQUEST") \(request.url?.absoluteString ?? "")")

            #endif
            throw APIError.requestFailed(
                statusCode: httpResponse.statusCode,
                message: Self.extractErrorMessage(from: data),
                responseBody: responseText,
                requestURL: request.url?.absoluteString,
                method: request.httpMethod
            )
        }

        if Response.self == EmptyAPIResponse.self {
            return EmptyAPIResponse() as! Response
        }
        do {
            return try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw APIError.decodingFailed
        }
    }

    private static func extractErrorMessage(from data: Data) -> String? {
        guard
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return "The server could not complete the request. Please try again."
        }

        if let details = object["detail"] as? [[String: Any]] {
            return details.compactMap { $0["msg"] as? String }.joined(separator: "\n")
        }
        if let detail = object["detail"] as? String {
            return detail
        }

        if let message = object["message"] as? String {
            return message
        }

        return nil
    }
}

struct EmptyAPIResponse: Decodable {}

extension Notification.Name {
    static let savrSessionExpired = Notification.Name("savr.sessionExpired")
}

extension APIError {
    static var notSignedIn: APIError {
        .requestFailed(statusCode: 401, message: "Please sign in again.", responseBody: nil, requestURL: nil, method: nil)
    }
    var isUnauthorized: Bool {
        if case .requestFailed(401, _, _, _, _) = self { return true }
        return false
    }
}
