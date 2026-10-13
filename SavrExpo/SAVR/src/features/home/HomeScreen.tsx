import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon, Logo, s } from '@/components/savr/ui';
import { knownStores, storeImages } from '@/data/stores';
import { useSession } from '@/state/session';
import { colors } from '@/theme/tokens';

const features = [
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Just ask SAVR',
    detail:
      'Meal ideas, recipes, or a shopping list. Start with what you need and let SAVR help you plan.',
  },
  {
    icon: 'pricetags-outline',
    title: 'Find your weekly savings',
    detail:
      'Browse flyers from your favourite Canadian stores and add the deals you love to your list.',
  },
  {
    icon: 'scan-outline',
    title: 'Snap. Scan. Shop.',
    detail:
      'Turn a photo of a recipe or handwritten list into a conversation about your next grocery trip.',
  },
  {
    icon: 'leaf-outline',
    title: 'Made for you',
    detail:
      'Save your dietary needs and brand preferences for a more personal grocery experience.',
  },
] as const;
export default function HomeScreen() {
  const { session } = useSession();
  const start = () => router.push(session ? '/(tabs)/chat' : '/sign-up');
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[s.row, styles.nav]}>
          <Logo />
          <View style={s.flex} />
          <Button
            title={session ? 'Open SAVR' : 'Sign in'}
            secondary
            onPress={() => router.push(session ? '/(tabs)/chat' : '/sign-in')}
          />
        </View>
        <LinearGradient
          colors={[colors.background, '#EDF2E2']}
          style={styles.hero}
        >
          <Text style={styles.eyebrow}>GROCERY SHOPPING, SIMPLIFIED</Text>
          <Text style={styles.heroTitle}>
            Your smart{'\n'}grocery{'\n'}
            <Text style={{ color: '#448949' }}>companion.</Text>
          </Text>
          <Text style={styles.lead}>
            Good meals start with a better plan. Build your list, explore local
            flyers, and make room for more savings.
          </Text>
          <Button
            title={session ? 'Continue to SAVR' : 'Start saving with SAVR'}
            icon="arrow-forward"
            onPress={start}
          />
          <View style={styles.receipt}>
            <View style={s.row}>
              <Icon name="basket-outline" />
              <Text style={s.cardTitle}>Your week, sorted.</Text>
            </View>
            <Text style={s.subtitle}>A little planning goes a long way.</Text>
            {[
              'Plan meals you will love',
              'Keep your groceries in one place',
              'Shop your favourite stores',
            ].map((t) => (
              <View key={t} style={s.row}>
                <Icon name="checkmark-circle" color="#448949" />
                <Text style={[s.body, s.flex]}>{t}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
        <View style={styles.section}>
          <Text style={styles.eyebrow}>EVERYTHING YOU NEED</Text>
          <Text style={s.title}>A fresher way to shop.</Text>
          {features.map((f) => (
            <Card key={f.title}>
              <Icon name={f.icon} size={28} />
              <Text style={s.cardTitle}>{f.title}</Text>
              <Text style={s.body}>{f.detail}</Text>
            </Card>
          ))}
        </View>
        <View style={[styles.section, { backgroundColor: colors.pale }]}>
          <Text style={s.title}>Your stores. Your choice.</Text>
          <Text style={s.subtitle}>
            Choose up to three favourite stores for your shopping plan.
          </Text>
          <View style={s.wrap}>
            {knownStores.map((store) => (
              <View key={store.id} style={styles.store}>
                <Image
                  source={storeImages[store.brand]}
                  style={{ width: 68, height: 42 }}
                  contentFit="contain"
                  accessibilityLabel={store.name}
                />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.eyebrow}>HOW IT WORKS</Text>
          {[
            'Tell SAVR what you need.',
            'Explore your list and weekly deals.',
            'Head to the store with a plan.',
          ].map((step, i) => (
            <View key={step} style={s.row}>
              <Text style={styles.step}>{i + 1}</Text>
              <Text style={[s.body, s.flex]}>{step}</Text>
            </View>
          ))}
          <Button title="Make your next grocery trip easier" onPress={start} />
          <Text style={[s.subtitle, { textAlign: 'center' }]}>
            SAVR · Your Canadian grocery companion
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { maxWidth: 840, width: '100%', alignSelf: 'center' },
  nav: { padding: 22 },
  hero: { padding: 28, gap: 24, borderRadius: 28 },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    color: colors.muted,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    color: colors.deep,
    lineHeight: 56,
  },
  lead: { fontSize: 18, lineHeight: 28, color: colors.muted },
  receipt: {
    backgroundColor: '#FFFFFFE8',
    padding: 24,
    borderRadius: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { padding: 28, gap: 22 },
  store: { padding: 10, borderRadius: 12, backgroundColor: 'white' },
  step: { fontSize: 26, fontWeight: '800', color: colors.deep, width: 40 },
});
