import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import {
  Scan,
  ArrowUp,
  MessageSquare,
  ArrowLeftRight,
  ShoppingCart,
  ChevronRight,
  ShoppingBag,
  Check,
  Sprout,
  Menu,
  X,
  XCircle,
  Sparkles,
} from "lucide-react"
import { LuCamera } from "react-icons/lu"
import useChatStore from "@/stores/chatStore"
import useListStore from "@/stores/listStore"
import { onboardingChatService, ChatMessage, GroceryItem } from "@/services/chatService"
import { SavedGroceryList } from "@/services/groceryListService"
import { SearchResultInDB, GroceryProduct } from "@/services/shoppingService"
import MarkdownText from "@/components/MarkdownText"
import { ListDrawer } from "@/components/chat/ListDrawer"
import OnboardingSignupModal from "@/components/OnboardingSignupModal"
import { compressImage } from "@/utils/imageUtils"
import { useToast } from "@/components/ui/use-toast"
import heic2any from "heic2any"

// ── Suggestion prompts for demo chat ───────────────────────────────────────────

const SUGGESTION_CONTAINERS = [
  ["Add eggs, milk, and bread to my list", "I need chicken breast, garlic, and onions", "Add pasta, tomato sauce, and parmesan", "Put coffee and filters on my grocery list"],
  ["Walk me through how to make a classic lasagna", "Build a grocery list for chicken stir-fry", "I want to make butter chicken", "Help me make homemade mac and cheese"],
  ["Plan a week of vegetarian dinners", "Suggest quick and healthy breakfast ideas", "I need low-carb dinner ideas", "Give me keto-friendly meal prep recipes"],
  ["Cheapest groceries for a family of 4 this week", "Compare chicken breast prices", "What's the best deal on milk and eggs?", "Find me the best prices on produce"],
  ["Here's my handwritten list – can you add these items?", "What can I cook with what's in my fridge?", "I saw this recipe – what do I need?", "What's missing from my spice rack?"],
]

function pickRandomSuggestions(): string[] {
  return SUGGESTION_CONTAINERS.map((c) => c[Math.floor(Math.random() * c.length)])
}

// ── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ backgroundColor: "rgba(253, 250, 245, 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e2d8c8" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/assets/savr-logo(primary).svg" 
            alt="Savr Logo" 
            className="h-7 w-auto"
          />
        </Link>

        {/* Center: Live indicator */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#71C278" }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#71C278" }} />
          </span>
          <span className="text-sm font-medium" style={{ color: "#5c7a60" }}>Live prices updating</span>
        </div>

        {/* Right: Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="rounded-full px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#204529" }}>
            Sign In
          </Link>
          <Link
            to="/signup"
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "#71C278", boxShadow: "0 2px 12px rgba(113, 194, 120, 0.3)" }}
          >
            Get Started
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden"
          style={{ color: "#204529" }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div style={{ backgroundColor: "rgba(253, 250, 245, 0.98)", borderTop: "1px solid #e2d8c8" }} className="md:hidden">
          <div className="flex flex-col gap-2 px-6 py-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: "#71C278" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#71C278" }} />
              </span>
              <span className="text-xs font-medium" style={{ color: "#5c7a60" }}>Live prices updating</span>
            </div>
            <Link to="/login" className="rounded-xl px-4 py-3 text-sm font-medium" style={{ color: "#204529" }}>Sign In</Link>
            <Link to="/signup" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white" style={{ backgroundColor: "#71C278" }}>Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Hero ─────────────────────────────────────────────────────────────────────

interface HeroPhoneMockupProps {
  animate?: boolean
  showLabel?: boolean
  className?: string
  showShadow?: boolean
}

function HeroPhoneMockup({
  animate = true,
  showLabel = true,
  className = "",
  showShadow = true,
}: HeroPhoneMockupProps) {
  return (
    <div className={`${animate ? "animate-float" : ""} w-full max-w-[280px] sm:max-w-[320px] mx-auto ${className}`}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative w-full overflow-hidden rounded-[2rem] p-2"
          style={{
            backgroundColor: "#204529",
            boxShadow: showShadow ? "0 25px 70px rgba(32, 69, 41, 0.2), 0 4px 12px rgba(32, 69, 41, 0.12)" : "none",
            filter: showShadow ? "drop-shadow(0 8px 25px rgba(32, 69, 41, 0.15))" : "none",
          }}
        >
          {/* Notch */}
          <div 
            className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full" 
            style={{ backgroundColor: "#204529" }} 
            aria-hidden="true" 
          />
          
          {/* Screen container */}
          <div className="overflow-hidden rounded-[1.4rem]" style={{ backgroundColor: "#FDFAF5" }}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-7 pb-2">
              <span className="text-[10px] font-semibold" style={{ color: "#204529" }}>9:41</span>
              <span className="text-[10px] font-semibold" style={{ color: "#204529" }}>SAVR</span>
              <div className="flex gap-1">
                <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: "#204529" }} />
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#204529" }} />
              </div>
            </div>
            
            {/* App screenshot */}
            <div className="px-2 pb-2">
              <img 
                src="/AppListPricing.jpeg" 
                alt="Savr App Screenshot" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
        
        {showLabel && (
          <p className="text-center text-xs font-semibold" style={{ color: "#5c7a60" }}>
            SAVR Preview
          </p>
        )}
      </div>
    </div>
  )
}

interface HeroProps {
  inputValue: string
  setInputValue: (v: string) => void
  showSuggestions: boolean
  displayedSuggestions: string[]
  onInputFocus: () => void
  onInputSubmit: (e: React.FormEvent) => void
  onSuggestionClick: (s: string) => void
  onUploadClick: () => void
  suggestionsRef: React.RefObject<HTMLDivElement>
  inputRef: React.RefObject<HTMLInputElement>
}

