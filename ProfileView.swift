import SwiftUI

// MARK: - Profile Tab Enum

private enum ProfileTab: String, CaseIterable {
    case userDetails = "User Details"
    case account     = "Account"
    case dietary     = "Dietary"
    case brands      = "Brands"

    var icon: String {
        switch self {
        case .userDetails: return "person.fill"
        case .account:     return "gearshape.fill"
        case .dietary:     return "fork.knife"
        case .brands:      return "tag.fill"
        }
    }
}

// MARK: - Supporting Models

struct BrandEntry: Identifiable {
    let id = UUID()
    var category: String
    var brandName: String
}

// MARK: - ViewModel

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var profile: UserProfile?
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var successMessage: String?

    // User Details — password change
    @Published var currentPassword = ""
    @Published var newPassword = ""
    @Published var confirmPassword = ""

    // Account tab — editable fields
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var address = ""
    @Published var phone = ""

    // Dietary
    @Published var selectedDietary: Set<String> = []
    @Published var customDietaryInput = ""
    @Published var customDietaryRestrictions: [String] = []

    // Brands
    @Published var likedBrands: [BrandEntry] = []
    @Published var dislikedBrands: [BrandEntry] = []
    @Published var likedCategory = ""
    @Published var likedBrandName = ""
    @Published var dislikedCategory = ""
    @Published var dislikedBrandName = ""

    private let authService = AuthService()
    private let tokenStore  = AuthTokenStore()

    let commonDietaryOptions: [String] = [
        "Gluten Free", "Dairy Free", "Nut Allergy",
        "Peanut Allergy", "Shellfish Allergy", "Vegetarian",
        "Vegan", "Kosher", "Halal",
        "Keto", "Paleo", "Diabetic",
        "Low Sodium", "Low FODMAP", "Weight Watchers",
        "Celiac Disease", "Pescatarian", "Soy Allergy",
        "Egg Allergy", "Low Carb", "High Protein"
    ]

    var initials: String {
        guard let p = profile else { return "?" }
        let first = p.firstName?.first.map(String.init) ?? ""
        let last  = p.lastName?.first.map(String.init) ?? ""
        let combined = (first + last).uppercased()
        return combined.isEmpty ? (p.email?.prefix(1).uppercased() ?? "?") : combined
    }

    var selectedDietaryLabel: String {
        let all = selectedDietary.sorted() + customDietaryRestrictions
        return all.isEmpty ? "None" : all.joined(separator: ", ")
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        if let p = try? await authService.fetchProfile() {
            profile = p
            firstName = p.firstName ?? ""
            lastName  = p.lastName ?? ""
        }
        // Load persisted preferences
        selectedDietary = Set(UserDefaults.standard.stringArray(forKey: "savr_dietary_prefs") ?? [])
        customDietaryRestrictions = UserDefaults.standard.stringArray(forKey: "savr_custom_dietary") ?? []
        if let likedData = UserDefaults.standard.data(forKey: "savr_liked_brands"),
           let decoded = try? JSONDecoder().decode([[String: String]].self, from: likedData) {
            likedBrands = decoded.compactMap {
                guard let c = $0["category"], let b = $0["brand"] else { return nil }
                return BrandEntry(category: c, brandName: b)
            }
        }
        if let dislikedData = UserDefaults.standard.data(forKey: "savr_disliked_brands"),
           let decoded = try? JSONDecoder().decode([[String: String]].self, from: dislikedData) {
            dislikedBrands = decoded.compactMap {
                guard let c = $0["category"], let b = $0["brand"] else { return nil }
                return BrandEntry(category: c, brandName: b)
            }
        }
        address = UserDefaults.standard.string(forKey: "savr_address") ?? ""
        phone   = UserDefaults.standard.string(forKey: "savr_phone") ?? ""
        isLoading = false
    }

    func changePassword() async {
        guard !currentPassword.isEmpty, !newPassword.isEmpty else {
            errorMessage = "Please fill in all password fields."
            return
        }
        guard newPassword == confirmPassword else {
            errorMessage = "New passwords don't match."
            return
        }
        guard newPassword.count >= 8 else {
            errorMessage = "New password must be at least 8 characters."
            return
        }
        guard let session = tokenStore.loadSession() else { errorMessage = "Not signed in."; return }

        isSaving = true
        errorMessage = nil
        successMessage = nil

        let body: [String: Any] = ["current_password": currentPassword, "new_password": newPassword]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { isSaving = false; return }

        do {
            let _: [String: String] = try await APIClient.shared.send(
                path: "auth/change-password",
                method: "POST",
                headers: [
                    "Authorization": "Bearer \(session.accessToken)",
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                ],
                body: data
            )
            successMessage = "Password updated successfully."
            currentPassword = ""; newPassword = ""; confirmPassword = ""
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }

    func saveAccount() {
        UserDefaults.standard.set(address, forKey: "savr_address")
        UserDefaults.standard.set(phone,   forKey: "savr_phone")
        successMessage = "Account information saved."
    }

    func saveDietary() {
        UserDefaults.standard.set(Array(selectedDietary), forKey: "savr_dietary_prefs")
        UserDefaults.standard.set(customDietaryRestrictions, forKey: "savr_custom_dietary")
        successMessage = "Dietary preferences saved."
    }

    func addCustomDietary() {
        let trimmed = customDietaryInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !customDietaryRestrictions.contains(trimmed) else { return }
        customDietaryRestrictions.append(trimmed)
        customDietaryInput = ""
    }

    func removeCustomDietary(_ item: String) {
        customDietaryRestrictions.removeAll { $0 == item }
    }

    func addLikedBrand() {
        let cat = likedCategory.trimmingCharacters(in: .whitespacesAndNewlines)
        let brand = likedBrandName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !brand.isEmpty else { return }
        likedBrands.append(BrandEntry(category: cat, brandName: brand))
        likedCategory = ""; likedBrandName = ""
        saveBrands()
    }

    func removeLikedBrand(at offsets: IndexSet) {
        likedBrands.remove(atOffsets: offsets)
        saveBrands()
    }

    func addDislikedBrand() {
        let cat = dislikedCategory.trimmingCharacters(in: .whitespacesAndNewlines)
        let brand = dislikedBrandName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !brand.isEmpty else { return }
        dislikedBrands.append(BrandEntry(category: cat, brandName: brand))
        dislikedCategory = ""; dislikedBrandName = ""
        saveBrands()
    }

    func removeDislikedBrand(at offsets: IndexSet) {
        dislikedBrands.remove(atOffsets: offsets)
        saveBrands()
    }

    private func saveBrands() {
        let likedEncoded = likedBrands.map { ["category": $0.category, "brand": $0.brandName] }
        let dislikedEncoded = dislikedBrands.map { ["category": $0.category, "brand": $0.brandName] }
        if let data = try? JSONEncoder().encode(likedEncoded) {
            UserDefaults.standard.set(data, forKey: "savr_liked_brands")
        }
        if let data = try? JSONEncoder().encode(dislikedEncoded) {
            UserDefaults.standard.set(data, forKey: "savr_disliked_brands")
        }
    }
}

