import { Tabs } from 'expo-router/js-tabs';
import { router } from 'expo-router';
import { Icon, IconButton, Logo } from '@/components/savr/ui';
import { colors } from '@/theme/tokens';
import { useSession } from '@/state/session';
export default function AppTabs() {
  const { session } = useSession();
  return (
    <Tabs
      key={session?.userId}
      initialRouteName="chat"
      screenOptions={{
        headerTitle: () => <Logo />,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerRight: () => (
          <IconButton
            label="Open profile"
            name="person-circle-outline"
            onPress={() => router.push('/profile')}
          />
        ),
        tabBarActiveTintColor: colors.deep,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.border,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="lists"
        options={{
          title: 'My Lists',
          tabBarIcon: ({ color }) => (
            <Icon name="basket-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Icon name="chatbubble-ellipses-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flyers"
        options={{
          title: 'Flyers',
          tabBarIcon: ({ color }) => (
            <Icon name="pricetags-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Stores',
          tabBarIcon: ({ color }) => (
            <Icon name="storefront-outline" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