function Hero({
  inputValue,
  setInputValue,
  showSuggestions,
  displayedSuggestions,
  onInputFocus,
  onInputSubmit,
  onSuggestionClick,
  onUploadClick,
  suggestionsRef,
  inputRef,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden px-6 pt-5 lg:pt-0 flex items-center justify-center" style={{ backgroundColor: "#FDFAF5", minHeight: "100svh" }}>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute top-20 -right-32 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]" style={{ background: "radial-gradient(circle, #EFD3B1 0%, transparent 70%)" }} aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full opacity-20 blur-[100px]" style={{ background: "radial-gradient(circle, #71C278 0%, transparent 70%)" }} aria-hidden="true" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 lg:flex-row lg:gap-16 py-20">
        {/* Left column: Text — exact 50% */}
        <div className="w-full lg:w-1/2">
          {/* Badge */}
          <div
            className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{ backgroundColor: "rgba(113, 194, 120, 0.1)", border: "1px solid rgba(113, 194, 120, 0.25)" }}
          >
            <Sparkles className="h-3 w-3 text-orange-500 mr-1 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-semibold" style={{ color: "#204529" }}>🛒 AI-Powered Canadian Grocery Shopping 🇨🇦</span>
          </div>

          <h1
            className="animate-fade-up mb-6 text-balance text-4xl leading-[1.1] font-medium tracking-tight sm:text-5xl lg:text-6xl"
            style={{ color: "#204529", animationDelay: "0.1s", fontFamily: '"Caprasimo", system-ui, sans-serif' }}
          >
            Your ai{" "}
            <span className="relative inline-block">
              <span style={{ color: "#71C278" }}>grocery shopping</span>
              <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none" aria-hidden="true">
                <path d="M1 5.5C40 2 80 2 100 4C120 6 160 6 199 3" stroke="#71C278" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
              </svg>
            </span>{" "}
            companion.
          </h1>

          {/* Mobile: paragraph left, mockup right */}
          <div
            className="animate-fade-up mb-0 flex items-end gap-3 lg:hidden"
            style={{ color: "#5c7a60", animationDelay: "0.2s" }}
          >
            <div className="min-w-0 flex-1 self-stretch flex items-center">
              <p className="text-sm leading-[1.42]">
                Stop overpaying for groceries. Tell SAVR what you need and we&apos;ll find the lowest price at a nearby store, saving you real money.
              </p>
            </div>
            <div className="pointer-events-none relative h-[244px] w-[186px] -mb-[6rem] -translate-x-4 -translate-y-3 overflow-hidden pt-4" aria-hidden="true">
              <HeroPhoneMockup
                animate={false}
                showLabel={false}
                showShadow={false}
                className="max-w-[182px] origin-top-right scale-[0.86]"
              />
            </div>
          </div>

          {/* Desktop/tablet paragraph */}
          <p
            className="animate-fade-up mb-8 hidden max-w-lg text-pretty text-lg leading-[1.42] sm:leading-[1.5] lg:block"
            style={{ color: "#5c7a60", animationDelay: "0.2s" }}
          >
            Stop overpaying for groceries. Tell SAVR what you need and we&apos;ll find the lowest price at a nearby store, saving you real money.
          </p>

          <div className="relative top-4 lg:top-0">
            {/* Try it now */}
            <div className="animate-fade-up relative mb-0 flex items-end" style={{ animationDelay: "0.25s" }}>
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="text-lg sm:text-xl font-medium whitespace-nowrap"
                  style={{ color: "#204529", fontFamily: '"Caprasimo", system-ui, sans-serif' }}
                >
                  ✨ Try it now!
                </span>
                <div className="h-px w-8" />
              </div>
            </div>

            {/* Chat Input — interactive */}
            <div className="animate-fade-up relative mt-0" style={{ animationDelay: "0.3s" }}>
              <div className="relative z-10">
                <form onSubmit={onInputSubmit}>
                  <div className="rounded-2xl p-[2px]" style={{ background: "linear-gradient(135deg, #ff8a80, #ffab91, #EFD3B1, #ff8a80)" }}>
                    <div
                      className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                      style={{ backgroundColor: "#ffffff", boxShadow: "0 4px 20px rgba(32, 69, 41, 0.06)" }}
                    >
                      <button
                        type="button"
                        onClick={onUploadClick}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-80"
                        style={{ backgroundColor: "#f5efe5", color: "#204529" }}
                        aria-label="Upload photo"
                      >
                        <LuCamera className="h-5 w-5" />
                      </button>
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={onInputFocus}
                        placeholder="Ask SAVR anything..."
                        className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-[#a8b5a0] focus:outline-none"
                        style={{ color: "#204529" }}
                      />
                      <button
                        type="submit"
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50"
                        style={{ backgroundColor: "#71C278", boxShadow: "0 2px 8px rgba(113, 194, 120, 0.35)" }}
                        aria-label="Send message"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 bottom-full mb-2 rounded-2xl overflow-hidden z-[60] shadow-xl"
                  style={{ backgroundColor: "#ffffff", border: "1px solid #e2d8c8" }}
                >
                  {displayedSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSuggestionClick(suggestion)}
                      className="w-full text-left px-5 py-3 text-sm transition-colors hover:bg-[#f5efe5] first:pt-4 last:pb-4"
                      style={{ color: "#204529" }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs" style={{ color: "#5c7a60" }}>
                Try: &quot;Cheapest groceries for a family of 4 this week&quot;
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Phone Mockup -- exact 50% */}
        <div className="hidden w-full items-center justify-center lg:flex lg:w-1/2">
          <div className="animate-slide-in-right relative w-full max-w-sm" style={{ animationDelay: "0.4s" }}>
            <div
              className="animate-float-delayed absolute -top-8 -right-8 h-48 w-48 rounded-full"
              style={{ backgroundColor: "#EFD3B1", opacity: 0.35 }}
              aria-hidden="true"
            />
            <div
              className="animate-float-delayed absolute -bottom-6 -left-6 h-32 w-32 rounded-full"
              style={{ backgroundColor: "rgba(113, 194, 120, 0.15)" }}
              aria-hidden="true"
            />
            <div className="relative">
              <HeroPhoneMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


// ── HowItWorks ────────────────────────────────────────────────────────────────

const howItWorksSteps = [
  {
    number: "01",
    title: "Tell Savr What You Need",
    description: "Chat naturally about recipes, meal plans, or just the basics. Savr understands you and builds your list as you talk.",
    icon: MessageSquare,
  },
  {
    number: "02",
    title: "Choose Your Stores",
    description: "Pick up to 3 stores near you. Savr instantly checks real-time prices at each one — no more guessing.",
    icon: ArrowLeftRight,
  },
  {
    number: "03",
    title: "Save Real Money",
    description: "Compare every item side-by-side. Pick the best deals or go with the cheapest store overall. You decide.",
    icon: ShoppingCart,
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-14 md:py-24" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-8 text-center md:mb-12">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "#71C278" }}>
            Simple Process
          </p>
          <h2 className="text-balance text-3xl font-medium tracking-tight md:text-4xl" style={{ color: "#204529", fontFamily: '"Caprasimo", system-ui, sans-serif' }}>
            How It Works
          </h2>
        </div>

        {/* Horizontal step flow */}
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-stretch md:gap-0">
          {howItWorksSteps.map((step, index) => (
            <div key={step.number} className="flex flex-1 flex-col items-center md:flex-row">
              {/* Step content */}
              <div
                className="relative flex h-full w-full flex-col items-center justify-start overflow-hidden text-center rounded-2xl px-5 py-6 transition-all duration-300 cursor-default"
                style={{
                  backgroundColor: "#EFD3B1",
                  boxShadow: "0 2px 16px rgba(32, 69, 41, 0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(32, 69, 41, 0.14)"
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(32, 69, 41, 0.06)"
                  e.currentTarget.style.transform = "translateY(0) scale(1)"
                }}
              >
                {/* Faint watermark number */}
                <span
                  className="pointer-events-none absolute top-2 right-3 select-none text-5xl font-extrabold"
                  style={{ color: "#204529", opacity: 0.08 }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <div
                  className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "#71C278",
                    boxShadow: "0 8px 22px rgba(113, 194, 120, 0.28)",
                  }}
                >
                  <step.icon className="h-6 w-6" style={{ color: "#ffffff" }} strokeWidth={2.4} />
                </div>
                <span className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: "#71C278" }}>
                  Step {step.number}
                </span>
                <h3 className="mb-1 text-base font-bold" style={{ color: "#204529" }}>
                  {step.title}
                </h3>
                <p className="max-w-[200px] text-xs leading-relaxed" style={{ color: "#5c7a60" }}>
                  {step.description}
                </p>
              </div>

              {/* Arrow connector (not after last step) */}
              {index < howItWorksSteps.length - 1 && (
                <div className="hidden flex-shrink-0 px-5 md:flex">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: "rgba(113, 194, 120, 0.12)" }}
                  >
                    <ChevronRight className="h-4 w-4" style={{ color: "#71C278" }} />
                  </div>
                </div>
              )}
              {/* Mobile arrow */}
              {index < howItWorksSteps.length - 1 && (
                <div className="flex justify-center py-1 md:hidden">
                  <ChevronRight className="h-4 w-4 rotate-90" style={{ color: "#71C278" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── PhoneMockups ──────────────────────────────────────────────────────────────

function PhoneFrame({ children, label, size = "normal" }: { children: React.ReactNode; label: string; size?: "normal" | "large" }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative overflow-hidden rounded-[2rem] p-2 ${
          size === "large" 
            ? "w-[280px] sm:w-[320px]" 
            : "w-[240px] sm:w-[260px]"
        }`}
        style={{
          backgroundColor: "#204529",
          boxShadow: "0 20px 60px rgba(32, 69, 41, 0.15), 0 2px 8px rgba(32, 69, 41, 0.08)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full" style={{ backgroundColor: "#204529" }} aria-hidden="true" />
        {/* Screen */}
        <div className="overflow-hidden rounded-[1.5rem]" style={{ backgroundColor: "#FDFAF5" }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-7 pb-2">
            <span className="text-[9px] font-semibold" style={{ color: "#204529" }}>9:41</span>
            <span className="text-[9px] font-semibold" style={{ color: "#204529" }}>SAVR</span>
            <div className="flex gap-1">
              <div className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: "#204529" }} />
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#204529" }} />
            </div>
          </div>
          {/* Content */}
          <div className="px-3 pb-4">
            {children}
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold" style={{ color: "#204529" }}>{label}</p>
    </div>
  )
}

function ChatScreen() {
  return (
    <div className="flex flex-col justify-end pb-1 relative overflow-hidden" style={{ height: '280px' }}>
      {/* Background with gradient blobs and food doodles from SVG - Only visible in light mode */}
      <div className="pointer-events-none absolute inset-0 z-0 dark:hidden overflow-hidden">
        {/* Gradient blobs */}
        <div
          className="absolute -top-10 -right-10 lg:-left-10 lg:right-auto h-[34vh] w-[34vh] lg:h-[68vh] lg:w-[68vh] rounded-full bg-gradient-to-br from-orange-200/50 via-amber-200/40 to-yellow-200/30 blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute -bottom-10 -left-10 lg:-right-10 lg:left-auto h-[36vh] w-[36vh] lg:h-[72vh] lg:w-[72vh] rounded-full bg-gradient-to-br from-emerald-200/40 via-teal-200/30 to-cyan-200/25 blur-3xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40vh] w-[40vh] rounded-full bg-gradient-to-br from-pink-200/25 via-rose-200/20 to-fuchsia-200/20 blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />

        {/* Food doodle pattern from SVG - scrolling horizontally - more visible */}
        <div
          className="absolute inset-0 opacity-100 animate-[scrollHorizontal_50s_linear_infinite]"
          style={{
            backgroundImage: "url(/food-pattern.svg)",
            backgroundSize: "500px 500px",
            backgroundRepeat: "repeat",
            filter:
              "brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.3))",
            width: "200%",
          }}
        />

        <style>{`
          @keyframes scrollHorizontal {
            0% { transform: translateX(0); }
            100% { transform: translateX(-500px); }
          }
        `}</style>
      </div>
      
      {/* Chat messages */}
      <div className="flex flex-col gap-1.5 mb-1 relative z-10">
        {/* Bot message */}
        <div className="self-start rounded-2xl rounded-tl-md px-2 py-1" style={{ backgroundColor: "#EFD3B1" }}>
          <p className="text-[10px] leading-snug" style={{ color: "#204529" }}>
            Hey! What groceries do you need today?
          </p>
        </div>
        {/* User message */}
        <div className="self-end rounded-2xl rounded-tr-md px-2 py-1" style={{ backgroundColor: "#71C278" }}>
          <p className="text-[10px] leading-snug text-white">
            Chicken breast, milk, bananas, and rice
          </p>
        </div>
        {/* Bot reply */}
        <div className="self-start rounded-2xl rounded-tl-md px-2 py-1" style={{ backgroundColor: "#EFD3B1" }}>
          <p className="text-[10px] leading-snug" style={{ color: "#204529" }}>
            Found the best prices across 3 stores. You could save $8.40!
          </p>
        </div>
        {/* Additional user message */}
        <div className="self-end rounded-2xl rounded-tr-md px-2 py-1" style={{ backgroundColor: "#71C278" }}>
          <p className="text-[10px] leading-snug text-white">
            Great! Show me the comparison
          </p>
        </div>
        {/* Additional bot reply */}
        <div className="self-start rounded-2xl rounded-tl-md px-2 py-1" style={{ backgroundColor: "#EFD3B1" }}>
          <p className="text-[10px] leading-snug" style={{ color: "#204529" }}>
            Here are your options with prices...
          </p>
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 relative z-10 backdrop-blur-sm bg-white/20" style={{ border: "1px solid rgba(226, 216, 200, 0.5)" }}>
        <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: "#e2d8c8" }} />
        <div className="flex h-4 w-4 items-center justify-center rounded-md" style={{ backgroundColor: "#71C278" }}>
          <ArrowUp className="h-2.5 w-2.5 text-white" />
        </div>
      </div>
    </div>
  )
}

function ComparisonScreen() {
  const rows = [
    { name: "No Frills", price: "$4.29", best: true },
    { name: "Loblaws", price: "$5.99", best: false },
    { name: "Metro", price: "$5.49", best: false },
  ]
  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-center text-[10px] font-bold" style={{ color: "#204529" }}>Chicken Breast 1kg</p>
      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <div
            key={r.name}
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{
              backgroundColor: r.best ? "rgba(113, 194, 120, 0.12)" : "#f5efe5",
              border: r.best ? "1px solid rgba(113, 194, 120, 0.3)" : "1px solid transparent",
            }}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-3 w-3" style={{ color: r.best ? "#71C278" : "#5c7a60" }} />
              <span className="text-[10px] font-semibold" style={{ color: "#204529" }}>{r.name}</span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: r.best ? "#71C278" : "#5c7a60" }}>{r.price}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 rounded-xl py-2 text-center" style={{ backgroundColor: "#EFD3B1" }}>
        <span className="text-[10px] font-bold" style={{ color: "#204529" }}>Save $1.70</span>
      </div>
    </div>
  )
}

function ListScreen() {
  const items = [
    { name: "Chicken Breast", store: "No Frills", done: true },
    { name: "2% Milk 4L", store: "No Frills", done: true },
    { name: "Bananas 1lb", store: "Metro", done: false },
    { name: "Basmati Rice 2kg", store: "Walmart", done: false },
    { name: "Greek Yogurt", store: "Loblaws", done: false },
    { name: "Whole Wheat Bread", store: "Metro", done: true },
    { name: "Olive Oil", store: "No Frills", done: false },
    { name: "Red Bell Peppers", store: "Sobeys", done: false },
  ]
  return (
    <div className="flex flex-col gap-1.5 pt-2" style={{ minHeight: '320px' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold" style={{ color: "#204529" }}>My Grocery List</p>
        <span className="text-[9px] font-semibold" style={{ color: "#71C278" }}>3/8</span>
      </div>
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ backgroundColor: item.done ? "rgba(113, 194, 120, 0.08)" : "#ffffff", border: "1px solid #e2d8c8" }}
        >
          <div
            className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
            style={{ backgroundColor: item.done ? "#71C278" : "#f5efe5" }}
          >
            {item.done && <Check className="h-2.5 w-2.5 text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-[10px] font-semibold ${item.done ? "line-through opacity-50" : ""}`} style={{ color: "#204529" }}>{item.name}</p>
            <p className="text-[8px]" style={{ color: "#5c7a60" }}>{item.store}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function PhoneMockups() {
  return (
    <section className="relative overflow-hidden px-6 py-14 md:py-28" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "#71C278" }}>
            See It In Action
          </p>
          <h2 className="text-balance text-3xl font-medium tracking-tight md:text-4xl" style={{ color: "#204529", fontFamily: '"Caprasimo", system-ui, sans-serif' }}>
            Built for Your Pocket
          </h2>
        </div>

        {/* Phones row */}
        <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:items-end sm:gap-8 md:gap-12">
          {/* Phone 1 - Chat (hidden on mobile) */}
          <div className="hidden sm:block sm:translate-y-4">
            <PhoneFrame label="Chat Interface" size="large">
              <ChatScreen />
            </PhoneFrame>
          </div>

          {/* Phone 2 - Comparison (always visible, center lifted on sm+) */}
          <div className="sm:-translate-y-4">
            <PhoneFrame label="Price Comparison">
              <ComparisonScreen />
            </PhoneFrame>
          </div>

          {/* Phone 3 - List (hidden on mobile) */}
          <div className="hidden sm:block sm:translate-y-4">
            <PhoneFrame label="Grocery List" size="large">
              <ListScreen />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── StatsBand ─────────────────────────────────────────────────────────────────

const stats = [
  { value: "15+", label: "Canadian Stores" },
  { value: "3", label: "Store Comparison" },
  { value: "100%", label: "Free to Use" },
  { value: "∞", label: "Grocery Lists" },
]

function StatsBand() {
  return (
    <section className="w-full px-6 py-4" style={{ backgroundColor: "#FDFAF5" }}>
      <div
        className="mx-auto max-w-7xl rounded-3xl px-5 py-10 md:px-8 md:py-16"
        style={{ backgroundColor: "#204529" }}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-10">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center ${index < stats.length - 1 ? "md:border-r" : ""}`}
              style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <p className="text-2xl font-extrabold text-white md:text-5xl">{stat.value}</p>
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255, 255, 255, 0.55)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── FeaturesGrid ──────────────────────────────────────────────────────────────

const features = [
  {
    icon: MessageSquare,
    title: "Just Ask SAVR",
    description: "Ask anything about your grocery trip. Meal ideas, recipes, what to make with what you have — SAVR has you covered.",
    iconBg: "#71C278",
    iconColor: "#ffffff",
  },
  {
    icon: ArrowLeftRight,
    title: "Compare 3 Stores Instantly",
    description: "SAVR scans 15+ stores in real-time and surfaces the top 3 closest options so you always shop the best price.",
    iconBg: "#F59E0B",
    iconColor: "#ffffff",
  },
  {
    icon: Scan,
    title: "Snap & Shop",
    description: "Photograph a recipe, handwritten list, or your fridge. SAVR reads it and builds your list.",
    iconBg: "#204529",
    iconColor: "#ffffff",
  },
  {
    icon: Check,
    title: "Multiple Options Per Item",
    description: "Every dollar is your call.",
    iconBg: "#EFD3B1",
    iconColor: "#204529",
  },
  {
    icon: Sprout,
    title: "Made for You",
    description: "Vegan, gluten-free, allergies — covered.",
    iconBg: "#71C278",
    iconColor: "#ffffff",
  },
  {
    icon: ShoppingBag,
    title: "Shop Your Way",
    description: "Print, share, or pull it up in-store.",
    iconBg: "#F59E0B",
    iconColor: "#ffffff",
  },
]

function FeaturesGrid() {
  return (
    <section className="relative px-6 py-14 md:py-28" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="mb-10 text-center md:mb-14">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "#71C278" }}>
            Everything You Need
          </p>
          <h2 className="text-balance text-3xl font-medium tracking-tight md:text-4xl" style={{ color: "#204529", fontFamily: '"Caprasimo", system-ui, sans-serif' }}>
            Features Built for Savings
          </h2>
        </div>

        {/* Strict 2-column grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col rounded-2xl p-6 transition-all duration-300 cursor-default"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2d8c8",
                boxShadow: "0 2px 16px rgba(32, 69, 41, 0.07), 0 1px 3px rgba(32, 69, 41, 0.04)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(32, 69, 41, 0.15), 0 4px 12px rgba(113, 194, 120, 0.08)"
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 16px rgba(32, 69, 41, 0.07), 0 1px 3px rgba(32, 69, 41, 0.04)"
                e.currentTarget.style.transform = "translateY(0) scale(1)"
              }}
            >
              {/* Icon */}
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: feature.iconBg, color: feature.iconColor }}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              {/* Content */}
              <h3 className="mb-2 text-lg font-bold" style={{ color: "#204529" }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#5c7a60" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── StoreLogos ────────────────────────────────────────────────────────────────

const stores = [
  "No Frills",
  "Loblaws",
  "Metro",
  "Walmart",
  "Sobeys",
  "FreshCo",
  "T&T",
  "Food Basics",
  "Independent",
  "Real Canadian Superstore",
  "Atlantic Superstore",
  "Foodland",
  "Maxi",
]

function StoreLogos() {
  return (
    <section className="px-6 py-10 md:py-16" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="mx-auto max-w-5xl">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest md:mb-10" style={{ color: "#5c7a60" }}>
          Prices compared across Canada&#39;s top stores
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-5">
          {stores.map((store) => (
            <div
              key={store}
              className="rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 sm:px-5 sm:py-3 sm:text-sm"
              style={{
                backgroundColor: "#ffffff",
                color: "#204529",
                border: "1px solid #e2d8c8",
                boxShadow: "0 1px 4px rgba(32, 69, 41, 0.04)",
              }}
            >
              {store}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── CtaSection ────────────────────────────────────────────────────────────────

function CtaSection() {
  return (
    <section className="px-4 py-4 md:px-6 md:py-6" style={{ backgroundColor: "#FDFAF5" }}>
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-6 py-12 text-center md:px-8 md:py-24"
        style={{
          background: "linear-gradient(135deg, #EFD3B1 0%, #f5e0c4 50%, #EFD3B1 100%)",
        }}
      >
        {/* Decorative shapes */}
        <div
          className="pointer-events-none absolute -top-12 -left-12 h-56 w-56 rounded-full opacity-40 blur-[60px]"
          style={{ backgroundColor: "#71C278" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full opacity-30 blur-[50px]"
          style={{ backgroundColor: "#F59E0B" }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <h2
            className="mb-4 text-balance text-2xl font-medium tracking-tight sm:text-3xl md:text-5xl lg:text-6xl"
            style={{ color: "#204529", fontFamily: '"Caprasimo", system-ui, sans-serif' }}
          >
            Ready to Start Saving?
          </h2>
          <p
            className="mx-auto mb-8 max-w-xl text-pretty text-base leading-relaxed md:mb-10 md:text-lg"
            style={{ color: "#3d6845" }}
          >
            Join Canadians who are already spending less on groceries. It&apos;s free to try — no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex w-full items-center justify-center rounded-full px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.02] sm:w-auto"
              style={{ backgroundColor: "#71C278", boxShadow: "0 4px 20px rgba(113, 194, 120, 0.35)" }}
            >
              Get Started for Free
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-full px-8 py-4 text-base font-bold transition-all hover:scale-[1.02] sm:w-auto"
              style={{
                backgroundColor: "#ffffff",
                color: "#204529",
                boxShadow: "0 2px 12px rgba(32, 69, 41, 0.08)",
              }}
            >
              See How It Works
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-6 py-10" style={{ backgroundColor: "#FDFAF5", borderTop: "1px solid #e2d8c8" }}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
        <div className="flex items-center gap-2.5">
          <img 
            src="/assets/savr-logo(primary).svg" 
            alt="Savr Logo" 
            className="h-6 w-auto"
          />
        </div>
        <p className="text-sm" style={{ color: "#5c7a60" }}>Built with love in Canada · 2026 © SAVR</p>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          <Link to="/privacy" className="text-sm font-medium transition-colors hover:underline" style={{ color: "#204529" }}>Privacy</Link>
          <Link to="/terms" className="text-sm font-medium transition-colors hover:underline" style={{ color: "#204529" }}>Terms</Link>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>(() => pickRandomSuggestions())
  const [chatActive, setChatActive] = useState(false)
  const [chatVisible, setChatVisible] = useState(false)
  const [chatTransitioning, setChatTransitioning] = useState(false)
  const [chatInitialized, setChatInitialized] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [onboardingSessionId, setOnboardingSessionId] = useState("")
  const [inputValueChat, setInputValueChat] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputBarRef = useRef<HTMLDivElement>(null)
  const [inputAreaHeight, setInputAreaHeight] = useState(64)
  const pendingMessageRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevGroceryListRef = useRef<{ items?: GroceryItem[] } | GroceryItem[] | null>(null)
  const [displayedStreamingText, setDisplayedStreamingText] = useState("")
  const streamTargetRef = useRef("")
  const { toast } = useToast()

  const {
    messages,
    streamingMessage,
    isLoading,
    sendMessage,
    groceryList,
    clearChat,
    isGenerating,
    spinnerActive,
  } = useChatStore()
  const {
    drawerState,
    setDrawerState,
    selectedListId,
    lists,
    addOrUpdateList,
    updateSelectionFunctional,
    calculateStoreSubtotals,
  } = useListStore()

  const selectedList = selectedListId ? lists.find((l) => l.id === selectedListId) || null : null

  const loaderText = "Thinking"
  const showThinkingLoader = (isLoading || isGenerating || spinnerActive) && !streamingMessage

  const getItemsArray = (gl: { items?: GroceryItem[] } | GroceryItem[] | null): GroceryItem[] => {
    if (!gl) return []
    if (Array.isArray(gl)) return gl
    if (gl.items && Array.isArray(gl.items)) return gl.items
    return []
  }

  const getGroceryListName = (gl: { name?: string } | null): string => {
    if (!gl) return "Your Grocery List"
    if (typeof gl === "object" && !Array.isArray(gl) && gl.name) return gl.name
    return "Your Grocery List"
  }

  useEffect(() => {
    streamTargetRef.current = streamingMessage?.content || ""
  }, [streamingMessage?.content])

  useEffect(() => {
    if (!streamingMessage) {
      streamTargetRef.current = ""
      setDisplayedStreamingText("")
      return
    }

    const timer = window.setInterval(() => {
      setDisplayedStreamingText((current) => {
        const target = streamTargetRef.current
        if (!target) return ""
        if (!target.startsWith(current)) return target
        if (current.length >= target.length) return current

        const remaining = target.length - current.length
        const step = remaining > 48 ? 8 : remaining > 20 ? 5 : 3
        return target.slice(0, current.length + step)
      })
    }, 18)

    return () => {
      window.clearInterval(timer)
    }
  }, [streamingMessage?.id, !!streamingMessage])

  useEffect(() => {
    if (!chatActive) return
    if (groceryList && getItemsArray(groceryList).length > 0) {
      const listName = getGroceryListName(groceryList)
      const realListId = (groceryList as { id?: string })?.id
      const tempList: SavedGroceryList = {
        id: realListId || "temp-current-list",
        name: listName,
        userId: "anonymous",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        items: getItemsArray(groceryList),
        chat_session_id: useChatStore.getState().currentSession || undefined,
      }
      addOrUpdateList(tempList)
      const prevItems = prevGroceryListRef.current ? getItemsArray(prevGroceryListRef.current) : []
      const currItems = getItemsArray(groceryList)
      const listActuallyChanged = prevItems.length !== currItems.length || JSON.stringify(prevItems) !== JSON.stringify(currItems)
      if (listActuallyChanged) {
        useListStore.getState().selectList(tempList.id)
        // Desktop: expanded, Mobile: peek
        if (typeof window !== "undefined" && window.innerWidth >= 1280) {
          setDrawerState("expanded")
        } else {
          setDrawerState("peek")
        }
      }
      prevGroceryListRef.current = groceryList
    }
  }, [groceryList, chatActive, addOrUpdateList, setDrawerState])

  useEffect(() => {
    if (!chatActive || !inputBarRef.current) return
    const el = inputBarRef.current
    const update = () => setInputAreaHeight(el.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [chatActive])

  const handleSelectProduct = useCallback(
    (itemName: string, product: GroceryProduct | SearchResultInDB, storeName: string) => {
      if (!selectedListId) return
      updateSelectionFunctional(selectedListId, itemName, storeName, product as SearchResultInDB)
      setTimeout(() => calculateStoreSubtotals(selectedListId), 100)
    },
    [selectedListId, updateSelectionFunctional, calculateStoreSubtotals]
  )

  const handleCheckPrices = useCallback(() => {
    const sid = useChatStore.getState().currentSession || localStorage.getItem("onboarding-session-id") || ""
    setOnboardingSessionId(sid)
    setShowSignupModal(true)
  }, [])

  const initChat = useCallback(async () => {
    if (chatInitialized) return
    setChatInitialized(true)
    useChatStore.getState().setOnboarding(true)
    try {
      const welcome = await onboardingChatService.getWelcomeMessage()
      if (welcome.session_id && !welcome.session_id.startsWith("error-")) {
        localStorage.setItem("onboarding-session-id", welcome.session_id)
        useChatStore.setState({ currentSession: welcome.session_id })
      }
      const welcomeMsg: ChatMessage = {
        id: `assistant-welcome-${Date.now()}`,
        content: welcome.content,
        is_user: false,
        timestamp: welcome.timestamp || new Date().toISOString(),
        imageBase64: null,
        imageMediaType: null,
      }
      useChatStore.setState((state) => ({ messages: [...state.messages, welcomeMsg], isLoading: false }))
    } catch {
      const fallback: ChatMessage = {
        id: `assistant-fallback-${Date.now()}`,
        content: "Hey there! I'm Savr, your grocery shopping sidekick. Tell me what you're cooking this week and I'll build your list!",
        is_user: false,
        timestamp: new Date().toISOString(),
        imageBase64: null,
        imageMediaType: null,
      }
      useChatStore.setState((state) => ({ messages: [...state.messages, fallback], isLoading: false }))
    }
    if (pendingMessageRef.current) {
      const msg = pendingMessageRef.current
      pendingMessageRef.current = null
      setTimeout(() => sendMessage(msg), 300)
    }
  }, [chatInitialized, sendMessage])

  const activateChat = useCallback((message?: string) => {
    setShowSuggestions(false)
    if (message) pendingMessageRef.current = message
    setChatActive(true)
    setChatTransitioning(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setChatVisible(true)
        setTimeout(() => setChatTransitioning(false), 600)
      })
    })
  }, [])

  const closeChat = useCallback(() => {
    setChatTransitioning(true)
    setChatVisible(false)
    setTimeout(() => {
      setChatActive(false)
      setChatTransitioning(false)
      setChatInitialized(false)
      clearChat()
      localStorage.removeItem("onboarding-session-id")
      useListStore.getState().selectList(null)
      setDrawerState("collapsed")
      prevGroceryListRef.current = null
    }, 600)
  }, [clearChat, setDrawerState])

  const clearSelectedImage = useCallback(() => {
    setSelectedImage(null)
    setImageBase64(null)
    setImagePreviewUrl(null)
    setIsProcessingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const convertToBase64 = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImageBase64((reader.result as string).split(",")[1])
      setIsProcessingImage(false)
    }
    reader.onerror = () => {
      toast({ title: "Error Reading File", description: "Could not process the selected image.", variant: "destructive" })
      clearSelectedImage()
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!chatActive) activateChat()
    setIsProcessingImage(true)
    let processedFile = file
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      try {
        const conversionResult = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 })
        const convertedBlob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
        processedFile = new File([convertedBlob], `${baseName}.jpg`, { type: "image/jpeg" })
      } catch (err: unknown) {
        if ((err as { code?: number; message?: string })?.code === 1) {
          if (!file.type?.startsWith("image/")) processedFile = new File([file], file.name, { type: "image/jpeg" })
        } else {
          toast({ title: "HEIC Conversion Error", description: "Could not convert HEIC image.", variant: "destructive" })
          clearSelectedImage()
          if (fileInputRef.current) fileInputRef.current.value = ""
          return
        }
      }
    }
    if (!processedFile.type.startsWith("image/")) {
      toast({ title: "Invalid File Type", description: "Please select an image file.", variant: "destructive" })
      clearSelectedImage()
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    if (processedFile.size > 10 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please select an image smaller than 10MB.", variant: "destructive" })
      clearSelectedImage()
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    try {
      const compressedFile = await compressImage(processedFile)
      setSelectedImage(compressedFile)
      const previewReader = new FileReader()
      previewReader.onloadend = () => setImagePreviewUrl(previewReader.result as string)
      previewReader.readAsDataURL(compressedFile)
      convertToBase64(compressedFile)
    } catch {
      toast({ title: "Compression Error", description: "Error compressing image.", variant: "destructive" })
      clearSelectedImage()
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      activateChat(inputValue.trim())
      setInputValue("")
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    activateChat(suggestion)
  }

  const handleLandingUploadClick = () => {
    activateChat()
    setTimeout(() => fileInputRef.current?.click(), 100)
  }

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputValueChat.trim() && !selectedImage) || isLoading || isProcessingImage) return
    if (selectedImage && !imageBase64) {
      toast({ title: "Image Still Processing", description: "Please wait a moment.", variant: "default" })
      return
    }
    sendMessage({ text: inputValueChat.trim() || "(image)", imageBase64: imageBase64 || undefined, imageMediaType: selectedImage?.type })
    setInputValueChat("")
    clearSelectedImage()
    if (chatInputRef.current) chatInputRef.current.style.height = "auto"
  }

  useEffect(() => {
    if (chatActive && !chatInitialized) initChat()
  }, [chatActive, chatInitialized, initChat])

  useEffect(() => {
    if (chatActive && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, streamingMessage, isLoading, chatActive])

  // Auto-scroll for desktop chat as well
  useEffect(() => {
    if (chatActive) {
      // For both mobile and desktop message containers
      const containers = document.querySelectorAll('[data-messages-container]')
      containers.forEach(container => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }, [messages, streamingMessage, isLoading, chatActive])

  useEffect(() => {
    if (chatActive && chatInitialized && chatInputRef.current && !isLoading) chatInputRef.current.focus({ preventScroll: true })
  }, [chatActive, chatInitialized, isLoading])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      )
        setShowSuggestions(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#FDFAF5" }}>
      <Navbar />
      <main>
        <Hero
          inputValue={inputValue}
          setInputValue={setInputValue}
          showSuggestions={showSuggestions}
          displayedSuggestions={displayedSuggestions}
          onInputFocus={() => { setDisplayedSuggestions(pickRandomSuggestions()); setShowSuggestions(true) }}
          onInputSubmit={handleInputSubmit}
          onSuggestionClick={handleSuggestionClick}
          onUploadClick={handleLandingUploadClick}
          suggestionsRef={suggestionsRef}
          inputRef={inputRef}
        />
        <HowItWorks />
        <PhoneMockups />
        <StatsBand />
        <FeaturesGrid />
        <StoreLogos />
        <CtaSection />
      </main>
      <Footer />

      {/* Chat overlay */}
      {chatActive && (
        <div
          className={`fixed inset-0 z-[80] flex flex-col transition-opacity duration-500 ease-out ${chatVisible ? "opacity-100" : "opacity-0"}`}
          style={{ pointerEvents: chatVisible && !chatTransitioning ? "auto" : "auto" }}
        >
          {/* Background - exact same as main chat */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
            {/* Floating blobs */}
            <div
              className="absolute -top-20 -left-20 h-[30vh] w-[30vh] rounded-full bg-gradient-to-br from-orange-200/30 via-amber-200/25 to-yellow-200/20 blur-3xl animate-pulse"
              style={{ animationDuration: "8s", animationDelay: "0s" }}
            />
            <div
              className="absolute top-1/4 -right-32 h-[25vh] w-[25vh] rounded-full bg-gradient-to-br from-yellow-200/25 via-orange-200/20 to-amber-200/15 blur-3xl animate-pulse"
              style={{ animationDuration: "10s", animationDelay: "2s" }}
            />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40vh] w-[40vh] rounded-full bg-gradient-to-br from-pink-200/25 via-rose-200/20 to-fuchsia-200/20 blur-3xl animate-pulse"
              style={{ animationDuration: "12s", animationDelay: "4s" }}
            />

            {/* Food doodle pattern from SVG - scrolling horizontally - more visible */}
            <div
              className="absolute inset-0 opacity-100 animate-[scrollHorizontal_50s_linear_infinite]"
              style={{
                backgroundImage: "url(/food-pattern.svg)",
                backgroundSize: "500px 500px",
                backgroundRepeat: "repeat",
                filter: "brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.3))",
                width: "200%",
              }}
            />

            <style>{`
              @keyframes scrollHorizontal {
                0% { transform: translateX(0); }
                100% { transform: translateX(-500px); }
              }
            `}</style>
          </div>
          <button
            onClick={closeChat}
            className={`fixed top-4 right-4 flex items-center h-10 rounded-full overflow-hidden transition-all z-[100] ${drawerState === "expanded" ? "z-20" : "z-[100]"}`}
            style={{
              width: 40,
              backgroundColor: "rgba(253, 250, 245, 0.95)",
              border: "1px solid #e2d8c8",
              boxShadow: "0 4px 20px rgba(32, 69, 41, 0.1)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.width = "170px" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.width = "40px" }}
          >
            <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ color: "#204529" }}>
              <X className="h-5 w-5" />
            </span>
            <span className="whitespace-nowrap text-sm font-medium pr-4" style={{ color: "#204529" }}>
              Close Savr Chat
            </span>
          </button>

          {/* Mobile: Single column layout */}
          <div className={`xl:hidden flex flex-col h-full transition-all duration-300 ease-in-out ${
            chatVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}>
            <div
              ref={messagesContainerRef}
              data-messages-container
              className={`relative flex-1 overflow-y-auto overflow-x-hidden pt-14 hide-scrollbar ${
                drawerState === "expanded" ? "pb-[60vh]" : drawerState === "peek" ? "pb-[140px]" : "pb-32"
              }`}
              style={{ zIndex: 10 }}
            >
            <div className="w-full mx-auto px-3 sm:px-6 transition-all duration-300 ease-in-out">
              <div className={`w-full flex justify-center px-0 transition-all duration-300 ease-in-out ${
                selectedList && drawerState !== "collapsed" ? "xl:justify-end xl:pr-12" : ""
              }`}>
                <div className={`w-full transition-all duration-300 ease-in-out space-y-4 sm:space-y-6 ${
                  selectedList && drawerState !== "collapsed"
                    ? "max-w-[97%] sm:max-w-[85%] xl:max-w-[47%]" 
                    : "max-w-[97%] sm:max-w-[85%] xl:max-w-[71%]"
                }`}>
              {messages.map((message: ChatMessage) => (
                <div key={message.id} className={`flex ${message.is_user ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] ${message.is_user ? "order-2" : "order-1"}`}>
                    {/* Avatar */}
                    {!message.is_user && (
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                          Savr
                        </span>
                      </div>
                    )}
                    {/* Message Bubble */}
                    <div
                      className={`relative message-bubble backdrop-blur-md ${
                        message.is_user
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-none border-0"
                          : "bg-gradient-to-br from-slate-50/80 via-white/80 to-slate-50/80 dark:from-slate-700/70 dark:via-slate-700/70 dark:to-slate-700/70 text-slate-900 dark:text-white border-2 border-orange-200/60 dark:border-slate-600/80 shadow-sm"
                      } rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-[13px] leading-tight sm:text-base sm:leading-relaxed`}>
                      {/* Message Content */}
                      <div className="space-y-1 sm:space-y-3 leading-tight sm:leading-normal">
                        <MarkdownText text={message.content} />
                        {message.imageBase64 && message.imageMediaType && (
                          <div className="mt-2">
                            <img
                              src={`data:${message.imageMediaType};base64,${message.imageBase64}`}
                              alt="User uploaded"
                              className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {streamingMessage && (
                <div className="flex justify-start">
                  <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]`}>
                    {/* Avatar */}
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                        <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                        Savr
                      </span>
                    </div>
                    {/* Message Bubble */}
                    <div
                      className={`relative message-bubble backdrop-blur-md bg-slate-100/70 dark:bg-slate-700/70 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-600/80 rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 overflow-hidden`}>
                      {/* Message Content */}
                      <div
                        className="space-y-1 sm:space-y-3 leading-tight sm:leading-normal animate-stream-text-in">
                        <MarkdownText text={displayedStreamingText || streamingMessage.content} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {showThinkingLoader && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-body">
                      {loaderText}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]" />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]"
                        style={{ animationDelay: "120ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]"
                        style={{ animationDelay: "240ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>

	          {/* Desktop: Side-by-side flex layout */}
	          <div className={`hidden xl:flex h-full w-full transition-all duration-500 ease-out ${
	            chatVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
	          } ${
	            selectedList && drawerState !== "collapsed" ? "" : "justify-center"
	          }`}>
	            {/* LEFT: Drawer - Desktop Only */}
	            <div
	              className={`hidden xl:flex flex-shrink-0 items-center justify-center overflow-hidden transition-[width,opacity] duration-500 ease-out ${
	                selectedList && drawerState !== "collapsed"
	                  ? "w-1/2 opacity-100"
	                  : "w-0 opacity-0 pointer-events-none"
	              }`}>
	              <div className="w-full p-6 flex items-center justify-center">
	                <div className="w-full max-w-2xl xl:translate-x-8 transition-transform duration-500 ease-out">
	                  {selectedList && drawerState !== "collapsed" && (
	                    <ListDrawer
	                      list={selectedList}
	                      onCheckPrices={handleCheckPrices}
	                      onSelectStores={() => { setOnboardingSessionId(useChatStore.getState().currentSession || localStorage.getItem("onboarding-session-id") || ""); setShowSignupModal(true) }}
	                      onSelectProduct={handleSelectProduct}
	                      isCheckingPrices={false}
	                      inputAreaHeight={0}
	                      embedded={true}
	                    />
	                  )}
	                </div>
	              </div>
	            </div>

	            {/* RIGHT: Chat */}
	            <div className={`flex flex-col h-full transition-[width,max-width] duration-500 ease-out ${
	              selectedList && drawerState !== "collapsed" ? "w-1/2" : "w-full max-w-4xl"
	            }`}>
              {/* Messages */}
              <div
                data-messages-container
                className="relative flex-1 overflow-y-auto overflow-x-hidden pt-6 xl:pt-8 pb-32 hide-scrollbar"
                style={{ zIndex: 10 }}
              >
                <div className="w-full mx-auto px-3 sm:px-6">
		                  <div
		                    className={`w-full flex justify-center px-0 transition-[padding] duration-500 ease-out ${
		                      selectedList && drawerState !== "collapsed"
		                        ? "xl:justify-end xl:pr-12"
		                        : "xl:pr-0"
		                    }`}
		                  >
		                    <div className={`w-full max-w-[90%] space-y-4 sm:space-y-6 transition-[transform] duration-500 ease-out ${
		                      selectedList && drawerState !== "collapsed" ? "xl:translate-x-4" : "xl:translate-x-0"
		                    }`}>
                      {messages.map((message: ChatMessage) => (
                        <div key={message.id} className={`flex ${message.is_user ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] ${message.is_user ? "order-2" : "order-1"}`}>
                            {/* Avatar */}
                            {!message.is_user && (
                              <div className="flex items-center mb-2">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                                  Savr
                                </span>
                              </div>
                            )}
                            {/* Message Bubble */}
                            <div
                              className={`relative message-bubble backdrop-blur-md ${
                                message.is_user
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-none border-0"
                                  : "bg-gradient-to-br from-slate-50/80 via-white/80 to-slate-50/80 dark:from-slate-700/70 dark:via-slate-700/70 dark:to-slate-700/70 text-slate-900 dark:text-white border-2 border-orange-200/60 dark:border-slate-600/80 shadow-sm"
                              } rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-[13px] leading-tight sm:text-base sm:leading-relaxed`}>
                              {/* Message Content */}
                              <div className="space-y-1 sm:space-y-3 leading-tight sm:leading-normal">
                                <MarkdownText text={message.content} />
                                {message.imageBase64 && message.imageMediaType && (
                                  <div className="mt-2">
                                    <img
                                      src={`data:${message.imageMediaType};base64,${message.imageBase64}`}
                                      alt="User uploaded"
                                      className="max-h-48 sm:max-h-64 rounded-lg object-cover w-full"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {streamingMessage && (
                        <div className="flex justify-start">
                          <div className={`max-w-[90%] sm:max-w-[85%] lg:max-w-[70%]`}>
                            {/* Avatar */}
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 shadow-md">
                                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-white" strokeWidth={2.25} />
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                                Savr
                              </span>
                            </div>
                            {/* Message Bubble */}
                            <div
                              className={`relative message-bubble backdrop-blur-md bg-slate-100/70 dark:bg-slate-700/70 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-600/80 rounded-2xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4 overflow-hidden`}>
                              {/* Message Content */}
                              <div
                                className="space-y-1 sm:space-y-3 leading-tight sm:leading-normal animate-stream-text-in">
                                <MarkdownText text={displayedStreamingText || streamingMessage.content} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {showThinkingLoader && (
                        <div className="flex justify-center">
                          <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-ping" />
                              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-body">
                              {loaderText}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]" />
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]"
                                style={{ animationDelay: "120ms" }}
                              />
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-primary/80 animate-[bounce_0.75s_ease-in-out_infinite]"
                                style={{ animationDelay: "240ms" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="relative flex-shrink-0 z-20">
                <div className="relative px-3 sm:px-6 pb-4 pt-3">
		                  <div
		                    className={`w-full flex justify-center px-0 transition-[padding] duration-500 ease-out ${
		                      selectedList && drawerState !== "collapsed"
		                        ? "xl:justify-end xl:pr-12"
		                        : "xl:pr-0"
		                    }`}
		                  >
		                    <div className={`w-full max-w-[90%] transition-[transform] duration-500 ease-out ${
		                      selectedList && drawerState !== "collapsed" ? "xl:translate-x-4" : "xl:translate-x-0"
		                    }`}>
                      {imagePreviewUrl && (
                        <div className="mb-2 px-4 relative inline-block">
                          <div className="relative p-2 rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2d8c8" }}>
                            <img src={imagePreviewUrl} alt="Selected" className="max-h-16 sm:max-h-20 max-w-full rounded-lg object-cover" />
                            <button
                              type="button"
                              className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                              onClick={clearSelectedImage}
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                      <form onSubmit={handleChatSend}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
                          style={{ display: "none" }}
                        />
                        <div className="rounded-2xl p-[2px]" style={{ background: "linear-gradient(135deg, #ff8a80, #ffab91, #EFD3B1, #ff8a80)" }}>
                          <div
                            className="flex items-center gap-3 rounded-[14px] px-4 py-3 bg-white dark:bg-slate-900"
                            style={{ boxShadow: "0 4px 20px rgba(32, 69, 41, 0.06)" }}
                          >
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isLoading || isProcessingImage}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-80"
                              style={{ backgroundColor: "#f5efe5", color: "#204529" }}
                              aria-label="Upload photo"
                            >
                              <LuCamera className="h-5 w-5" />
                            </button>
                            <div className="flex-1 min-w-0 relative flex items-center">
                              <textarea
                                ref={chatInputRef}
                                value={inputValueChat}
                                onChange={(e) => {
                                  setInputValueChat(e.target.value)
                                  const el = e.target
                                  el.style.height = "auto"
                                  el.style.height = `${Math.min(el.scrollHeight, 88)}px`
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!isLoading && (inputValueChat.trim() || selectedImage)) handleChatSend(e as unknown as React.FormEvent) } }}
                                placeholder={isProcessingImage ? "Processing image..." : selectedImage ? "Add a description..." : "What are you shopping for?"}
                                rows={1}
                                disabled={isLoading || isProcessingImage}
                                className="w-full min-w-0 bg-transparent text-sm placeholder:text-[#a8b5a0] focus:outline-none font-body leading-[1.25] resize-none overflow-hidden py-1"
                                style={{ color: "#204529" }}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={isLoading || isProcessingImage || (!inputValueChat.trim() && !selectedImage) || !!(selectedImage && !imageBase64)}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50"
                              style={{ backgroundColor: "#71C278", boxShadow: "0 2px 8px rgba(113, 194, 120, 0.35)" }}
                              aria-label="Send message"
                            >
                              {isLoading || isProcessingImage || isGenerating || spinnerActive ? (
                                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                                  <span className="absolute h-5 w-5 rounded-full border-2 border-white/35" />
                                  <span className="absolute h-5 w-5 rounded-full border-2 border-transparent border-t-white border-r-white animate-[spin_0.65s_linear_infinite]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-white/95 animate-pulse" />
                                </span>
                              ) : (
                                <ArrowUp className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Input area */}
          <div ref={inputBarRef} className={`xl:hidden fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${chatVisible ? "translate-y-0" : "translate-y-full"}`}>
            <div className="absolute inset-0" style={{ backgroundColor: "white" }} />
            <div className="relative px-3 sm:px-6 pb-4 pt-3">
              <div className="w-full flex justify-center px-0">
                <div className="w-full max-w-[97%] sm:max-w-[85%]">
                  {imagePreviewUrl && (
                    <div className="mb-2 px-4 relative inline-block">
                      <div className="relative p-2 rounded-xl" style={{ backgroundColor: "#ffffff", border: "1px solid #e2d8c8" }}>
                        <img src={imagePreviewUrl} alt="Selected" className="max-h-16 sm:max-h-20 max-w-full rounded-lg object-cover" />
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                          onClick={clearSelectedImage}
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleChatSend}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/gif,image/webp,image/heic,.heic"
                      style={{ display: "none" }}
                    />
                        <div className="rounded-2xl p-[2px]" style={{ background: "linear-gradient(135deg, #ff8a80, #ffab91, #EFD3B1, #ff8a80)" }}>
                          <div
                            className="flex items-center gap-3 rounded-[14px] px-4 py-3 bg-white dark:bg-slate-900"
                            style={{ boxShadow: "0 4px 20px rgba(32, 69, 41, 0.06)" }}
                          >
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isLoading || isProcessingImage}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors hover:opacity-80"
                              style={{ backgroundColor: "#f5efe5", color: "#204529" }}
                              aria-label="Upload photo"
                            >
                              <LuCamera className="h-5 w-5" />
                            </button>
                            <div className="flex-1 min-w-0 relative flex items-center">
                              <textarea
                                ref={chatInputRef}
                                value={inputValueChat}
                                onChange={(e) => {
                                  setInputValueChat(e.target.value)
                                  const el = e.target
                                  el.style.height = "auto"
                                  el.style.height = `${Math.min(el.scrollHeight, 88)}px`
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!isLoading && (inputValueChat.trim() || selectedImage)) handleChatSend(e as unknown as React.FormEvent) } }}
                                placeholder={isProcessingImage ? "Processing image..." : selectedImage ? "Add a description..." : "What are you shopping for?"}
                                rows={1}
                                disabled={isLoading || isProcessingImage}
                                className="w-full min-w-0 bg-transparent text-sm placeholder:text-[#a8b5a0] focus:outline-none font-body leading-[1.25] resize-none overflow-hidden py-1"
                                style={{ color: "#204529" }}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={isLoading || isProcessingImage || (!inputValueChat.trim() && !selectedImage) || !!(selectedImage && !imageBase64)}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50"
                              style={{ backgroundColor: "#71C278", boxShadow: "0 2px 8px rgba(113, 194, 120, 0.35)" }}
                              aria-label="Send message"
                            >
                              {isLoading || isProcessingImage || isGenerating || spinnerActive ? (
                                <span className="relative inline-flex h-5 w-5 items-center justify-center">
                                  <span className="absolute h-5 w-5 rounded-full border-2 border-white/35" />
                                  <span className="absolute h-5 w-5 rounded-full border-2 border-transparent border-t-white border-r-white animate-[spin_0.65s_linear_infinite]" />
                                  <span className="h-1.5 w-1.5 rounded-full bg-white/95 animate-pulse" />
                                </span>
                              ) : (
                                <ArrowUp className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: List Drawer overlay */}
          {selectedList && (
            <div className="xl:hidden fixed left-0 right-0 z-10 pointer-events-none" style={{ bottom: 0 }}>
              <div className="max-w-4xl mx-auto px-6 sm:px-8 relative pointer-events-auto">
                <ListDrawer
                  list={selectedList}
                  onCheckPrices={handleCheckPrices}
                  onSelectStores={() => { setOnboardingSessionId(useChatStore.getState().currentSession || localStorage.getItem("onboarding-session-id") || ""); setShowSignupModal(true) }}
                  onSelectProduct={handleSelectProduct}
                  isCheckingPrices={false}
                  inputAreaHeight={inputAreaHeight - 2}
                  embedded={true}
                />
              </div>
            </div>
          )}

          <OnboardingSignupModal isOpen={showSignupModal} onClose={() => setShowSignupModal(false)} anonymousSessionId={onboardingSessionId} />
        </div>
      )}
    </div>
  )
}
