import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-100 via-emerald-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:via-emerald-900 dark:to-green-900">
      <Helmet>
        <title>Terms of Service - Savr</title>
        <meta name="description" content="Savr's terms of service. Read the terms and conditions for using the Savr grocery price comparison platform." />
        <link rel="canonical" href="https://savr.app/terms" />
      </Helmet>
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
              SAVR Terms of Service
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Effective Date:</strong> October 13, 2025
            </p>
          </div>

          {/* Introduction */}
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed mb-6">
              Welcome to SAVR! These Terms of Service ("Terms") are a legal
              agreement between you and SAVR ("SAVR," "we," "us," or "our").
              They govern your use of our website at savr.app and related
              services (together, the "Service").
            </p>

            <p className="mb-6">
              Please read these Terms carefully. They outline your rights and
              responsibilities when using SAVR.
            </p>

            <p className="mb-6">
              We may update these Terms periodically. By using the Service, you
              accept this Agreement and any changes we make. It's your
              responsibility to review the most current version regularly. If
              you do not agree with any part of these Terms, please do not use
              the Service.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-8">
              <p className="text-sm mb-0">
                <strong>Note:</strong> SAVR may have financial relationships
                with some retailers and merchants listed on our Service now or
                in the future. This is how we fund our operations and keep the
                Service free or low-cost for you. We may earn a commission if
                you choose to purchase products from these merchants, but we
                always strive to give you the most comprehensive price
                comparisons possible so you remain in control at all times. We
                commit to full transparency and will always make decisions that
                put our users first.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Table of Contents:
              </h2>
              <ol className="space-y-2 text-sm">
                <li>
                  <a href="#section-1" className="text-green-600 dark:text-green-400 hover:underline">
                    Eligibility
                  </a>
                </li>
                <li>
                  <a href="#section-2" className="text-green-600 dark:text-green-400 hover:underline">
                    Your Use of SAVR Content
                  </a>
                </li>
                <li>
                  <a href="#section-3" className="text-green-600 dark:text-green-400 hover:underline">
                    How the Service Works
                  </a>
                </li>
                <li>
                  <a href="#section-4" className="text-green-600 dark:text-green-400 hover:underline">
                    Creating and Managing Your Account
                  </a>
                </li>
                <li>
                  <a href="#section-5" className="text-green-600 dark:text-green-400 hover:underline">
                    What You Cannot Do (Use Restrictions)
                  </a>
                </li>
                <li>
                  <a href="#section-6" className="text-green-600 dark:text-green-400 hover:underline">
                    Data Collection and Use
                  </a>
                </li>
                <li>
                  <a href="#section-7" className="text-green-600 dark:text-green-400 hover:underline">
                    Your Rights and Choices
                  </a>
                </li>
                <li>
                  <a href="#section-8" className="text-green-600 dark:text-green-400 hover:underline">
                    Interactive Features and Your Content
                  </a>
                </li>
                <li>
                  <a href="#section-9" className="text-green-600 dark:text-green-400 hover:underline">
                    Third-Party Links and Services
                  </a>
                </li>
                <li>
                  <a href="#section-10" className="text-green-600 dark:text-green-400 hover:underline">
                    Disclaimer of Warranties
                  </a>
                </li>
                <li>
                  <a href="#section-11" className="text-green-600 dark:text-green-400 hover:underline">
                    Limitation of Liability
                  </a>
                </li>
                <li>
                  <a href="#section-12" className="text-green-600 dark:text-green-400 hover:underline">
                    Indemnification
                  </a>
                </li>
                <li>
                  <a href="#section-13" className="text-green-600 dark:text-green-400 hover:underline">
                    Termination and Restrictions on Access
                  </a>
                </li>
                <li>
                  <a href="#section-14" className="text-green-600 dark:text-green-400 hover:underline">
                    Refunds and Cancellations
                  </a>
                </li>
                <li>
                  <a href="#section-15" className="text-green-600 dark:text-green-400 hover:underline">
                    Consent to Electronic Communications
                  </a>
                </li>
                <li>
                  <a href="#section-16" className="text-green-600 dark:text-green-400 hover:underline">
                    Dispute Resolution
                  </a>
                </li>
                <li>
                  <a href="#section-17" className="text-green-600 dark:text-green-400 hover:underline">
                    General Legal Notices
                  </a>
                </li>
                <li>
                  <a href="#section-18" className="text-green-600 dark:text-green-400 hover:underline">
                    Force Majeure
                  </a>
                </li>
                <li>
                  <a href="#section-19" className="text-green-600 dark:text-green-400 hover:underline">
                    Contact Us
                  </a>
                </li>
              </ol>
            </div>

            {/* Section 1 */}
            <section id="section-1" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                1. Eligibility
              </h2>
              <p className="mb-4">
                To use the Service, you must be at least 16 years old and
                capable of providing meaningful consent under applicable privacy
                laws. If you are under 16 years old, you may use the Service
                only with the involvement of a parent or legal guardian who
                agrees to these Terms on your behalf.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                2. Your Use of SAVR Content
              </h2>
              <p className="mb-4">
                This Service is provided to you as a limited license, not sold
                to you.
              </p>
              <p className="mb-4">
                All content and materials that comprise the Service—including
                the SAVR logo, designs, text, graphics, software, and other
                materials (collectively, "Content")—are owned by SAVR and/or its
                suppliers or licensors. This Content is protected by Canadian
                and international copyright laws. As long as you follow these
                Terms, SAVR grants you a limited, personal, and non-transferable
                right to access and use the Service for your personal,
                non-commercial use only. The Service is for your individual use
                and not for resale or further distribution. We can cancel this
                right at any time.
              </p>
              <p className="mb-4">
                Unless specifically allowed by this Agreement or applicable law,
                you are not permitted to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Copy, change, translate, improve, or reverse engineer the
                  Service.
                </li>
                <li>Rent, lease, or sublicense access to the Service.</li>
                <li>
                  Bypass or disable any of the Service's security features.
                </li>
                <li>
                  Use the Service for data scraping purposes or any commercial
                  use.
                </li>
                <li>
                  Distribute, modify, or exploit any content without our prior
                  written consent.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                3. How the Service Works
              </h2>
              <p className="mb-4">
                We provide price comparison and shopping list-building services
                to help you find the best deals on groceries, household items,
                and other products.
              </p>
              <p className="mb-2">
                <strong>Accuracy:</strong> Our price data is only as good as the
                information displayed or provided by the retailers and merchants
                from whom we obtain our data. SAVR is not responsible for any
                errors, omissions, or expired prices, coupons, or promotional
                offers. We will do our best to correct or obtain corrections
                whenever we receive notice of discrepancies and can confirm them
                with the relevant parties.
              </p>
              <p className="mb-2">
                <strong>Your Responsibility:</strong> You are responsible for
                verifying that any price, discount, special sale, or coupon
                offer is valid at the relevant retailer before making a
                purchase.
              </p>
              <p className="mb-4">
                <strong>Changes:</strong> All prices, promotions, and product
                availability shown on the Service can change without notice. We
                do not control the legality of prices or a retailer's ability to
                complete a sale at those prices.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                4. Creating and Managing Your Account
              </h2>
              <p className="mb-4">
                You may register for an account to access features like creating
                shopping lists, saving preferences, and comparing prices across
                retailers. When you register, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Provide accurate, current, and complete information about
                  yourself as requested by our registration forms.
                </li>
                <li>
                  Keep your login details, passwords, and other credentials
                  secure.
                </li>
                <li>
                  Keep your account information accurate, current, and complete
                  by promptly updating it.
                </li>
              </ul>
              <p className="mb-4">
                You must immediately inform us of any unauthorized use of your
                account or any other security breach.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                5. What You Cannot Do (Use Restrictions)
              </h2>
              <p className="mb-4">
                To ensure a fair and safe environment for all users, you agree
                not to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Use the Service for fraudulent, unlawful, misleading, or
                  malicious purposes, including deceptive marketing practices.
                </li>
                <li>
                  Distribute spam, unsolicited promotional content, or conduct
                  phishing attacks.
                </li>
                <li>
                  Access, monitor, or copy any content or information on the
                  Service using automated tools (like robots, agents, or
                  spiders) or manual processes without our express written
                  permission.
                </li>
                <li>
                  Interfere with, disrupt, or undermine the integrity, security,
                  or functionality of the Service, including unauthorized access
                  or attempting to bypass security measures.
                </li>
                <li>
                  Post, transmit, or distribute harmful content, including
                  malware, viruses, or any other code designed to damage,
                  interfere with, or disrupt the Service.
                </li>
                <li>
                  Create deep-links to any part of the Service (including direct
                  links to retailers, products, or prices) for any purpose
                  without our express written permission.
                </li>
                <li>
                  "Frame," "mirror," or otherwise embed any part of the Service
                  into any other website or product without our prior written
                  permission.
                </li>
                <li>
                  Violate any applicable laws, regulations, or the rights of
                  others, including intellectual property and privacy laws.
                </li>
                <li>
                  Take any action that could overload our systems or impact the
                  Service's performance.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                6. Data Collection and Use
              </h2>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                6.1 Consent to Data Collection
              </h3>
              <p className="mb-4">
                By using the Service, you consent to our collection, use,
                sharing, and/or transfer of information as outlined in the SAVR
                Privacy Policy, as updated from time to time, which is
                incorporated into these Terms. This includes but is not limited
                to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Personal information (such as name, email address, and account
                  credentials)
                </li>
                <li>Shopping behavior, preferences, and list-building activity</li>
                <li>
                  Location data (including IP address and geolocation
                  information)
                </li>
                <li>
                  Technical information about your device, browser, and system
                </li>
                <li>
                  Usage data related to your interactions with the Service
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                6.2 Data Use
              </h3>
              <p className="mb-4">We collect and use this information to:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Provide and improve our price comparison and list-building
                  services
                </li>
                <li>
                  Personalize your shopping experience and recommendations
                </li>
                <li>Analyze usage patterns and optimize Service performance</li>
                <li>Communicate with you about the Service</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                6.3 Privacy Policy
              </h3>
              <p className="mb-4">
                All data collection and use practices are governed by our
                Privacy Policy, available at{" "}
                <Link
                  to="/privacy"
                  className="text-green-600 dark:text-green-400 hover:underline">
                  SAVR Privacy Policy
                </Link>
                . Please review our Privacy Policy to understand how we collect,
                use, and protect your information.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                7. Your Rights and Choices
              </h2>
              <p className="mb-4">You may have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>Access and correct your information:</strong> You may
                  request a copy of the personal data we hold about you and
                  request corrections to inaccurate or incomplete information.
                </li>
                <li>
                  <strong>Request deletion:</strong> You can ask us to erase
                  your personal data, subject to legal and operational retention
                  requirements.
                </li>
                <li>
                  <strong>Withdraw consent:</strong> If you previously provided
                  consent for data collection, you may withdraw it at any time.
                  This may impact your ability to use certain features of the
                  Service.
                </li>
                <li>
                  <strong>Opt-out of targeted advertising:</strong> You can
                  adjust ad-tracking preferences through third-party advertising
                  networks, device settings, or by contacting us.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                7.1 Parental Consent and Controls for Minors
              </h3>
              <p className="mb-4">
                If you are under 16 years old, your parent or legal guardian
                must provide consent for you to use the Service. Parents or
                legal guardians may:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Review or request deletion of their child's personal
                  information.
                </li>
                <li>
                  Withdraw consent, which may restrict or delete the child's
                  account.
                </li>
                <li>
                  Opt-out of targeted advertising on behalf of the child through
                  device settings or by contacting us.
                </li>
              </ul>
              <p className="mb-4">
                If we determine that we have collected personal data from a
                minor without appropriate consent, we will take immediate steps
                to delete it.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                8. Interactive Features and Your Content
              </h2>
              <p className="mb-4">
                The Service may include interactive features like reviews,
                comments, ratings, and other user-generated content
                ("Interactive Services"). Through these, you or others may post,
                share, or transmit content.
              </p>
              <p className="mb-4">
                You are solely responsible for your use of Interactive Services
                and use them at your own risk. To ensure a safe and respectful
                environment, you agree not to post, transmit, distribute,
                upload, or otherwise share through the Service any of the
                following:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Illegal, offensive, or harmful materials (e.g., libelous,
                  defamatory, obscene, harassing, or fraudulent content).
                </li>
                <li>
                  Material that violates any applicable law, regulation, or
                  government order.
                </li>
                <li>
                  Material that infringes on patents, trademarks, trade secrets,
                  copyrights, or other intellectual property rights of any
                  party, or content you do not have the right to share.
                </li>
                <li>
                  Private or confidential information about any person or
                  entity.
                </li>
                <li>
                  Material that impersonates any person or entity, or
                  misrepresents your affiliation with the Service or any other
                  person or entity.
                </li>
                <li>
                  Advertising, solicitations, or political campaigning (unless
                  specifically allowed).
                </li>
                <li>Comments that refer to persons under 18 years of age.</li>
                <li>Viruses, corrupted data, or other harmful files.</li>
                <li>
                  Material that, in SAVR's sole judgment, is objectionable,
                  restricts others from using the Service, or may expose SAVR or
                  its users to harm or liability.
                </li>
              </ul>
              <p className="mb-4">
                <strong>Important:</strong> SAVR is not responsible for any
                content posted, stored, or uploaded by you or others, nor for
                any related loss or damage. While SAVR is not obligated to
                review, edit, or monitor content on the Service, we reserve the
                right to remove, screen, or edit any content at any time and for
                any reason, without notice.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                8.1 When You Post Content
              </h3>
              <p className="mb-4">
                If you post material on or through the Service, unless SAVR
                indicates otherwise, you:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>
                  Grant SAVR and its affiliates a non-exclusive, royalty-free,
                  worldwide, and perpetual license to use, reproduce, modify,
                  adapt, publish, translate, create derivative works from,
                  distribute, perform, and display such material in any media.
                </li>
                <li>
                  Grant SAVR and its affiliates the right to use the name you
                  submit in connection with such material, if they choose.
                </li>
                <li>
                  Represent and warrant that you own and control all rights to
                  the material you post, or you otherwise have the right to post
                  it to the Service; and that the use and posting of material
                  you supply does not violate these Terms, will not violate any
                  rights of or cause injury to any person or entity, and will
                  not otherwise create any harm or liability for SAVR or third
                  parties.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                8.2 Feedback and Suggestions
              </h3>
              <p className="mb-4">
                You may provide suggestions, comments, or other feedback
                ("Feedback") to us about the Service. By providing Feedback, you
                grant SAVR a perpetual, irrevocable, non-exclusive, royalty-free,
                worldwide license to use, reproduce, modify, distribute, and
                display such Feedback for any purpose without compensation or
                attribution to you. You represent that any Feedback you provide
                is original to you and does not infringe any third-party rights.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                8.3 Content Disclaimers
              </h3>
              <p className="mb-4">
                You acknowledge that by using the Service, you may encounter
                user-generated content that you may find offensive,
                inappropriate, or objectionable. You agree to use the Service at
                your own risk, and we shall have no liability for any such
                content.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                9. Third-Party Links and Services
              </h2>
              <p className="mb-4">
                The Service may contain links to web pages and content from
                third parties, including retailers, merchants, and other
                services ("Third-Party Content"), as a convenience. SAVR does
                not monitor, endorse, adopt, or control any Third-Party Content.
                We are not responsible for updating or reviewing any Third-Party
                Content and cannot guarantee its accuracy or completeness.
              </p>
              <p className="mb-4">
                If you click on a link or navigate away from the Service, these
                Terms will no longer apply. You should review the terms and
                policies, including privacy and data practices, of any websites
                or Third-Party Content you access from the Service. You access
                and use Third-Party Content at your own risk.
              </p>
              <p className="mb-4">
                The Service may also display advertisements and promotions from
                third parties. Any dealings or correspondence you have with
                these advertisers, or your participation in their promotions,
                including any terms, conditions, warranties, or representations
                associated with such dealings, are solely between you and that
                third party.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                9.1 Price Information Disclaimer
              </h3>
              <p className="mb-4">
                Price information displayed on the Service is provided by
                third-party retailers, merchants, and other sources. We make no
                representations or warranties regarding the accuracy,
                completeness, or timeliness of such price information. Actual
                prices, availability, and promotional offers may vary and should
                be verified directly with the retailer before making any
                purchase.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                10. Disclaimer of Warranties (No Guarantees)
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                <p className="text-sm uppercase font-semibold mb-2">
                  YOUR USE OF THE SERVICE, INCLUDING ANY CONTENT ACCESSIBLE
                  THROUGH THE WEBSITE, AND YOUR INTERACTIONS WITH OTHER SERVICE
                  USERS, IS ENTIRELY AT YOUR OWN RISK.
                </p>
                <p className="text-sm mb-2">
                  THE SERVICE, AND ALL CONTENT AVAILABLE ON OR THROUGH THE
                  WEBSITE OR SERVICE, IS PROVIDED "AS IS" AND "AS AVAILABLE."
                  SAVR AND ITS SUPPLIERS AND LICENSORS EXPRESSLY DISCLAIM ALL
                  WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
                  BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
                <p className="text-sm mb-2">
                  SAVR DOES NOT GUARANTEE UNINTERRUPTED USE OR OPERATION OF THE
                  SERVICE OR YOUR ACCESS TO ANY CONTENT. NO ADVICE OR
                  INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU FROM THE
                  SERVICE WILL CREATE ANY WARRANTY REGARDING SAVR THAT IS NOT
                  EXPRESSLY STATED IN THESE TERMS.
                </p>
                <p className="text-sm mb-0">
                  SOME JURISDICTIONS MAY PROHIBIT A DISCLAIMER OF WARRANTIES,
                  AND YOU MAY HAVE OTHER RIGHTS THAT VARY FROM JURISDICTION TO
                  JURISDICTION.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                11. Limitation of Liability (Our Responsibility to You)
              </h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                <p className="text-sm mb-2">
                  NEITHER SAVR NOR ITS SUPPLIERS OR LICENSORS WILL BE LIABLE FOR
                  ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY
                  DAMAGES, INCLUDING DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE,
                  DATA, OR OTHER INTANGIBLE LOSSES (EVEN IF SAVR OR ANY SUPPLIER
                  OR LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF THESE
                  DAMAGES). THIS APPLIES TO DAMAGES ARISING OUT OF OR RELATING
                  TO YOUR ACCESS TO OR USE OF, OR YOUR INABILITY TO ACCESS OR
                  USE, THE SERVICE OR ANY CONTENT.
                </p>
                <p className="text-sm mb-2">
                  SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF
                  LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, SO THE
                  ABOVE LIMITATION MAY NOT APPLY TO YOU.
                </p>
                <p className="text-sm mb-2">
                  THE MAXIMUM TOTAL LIABILITY OF SAVR AND ITS SUPPLIERS AND
                  LICENSORS TO YOU FOR ALL CLAIMS UNDER THESE TERMS, WHETHER IN
                  CONTRACT, TORT, OR OTHERWISE, IS FIFTY DOLLARS ($50.00 CAD).
                </p>
                <p className="text-sm mb-0">
                  EACH PROVISION OF THESE TERMS THAT LIMITS LIABILITY, DISCLAIMS
                  WARRANTIES, OR EXCLUDES DAMAGES IS INTENDED TO ALLOCATE RISKS
                  BETWEEN THE PARTIES. THIS ALLOCATION IS A FUNDAMENTAL PART OF
                  OUR AGREEMENT. EACH OF THESE PROVISIONS IS SEPARATE AND
                  INDEPENDENT OF ALL OTHER PROVISIONS OF THESE TERMS. THE
                  LIMITATIONS IN THIS SECTION WILL APPLY EVEN IF ANY LIMITED
                  REMEDY FAILS OF ITS ESSENTIAL PURPOSE.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                12. Indemnification (Your Responsibility for Damages)
              </h2>
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless SAVR, its
                subsidiaries and affiliates, and their respective directors,
                officers, agents, employees, licensors, and suppliers from and
                against any costs, damages, expenses, and liabilities (including
                reasonable attorneys' fees) arising out of or related to:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third party's rights</li>
                <li>Any content you post or transmit through the Service</li>
              </ul>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                13. Termination and Restrictions on Access
              </h2>
              <p className="mb-4">
                SAVR reserves the right, without notice and at our sole
                discretion, to terminate your license to use the Service and to
                block, restrict, and prevent your future access to and use of
                the Service under the following conditions:
              </p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>You violate these Terms or any applicable laws.</li>
                <li>
                  You engage in fraudulent, abusive, or harmful activity,
                  including unauthorized access or data breaches.
                </li>
                <li>
                  You attempt to interfere with the functionality, security, or
                  integrity of the Service.
                </li>
                <li>
                  If required by law enforcement or regulatory authorities.
                </li>
              </ul>
              <p className="mb-4">
                Additionally, SAVR reserves the right to modify, discontinue, or
                restrict, temporarily or permanently, all or part of the Service
                without notice and at our sole discretion. Neither SAVR nor its
                suppliers or licensors will be liable to you or any third party
                for any such modification, discontinuance, or restriction of the
                Service.
              </p>
              <p className="mb-4">
                If your account is terminated, you may no longer access the
                Service. Any outstanding obligations shall survive termination.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                14. Refunds and Cancellations
              </h2>
              <p className="mb-4">
                If you purchase any paid services through the Service, you
                acknowledge that all payments are final unless explicitly stated
                otherwise. We do not offer refunds or cancellations except as
                required by law or explicitly outlined in a separate service
                agreement.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                15. Consent to Electronic Communications
              </h2>
              <p className="mb-4">
                By using the Service, you agree to receive electronic
                communications from SAVR. These communications may include
                notices about your account and information related to the
                Service.
              </p>
              <p className="mb-4">
                You agree that any notices, agreements, disclosures, or other
                communications that SAVR sends to you electronically will
                satisfy any legal communication requirements, including that
                such communications be in writing.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                16. Dispute Resolution
              </h2>
              <p className="mb-4">
                Any disputes arising from these Terms shall first be attempted
                to be resolved through good-faith negotiations. If no resolution
                is reached within 30 days, disputes shall be resolved in the
                courts of Toronto, Ontario, Canada. However, either party may
                seek injunctive relief or legal recourse for intellectual
                property infringement or unauthorized use of the Service.
              </p>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                17. General Legal Notices
              </h2>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.1 Entire Agreement
              </h3>
              <p className="mb-4">
                These Terms constitute the entire agreement between you and SAVR
                regarding the Service and supersede all prior agreements or
                communications between you and SAVR concerning the subject
                matter of these Terms.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.2 Assignment
              </h3>
              <p className="mb-4">
                You may not assign or transfer these Terms without our prior
                written consent. We may assign these Terms without restriction.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.3 No Waiver
              </h3>
              <p className="mb-4">
                If SAVR doesn't act in a particular situation, it doesn't mean
                we waive our right to act in that situation or similar ones
                later.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.4 Severability
              </h3>
              <p className="mb-4">
                If any part of these Terms is found to be invalid, unlawful, or
                unenforceable, that specific part will be removed, and the
                remaining provisions will continue to be in full force and
                effect.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.5 Headings
              </h3>
              <p className="mb-4">
                The section headings and titles in these Terms are for
                convenience only and have no legal or contractual effect.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.6 Survival
              </h3>
              <p className="mb-4">
                Any part of these Terms that, by its nature, should remain in
                effect after your license to access the Service or these Terms
                are terminated (including provisions on Data Collection and Use,
                Intellectual Property, User-Generated Content and Feedback,
                Disclaimer of Warranties, Limitation of Liability,
                Indemnification, Governing Law, and General Provisions) will
                continue to remain in full force and effect.
              </p>

              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-6 mb-3">
                17.7 Governing Law
              </h3>
              <p className="mb-4">
                These Terms are governed by the laws of the province of Ontario,
                Canada, without regard to its conflict of law principles. Any
                disputes shall be resolved in the courts of Toronto, Ontario.
              </p>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                18. Force Majeure
              </h2>
              <p className="mb-4">
                SAVR shall not be held liable for any delay or failure to
                perform obligations due to causes beyond our reasonable control,
                including but not limited to natural disasters, government
                actions, pandemics, cyberattacks, or technical failures.
              </p>
            </section>

            {/* Section 19 */}
            <section id="section-19" className="mb-10 scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                19. Contact Us
              </h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-6">
                <p className="font-semibold text-slate-900 dark:text-white mb-2">
                  SAVR
                </p>
                <p>
                  <a
                    href="mailto:support@savr.app"
                    className="text-green-600 dark:text-green-400 hover:underline">
                    support@savr.app
                  </a>
                </p>
              </div>
            </section>

            {/* Closing Statement */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
              <p className="text-center text-slate-900 dark:text-white font-medium">
                By using the Service, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service.
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
              <Link
                to="/privacy"
                className="hover:text-slate-900 dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="hover:text-slate-900 dark:hover:text-white">
                Terms of Service
              </Link>
            </div>
            <div className="mt-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <p>&copy; 2026. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;

