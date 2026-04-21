import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 bg-cyan-100/80 dark:bg-cyan-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center border-b border-slate-200 dark:border-slate-600 pb-3 sm:pb-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/assets/savr-logo(primary).svg"
              alt="Savr Logo"
              className="h-6 sm:h-8"
            />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 p-6 sm:p-10 shadow-lg">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              SAVR Privacy Policy
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Effective Date:</strong> October 13, 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed mb-6">
              Welcome to SAVR! This Privacy Policy explains how SAVR Inc. and
              our platform (collectively, the "Services") collect, use, share,
              and protect your information. We've designed SAVR to be your smart
              grocery shopping assistant, and this policy tells you how we
              handle your data to make that happen.
            </p>

            <p className="mb-6">
              By using our Services, you agree to this Privacy Policy. If you
              don't agree, please don't use SAVR. This policy is part of our
              SAVR Terms of Use. Any terms not defined here have the meaning
              given in the Terms of Use.
            </p>

            {/* Table of Contents */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                What You'll Find Here:
              </h2>
              <ol className="space-y-2 text-sm">
                <li>
                  <a href="#section-1" className="text-green-600 dark:text-green-400 hover:underline">
                    Information We Collect
                  </a>{" "}
                  – What data we gather from you
                </li>
                <li>
                  <a href="#section-2" className="text-green-600 dark:text-green-400 hover:underline">
                    How We Use Your Information
                  </a>{" "}
                  – Why and how we use the data we collect
                </li>
                <li>
                  <a href="#section-3" className="text-green-600 dark:text-green-400 hover:underline">
                    When We Share Your Information
                  </a>{" "}
                  – Who we share your data with and why
                </li>
                <li>
                  <a href="#section-4" className="text-green-600 dark:text-green-400 hover:underline">
                    Where Your Data Lives
                  </a>{" "}
                  – Information about cross-border data processing
                </li>
                <li>
                  <a href="#section-5" className="text-green-600 dark:text-green-400 hover:underline">
                    Your Privacy Choices
                  </a>{" "}
                  – How you can control your data
                </li>
                <li>
                  <a href="#section-6" className="text-green-600 dark:text-green-400 hover:underline">
                    Data Security
                  </a>{" "}
                  – How we protect your information
                </li>
                <li>
                  <a href="#section-7" className="text-green-600 dark:text-green-400 hover:underline">
                    Withdrawing Your Consent
                  </a>{" "}
                  – How to manage and delete your data
                </li>
                <li>
                  <a href="#section-8" className="text-green-600 dark:text-green-400 hover:underline">
                    How Long We Keep Your Information
                  </a>{" "}
                  – Our data retention practices
                </li>
                <li>
                  <a href="#section-9" className="text-green-600 dark:text-green-400 hover:underline">
                    Security and Data Breach Response
                  </a>{" "}
                  – What we do to protect you
                </li>
                <li>
                  <a href="#section-10" className="text-green-600 dark:text-green-400 hover:underline">
                    Age Requirements
                  </a>{" "}
                  – Our policy for users under 18
                </li>
                <li>
                  <a href="#section-11" className="text-green-600 dark:text-green-400 hover:underline">
                    Your Privacy Rights
                  </a>{" "}
                  – Access, correction, and deletion rights
                </li>
                <li>
                  <a href="#section-12" className="text-green-600 dark:text-green-400 hover:underline">
                    Privacy Officer
                  </a>{" "}
                  – Who's responsible for privacy at SAVR
                </li>
                <li>
                  <a href="#section-13" className="text-green-600 dark:text-green-400 hover:underline">
                    Privacy Complaints
                  </a>{" "}
                  – How to file a complaint
                </li>
                <li>
                  <a href="#section-14" className="text-green-600 dark:text-green-400 hover:underline">
                    Policy Updates
                  </a>{" "}
                  – How we'll notify you of changes
                </li>
                <li>
                  <a href="#section-15" className="text-green-600 dark:text-green-400 hover:underline">
                    Contact Us
                  </a>{" "}
                  – How to reach us with questions
                </li>
              </ol>
            </div>

            {/* Section 1 */}
            <section id="section-1" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              <p className="mb-4">
                To help you shop smarter and save money on groceries, we collect
                different types of information. This can include data that
                identifies you directly (like your name) and data that doesn't.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                A. Information You Provide to Us
              </h3>
              <p className="mb-4">
                We collect personal information that you voluntarily provide
                when you register, use our Services, or contact customer
                support:
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Account Information:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Name, email address, password</li>
                  <li>Postal code and city (to find stores near you)</li>
                  <li>
                    Household information (optional - number of people, dietary
                    needs)
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Shopping & Meal Planning Information:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Shopping lists you create</li>
                  <li>Recipe photos you upload</li>
                  <li>Recipe links you paste</li>
                  <li>Meal planning requests you make</li>
                  <li>
                    Dietary preferences and restrictions (e.g., vegetarian,
                    gluten-free, allergies)
                  </li>
                  <li>
                    Store selections (which 3 retailers you choose for price
                    comparisons)
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Chat Conversations:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Messages you send to our AI shopping assistant</li>
                  <li>
                    Questions you ask about recipes, products, or meal planning
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Customer Support:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Support inquiries and communications with our team</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                B. Information We Collect Automatically
              </h3>
              <p className="mb-4">
                When you use SAVR, we automatically collect certain information
                about your device and how you use our Services:
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Usage Information:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Features you use (chat, recipe upload, manual list entry)
                  </li>
                  <li>Searches you perform within SAVR</li>
                  <li>How long you spend using different features</li>
                  <li>Shopping lists you create, view, or delete</li>
                  <li>Stores you select for price comparisons</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Device Information:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Device type (phone, tablet, computer)</li>
                  <li>Operating system (iOS, Android, Windows, Mac)</li>
                  <li>Browser type and version</li>
                  <li>IP address</li>
                  <li>General location (city/region based on IP address)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Cookies and Similar Technologies:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Session cookies (deleted when you close your browser)</li>
                  <li>
                    Persistent cookies (stay on your device for up to 2 years)
                  </li>
                  <li>
                    We use cookies to remember your login, preferences, and
                    provide core functionality
                  </li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                C. Artificial Intelligence Features
              </h3>
              <p className="mb-4">
                SAVR uses third-party AI technology providers (including OpenAI,
                Anthropic, and Google Gemini) to help you build shopping lists
                and plan meals.
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  When you use AI features, we share:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your shopping lists and meal planning requests</li>
                  <li>Recipe photos and links you provide</li>
                  <li>Your dietary preferences and restrictions</li>
                  <li>Chat messages with our assistant</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  What AI Does:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Extracts ingredients from recipe photos and text</li>
                  <li>Suggests relevant products and alternatives</li>
                  <li>Generates shopping lists based on meal plans</li>
                  <li>Answers your shopping-related questions</li>
                  <li>Provides recipe recommendations</li>
                </ul>
              </div>

              <p className="mb-2">
                <strong>Data Protection:</strong> AI providers process your data
                solely to deliver these features and cannot use your information
                for their own purposes. Data is transmitted using encrypted
                connections.
              </p>

              <p className="mb-2">
                <strong>Your Control:</strong> You can withdraw consent for AI
                processing by emailing{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                with subject "Disable AI Features." Note: This significantly
                limits SAVR's functionality - you won't be able to use chat,
                recipe photos, or meal planning. You can still manually create
                shopping lists and see price comparisons.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                D. Information from Google Maps
              </h3>
              <p className="mb-4">We use Google Maps to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Show you stores near your postal code</li>
                <li>Display store photos and information</li>
                <li>Help you find the best places to shop</li>
              </ul>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  What Google Maps Receives:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your postal code (to find nearby stores)</li>
                  <li>The stores you select for price comparison</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                2. How We Use Your Information
              </h2>
              <p className="mb-4">
                We use the information we collect to power SAVR, help you save
                money on groceries, and personalize your experience.
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Provide and Improve Our Services:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Create and maintain your account</li>
                  <li>Generate shopping lists from recipes</li>
                  <li>Compare prices across your selected retailers</li>
                  <li>
                    Show you which stores have the best prices for your items
                  </li>
                  <li>Track your savings over time</li>
                  <li>Improve SAVR's features and performance</li>
                  <li>Fix bugs and technical issues</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Personalize Your Experience:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Remember your dietary preferences and restrictions</li>
                  <li>Suggest products that match your needs</li>
                  <li>Recommend recipes based on your preferences</li>
                  <li>Show relevant product alternatives and substitutions</li>
                  <li>Remember your store selections</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  AI-Powered Features:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Process your chat messages to understand your shopping needs
                  </li>
                  <li>Analyze recipe photos to extract ingredients</li>
                  <li>Generate meal plans and shopping lists</li>
                  <li>Provide conversational shopping assistance</li>
                  <li>Suggest products and recipes</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Communicate With You:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Send important account notifications</li>
                  <li>Respond to your customer support requests</li>
                  <li>Provide updates about SAVR features (if you opt in)</li>
                  <li>Send service-related announcements</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Operate and Secure Our Services:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Prevent fraud and unauthorized access</li>
                  <li>Troubleshoot technical problems</li>
                  <li>Analyze how people use SAVR to improve it</li>
                  <li>Ensure our Services are working properly</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Location-Based Services:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Find grocery stores near you based on your postal code</li>
                  <li>Show you relevant pricing for your area</li>
                  <li>Provide store recommendations</li>
                </ul>
              </div>

              <p className="mt-4">
                We may also combine or anonymize information in a way that
                doesn't identify you personally and use it for any purpose, such
                as understanding grocery shopping trends.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                3. When We Share Your Information
              </h2>
              <p className="mb-4">
                We share your information only as necessary to provide our
                Services and comply with legal obligations.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                A. Service Providers and Business Partners
              </h3>
              <p className="mb-4">
                We work with third-party companies to help operate SAVR. These
                providers only access information necessary for their specific
                function and cannot use it for other purposes.
              </p>

              <p className="mb-4">
                <strong>Our Accountability:</strong> We remain responsible for
                your information even when processed by third parties. We
                require all service providers to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Protect your data using Canadian privacy standards</li>
                <li>Use your information only for authorized purposes</li>
                <li>Comply with PIPEDA and applicable privacy laws</li>
                <li>Return or delete your information when services end</li>
              </ul>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Types of Service Providers:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong>AI Technology Providers</strong> (including OpenAI,
                    Anthropic, and Google Gemini): Process your shopping lists,
                    chat messages, recipe photos, and dietary preferences to
                    provide AI-powered features
                  </li>
                  <li>
                    <strong>Google Maps:</strong> Provides store location
                    services and photos based on your postal code
                  </li>
                  <li>
                    <strong>Web Hosting & Infrastructure:</strong> Servers and
                    systems that run the SAVR platform
                  </li>
                  <li>
                    <strong>Email Services:</strong> For account communications
                  </li>
                </ul>
              </div>

              <p className="mb-2">
                <strong>Future Service Providers:</strong> As SAVR grows, we may
                add:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Payment processors (Stripe) for subscription payments</li>
                <li>
                  Email marketing services for promotional communications
                </li>
                <li>Analytics tools to improve our platform</li>
                <li>Customer support platforms</li>
              </ul>
              <p className="mb-4">
                We will update this policy and notify you of significant new
                providers.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                B. Sharing Anonymized Shopping Insights
              </h3>
              <p className="mb-4">
                Currently, SAVR does not share your information with third
                parties for data monetization purposes.
              </p>
              <p className="mb-4">
                In the future, we plan to share anonymized, aggregated shopping
                insights with grocery retailers, brands, and market research
                firms to help improve products, pricing, and the shopping
                experience.
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  What We May Share:
                </h4>
                <p className="mb-2">
                  <strong>Aggregated Trends:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>
                    "30% increase in organic product searches in Ontario during
                    January"
                  </li>
                  <li>
                    "Users shopping at discount stores prioritize price over
                    brand 78% of the time"
                  </li>
                  <li>
                    "Plant-based protein searches up 45% year-over-year"
                  </li>
                </ul>

                <p className="mb-2">
                  <strong>Anonymized Shopping Patterns:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>
                    "Users who buy chicken also search for rice 68% of the time"
                  </li>
                  <li>
                    "Weekend shoppers purchase 23% more produce than weekday
                    shoppers"
                  </li>
                  <li>"Average shopping list contains 15-20 items"</li>
                </ul>

                <p className="mb-2">
                  <strong>De-Identified Shopping Lists:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1 mb-4">
                  <li>
                    Sample shopping lists with all personal identifiers removed
                  </li>
                  <li>
                    Lists labeled only by anonymized ID, region, and general
                    demographic
                  </li>
                  <li>
                    No names, emails, addresses, or information that identifies
                    you
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                <p className="font-semibold text-slate-900 dark:text-white mb-2">
                  Example:
                </p>
                <p className="text-sm">
                  Anonymous User #12345 | Region: Toronto | Age Range: 25-34
                  <br />
                  Shopping List: Chicken breast, Brown rice, Broccoli, Olive oil
                  <br />
                  Store Preference: Discount chains
                  <br />
                  Dietary Tags: High-protein, Gluten-free
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  What We Will NEVER Share:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your name, email, phone number, or address</li>
                  <li>Shopping lists with YOUR identity attached</li>
                  <li>Any data that identifies YOU as an individual</li>
                  <li>
                    Information that can be traced back to you personally
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  The Difference:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    We may share: "Anonymous User #12345 shops for chicken and
                    rice"
                  </li>
                  <li>
                    We will NEVER share: "John Smith shops for chicken and rice"
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  How We Anonymize Data:
                </h4>
                <p className="mb-2">
                  Before sharing any shopping data, we:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Remove all names, emails, addresses, and account information
                  </li>
                  <li>Replace user identities with random anonymous IDs</li>
                  <li>Aggregate individual data into broader patterns</li>
                  <li>
                    Ensure data cannot be reverse-engineered to identify
                    individuals
                  </li>
                  <li>
                    Use privacy-preserving techniques to protect your identity
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Before We Start Sharing Insights:
                </h4>
                <ol className="list-decimal pl-6 space-y-1">
                  <li>
                    We will update this Privacy Policy with specific details
                  </li>
                  <li>
                    We will notify you by email at least 30 days in advance
                  </li>
                  <li>
                    You'll have the option to opt out or delete your account
                  </li>
                  <li>All data will be properly anonymized and aggregated</li>
                </ol>
              </div>

              <p className="mb-4">
                <strong>Your Rights:</strong> If we implement data sharing in
                the future, you can opt out at any time through Account Settings
                &gt; Privacy &gt; Data Sharing Preferences.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                C. Legal Compliance and Protection
              </h3>
              <p className="mb-4">
                We may disclose information about you without your consent if we
                believe it's necessary to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Comply with legal obligations, court orders, or subpoenas</li>
                <li>Protect our rights, property, or safety</li>
                <li>
                  Protect the rights, property, or safety of our users or others
                </li>
                <li>Investigate fraud or other illegal activities</li>
                <li>Enforce our Terms of Use or other agreements</li>
                <li>Respond to government or law enforcement requests</li>
              </ul>
              <p className="mb-4">
                We will not disclose more information than necessary for these
                purposes.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                D. Business Transfers
              </h3>
              <p className="mb-4">
                If SAVR is involved in a merger, acquisition, bankruptcy, or
                sale of assets, your information may be transferred as part of
                that transaction. We may disclose information to evaluate or
                complete such transactions.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                4. Where Your Data Lives
              </h2>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Current Infrastructure
              </h3>
              <p className="mb-4">
                SAVR's web application is currently hosted on servers in the
                United States. When you use SAVR, your information is
                transmitted to and processed in the US.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                AI Processing
              </h3>
              <p className="mb-4">
                When you use SAVR's AI-powered features (chat assistant, recipe
                analysis, meal planning), your data is processed by AI service
                providers located in the United States.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                What This Means
              </h3>
              <p className="mb-4">
                Your personal information is processed in the United States. As
                a result, US government agencies, courts, or law enforcement may
                be able to obtain disclosure of your information through laws
                applicable in the United States.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Why United States?
              </h3>
              <p className="mb-4">
                We use US-based infrastructure and AI services for reliability,
                cost-effectiveness, and access to cutting-edge AI technology. We
                are planning to migrate to Canadian servers (Google Cloud Run,
                Montreal or Toronto) in the future.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Your Consent
              </h3>
              <p className="mb-4">
                By using SAVR, you consent to this cross-border processing. We
                use encryption and security measures to protect your information
                regardless of where it's processed.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Your Data Protection
              </h3>
              <p className="mb-4">
                Even though data is processed in the US, we:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Use strong encryption for data transmission and storage</li>
                <li>Require all service providers to protect your data</li>
                <li>
                  Contractually prohibit service providers from using your data
                  for their own purposes
                </li>
                <li>Regularly audit our security practices</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                5. Your Privacy Choices
              </h2>
              <p className="mb-4">
                We believe you should have control over your information. Here's
                how you can manage your preferences:
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Account Settings
              </h3>
              <p className="mb-4">
                Log into SAVR and go to Settings &gt; Privacy to control:
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  AI Features:
                </h4>
                <p className="mb-2">
                  To withdraw consent for AI features (chat assistant, recipe
                  analysis, meal planning), email{" "}
                  <a
                    href="mailto:privacy@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    privacy@savr.app
                  </a>{" "}
                  with subject "Disable AI Features."
                </p>
                <p className="mb-2">
                  We are building a direct toggle in Account Settings that will
                  let you control this yourself. Until then, we process email
                  requests within 24 hours.
                </p>
                <p className="mb-2">
                  <strong>Impact of Withdrawing AI Consent:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You cannot use the chat assistant</li>
                  <li>
                    You cannot upload recipe photos for automatic ingredient
                    extraction
                  </li>
                  <li>
                    You cannot paste recipe links for automatic processing
                  </li>
                  <li>You cannot use AI-powered meal planning</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Shopping Data:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Delete individual shopping lists</li>
                  <li>Clear all shopping list history</li>
                  <li>Remove saved dietary preferences</li>
                  <li>Change or remove store selections</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Chat History:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Clear all AI chat conversations</li>
                  <li>Delete specific chat sessions</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Email Communications:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Unsubscribe from promotional emails (when we offer them)
                  </li>
                  <li>Manage notification preferences</li>
                  <li>Click "unsubscribe" in any email we send</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Browser and Device Settings
              </h3>
              <p className="mb-2">
                <strong>Cookies:</strong> You can manage cookies through your
                browser's privacy settings. Note that disabling cookies may
                limit some SAVR features.
              </p>
              <p className="mb-4">
                <strong>Location Services:</strong> You can control whether to
                provide your postal code. Note that without location
                information, we cannot show you nearby stores or relevant
                pricing.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Minimize Data Collection
              </h3>
              <p className="mb-2">
                <strong>Limit AI Processing:</strong> Manually type your
                shopping lists instead of using:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Chat assistant</li>
                <li>Recipe photo upload</li>
                <li>Recipe link pasting</li>
              </ul>
              <p className="mb-4">
                This reduces data sent to AI providers but significantly limits
                SAVR's functionality.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                6. Data Security
              </h2>
              <p className="mb-4">
                We take security seriously and use multiple layers of protection
                to safeguard your personal information.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                How We Protect Your Information
              </h3>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Encryption:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>All data encrypted in transit and at rest</li>
                  <li>
                    Your password is hashed (we never see your actual password)
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Access Controls:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Team members only access data needed for their specific job
                  </li>
                  <li>Multi-factor authentication for internal systems</li>
                  <li>Regular access reviews and logging</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Infrastructure Security:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Secure hosting with monitoring</li>
                  <li>Regular security audits and vulnerability scanning</li>
                  <li>Intrusion detection systems</li>
                  <li>Firewall protection</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Development Practices:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Secure coding standards</li>
                  <li>Code reviews for security issues</li>
                  <li>Regular security testing</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Your Role in Security
              </h3>
              <p className="mb-4">You can help protect your account by:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Using a strong, unique password for SAVR</li>
                <li>Not sharing your login credentials</li>
                <li>Logging out on shared or public devices</li>
                <li>Keeping your device software updated</li>
                <li>Reporting suspicious activity immediately</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Limitations
              </h3>
              <p className="mb-4">
                While we use industry-standard security measures, no system is
                100% secure. Internet transmission and electronic storage carry
                inherent risks. We cannot guarantee absolute security.
              </p>
              <p className="mb-4">
                We are not responsible for disclosure of information due to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Unauthorized third-party breaches despite reasonable
                  safeguards
                </li>
                <li>
                  Your failure to protect your password or account credentials
                </li>
                <li>Transmission interception outside our control</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                7. Withdrawing Your Consent and Managing Your Data
              </h2>
              <p className="mb-4">
                You can change your mind about how SAVR uses your information at
                any time.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Manage Your Data
              </h3>
              <p className="mb-4">
                <strong>AI Features:</strong> Email{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                with subject "Disable AI Features" to stop sending data to AI
                providers.
              </p>
              <p className="mb-4">
                <strong>Important:</strong> This significantly limits SAVR
                functionality - you won't be able to use chat, recipe photos, or
                meal planning. You can still manually create shopping lists and
                see price comparisons.
              </p>

              <p className="mb-4">
                <strong>Account:</strong> Delete your account in Settings &gt;
                Account &gt; Delete My Account
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Delete Your Account Completely
              </h3>
              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  What Happens When You Delete:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Your account closes within 24 hours</li>
                  <li>All personal information deleted within 30 days</li>
                  <li>
                    Shopping lists, chat history, and preferences permanently
                    erased
                  </li>
                  <li>
                    You'll receive confirmation email when deletion is complete
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  What We Must Keep (Legal Requirements):
                </h4>
                <p className="mb-2">
                  Even after account deletion, we may retain:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Transaction records if you had a paid subscription (7 years
                    - Canadian tax law requirement)
                  </li>
                  <li>
                    Anonymized usage data for improving SAVR (cannot be traced
                    back to you)
                  </li>
                  <li>Records of your deletion request (proof of compliance)</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Request Specific Actions
              </h3>
              <p className="mb-2">
                Email{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                with your request:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  "Disable AI Features" - We turn off chat, recipe analysis, AI
                  suggestions for your account
                </li>
                <li>"Remove Store Data" - We delete your store selections</li>
                <li>
                  "Data Access Request" - We send you everything we have about
                  you (within 30 days)
                </li>
                <li>
                  "Data Correction" - We fix inaccurate information
                </li>
                <li>
                  "Data Deletion Request" - We delete requested information (if
                  legally permitted)
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Response Times
              </h3>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Account setting changes: Immediate</li>
                <li>Email requests: We respond within 10 business days</li>
                <li>Data deletion: Complete within 30 days</li>
                <li>Data access requests: Delivered within 30 days</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Important to Understand
              </h3>
              <p className="mb-2">
                <strong>You Cannot Use SAVR Without:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Account creation (email, password)</li>
                <li>Basic shopping list storage</li>
                <li>Store selection for price comparisons</li>
              </ul>
              <p className="mb-4">
                <strong>
                  SAVR Has Very Limited Functionality Without AI Processing.
                </strong>
              </p>
              <p className="mb-4">
                If you withdraw consent for essential functions, we may need to
                close your account.
              </p>
              <p className="mb-4">
                Questions? Contact our Privacy Officer at{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                8. How Long We Keep Your Information
              </h2>
              <p className="mb-4">
                We only keep your information as long as needed for the purposes
                we collected it, or as required by law.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Retention Periods
              </h3>

              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-slate-300 dark:border-slate-600">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">
                        Information Type
                      </th>
                      <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">
                        Retention Period
                      </th>
                      <th className="border border-slate-300 dark:border-slate-600 px-4 py-2 text-left">
                        Why
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Account & Shopping Data
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Duration of account + 1 year
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Resolve any issues after closure
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Chat & AI Logs
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Duration of account or 30 days
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Provide service / troubleshooting
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Payment Records
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        7 years after last payment
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Canadian tax law requirement
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Support Communications
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        3 years from last message
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Customer support history
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Privacy Requests
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        3 years
                      </td>
                      <td className="border border-slate-300 dark:border-slate-600 px-4 py-2">
                        Demonstrate compliance
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                When Your Account Closes
              </h3>
              <p className="mb-4">When you delete your SAVR account:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Most personal information deleted within 30 days</li>
                <li>
                  Shopping lists, chat history, preferences deleted immediately
                </li>
                <li>
                  Some data retained for legal obligations (see table above)
                </li>
                <li>Backup systems purged within 90 days</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Anonymized Data
              </h3>
              <p className="mb-4">
                We may convert your information into anonymous, aggregated form
                that can't identify you. This anonymized data may be kept
                indefinitely for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Improving SAVR's algorithms and features</li>
                <li>Understanding grocery shopping trends</li>
                <li>Research and development</li>
              </ul>
              <p className="mb-4">
                <strong>Example:</strong> "Users in Ontario searched for
                'gluten-free' products 15% more in 2025 than 2024" - this
                doesn't identify anyone.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Your Right to Earlier Deletion
              </h3>
              <p className="mb-4">
                You can request deletion before these retention periods by:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Going to Settings &gt; Account &gt; Delete My Account
                </li>
                <li>
                  Emailing{" "}
                  <a
                    href="mailto:privacy@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    privacy@savr.app
                  </a>{" "}
                  with subject "Early Deletion Request"
                </li>
              </ul>
              <p className="mb-4">
                We'll delete everything we legally can within 30 days. If we
                must keep something (like payment records for tax law), we'll
                tell you specifically what and why.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                9. Security and Data Breach Response
              </h2>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                How We Protect Your Information
              </h3>
              <p className="mb-4">
                We use multiple layers of security to protect your personal
                information from unauthorized access, disclosure, or misuse.
              </p>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Technical Safeguards:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure password hashing</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Intrusion detection and prevention systems</li>
                  <li>Firewall protection and network segmentation</li>
                  <li>Secure development practices and code reviews</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Administrative Safeguards:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Role-based access controls (employees only access data
                    needed for their role)
                  </li>
                  <li>Confidentiality agreements with all staff and contractors</li>
                  <li>Regular privacy and security training</li>
                  <li>Incident response procedures and plans</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Physical Safeguards:
                </h4>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Secure data centers with monitoring</li>
                  <li>Access controls and visitor logging</li>
                  <li>Redundant power and environmental controls</li>
                </ul>
              </div>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Your Role in Security
              </h3>
              <p className="mb-4">You can help protect your account by:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Using a strong, unique password</li>
                <li>Not sharing your login credentials</li>
                <li>Logging out on shared or public devices</li>
                <li>Keeping your device software updated</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Limitations
              </h3>
              <p className="mb-4">
                While we use industry-standard security measures, no system is
                completely secure. Internet transmission and electronic storage
                carry inherent risks. We cannot guarantee absolute security and
                are not responsible for disclosure due to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Unauthorized third-party breaches despite reasonable
                  safeguards
                </li>
                <li>
                  Your failure to protect your password or account credentials
                </li>
                <li>Transmission interception outside our control</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                If a Data Breach Occurs
              </h3>
              <p className="mb-4">
                If we discover unauthorized access to your information that
                creates a real risk of significant harm (identity theft, fraud,
                financial loss, damage to reputation, etc.), we will:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Secure our systems and investigate what information was
                  affected
                </li>
                <li>
                  Notify you by email and/or prominent notice when you log in
                </li>
                <li>
                  Inform you what happened, what information was involved, and
                  what you should do
                </li>
                <li>
                  Tell you how to contact us with questions and your right to
                  file a complaint with the Privacy Commissioner of Canada
                </li>
                <li>
                  Notify the Office of the Privacy Commissioner of Canada as
                  required by law
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Report Security Concerns
              </h3>
              <p className="mb-4">
                If you think your account was accessed without permission or you
                notice suspicious activity:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:security@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    security@savr.app
                  </a>{" "}
                  (Subject: "Security Incident")
                </li>
                <li>Change your password immediately</li>
                <li>We'll investigate and respond within 24 hours</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                10. Age Requirements
              </h2>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Minimum Age
              </h3>
              <p className="mb-4">
                You must be at least 16 years old to create a SAVR account and
                use our Services.
              </p>
              <p className="mb-4">
                <strong>Why 16?</strong> At 16, most people in Ontario are
                starting to shop independently for groceries and can understand
                how SAVR uses their information.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                For Users 16-17
              </h3>
              <p className="mb-4">
                If you're 16 or 17 years old, we encourage you to review this
                Privacy Policy with a parent or guardian before using SAVR.
                While we don't require formal parental consent at this age, we
                want you to understand how we handle your data.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                If You're Under 16
              </h3>
              <p className="mb-4">
                Please don't create an account or provide any information to
                SAVR. If we discover someone under 16 is using our Services,
                we'll delete their account and information immediately.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                For Parents and Guardians
              </h3>
              <p className="mb-4">
                If you believe your child under 16 has created an account, or if
                you want to manage information for your 16-17 year old child,
                contact us at{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                with:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Your relationship to the minor</li>
                <li>The account username or email</li>
                <li>
                  What you'd like us to do (review data, delete account, etc.)
                </li>
              </ul>
              <p className="mb-4">
                We'll verify your parental relationship before taking action.
                You can:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Review what information we have about your child</li>
                <li>Request deletion of their information</li>
                <li>Close their account</li>
                <li>Ask questions about how we use their data</li>
              </ul>
              <p className="mb-4">
                <strong>Students & First-Time Shoppers:</strong> We know many of
                our users are university students and young adults learning to
                shop independently. We're committed to protecting your privacy
                while helping you save money on groceries.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                11. Your Privacy Rights
              </h2>
              <p className="mb-4">
                Under Canadian privacy law (PIPEDA), you have specific rights
                regarding your personal information.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Right to Access
              </h3>
              <p className="mb-4">
                You can request a copy of all personal information we have about
                you.
              </p>
              <p className="mb-2">
                <strong>How to Request:</strong> Email{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                with subject "Data Access Request"
              </p>
              <p className="mb-2">
                <strong>What You'll Receive:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Categories of personal information we collect</li>
                <li>Specific pieces of your personal information</li>
                <li>Sources from which we collected it</li>
                <li>Purposes for collecting, using, or sharing it</li>
                <li>Categories of third parties we share it with</li>
              </ul>
              <p className="mb-4">
                <strong>Timeline:</strong> We'll respond within 30 days
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Right to Correction
              </h3>
              <p className="mb-4">
                You can request that we correct inaccurate personal information
                about you.
              </p>
              <p className="mb-2">
                <strong>How to Correct:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Update your information directly in Account Settings &gt;
                  Profile
                </li>
                <li>
                  For other corrections, email{" "}
                  <a
                    href="mailto:privacy@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    privacy@savr.app
                  </a>{" "}
                  with subject "Data Correction"
                </li>
              </ul>
              <p className="mb-4">
                <strong>Timeline:</strong> Changes reflected immediately in your
                account; email requests within 30 days
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Right to Delete
              </h3>
              <p className="mb-4">
                You can request that we delete your personal information, with
                some exceptions.
              </p>
              <p className="mb-2">
                <strong>How to Request:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Settings &gt; Account &gt; Delete My Account (fastest)
                </li>
                <li>
                  Email{" "}
                  <a
                    href="mailto:privacy@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    privacy@savr.app
                  </a>{" "}
                  with subject "Data Deletion Request"
                </li>
              </ul>
              <p className="mb-2">
                <strong>What Gets Deleted:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>All shopping lists and chat history (immediately)</li>
                <li>Account information (within 30 days)</li>
                <li>Saved preferences and settings (within 30 days)</li>
                <li>Usage history (within 30 days)</li>
              </ul>
              <p className="mb-2">
                <strong>What We May Keep:</strong> We may retain information if
                necessary for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Completing a transaction or providing a service you requested
                </li>
                <li>
                  Detecting security incidents, protecting against fraud
                </li>
                <li>Debugging to fix errors</li>
                <li>Complying with legal obligations</li>
                <li>
                  Internal uses reasonably aligned with your expectations
                </li>
              </ul>
              <p className="mb-4">
                <strong>Timeline:</strong> Deletion complete within 30 days
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Right to Withdraw Consent
              </h3>
              <p className="mb-4">
                You can withdraw consent for data collection and use at any
                time. See Section 7 for details.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Right to File a Complaint
              </h3>
              <p className="mb-4">
                If you're not satisfied with how we handle your privacy rights,
                you can file a complaint with:
              </p>
              <p className="mb-2">
                <strong>Office of the Privacy Commissioner of Canada</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Website:{" "}
                  <a
                    href="https://www.priv.gc.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    www.priv.gc.ca
                  </a>
                </li>
                <li>Phone: 1-800-282-1376</li>
                <li>
                  Online Form:{" "}
                  <a
                    href="https://www.priv.gc.ca/en/report-a-concern/file-a-formal-privacy-complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline break-all">
                    https://www.priv.gc.ca/en/report-a-concern/file-a-formal-privacy-complaint/
                  </a>
                </li>
                <li>Mail: 30 Victoria Street, Gatineau, Quebec K1A 1H3</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                12. Privacy Officer
              </h2>
              <p className="mb-4">
                SAVR has designated a Privacy Officer responsible for ensuring
                we comply with Canadian privacy laws and handle your information
                properly.
              </p>
              <p className="mb-4">
                Contact our Privacy Officer at{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                for:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Questions about how we use your information</li>
                <li>Filing a privacy complaint</li>
                <li>
                  Exercising your privacy rights (access, correction, deletion)
                </li>
                <li>Reporting potential privacy issues</li>
              </ul>
              <p className="mb-4">
                All privacy inquiries are taken seriously and handled
                confidentially.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                13. Privacy Complaints and How to Resolve Them
              </h2>
              <p className="mb-4">
                We want to address any privacy concerns you have.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Internal Complaint Process
              </h3>
              <p className="mb-2">
                <strong>Contact Our Privacy Officer:</strong>
              </p>
              <p className="mb-4">
                Email:{" "}
                <a
                  href="mailto:privacy@savr.app"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  privacy@savr.app
                </a>{" "}
                (Subject: "Privacy Complaint")
              </p>
              <p className="mb-2">
                <strong>Please include:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Your name and contact information</li>
                <li>Description of your privacy concern</li>
                <li>What information is involved</li>
                <li>What you'd like us to do about it</li>
              </ul>
              <p className="mb-4">
                <strong>Our Process:</strong> We will acknowledge receipt of
                your complaint and investigate the matter. We aim to provide a
                written response within 30 days. If we need more time, we'll let
                you know why and when to expect our response.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                File With Privacy Commissioner
              </h3>
              <p className="mb-4">
                If you're not satisfied with our response, or if you prefer to
                file a complaint directly with a regulatory authority, you can
                contact:
              </p>
              <p className="mb-2">
                <strong>Office of the Privacy Commissioner of Canada</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Website:{" "}
                  <a
                    href="https://www.priv.gc.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    www.priv.gc.ca
                  </a>
                </li>
                <li>Phone: 1-800-282-1376</li>
                <li>
                  Online Form:{" "}
                  <a
                    href="https://www.priv.gc.ca/en/report-a-concern/file-a-formal-privacy-complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline break-all">
                    https://www.priv.gc.ca/en/report-a-concern/file-a-formal-privacy-complaint/
                  </a>
                </li>
                <li>Mail: 30 Victoria Street, Gatineau, Quebec K1A 1H3</li>
              </ul>
              <p className="mb-4">
                The Privacy Commissioner investigates privacy complaints and can
                make recommendations. There's no cost to file a complaint.
              </p>
              <p className="mb-4">
                Filing a complaint does not affect any other legal rights you
                may have.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                14. Policy Updates
              </h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, technology, legal requirements, or
                other factors.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                How We'll Notify You
              </h3>
              <p className="mb-4">When we make changes:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>We'll post the updated policy on savr.app</li>
                <li>We'll update the "Effective Date" at the top</li>
                <li>
                  For significant changes, we'll also notify you by:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Email to your registered address</li>
                    <li>Prominent notice when you log into SAVR</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Your Continued Use
              </h3>
              <p className="mb-4">
                By continuing to use SAVR after we post changes, you agree to
                the updated Privacy Policy.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Review Regularly
              </h3>
              <p className="mb-4">
                We encourage you to review this policy periodically to stay
                informed about how we protect your information.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                15. Contact Us
              </h2>
              <p className="mb-4">
                If you have any questions, comments, or concerns about this
                Privacy Policy, your information, or our privacy practices,
                please contact us:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-6">
                <p className="mb-2">
                  <strong>General Privacy Inquiries:</strong>{" "}
                  <a
                    href="mailto:privacy@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    privacy@savr.app
                  </a>
                </p>
                <p className="mb-2">
                  <strong>Security Concerns:</strong>{" "}
                  <a
                    href="mailto:security@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    security@savr.app
                  </a>
                </p>
                <p>
                  <strong>Customer Support:</strong>{" "}
                  <a
                    href="mailto:support@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    support@savr.app
                  </a>
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Last Updated: October 13, 2025
              </p>
            </section>

            {/* Additional Information */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Additional Information
              </h2>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Scope of This Policy
              </h3>
              <p className="mb-4">
                This Privacy Policy applies only to SAVR's Services. Our
                Services may contain links to other websites or applications
                that we do not own or operate. We are not responsible for the
                privacy practices of these third-party sites. We encourage you
                to review the privacy policies of any third-party sites you
                visit.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Survival
              </h3>
              <p className="mb-4">
                The following sections shall survive any termination of your use
                of the Services: Where Your Data Lives, How Long We Keep Your
                Information, Security and Data Breach Response, Age
                Requirements, Your Privacy Rights, Privacy Officer, Privacy
                Complaints, and Contact Us.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Language
              </h3>
              <p className="mb-4">
                This Privacy Policy is written in English. If we provide a
                translation, the English version controls in case of any
                conflict.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                Governing Law
              </h3>
              <p className="mb-4">
                This Privacy Policy is governed by the laws of Ontario, and
                complies with the Personal Information Protection and Electronic
                Documents Act (PIPEDA).
              </p>
            </section>

            {/* Closing Statement */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
              <p className="text-center text-slate-900 dark:text-white font-medium">
                SAVR is committed to protecting your privacy while helping you
                save money on groceries. If you have any questions about this
                policy or how we handle your information, please don't hesitate
                to contact us.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-8 border-t border-slate-200 dark:border-slate-600">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/assets/savr-logo(primary).svg"
                alt="Savr Logo"
                className="h-5 sm:h-6"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white">
                Terms of Service
              </Link>
            </div>
            <div className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <p>&copy; 2025. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPage;

