import { Platform } from "react-native";

const rgba = (r: number, g: number, b: number, a = 1) =>
  `rgba(${r}, ${g}, ${b}, ${a})`;

export const SavrColors = {
  bg: "#f9f7f3",
  bgTop: "#f9f7f3",
  bgBottom: "#fcfaf2",

  brandGreen: "#70c978",
  deepGreen: "#1a4d29",
  mutedGreen: "#6e9473",
  brandBlue: "#cae0bf",
  brandOrange: "#f2ad33",
  brandPurple: "#eddebd",

  line: "#e0d6c7",
  card: rgba(255, 255, 255, 0.96),
  softCard: rgba(255, 255, 255, 0.92),
  cardStroke: "#e0d6c7",
  inputBackground: "#ffffff",
  processCard: "#f2d6b0",
  ctaCard: "#f2d6b0",
  peach: "#f7e3bd",
  peachGlow: "#f7dba8",
  mintGlow: "#dcedcc",

  textPrimary: "#1a4d29",
  textSecondary: "#547359",

  orangeBorder: "#fa9478",

  statBar: "#1a4d29",
  metricsGreen: "#1a4d29",

  featureYellow: "#f5a60d",
  featureBeige: "#ebcca1",
} as const;

export const SavrTypography = {
  hero: {
    fontSize: 54,
    fontWeight: "900" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "serif",
      web: "Georgia, 'Times New Roman', serif",
    }),
  },
  section: {
    fontSize: 34,
    fontWeight: "900" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "serif",
      web: "Georgia, 'Times New Roman', serif",
    }),
  },
  cta: {
    fontSize: 42,
    fontWeight: "900" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "serif",
      web: "Georgia, 'Times New Roman', serif",
    }),
  },

  nav: {
    fontSize: 16,
    fontWeight: "600" as const,
    fontFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif",
      default: "sans-serif",
      web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    }),
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    fontFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif",
      default: "sans-serif",
      web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    }),
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "700" as const,
    fontFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif",
      default: "sans-serif",
      web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    }),
  },
  caption: {
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif",
      default: "sans-serif",
      web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    }),
  },
  overline: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif",
      default: "sans-serif",
      web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    }),
  },

  heroTitle: {
    fontSize: 34,
    fontWeight: "900" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "serif",
      web: "Georgia, 'Times New Roman', serif",
    }),
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: "900" as const,
    fontFamily: Platform.select({
      ios: "ui-serif",
      android: "serif",
      default: "serif",
      web: "Georgia, 'Times New Roman', serif",
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: Platform.select({
      ios: "ui-rounded",
      android: "sans-serif",
      default: "sans-serif",
      web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    }),
  },
} as const;

export const SavrTheme = {
  colors: SavrColors,
  typography: SavrTypography,

  background: {
    gradient: [SavrColors.bgTop, SavrColors.bgBottom] as const,
    glow: {
      mint: rgba(220, 237, 204, 0.35),
      peach: rgba(247, 219, 168, 0.28),
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },

  borderWidth: {
    hairline: 1,
    thin: 1.5,
    regular: 2,
  },

  shadows: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    soft: {
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  },
} as const;

export type SavrThemeType = typeof SavrTheme;
export type SavrColorName = keyof typeof SavrColors;
export type SavrTypographyName = keyof typeof SavrTypography;
