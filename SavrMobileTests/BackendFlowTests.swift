import XCTest
@testable import SavrMobile

final class StubProtocol: URLProtocol {
    static var handle: ((URLRequest) throws -> (Int, Data))!
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let (code, data) = try Self.handle(request)
            client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: code, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    override func stopLoading() {}
}

@MainActor
final class BackendFlowTests: XCTestCase {
    var client: APIClient!
    var tokens: AuthTokenStore!
    let listJSON = #"{"id":"list-1","name":"Weekly groceries","items":[{"name":"Milk","category":"Dairy","quantity":"1"}],"created_at":"2026-09-21T12:00:00Z","is_active":true,"chat_session_id":"session-1"}"#
    let profileJSON = #"{"email":"qa@example.com","first_name":"QA","dietaryRestrictions":["Vegan"],"brandPreferences":{"liked":{"Dairy":"Oatly"},"disliked":{}},"address":{"street":"1 Test St","city":"Toronto","province":"ON","postalCode":"M5V 2T6"}}"#
    override func setUp() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubProtocol.self]
        client = APIClient(session: URLSession(configuration: config), baseURL: URL(string: "https://qa.invalid/api"))
        tokens = AuthTokenStore(service: "com.savr.tests.\(UUID().uuidString)")
        try tokens.save(accessToken: "test-token", userID: "test-user")
    }
    override func tearDown() async throws { try tokens.clear(); StubProtocol.handle = nil }
    func stub(_ json: String, status: Int = 200) { StubProtocol.handle = { _ in (status, Data(json.utf8)) } }
    func body(_ request: URLRequest) -> [String: Any] {
        var data = request.httpBody ?? Data()
        if let stream = request.httpBodyStream {
            stream.open(); defer { stream.close() }
            var buffer = [UInt8](repeating: 0, count: 4096)
            while stream.hasBytesAvailable {
                let count = stream.read(&buffer, maxLength: buffer.count)
                if count <= 0 { break }; data.append(contentsOf: buffer.prefix(count))
            }
        }
        return (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
    }
    func testAuthenticationProfileUsesLiveCamelCaseContract() async throws {
        stub(profileJSON)
        let profile = try await AuthService(apiClient: client, tokenStore: tokens).fetchProfile()
        XCTAssertEqual(profile.dietaryRestrictions, ["Vegan"])
        XCTAssertEqual(profile.likedBrands.first?.brand, "Oatly")
        XCTAssertEqual(profile.address?.postalCode, "M5V 2T6")
    }
    func testChatImageActuallyTravelsToBackend() async throws {
        StubProtocol.handle = { request in
            let payload = self.body(request)
            XCTAssertEqual(payload["imageBase64"] as? String, Data([1,2,3]).base64EncodedString())
            XCTAssertEqual(payload["imageMediaType"] as? String, "image/jpeg")
            XCTAssertEqual(request.timeoutInterval, 90)
            return (200, Data(#"{"sessionId":"s1","botResponse":"Milk"}"#.utf8))
        }
        let result = try await ChatService(apiClient: client, tokenStore: tokens).sendMessage(text: "Photo", sessionId: nil, imageData: Data([1,2,3]))
        XCTAssertEqual(result.sessionId, "s1")
    }
    func testChatRecoveryContextDoesNotPolluteVisibleUserMessage() async throws {
        StubProtocol.handle = { request in
            let payload = self.body(request)
            XCTAssertEqual(payload["message"] as? String, "Add eggs")
            XCTAssertNotNil(payload["context"])
            return (200, Data(#"{"sessionId":"s1","botResponse":"Added"}"#.utf8))
        }
        _ = try await ChatService(apiClient: client, tokenStore: tokens).sendMessage(text: "Add eggs", sessionId: nil, context: ["list_id":"list-1"])
    }
    func testSessionDiscoveryAndHistory() async throws {
        let service = ChatService(apiClient: client, tokenStore: tokens)
        stub(#"[{"id":"s1","created_at":"2026-09-21T12:00:00Z","updated_at":"2026-09-21T12:00:00Z"}]"#)
        let sessions = try await service.fetchSessions(); XCTAssertEqual(sessions.count, 1)
        stub(#"[{"id":"m1","content":"Milk","is_user":true,"timestamp":"2026-09-21T12:00:00Z"}]"#)
        let messages = try await service.fetchHistory(sessionId: "s1")
        XCTAssertEqual(messages.first?.text, "Milk")
        XCTAssertEqual(messages.first?.timestamp, ISO8601DateFormatter().date(from: "2026-09-21T12:00:00Z"))
    }
    func testSessionListFinalizeAndDetach() async throws {
        let service = ChatService(apiClient: client, tokenStore: tokens)
        stub(#"{"list":{"id":"l1","name":"Weekly"},"items":[],"itemsCount":0}"#)
        let current = try await service.currentList(sessionId: "s1"); XCTAssertEqual(current.list?.id, "l1")
        stub(#"{"listId":"l1"}"#)
        let id = try await service.finalizeList(sessionId: "s1"); XCTAssertEqual(id, "l1")
        stub("", status: 204); try await service.detachList(sessionId: "s1")
    }
    func testListsDecodeCurrentDateAndSessionKeys() async throws {
        stub("[\(listJSON)]")
        let lists = try await GroceryListService(apiClient: client, tokenStore: tokens).fetchAllLists()
        XCTAssertEqual(lists.first?.sessionId, "session-1")
        XCTAssertEqual(lists.first?.createdAt, "2026-09-21T12:00:00Z")
    }
    func testListCollectionAlsoDecodesCamelCaseDates() async throws {
        stub("[\(listJSON.replacingOccurrences(of: "created_at", with: "createdAt"))]")
        let lists = try await GroceryListService(apiClient: client, tokenStore: tokens).fetchAllLists()
        XCTAssertEqual(lists.first?.createdAt, "2026-09-21T12:00:00Z")
    }
    func testSelectedListIsLinkedToTheActualBackendSession() async throws {
        StubProtocol.handle = { request in
            XCTAssertEqual(request.httpMethod, "PUT")
            XCTAssertTrue(request.url!.path.hasSuffix("grocery-lists/list-1"))
            XCTAssertEqual(self.body(request)["chat_session_id"] as? String, "session-1")
            return (200, Data(self.listJSON.utf8))
        }
        try await GroceryListService(apiClient: client, tokenStore: tokens).linkSession(listId: "list-1", sessionId: "session-1")
    }
    func testRenamePersistsBeforeChangingVisibleRow() async throws {
        let vm = ListsViewModel(service: GroceryListService(apiClient: client, tokenStore: tokens))
        stub("[\(listJSON)]"); await vm.load()
        stub(listJSON.replacingOccurrences(of: "Weekly groceries", with: "Renamed"))
        let renamed = await vm.rename(id: "list-1", newName: "Renamed")
        XCTAssertTrue(renamed); XCTAssertEqual(vm.lists.first?.name, "Renamed")
    }
    func testFailedDeleteKeepsListVisible() async throws {
        let vm = ListsViewModel(service: GroceryListService(apiClient: client, tokenStore: tokens))
        stub("[\(listJSON)]"); await vm.load()
        stub(#"{"detail":"Unavailable"}"#, status: 503); await vm.delete(id: "list-1")
        XCTAssertEqual(vm.lists.count, 1); XCTAssertNotNil(vm.errorMessage)
    }
    func testFailedRenameKeepsOriginalName() async throws {
        let vm = ListsViewModel(service: GroceryListService(apiClient: client, tokenStore: tokens))
        stub("[\(listJSON)]"); await vm.load()
        stub(#"{"detail":"Unavailable"}"#, status: 500)
        let renamed = await vm.rename(id: "list-1", newName: "Lost")
        XCTAssertFalse(renamed); XCTAssertEqual(vm.lists.first?.name, "Weekly groceries")
    }
    func testEmpty204IsSuccessful() async throws {
        stub("", status: 204)
        try await GroceryListService(apiClient: client, tokenStore: tokens).deleteList(id: "list-1")
    }
    func testFlyerMutationUsesItemNamesAndAllowsNewList() async throws {
        StubProtocol.handle = { request in
            let payload = self.body(request)
            XCTAssertEqual(payload["item_names"] as? [String], ["Eggs"])
            XCTAssertNil(payload["deal_ids"]); XCTAssertNil(payload["list_id"])
            XCTAssertEqual(payload["new_list_name"] as? String, "Flyer picks")
            return (200, Data("{}".utf8))
        }
        try await FlyerService(apiClient: client, tokenStore: tokens).addToList(itemNames: ["Eggs"], listId: nil)
    }
    func testFlyersTraverseAllPages() async throws {
        var calls = 0
        StubProtocol.handle = { request in
            calls += 1
            XCTAssertTrue(request.url!.absoluteString.contains("page=\(calls)"))
            return (200, Data("{\"deals\":[{\"id\":\"\(calls)\",\"store_brand\":\"walmart\",\"product_name\":\"Eggs\",\"price\":\"3.00\",\"valid_from\":\"2026-09-01\",\"valid_to\":\"2026-09-30\"}],\"total\":2,\"page\":\(calls),\"page_size\":1}".utf8))
        }
        let deals = try await FlyerService(apiClient: client, tokenStore: tokens).fetchAllDeals(storeBrand: "walmart")
        XCTAssertEqual(deals.count, 2); XCTAssertEqual(calls, 2)
    }
    func testFlyerNetworkFailureIsNotReportedAsAnEmptyCatalog() async throws {
        let vm = FlyersViewModel(flyerService: FlyerService(apiClient: client, tokenStore: tokens), listService: GroceryListService(apiClient: client, tokenStore: tokens))
        StubProtocol.handle = { request in
            if request.url!.path.hasSuffix("selected_stores") {
                return (200, Data(#"[{"id":7,"store_name":"Walmart","address":"Test","postal_code":"M5V 2T6"}]"#.utf8))
            }
            throw URLError(.timedOut)
        }
        await vm.load()
        XCTAssertFalse(vm.isLoading)
        XCTAssertTrue(vm.errorMessage?.contains("Couldn't refresh flyers") == true)
        XCTAssertFalse(vm.errorMessage?.contains("No flyer deals") == true)
    }
    func testStoreBrandsDoNotCollide() async throws {
        let vm = StoreSelectViewModel(service: StoreService(apiClient: client, tokenStore: tokens))
        stub(#"[{"id":7,"store_name":"Atlantic Superstore","address":"Test","postal_code":"B3K 2R9"}]"#)
        await vm.load()
        XCTAssertTrue(vm.isSelected(knownStores.first { $0.brand == "atlanticsuperstore" }!))
        XCTAssertFalse(vm.isSelected(knownStores.first { $0.brand == "superstore" }!))
        XCTAssertEqual(vm.savedStoreIds["atlanticsuperstore"], 7)
    }
    func testStoreMutationFailureRemainsVisible() async throws {
        let vm = StoreSelectViewModel(service: StoreService(apiClient: client, tokenStore: tokens))
        stub("[]"); await vm.load()
        stub(#"{"detail":"Store service unavailable"}"#, status: 503)
        await vm.toggle(knownStores[0])
        XCTAssertTrue(vm.savedStores.isEmpty); XCTAssertNotNil(vm.errorMessage)
    }
    func testProfileUpdateUsesContractKeys() async throws {
        StubProtocol.handle = { request in
            let payload = self.body(request)
            XCTAssertEqual(payload["dietaryRestrictions"] as? [String], ["Vegan"])
            XCTAssertNotNil(payload["brandPreferences"]); XCTAssertNil(payload["dietary_restrictions"])
            return (200, Data(self.profileJSON.utf8))
        }
        try await AuthService(apiClient: client, tokenStore: tokens).updateProfile(firstName: "QA", lastName: "", phone: nil, address: nil, dietaryRestrictions: ["Vegan"], likedBrands: [], dislikedBrands: [])
    }
    func testEmptyBackendPreferencesDoNotResurrectCache() async throws {
        UserDefaults.standard.set(["Vegan"], forKey: "savr_dietary_prefs")
        stub(#"{"dietaryRestrictions":[],"brandPreferences":{"liked":{},"disliked":{}}}"#)
        let vm = ProfileViewModel(authService: AuthService(apiClient: client, tokenStore: tokens), tokenStore: tokens)
        await vm.load()
        XCTAssertTrue(vm.selectedDietary.isEmpty)
    }
    func testAccountDeleteFailureDoesNotSignOut() async throws {
        stub(#"{"detail":"Incorrect password"}"#, status: 403)
        let vm = ProfileViewModel(authService: AuthService(apiClient: client, tokenStore: tokens), tokenStore: tokens)
        vm.deletionPassword = "wrong"
        let deleted = await vm.deleteAccount()
        XCTAssertFalse(deleted); XCTAssertNotNil(tokens.loadSession()); XCTAssertNotNil(vm.errorMessage)
    }
    func testAccountDeleteHasConfirmationAndAccepts204() async throws {
        StubProtocol.handle = { request in
            XCTAssertEqual(self.body(request)["confirmationText"] as? String, "DELETE")
            XCTAssertEqual(self.body(request)["password"] as? String, "test-password")
            return (204, Data())
        }
        try await AuthService(apiClient: client, tokenStore: tokens).deleteAccount(password: "test-password")
        XCTAssertNil(tokens.loadSession())
    }
    func testLogoutClearsAccountCaches() async throws {
        UserDefaults.standard.set("cached", forKey: "savr.list-chat.messages.list-1")
        UserDefaults.standard.set(["Vegan"], forKey: "savr_dietary_prefs")
        try tokens.clear()
        XCTAssertNil(UserDefaults.standard.object(forKey: "savr.list-chat.messages.list-1"))
        XCTAssertNil(UserDefaults.standard.object(forKey: "savr_dietary_prefs"))
    }
    func testMalformedResponseProducesTypedError() async {
        stub("<html>Bad gateway</html>")
        do { let _: LoginResponse = try await client.send(path: "auth/login", method: "POST"); XCTFail("Expected decoding failure") }
        catch { guard case APIError.decodingFailed = error else { return XCTFail("Unexpected error: \(error)") } }
    }
    func testOfflineFailureIsReportedWithoutLosingLists() async {
        let vm = ListsViewModel(service: GroceryListService(apiClient: client, tokenStore: tokens))
        stub("[\(listJSON)]"); await vm.load()
        StubProtocol.handle = { _ in throw URLError(.notConnectedToInternet) }
        await vm.load(); XCTAssertEqual(vm.lists.count, 1); XCTAssertTrue(vm.errorMessage?.contains("internet connection") == true)
    }
    func testTimeoutDoesNotHangOrEraseStoreSelection() async {
        let vm = StoreSelectViewModel(service: StoreService(apiClient: client, tokenStore: tokens))
        stub(#"[{"id":7,"store_name":"Walmart","address":"Test","postal_code":"M5V 2T6"}]"#); await vm.load()
        StubProtocol.handle = { _ in throw URLError(.timedOut) }
        await vm.load(); XCTAssertEqual(vm.savedStores.count, 1); XCTAssertFalse(vm.isLoading); XCTAssertTrue(vm.errorMessage?.contains("timed out") == true)
    }
    func testExpiredSessionNeverBootstrapsSignedIn() async {
        stub(#"{"detail":"Expired"}"#, status: 401)
        let state = AppState(authService: AuthService(apiClient: client, tokenStore: tokens))
        await state.bootstrap(); XCTAssertFalse(state.isSignedIn)
    }
    func testValidationArrayIsReadable() async {
        stub(#"{"detail":[{"msg":"Password must have 8 characters"}]}"#, status: 422)
        do { let _: LoginResponse = try await client.send(path: "auth/signup", method: "POST"); XCTFail() }
        catch { XCTAssertEqual(error.localizedDescription, "Password must have 8 characters") }
    }
}
