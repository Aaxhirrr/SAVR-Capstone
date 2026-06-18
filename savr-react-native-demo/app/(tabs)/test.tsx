import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthField from "@/components/swift-ports/auth-field";
import CheckboxToggleStyle from "@/components/swift-ports/checkbox-toggle-style";
import FeatureCard from "@/components/swift-ports/feature-card";
import FooterView from "@/components/swift-ports/footer-view";
import HeroSearchBar from "@/components/swift-ports/hero-search-bar";
import InfoCard from "@/components/swift-ports/info-card";
import MetricsBar from "@/components/swift-ports/metrics-bar";
import PillTag from "@/components/swift-ports/pill-tag";
import ProcessCard from "@/components/swift-ports/process-card";
import SavrLogoView from "@/components/swift-ports/savr-logo-view";
import SavrNavBar from "@/components/swift-ports/savr-navbar";
import SavrSearchBar from "@/components/swift-ports/savr-search-bar";
import SavrTopBar from "@/components/swift-ports/savr-top-bar";
import StatBar from "@/components/swift-ports/stat-bar";
import StoreChip from "@/components/swift-ports/store-chip";
import { SavrTheme } from "@/constants/theme";

export default function TestTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [heroQuery, setHeroQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [checked, setChecked] = useState(true);

  const toast = (msg: string) => Alert.alert("SAVR Demo", msg);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>SAVR Swift Ports Demo</Text>
        <Text style={styles.pageSubtitle}>
          Showcase of recreated Swift UI components in Expo React Native TSX.
        </Text>

        <Section title="Brand">
          <SavrLogoView size={54} />
        </Section>

        <Section title="Top Bars">
          <SavrNavBar
            onSignIn={() => toast("Sign In tapped")}
            onGetStarted={() => toast("Get Started tapped")}
          />
          <SavrTopBar
            onSignIn={() => toast("TopBar Sign In tapped")}
            onGetStarted={() => toast("TopBar Get Started tapped")}
          />
        </Section>

        <Section title="Search">
          <HeroSearchBar
            text={heroQuery}
            onChangeText={setHeroQuery}
            onCamera={() => toast("Hero camera tapped")}
            onSubmit={() => toast(`Hero submit: ${heroQuery || "(empty)"}`)}
          />
          <SavrSearchBar
            text={searchQuery}
            onChangeText={setSearchQuery}
            onCamera={() => toast("Search camera tapped")}
            onSubmit={() => toast(`Search submit: ${searchQuery || "(empty)"}`)}
          />
        </Section>

        <Section title="Auth + Toggle">
          <AuthField
            title="Email"
            placeholder="you@example.com"
            text={email}
            onChangeText={setEmail}
            keyboard="email-address"
          />
          <AuthField
            title="Password"
            placeholder="Enter password"
            text={password}
            onChangeText={setPassword}
            isSecure
          />
          <CheckboxToggleStyle
            isOn={checked}
            onToggle={setChecked}
            label="I agree to receive SAVR shopping updates and feature announcements."
          />
        </Section>

        <Section title="Tags + Chips">
          <View style={styles.rowWrap}>
            <PillTag text="new" />
            <PillTag text="ai shopping" />
            <PillTag text="deals" />
          </View>
          <View style={styles.rowWrap}>
            <StoreChip text="Walmart" />
            <StoreChip text="Costco" />
            <StoreChip text="Amazon" />
          </View>
        </Section>

        <Section title="Cards">
          <View style={styles.grid2}>
            <InfoCard
              icon="flash"
              iconColor="#6DC271"
              title="Instant Insights"
              subtitle="Summarized comparisons in seconds with AI support."
            />
            <InfoCard
              icon="cart"
              iconColor="#7B8CFF"
              title="Smart Carts"
              subtitle="Auto-build lower-cost alternatives as you shop."
            />
          </View>

          <View style={styles.grid2}>
            <FeatureCard
              icon="camera"
              iconColor="#F4A261"
              title="Snap & Compare"
              body="Take a photo of any item and get real-time alternatives and pricing."
            />
            <FeatureCard
              icon="analytics"
              iconColor="#6DB473"
              title="Track Savings"
              body="Monitor your cumulative savings and weekly budget performance."
            />
          </View>

          <View style={styles.grid2}>
            <ProcessCard
              number="01"
              step="Step One"
              title="Describe your item"
              body="Type what you need or use your camera for quick product capture."
              icon="create-outline"
            />
            <ProcessCard
              number="02"
              step="Step Two"
              title="Compare options"
              body="SAVR ranks alternatives by price, quality, and store availability."
              icon="git-compare-outline"
            />
          </View>
        </Section>

        <Section title="Stats">
          <MetricsBar
            metrics={[
              {
                value: "34%",
                label: "Avg Savings",
                sublabel: "per grocery run",
              },
              { value: "2.4x", label: "Faster", sublabel: "decision speed" },
              { value: "98%", label: "Accuracy", sublabel: "price updates" },
              { value: "12k+", label: "Products", sublabel: "indexed weekly" },
            ]}
          />
          <View style={{ height: 12 }} />
          <StatBar
            stats={[
              ["$182", "Average monthly savings"],
              ["4.8★", "User satisfaction"],
              ["24/7", "Live tracking uptime"],
            ]}
          />
        </Section>

        <Section title="Footer">
          <FooterView />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const { colors, typography, spacing, radius, borderWidth, shadows } = SavrTheme;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  pageTitle: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  pageSubtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    ...typography.overline,
  },
  section: {
    backgroundColor: colors.card,
    borderWidth: borderWidth.hairline,
    borderColor: colors.cardStroke,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.deepGreen,
    ...typography.cardTitle,
  },
  sectionBody: {
    gap: spacing.sm,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  grid2: {
    flexDirection: "row",
    gap: spacing.xs,
  },
});