// MARK: - Profile View

struct ProfileView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var viewModel = ProfileViewModel()
    @State private var selectedTab: ProfileTab = .userDetails
    @State private var showSignOutConfirm = false

    var body: some View {
        ZStack {
            Color(red: 0.97, green: 0.98, blue: 0.97).ignoresSafeArea()

            if viewModel.isLoading {
                ProgressView()
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        headerCard
                        tabBar
                            .padding(.top, 12)
                        tabContent
                            .padding(.top, 12)
                    }
                    .padding(.bottom, 40)
                }
            }
        }
        .task { await viewModel.load() }
        .confirmationDialog("Sign Out", isPresented: $showSignOutConfirm, titleVisibility: .visible) {
            Button("Sign Out", role: .destructive) { appState.signOut() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("You'll need to sign in again to use SAVR.")
        }
    }

    // MARK: - Header

    private var headerCard: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(SavrColors.brandGreen)
                    .frame(width: 48, height: 48)
                Text(viewModel.initials)
                    .font(.system(size: 17, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text("Your Profile")
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                Text("Update your account information")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1))
        .shadow(color: .black.opacity(0.04), radius: 5, x: 0, y: 2)
        .padding(.horizontal, 16)
        .padding(.top, 20)
    }

    // MARK: - Tab Bar

    private var tabBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(ProfileTab.allCases, id: \.self) { tab in
                    Button {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            selectedTab = tab
                            viewModel.errorMessage = nil
                            viewModel.successMessage = nil
                        }
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: tab.icon)
                                .font(.system(size: 11, weight: .semibold))
                            Text(tab.rawValue)
                                .font(.system(size: 13, weight: .semibold))
                        }
                        .foregroundStyle(selectedTab == tab ? SavrColors.brandGreen : Color(red: 0.40, green: 0.48, blue: 0.40))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(selectedTab == tab ? SavrColors.brandGreen.opacity(0.12) : Color.clear)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(selectedTab == tab ? SavrColors.brandGreen.opacity(0.5) : Color(red: 0.85, green: 0.90, blue: 0.85), lineWidth: 1))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Tab Content

    @ViewBuilder
    private var tabContent: some View {
        switch selectedTab {
        case .userDetails: UserDetailsSection(viewModel: viewModel)
        case .account:     AccountSection(viewModel: viewModel, showSignOut: $showSignOutConfirm)
        case .dietary:     DietarySection(viewModel: viewModel)
        case .brands:      BrandsSection(viewModel: viewModel)
        }
    }
}

