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

const palette = {
  background: "#0b1220",
  panel: "#111b2f",
  accent: "#e93b56",
  accentSoft: "#f4c5cf",
  text: "#f5f7fb",
  muted: "#b8c2d8",
  stroke: "#1d2a45",
};

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
        styles.button,
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
          color={palette.text}
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
          <View style={styles.heroGlow} />
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
              color={palette.accentSoft}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: palette.panel,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.stroke,
    marginBottom: 24,
  },
  heroGlow: {
    position: "absolute",
    right: -40,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: "#2a3553",
    opacity: 0.6,
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(233, 59, 86, 0.15)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(233, 59, 86, 0.35)",
    marginBottom: 12,
  },
  heroBadgeText: {
    color: palette.accent,
    fontWeight: "600",
  },
  heroTitle: {
    color: palette.text,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  heroSubtitle: {
    color: palette.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 14,
  },
  button: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.stroke,
    marginRight: 12,
  },
  buttonPrimary: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonPrimaryText: {
    color: "#0b1220",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonGhostText: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 15,
  },
  heroFootnote: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  heroFootnoteText: {
    color: palette.accentSoft,
    marginLeft: 8,
  },
  heroMock: {
    backgroundColor: "#131d32",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    padding: 12,
    alignItems: "center",
  },
  heroImage: {
    width: "100%",
    height: 260,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  pill: {
    flexBasis: "32%",
    backgroundColor: palette.panel,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    marginBottom: 12,
  },
  pillTitle: {
    color: palette.text,
    fontWeight: "700",
    marginBottom: 4,
  },
  pillSubtitle: {
    color: palette.muted,
    fontSize: 13,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionKicker: {
    color: palette.accent,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontSize: 12,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: palette.muted,
    lineHeight: 22,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  featureCard: {
    width: "48%",
    backgroundColor: palette.panel,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    marginBottom: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1d2742",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: palette.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 6,
  },
  cardBody: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  ctaPanel: {
    backgroundColor: palette.panel,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  ctaTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  ctaSubtitle: {
    color: palette.muted,
    lineHeight: 22,
    marginBottom: 16,
  },
});
