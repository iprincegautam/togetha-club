import Foundation
import Security

/// Real Supabase phone-OTP auth over GoTrue REST (no SDK, matching the app's
/// hand-rolled REST style). Persists the session in the Keychain and refreshes
/// the access token on demand.
///
/// Graceful-fallback contract: when Supabase isn't configured (no URL / anon
/// key in Info.plist), `isConfigured` is false and callers fall back to the
/// mock/UI-only sign-in path — so the app builds and runs exactly as today.
@MainActor
@Observable
final class AuthService {
    static let shared = AuthService()

    private let config = Config.shared
    private let session = URLSession.shared

    private(set) var isSignedIn = false
    private(set) var applicantId: String?

    private var accessToken: String?
    private var refreshToken: String?
    private var expiresAt: Date?

    /// Read synchronously by the API client to set the bearer header. Mirrors
    /// `accessToken` but is nonisolated so `LiveAPIClient.request()` (which builds
    /// requests off the main actor) can read it without an await.
    nonisolated(unsafe) static var bearerToken: String?

    /// Decode the current access token's claims (sub = user id, email). Nonisolated
    /// so the API client can resolve "who am I" for RLS-scoped reads without an
    /// actor hop. Returns nil when signed out.
    nonisolated static func session() -> (sub: String, email: String?)? {
        guard let token = bearerToken else { return nil }
        let parts = token.split(separator: ".")
        guard parts.count >= 2 else { return nil }
        var b64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64 += "=" }
        guard let data = Data(base64Encoded: b64),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let sub = obj["sub"] as? String else { return nil }
        return (sub, obj["email"] as? String)
    }

    var isConfigured: Bool { config.isConfigured }

    private init() { restore() }

    // MARK: - OTP flow

    /// Sends a 6-digit SMS code to an E.164 phone (e.g. "+919876543210").
    func sendOTP(phone e164: String) async throws {
        _ = try await post("/auth/v1/otp", body: ["phone": e164, "create_user": true])
    }

    /// Verifies the code, stores the session, and warms the profile↔applicant link.
    func verifyOTP(phone e164: String, code: String) async throws {
        let data = try await post("/auth/v1/verify",
                                  body: ["phone": e164, "token": code, "type": "sms"])
        apply(try JSONDecoder().decode(TokenResponse.self, from: data))
        await linkProfile()
    }

    // MARK: - Email + password

    /// Signs up with email/password. Returns true if a session came back
    /// (email confirmation is OFF); false if a confirmation email was sent and
    /// the user must confirm before logging in.
    @discardableResult
    func signUp(email: String, password: String) async throws -> Bool {
        let data = try await post("/auth/v1/signup", body: ["email": email, "password": password])
        if let tok = try? JSONDecoder().decode(TokenResponse.self, from: data), !tok.access_token.isEmpty {
            apply(tok)
            await linkProfile()
            return true
        }
        return false
    }

    func signIn(email: String, password: String) async throws {
        let data = try await post("/auth/v1/token?grant_type=password",
                                  body: ["email": email, "password": password])
        apply(try JSONDecoder().decode(TokenResponse.self, from: data))
        await linkProfile()
    }

    func signOut() {
        accessToken = nil; refreshToken = nil; expiresAt = nil
        applicantId = nil; isSignedIn = false
        Self.bearerToken = nil
        Keychain.delete(Self.sessionKey)
    }

    // MARK: - Internals

    private struct TokenResponse: Decodable {
        let access_token: String
        let refresh_token: String
        let expires_in: Int
    }

    private func apply(_ tok: TokenResponse) {
        accessToken = tok.access_token
        refreshToken = tok.refresh_token
        expiresAt = Date().addingTimeInterval(TimeInterval(tok.expires_in))
        isSignedIn = true
        Self.bearerToken = tok.access_token
        persist()
    }

    /// Calls the `link-profile` edge function so the server ensures a profiles
    /// row and links the applicant by phone. Fire-and-forget — never blocks UI.
    private func linkProfile() async {
        guard let token = accessToken, !config.functionsURL.isEmpty,
              let url = URL(string: config.functionsURL + "/link-profile") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        struct LinkResponse: Decodable { let applicant_id: String? }
        if let (data, _) = try? await session.data(for: req),
           let resp = try? JSONDecoder().decode(LinkResponse.self, from: data) {
            applicantId = resp.applicant_id
        }
    }

    private func post(_ path: String, body: [String: Any]) async throws -> Data {
        guard let url = URL(string: config.supabaseURL + path) else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let decoded = try? JSONDecoder().decode(GoTrueError.self, from: data)
            throw AuthError.message(decoded?.message ?? "Something went wrong. Try again.")
        }
        return data
    }

    private struct GoTrueError: Decodable {
        let msg: String?
        let error_description: String?
        var message: String? { msg ?? error_description }
    }

    // MARK: - Keychain persistence

    private static let sessionKey = "club.togetha.session"
    private struct Stored: Codable { let access: String; let refresh: String; let exp: Double }

    private func persist() {
        guard let a = accessToken, let r = refreshToken, let e = expiresAt,
              let data = try? JSONEncoder().encode(Stored(access: a, refresh: r, exp: e.timeIntervalSince1970))
        else { return }
        Keychain.set(data, for: Self.sessionKey)
    }

    private func restore() {
        guard isConfigured,
              let data = Keychain.get(Self.sessionKey),
              let s = try? JSONDecoder().decode(Stored.self, from: data) else { return }
        accessToken = s.access
        refreshToken = s.refresh
        expiresAt = Date(timeIntervalSince1970: s.exp)
        isSignedIn = true
        Self.bearerToken = s.access
    }
}

enum AuthError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case let .message(m) = self { return m }; return nil }
}

/// Minimal Keychain wrapper for the session blob (access + refresh tokens).
enum Keychain {
    static func set(_ data: Data, for key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
        var add = query
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(add as CFDictionary, nil)
    }

    static func get(_ key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var out: AnyObject?
        return SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess ? out as? Data : nil
    }

    static func delete(_ key: String) {
        SecItemDelete([
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ] as CFDictionary)
    }
}