// MARK: - User Details Section

private struct UserDetailsSection: View {
    @ObservedObject var viewModel: ProfileViewModel

    var body: some View {
        VStack(spacing: 14) {
            feedbackBanners(viewModel: viewModel)

            ProfileCard(title: "User Details", subtitle: "Manage your email and password settings.") {
                VStack(alignment: .leading, spacing: 10) {
                    ProfileFieldLabel("Email Address")
                    Text(viewModel.profile?.email ?? "—")
                        .font(.system(size: 15))
                        .foregroundStyle(Color(red: 0.20, green: 0.25, blue: 0.20))
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(red: 0.95, green: 0.97, blue: 0.95))
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }

            ProfileCard(title: "Password Settings", subtitle: nil, icon: "lock.fill") {
                VStack(alignment: .leading, spacing: 10) {
                    ProfileFieldLabel("Current Password")
                    SecureField("Enter your current password", text: $viewModel.currentPassword)
                        .textFieldStyle(ProfileFieldStyle())

                    ProfileFieldLabel("New Password")
                    SecureField("Enter a new password", text: $viewModel.newPassword)
                        .textFieldStyle(ProfileFieldStyle())

                    ProfileFieldLabel("Confirm New Password")
                    SecureField("Confirm your new password", text: $viewModel.confirmPassword)
                        .textFieldStyle(ProfileFieldStyle())

                    Button {
                        Task { await viewModel.changePassword() }
                    } label: {
                        HStack(spacing: 6) {
                            if viewModel.isSaving {
                                ProgressView().scaleEffect(0.75).tint(.white)
                            } else {
                                Image(systemName: "lock.rotation")
                                    .font(.system(size: 13, weight: .semibold))
                            }
                            Text("Update Password")
                                .font(.system(size: 14, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 13)
                        .background(SavrColors.brandGreen)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(viewModel.isSaving)
                    .padding(.top, 4)
                }
            }
        }
        .padding(.horizontal, 16)
    }
}

// MARK: - Account Section

private struct AccountSection: View {
    @ObservedObject var viewModel: ProfileViewModel
    @Binding var showSignOut: Bool

    var body: some View {
        VStack(spacing: 14) {
            feedbackBanners(viewModel: viewModel)

            // Connected Accounts
            ProfileCard(title: "Connected Accounts", subtitle: "Link your accounts for faster sign-in.") {
                HStack(spacing: 12) {
                    // Google G logo approximation
                    ZStack {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(Color.white)
                            .frame(width: 36, height: 36)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .stroke(Color(red: 0.88, green: 0.90, blue: 0.88), lineWidth: 1)
                            )
                        Text("G")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(Color(red: 0.26, green: 0.52, blue: 0.96))
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Google")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Sign in faster with your Google account")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Text("Connect")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color(red: 0.35, green: 0.45, blue: 0.35))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color(red: 0.92, green: 0.96, blue: 0.92))
                        .clipShape(Capsule())
                }
            }

            // Account Information
            ProfileCard(title: "Account Information", subtitle: "Update your personal information and address details.") {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            ProfileFieldLabel("First Name")
                            TextField("Aashir", text: $viewModel.firstName)
                                .textFieldStyle(ProfileFieldStyle())
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            ProfileFieldLabel("Last Name")
                            TextField("Javed", text: $viewModel.lastName)
                                .textFieldStyle(ProfileFieldStyle())
                        }
                    }

                    HStack {
                        Text("Address Information")
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                        Spacer()
                        Button {
                            // Use my location — placeholder
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 10))
                                Text("Use my location")
                                    .font(.system(size: 11, weight: .semibold))
                            }
                            .foregroundStyle(SavrColors.brandGreen)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, 4)

                    ProfileFieldLabel("Address")
                    TextField("123 Main Street, City, Province", text: $viewModel.address)
                        .textFieldStyle(ProfileFieldStyle())

                    ProfileFieldLabel("Phone Number")
                    TextField("(123) 456-7890", text: $viewModel.phone)
                        .textFieldStyle(ProfileFieldStyle())
                        .keyboardType(.phonePad)

                    Button {
                        viewModel.saveAccount()
                    } label: {
                        Text("Save Changes")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(SavrColors.brandGreen)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 4)
                }
            }

            // Danger Zone
            ProfileCard(title: "Permanently remove my personal data", subtitle: nil, collapsible: true) {
                VStack(spacing: 10) {
                    Text("This will permanently delete your account and all associated data. This action cannot be undone.")
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    Button {
                        showSignOut = true
                    } label: {
                        Text("Sign Out of SAVR")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Color(red: 0.80, green: 0.15, blue: 0.15))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(Color(red: 0.80, green: 0.15, blue: 0.15).opacity(0.10))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .stroke(Color(red: 0.80, green: 0.15, blue: 0.15).opacity(0.3), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 16)
    }
}

