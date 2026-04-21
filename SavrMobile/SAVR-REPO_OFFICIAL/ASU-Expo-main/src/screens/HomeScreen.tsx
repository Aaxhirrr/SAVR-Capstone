import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { logout, getUserId } from '../services/auth';
import { colors, fonts, spacing, radius, shadows } from '../theme';
import { RootStackParamList } from '../navigation';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  async function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>SAVR</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.welcomeLabel}>Welcome back</Text>
          {userId && (
            <Text style={styles.userId}>User ID: {userId}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Savings</Text>
          <Text style={styles.placeholder}>
            Connect your screens here. Add more routes in{' '}
            <Text style={styles.code}>src/navigation/index.tsx</Text> and
            screens in <Text style={styles.code}>src/screens/</Text>.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logo: {
    fontSize: fonts.sizeXl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 3,
  },
  logoutBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.full,
  },
  logoutText: {
    fontSize: fonts.sizeSm,
    color: colors.error,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  welcomeLabel: {
    fontSize: fonts.size2xl,
    fontWeight: '700',
    color: colors.text,
  },
  userId: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fonts.sizeLg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  placeholder: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.primary,
  },
});
