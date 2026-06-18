import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SavrTheme } from "@/constants/theme";

const { colors, typography, spacing, radius, borderWidth, shadows } = SavrTheme;

const stats = [
  { title: "15+ Canadian Stores", subtitle: "Real prices, real-time" },
  { title: "3 Store Comparison", subtitle: "Side-by-side totals instantly" },
  { title: "100% Free to Use", subtitle: "No credit card needed" },
];

const steps = [
  {
    title: "Tell Savr What You Need",
    body: "Chat about recipes, meal plans, or basics. Savr understands and builds your list.",
    icon: "chatbubble-ellipses",
  },
  {
    title: "Choose Your Stores",
    body: "Pick up to three stores nearby. We pull live prices so you never guess.",
    icon: "navigate",
  },
  {
    title: "Save Real Money",
    body: "Compare items side-by-side. Pick the best deals or go with the cheapest cart.",
    icon: "pricetag",
  },
];

const features = [
  {
    title: "Just Ask Savr",
    body: "Skip menus. Describe what you need in your own words.",
    icon: "mic",
  },
  {
    title: "Compare 3 Stores Instantly",
    body: "Real-time totals before you leave home.",
    icon: "git-compare",
  },
  {
    title: "Snap & Shop",
    body: "Photograph a recipe or fridge and we build the list.",
    icon: "camera",
  },
  {
    title: "Always Your Choice",
    body: "Multiple options per item so every dollar is yours.",
    icon: "checkmark-circle",
  },
  {
    title: "Made for You",
    body: "Dietary preferences and allergies handled once.",
    icon: "leaf",
  },
  {
    title: "Shop Your Way",
    body: "Print, share, or pull it up in-store — your list travels.",
    icon: "share-social",
  },
];

function CTAButton({
  label,
  variant = "primary",
  onPress,
}: {
  label: string;
  variant?: "primary" | "ghost";
  onPress: () => void;
}) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.buttonBase,
        isPrimary ? styles.buttonPrimary : styles.buttonGhost,
      ]}
    >
      <Text
        style={isPrimary ? styles.buttonPrimaryText : styles.buttonGhostText}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Pill({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillTitle}>{title}</Text>
      <Text style={styles.pillSubtitle}>{subtitle}</Text>
    </View>
  );
}