// MARK: - Dietary Section

private struct DietarySection: View {
    @ObservedObject var viewModel: ProfileViewModel

    // 3-column grid
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 10), count: 3)

    var body: some View {
        VStack(spacing: 14) {
            feedbackBanners(viewModel: viewModel)

            ProfileCard(title: "Common Dietary Preferences", subtitle: "Select your dietary preferences and add any custom notes.") {
                VStack(alignment: .leading, spacing: 14) {
                    LazyVGrid(columns: columns, spacing: 10) {
                        ForEach(viewModel.commonDietaryOptions, id: \.self) { option in
                            let isOn = viewModel.selectedDietary.contains(option)
                            Button {
                                if isOn { viewModel.selectedDietary.remove(option) }
                                else { viewModel.selectedDietary.insert(option) }
                            } label: {
                                HStack(spacing: 6) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 4)
                                            .stroke(isOn ? SavrColors.brandGreen : Color(red: 0.75, green: 0.80, blue: 0.75), lineWidth: 1.5)
                                            .frame(width: 16, height: 16)
                                        if isOn {
                                            Image(systemName: "checkmark")
                                                .font(.system(size: 9, weight: .bold))
                                                .foregroundStyle(SavrColors.brandGreen)
                                        }
                                    }
                                    Text(option)
                                        .font(.system(size: 11, weight: .medium))
                                        .foregroundStyle(Color(red: 0.20, green: 0.25, blue: 0.20))
                                        .lineLimit(2)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                .padding(.vertical, 8)
                                .padding(.horizontal, 8)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(isOn ? SavrColors.brandGreen.opacity(0.07) : Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .stroke(isOn ? SavrColors.brandGreen.opacity(0.4) : Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    HStack(spacing: 4) {
                        Text("Selected restrictions:")
                            .font(.system(size: 12))
                            .foregroundStyle(.secondary)
                        Text(viewModel.selectedDietaryLabel)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(viewModel.selectedDietary.isEmpty && viewModel.customDietaryRestrictions.isEmpty ? .secondary : SavrColors.brandGreen)
                    }
                    .padding(.top, 4)

                    Button {
                        viewModel.saveDietary()
                    } label: {
                        Text("Save Preferences")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(SavrColors.brandGreen)
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }

            ProfileCard(title: "Custom Dietary Preferences", subtitle: "Your custom preferences.") {
                VStack(alignment: .leading, spacing: 10) {
                    if viewModel.customDietaryRestrictions.isEmpty {
                        Text("No custom dietary preferences added.")
                            .font(.system(size: 13))
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(viewModel.customDietaryRestrictions, id: \.self) { item in
                            HStack {
                                Text(item)
                                    .font(.system(size: 14))
                                Spacer()
                                Button {
                                    viewModel.removeCustomDietary(item)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(Color(red: 0.70, green: 0.70, blue: 0.70))
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(red: 0.95, green: 0.97, blue: 0.95))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }

                    HStack(spacing: 8) {
                        TextField("Add a custom dietary restriction", text: $viewModel.customDietaryInput)
                            .textFieldStyle(ProfileFieldStyle())
                        Button {
                            viewModel.addCustomDietary()
                        } label: {
                            Text("Add")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 11)
                                .background(SavrColors.brandGreen)
                                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(.horizontal, 16)
    }
}

// MARK: - Brands Section

private struct BrandsSection: View {
    @ObservedObject var viewModel: ProfileViewModel

    var body: some View {
        VStack(spacing: 14) {
            feedbackBanners(viewModel: viewModel)

            // Brands You Like
            brandInputCard(
                title: "Brands You Like",
                titleColor: SavrColors.brandGreen,
                brands: viewModel.likedBrands,
                categoryBinding: $viewModel.likedCategory,
                brandBinding: $viewModel.likedBrandName,
                categoryPlaceholder: "Category (e.g., Pasta Sauce)",
                brandPlaceholder: "Brand Name",
                buttonLabel: "Add Preferred Brand",
                buttonColor: SavrColors.brandGreen,
                emptyText: "No preferred brands added yet.",
                onAdd: { viewModel.addLikedBrand() },
                onDelete: { viewModel.removeLikedBrand(at: $0) }
            )

            // Brands You Dislike
            brandInputCard(
                title: "Brands You Dislike",
                titleColor: Color(red: 0.80, green: 0.15, blue: 0.15),
                brands: viewModel.dislikedBrands,
                categoryBinding: $viewModel.dislikedCategory,
                brandBinding: $viewModel.dislikedBrandName,
                categoryPlaceholder: "Category (e.g., Cookies)",
                brandPlaceholder: "Brand Name",
                buttonLabel: "Add Disliked Brand",
                buttonColor: Color(red: 0.80, green: 0.15, blue: 0.15),
                emptyText: "No disliked brands added yet.",
                onAdd: { viewModel.addDislikedBrand() },
                onDelete: { viewModel.removeDislikedBrand(at: $0) }
            )
        }
        .padding(.horizontal, 16)
    }

    private func brandInputCard(
        title: String,
        titleColor: Color,
        brands: [BrandEntry],
        categoryBinding: Binding<String>,
        brandBinding: Binding<String>,
        categoryPlaceholder: String,
        brandPlaceholder: String,
        buttonLabel: String,
        buttonColor: Color,
        emptyText: String,
        onAdd: @escaping () -> Void,
        onDelete: @escaping (IndexSet) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(titleColor)

            if brands.isEmpty {
                Text(emptyText)
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            } else {
                VStack(spacing: 6) {
                    ForEach(Array(brands.enumerated()), id: \.element.id) { idx, entry in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                if !entry.category.isEmpty {
                                    Text(entry.category)
                                        .font(.system(size: 11))
                                        .foregroundStyle(.secondary)
                                }
                                Text(entry.brandName)
                                    .font(.system(size: 14, weight: .semibold))
                            }
                            Spacer()
                            Button {
                                onDelete(IndexSet(integer: idx))
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(Color(red: 0.70, green: 0.70, blue: 0.70))
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(titleColor.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            }

            HStack(spacing: 8) {
                TextField(categoryPlaceholder, text: categoryBinding)
                    .textFieldStyle(ProfileFieldStyle())
                    .frame(maxWidth: .infinity)
                TextField(brandPlaceholder, text: brandBinding)
                    .textFieldStyle(ProfileFieldStyle())
                    .frame(maxWidth: .infinity)
            }

            Button(action: onAdd) {
                Text(buttonLabel)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .background(buttonColor)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .buttonStyle(.plain)
        }
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

// MARK: - Shared Components

private struct ProfileCard<Content: View>: View {
    let title: String
    let subtitle: String?
    var icon: String? = nil
    var collapsible: Bool = false
    @State private var isExpanded = false
    let content: () -> Content

    init(title: String, subtitle: String?, icon: String? = nil, collapsible: Bool = false, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.icon = icon
        self.collapsible = collapsible
        self.content = content
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if collapsible {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { isExpanded.toggle() }
                } label: {
                    HStack {
                        Text(title)
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(Color(red: 0.60, green: 0.20, blue: 0.20))
                        Spacer()
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.secondary)
                    }
                }
                .buttonStyle(.plain)

                if isExpanded {
                    content()
                }
            } else {
                HStack(spacing: 6) {
                    if let icon {
                        Image(systemName: icon)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(SavrColors.brandGreen)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.system(size: 15, weight: .bold, design: .rounded))
                        if let subtitle {
                            Text(subtitle)
                                .font(.system(size: 12))
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                content()
            }
        }
        .padding(16)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color(red: 0.88, green: 0.92, blue: 0.88), lineWidth: 1))
        .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 2)
    }
}

private struct ProfileFieldLabel: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .semibold))
            .foregroundStyle(Color(red: 0.35, green: 0.40, blue: 0.35))
    }
}

private struct ProfileFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(.system(size: 14))
            .padding(11)
            .background(Color(red: 0.96, green: 0.97, blue: 0.96))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(Color(red: 0.86, green: 0.90, blue: 0.86), lineWidth: 1)
            )
    }
}

@ViewBuilder
private func feedbackBanners(viewModel: ProfileViewModel) -> some View {
    if let success = viewModel.successMessage {
        HStack(spacing: 8) {
            Image(systemName: "checkmark.circle.fill").foregroundStyle(SavrColors.brandGreen)
            Text(success).font(.system(size: 13, weight: .medium)).foregroundStyle(Color(red: 0.10, green: 0.40, blue: 0.15))
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 0.88, green: 0.97, blue: 0.88))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    if let error = viewModel.errorMessage {
        HStack(spacing: 8) {
            Image(systemName: "exclamationmark.circle.fill").foregroundStyle(.orange)
            Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(Color(red: 0.55, green: 0.30, blue: 0.05))
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(red: 1.0, green: 0.95, blue: 0.85))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