function FeatureCard({
  title,
  body,
  icon,
}: {
  title: string;
  body: string;
  icon: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.iconBadge}>
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={colors.textPrimary}
        />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroGlowMint} />
          <View style={styles.heroGlowPeach} />

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>
              🍎 Your AI Grocery Companion
            </Text>
          </View>

          <Text style={styles.heroTitle}>Stop overpaying for groceries.</Text>

          <Text style={styles.heroSubtitle}>
            Tell Savr what you need and we will find the lowest price at nearby
            stores — saving you real money.
          </Text>

          <View style={styles.buttonRow}>
            <CTAButton
              label="Get Started Free"
              onPress={() => Linking.openURL("https://savr.app/signup")}
            />
            <CTAButton
              label="Sign In"
              variant="ghost"
              onPress={() => Linking.openURL("https://savr.app/login")}
            />
          </View>

          <View style={styles.heroFootnote}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={colors.mutedGreen}
            />
            <Text style={styles.heroFootnoteText}>
              No credit card required. Cancel anytime.
            </Text>
          </View>

          <View style={styles.heroMock}>
            <Image
              source={{
                uri: "https://images.ctfassets.net/f60q1anpxzid/4IVwWvNysV6n4nR0W2Laxd/9b682e6f4d8449569fbe0c1e6f1fcb67/placeholder-phone.png",
              }}
              contentFit="cover"
              style={styles.heroImage}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <Pill
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Simple as 1-2-3</Text>
          <Text style={styles.sectionTitle}>How Savr Works</Text>
          <Text style={styles.sectionSubtitle}>
            From your kitchen to checkout in three easy steps.
          </Text>
        </View>

        <View style={styles.cardsGrid}>
          {steps.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              body={item.body}
              icon={item.icon}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionKicker}>Packed with features</Text>
          <Text style={styles.sectionTitle}>Why Canadians Love Savr</Text>
          <Text style={styles.sectionSubtitle}>
            Everything you need to shop smarter, save more, and stress less.
          </Text>
        </View>

        <View style={styles.cardsGrid}>
          {features.map((item) => (
            <FeatureCard
              key={item.title}
              title={item.title}
              body={item.body}
              icon={item.icon}
            />
          ))}
        </View>

        <View style={styles.ctaPanel}>
          <Text style={styles.ctaTitle}>Ready to start saving?</Text>
          <Text style={styles.ctaSubtitle}>
            Join Canadians who are already spending less on groceries. It is
            free to try.
          </Text>
          <View style={styles.buttonRowCompact}>
            <CTAButton
              label="Get Started Free"
              onPress={() => Linking.openURL("https://savr.app/signup")}
            />
            <CTAButton
              label="Sign In"
              variant="ghost"
              onPress={() => Linking.openURL("https://savr.app/login")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: "hidden",
    borderWidth: borderWidth.thin,
    borderColor: colors.cardStroke,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  heroGlowMint: {
    position: "absolute",
    right: -44,
    top: -62,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: SavrTheme.background.glow.mint,
  },
  heroGlowPeach: {
    position: "absolute",
    left: -78,
    bottom: -86,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: SavrTheme.background.glow.peach,
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.peach,
    borderRadius: radius.pill,
    borderWidth: borderWidth.thin,
    borderColor: colors.orangeBorder,
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    color: colors.deepGreen,
    ...typography.caption,
  },
  heroTitle: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    ...typography.section,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
    ...typography.body,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: spacing.sm,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  buttonRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  buttonBase: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: borderWidth.thin,
  },
  buttonPrimary: {
    backgroundColor: colors.brandGreen,
    borderColor: colors.deepGreen,
  },
  buttonGhost: {
    backgroundColor: colors.softCard,
    borderColor: colors.line,
  },
  buttonPrimaryText: {
    color: colors.deepGreen,
    ...typography.bodyBold,
  },
  buttonGhostText: {
    color: colors.textPrimary,
    ...typography.bodyBold,
  },
  heroFootnote: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  heroFootnoteText: {
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    ...typography.caption,
  },
  heroMock: {
    backgroundColor: colors.softCard,
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
    padding: spacing.sm,
    alignItems: "center",
  },
  heroImage: {
    width: "100%",
    height: 260,
    borderRadius: radius.md,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  pill: {
    flexBasis: "31%",
    minWidth: 104,
    backgroundColor: colors.softCard,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.line,
    marginBottom: spacing.xs,
  },
  pillTitle: {
    color: colors.textPrimary,
    marginBottom: 4,
    ...typography.bodyBold,
  },
  pillSubtitle: {
    color: colors.textSecondary,
    ...typography.caption,
  },

  sectionHeader: {
    marginBottom: spacing.sm,
  },
  sectionKicker: {
    color: colors.brandOrange,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    ...typography.overline,
  },
  sectionTitle: {
    color: colors.textPrimary,
    marginBottom: 4,
    ...typography.sectionTitle,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    lineHeight: 22,
    ...typography.body,
  },

  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: "48%",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.cardStroke,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  cardTitle: {
    color: colors.textPrimary,
    marginBottom: 6,
    ...typography.cardTitle,
  },
  cardBody: {
    color: colors.textSecondary,
    lineHeight: 20,
    ...typography.caption,
  },

  ctaPanel: {
    backgroundColor: colors.ctaCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: borderWidth.thin,
    borderColor: colors.orangeBorder,
    ...shadows.soft,
  },
  ctaTitle: {
    color: colors.deepGreen,
    marginBottom: spacing.xs,
    ...typography.sectionTitle,
  },
  ctaSubtitle: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
    ...typography.body,
  },
});
