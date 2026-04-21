import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, spacing, radius, shadows } from '../theme';
import { getUserId, logout } from '../services/auth';
import { getProfile, getDisplayName, updateProfile } from '../services/profile';
import { fetchWelcomeMessage, fetchChatHistory, sendMessage as sendChatMessage } from '../services/chat';
import { getFlyers, FlyerDeal } from '../services/flyers';
import {
  getUserSelectedStores,
  addUserSelectedStore,
  removeUserSelectedStore,
  getCoordinatesFromAddress,
  getNearbyStoresFromDB,
  storeBrandKey,
  UserSelectedStore,
  Store,
} from '../services/storeService';
import { RootStackParamList } from '../navigation';

type ChatScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
};

type ChatMessage = {
  id: string;
  from: 'user' | 'assistant';
  text: string;
};

type GroceryListSummary = {
  id: string;
  name: string;
  meta: string;
};

type Recipe = {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
};

const EXAMPLE_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Classic Beef Chili',
    description: 'A hearty, warming chili packed with beans and spices. Perfect for cold evenings.',
    prepTime: '15 min',
    cookTime: '45 min',
    servings: 6,
    ingredients: [
      '1 lb ground beef',
      '1 onion, diced',
      '2 cloves garlic, minced',
      '1 can (28 oz) diced tomatoes',
      '1 can (15 oz) kidney beans',
      '2 tbsp chili powder',
      '1 tsp cumin',
    ],
    instructions: [
      'Brown the beef in a large pot over medium heat. Add onion and garlic; cook until softened.',
      'Stir in tomatoes (with juice), beans, chili powder, and cumin. Bring to a boil.',
      'Reduce heat and simmer uncovered for 35–40 minutes, stirring occasionally.',
      'Serve with toppings like cheese, sour cream, and cilantro.',
    ],
  },
  {
    id: '2',
    title: 'Banana Bread',
    description: 'Moist, tender banana bread with a hint of cinnamon. Great for breakfast or a snack.',
    prepTime: '10 min',
    cookTime: '55 min',
    servings: 8,
    ingredients: [
      '3 ripe bananas, mashed',
      '1/3 cup melted butter',
      '3/4 cup sugar',
      '1 egg, beaten',
      '1 tsp vanilla',
      '1 tsp baking soda',
      '1 1/2 cups flour',
      '1/2 tsp cinnamon',
    ],
    instructions: [
      'Preheat oven to 350°F. Mix mashed bananas, butter, sugar, egg, and vanilla.',
      'Add baking soda, flour, and cinnamon. Stir until just combined.',
      'Pour into a greased 8x4" loaf pan. Bake 55–60 minutes until a toothpick comes out clean.',
      'Cool in pan 10 minutes, then turn out onto a wire rack.',
    ],
  },
];

type SidebarTab = 'Flyers' | 'Chat' | 'Cookbook';

export default function ChatScreen({ navigation }: ChatScreenProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>('User');
  const [activeTab, setActiveTab] = useState<SidebarTab>('Chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flyersLoading, setFlyersLoading] = useState(false);
  const [flyersError, setFlyersError] = useState<string | null>(null);
  const [flyerDeals, setFlyerDeals] = useState<FlyerDeal[]>([]);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [selectedStores, setSelectedStores] = useState<UserSelectedStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [newRestriction, setNewRestriction] = useState('');
  const [likedBrands, setLikedBrands] = useState<Record<string, string>>({});
  const [dislikedBrands, setDislikedBrands] = useState<Record<string, string>>({});
  const [newLikedCategory, setNewLikedCategory] = useState('');
  const [newLikedBrand, setNewLikedBrand] = useState('');
  const [newDislikedCategory, setNewDislikedCategory] = useState('');
  const [newDislikedBrand, setNewDislikedBrand] = useState('');
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [flyerStores, setFlyerStores] = useState<UserSelectedStore[]>([]);
  const [flyerStoresLoaded, setFlyerStoresLoaded] = useState(false);
  const [selectedFlyerBrand, setSelectedFlyerBrand] = useState<string>('nofrills');
  const [addStoreAddress, setAddStoreAddress] = useState('');
  const [addStoreLoading, setAddStoreLoading] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);
  const [sending, setSending] = useState(false);
  const [sidebarListsExpanded, setSidebarListsExpanded] = useState(true);
  const [groceryLists] = useState<GroceryListSummary[]>([
    {
      id: 'list-1',
      name: 'Chili and Banana Bread',
      meta: 'Today · 22 items',
    },
    {
      id: 'list-2',
      name: 'Weeknight Dinners',
      meta: 'This week · 15 items',
    },
    {
      id: 'list-3',
      name: 'Breakfast & Snacks',
      meta: 'This week · 9 items',
    },
  ]);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    getProfile()
      .then((p) => setUserDisplayName(getDisplayName(p)))
      .catch(() => setUserDisplayName('User'));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialChat() {
      try {
        setLoading(true);
        const welcome = await fetchWelcomeMessage();
        if (!isMounted) return;

        setSessionId(welcome.session_id);

        let history: ChatMessage[] = [];
        try {
          const backendMessages = await fetchChatHistory(welcome.session_id);
          if (isMounted && backendMessages.length > 0) {
            history = backendMessages.map((m) => ({
              id: m.id,
              from: m.is_user ? 'user' : 'assistant',
              text: m.content,
            }));
          }
        } catch {
          // If history fails, fall back to just the welcome text below.
        }

        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([
            {
              id: 'welcome',
              from: 'assistant',
              text: welcome.content,
            },
          ]);
        }
      } catch {
        if (!isMounted) return;
        setMessages([
          {
            id: 'welcome-fallback',
            from: 'assistant',
            text:
              "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list.",
          },
        ]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialChat();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function loadFlyersIfNeeded() {
      if (activeTab !== 'Flyers') return;
      // Wait for stores to load so we use the user's store brand, not default nofrills
      if (!flyerStoresLoaded) return;

      try {
        setFlyersLoading(true);
        setFlyersError(null);
        const page = await getFlyers({
          store_brand: selectedFlyerBrand,
          page: 1,
          page_size: 20,
          sort_by: 'product_name',
          sort_dir: 'asc',
        });
        setFlyerDeals(page.deals ?? []);
      } catch (err: any) {
        setFlyersError(
          err?.response?.data?.detail ||
            'Failed to load flyers. Please try again later.'
        );
        setFlyerDeals([]);
      } finally {
        setFlyersLoading(false);
      }
    }

    loadFlyersIfNeeded();
  }, [activeTab, selectedFlyerBrand, flyerStoresLoaded]);

  useEffect(() => {
    if (!isStoreModalOpen) return;
    setStoresLoading(true);
    getUserSelectedStores()
      .then(setSelectedStores)
      .catch(() => setSelectedStores([]))
      .finally(() => setStoresLoading(false));
  }, [isStoreModalOpen]);

  useEffect(() => {
    if (!isPreferencesOpen) return;
    setPreferencesLoading(true);
    getProfile()
      .then((p) => {
        const dr = p.dietaryRestrictions || p.dietary_restrictions || [];
        setDietaryRestrictions(Array.isArray(dr) ? dr : []);
        const prefs = p.brandPreferences || p.brand_preferences;
        if (prefs && typeof prefs === 'object') {
          if (prefs.liked && prefs.disliked) {
            setLikedBrands(prefs.liked as Record<string, string>);
            setDislikedBrands(prefs.disliked as Record<string, string>);
          } else if (typeof prefs === 'object' && !Array.isArray(prefs)) {
            setLikedBrands((prefs as Record<string, string>) || {});
            setDislikedBrands({});
          }
        }
      })
      .catch(() => {
        setDietaryRestrictions([]);
        setLikedBrands({});
        setDislikedBrands({});
      })
      .finally(() => setPreferencesLoading(false));
  }, [isPreferencesOpen]);

  useEffect(() => {
    if (activeTab !== 'Flyers') return;
    setFlyerStoresLoaded(false);
    getUserSelectedStores()
      .then((stores) => {
        setFlyerStores(stores);
        if (stores.length > 0) {
          const firstKey = storeBrandKey(stores[0].store_name);
          setSelectedFlyerBrand(firstKey || 'nofrills');
        }
        setFlyerStoresLoaded(true);
      })
      .catch(() => {
        setFlyerStores([]);
        setFlyerStoresLoaded(true);
      });
  }, [activeTab]);

  async function handleNewChat() {
    if (isCreatingNewChat) return;
    setIsCreatingNewChat(true);
    try {
      const welcome = await fetchWelcomeMessage();
      setSessionId(welcome.session_id);
      setMessages([
        { id: 'welcome', from: 'assistant', text: welcome.content },
      ]);
      setListExpanded(false);
    } catch {
      setMessages([
        {
          id: 'welcome-fallback',
          from: 'assistant',
          text:
            "Hi, I'm Savr! You can tell me what meals you're shopping for, or just give me your shopping list.",
        },
      ]);
    } finally {
      setIsCreatingNewChat(false);
    }
  }

  function handleLogout() {
    setSidebarOpen(false);
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      from: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      let sid = sessionId;
      if (!sid) {
        const welcome = await fetchWelcomeMessage();
        sid = welcome.session_id;
        setSessionId(sid);
      }
      const { sessionId: newSessionId, botResponse } = await sendChatMessage(sid, trimmed);
      if (newSessionId && newSessionId !== sid) setSessionId(newSessionId);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        from: 'assistant',
        text: botResponse || 'No response from the assistant.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        from: 'assistant',
        text: "Something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: ChatMessage }) {
    const isUser = item.from === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageUser : styles.messageAssistant,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.messageTextUser : styles.messageTextAssistant,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  }

  const flyerBrands = React.useMemo(() => {
    const seen = new Set<string>();
    const out: { key: string; label: string }[] = [];
    for (const s of flyerStores) {
      const key = storeBrandKey(s.store_name);
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push({ key, label: s.store_name });
      }
    }
    if (out.length === 0) out.push({ key: 'nofrills', label: 'No Frills' });
    return out;
  }, [flyerStores]);

  function renderTabContent() {
    if (activeTab === 'Flyers') {
      return (
        <View style={styles.flyersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.flyerBrandTabs}
            contentContainerStyle={styles.flyerBrandTabsContent}
          >
            {flyerBrands.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedFlyerBrand(key)}
                style={[
                  styles.flyerBrandTab,
                  selectedFlyerBrand === key && styles.flyerBrandTabActive,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.flyerBrandTabText,
                    selectedFlyerBrand === key && styles.flyerBrandTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {flyersLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading flyers…</Text>
            </View>
          ) : flyersError ? (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderTitle}>Flyers</Text>
              <Text style={styles.placeholderBody}>{flyersError}</Text>
            </View>
          ) : flyerDeals.length === 0 ? (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderTitle}>Flyers</Text>
              <Text style={styles.placeholderBody}>
                {flyerStores.length === 0
                  ? 'Add stores using the location icon above to see flyers for those stores.'
                  : `No deals found for this store right now. Try another store tab or check back later.`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={flyerDeals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.flyersList}
              renderItem={({ item }) => (
                <View style={styles.flyerCard}>
                  <View style={styles.flyerHeaderRow}>
                    <Text style={styles.flyerProduct}>{item.product_name}</Text>
                    <Text style={styles.flyerPrice}>{item.price}</Text>
                  </View>
                  {item.brand && (
                    <Text style={styles.flyerBrand}>{item.brand}</Text>
                  )}
                  {item.sale_story && (
                    <Text style={styles.flyerSale}>{item.sale_story}</Text>
                  )}
                  <Text style={styles.flyerDates}>
                    {new Date(item.valid_from).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    –{' '}
                    {new Date(item.valid_to).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      );
    }

    if (activeTab === 'Cookbook') {
      return (
        <View style={styles.cookbookContainer}>
          <Text style={styles.cookbookTitle}>Cookbook</Text>
          <Text style={styles.cookbookSubtitle}>
            Recipe cards for meals you plan. Tap a card to view full details.
          </Text>
          <ScrollView
            style={styles.cookbookScroll}
            contentContainerStyle={styles.cookbookList}
            showsVerticalScrollIndicator={false}
          >
            {EXAMPLE_RECIPES.map((recipe) => (
              <View key={recipe.id} style={styles.recipeCard}>
                <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
                <Text style={styles.recipeCardDescription}>
                  {recipe.description}
                </Text>
                <View style={styles.recipeCardMeta}>
                  <Text style={styles.recipeMetaText}>
                    {recipe.prepTime} prep · {recipe.cookTime} cook
                  </Text>
                  <Text style={styles.recipeMetaText}>
                    Serves {recipe.servings}
                  </Text>
                </View>
                <View style={styles.recipeCardSection}>
                  <Text style={styles.recipeSectionTitle}>Ingredients</Text>
                  {recipe.ingredients.slice(0, 4).map((ing, i) => (
                    <Text key={i} style={styles.recipeBullet}>
                      • {ing}
                    </Text>
                  ))}
                  {recipe.ingredients.length > 4 && (
                    <Text style={styles.recipeMore}>
                      +{recipe.ingredients.length - 4} more
                    </Text>
                  )}
                </View>
                <View style={styles.recipeCardSection}>
                  <Text style={styles.recipeSectionTitle}>Instructions</Text>
                  {recipe.instructions.slice(0, 2).map((step, i) => (
                    <Text key={i} style={styles.recipeStep} numberOfLines={2}>
                      {i + 1}. {step}
                    </Text>
                  ))}
                  {recipe.instructions.length > 2 && (
                    <Text style={styles.recipeMore}>
                      +{recipe.instructions.length - 2} more steps
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    // Default/chat view
    return (
      <View style={styles.chatContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your chat…</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
          />
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header with menu button, SAVR logo, and action icons */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => setSidebarOpen(true)}
              activeOpacity={0.8}
              style={styles.menuButton}
            >
              <View style={styles.menuIconBar} />
              <View style={styles.menuIconBar} />
              <View style={styles.menuIconBar} />
            </TouchableOpacity>
            <Text style={styles.logo}>SAVR</Text>
          </View>
          {activeTab === 'Chat' && (
            <View style={styles.headerIcons}>
              <TouchableOpacity
                onPress={handleNewChat}
                disabled={isCreatingNewChat}
                style={styles.headerIconBtn}
                activeOpacity={0.7}
              >
                {isCreatingNewChat ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color={colors.text}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsStoreModalOpen(true)}
                style={styles.headerIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsPreferencesOpen(true)}
                style={styles.headerIconBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="heart-outline"
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeLabel}>Welcome back</Text>
            {userId && <Text style={styles.userId}>User ID: {userId}</Text>}
          </View>

          {/* Primary chat area */}
          <View style={styles.mainCard}>{renderTabContent()}</View>
        </View>

        {/* Bottom lists preview + chat input */}
        {activeTab === 'Chat' && (
          <View style={styles.bottomArea}>
            <View
              style={[
                styles.listDrawer,
                listExpanded && styles.listDrawerExpanded,
              ]}
            >
              <View style={styles.listHandleRow}>
                <View style={styles.listHandleBar} />
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setListExpanded((prev) => !prev)}
                style={styles.listHeaderRow}
              >
                <View>
                  <Text style={styles.listTitle}>
                    {groceryLists[0]?.name ?? 'My Lists'}
                  </Text>
                  <Text style={styles.listMeta}>
                    {groceryLists[0]?.meta ?? 'Your current shopping plan'}
                  </Text>
                </View>
                <Text style={styles.listChevron}>
                  {listExpanded ? '⌄' : '⌃'}
                </Text>
              </TouchableOpacity>
              {listExpanded && (
                <View style={styles.listItems}>
                  <Text style={styles.listItemText}>
                    (List items will appear here as you build your plan.)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Message Savr..."
                placeholderTextColor={colors.placeholder}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Slide-out sidebar menu */}
        {sidebarOpen && (
          <View style={styles.sidebarOverlay}>
            {/* Drawer slides in from the left; backdrop fills the remaining space */}
            <View style={styles.sidebar}>
              <View style={styles.sidebarMain}>
                <Text style={styles.sidebarLogo}>SAVR</Text>
                <View style={styles.sidebarHeaderRow}>
                  <Text style={styles.sidebarTitle}>Menu</Text>
                  <TouchableOpacity
                    onPress={() => setSidebarOpen(false)}
                    activeOpacity={0.8}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                {(['Chat', 'Flyers', 'Cookbook'] as SidebarTab[]).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.sidebarItem,
                        isActive && styles.sidebarItemActive,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setActiveTab(tab);
                        setSidebarOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.sidebarItemText,
                          isActive && styles.sidebarItemTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={styles.sidebarListsSection}>
                  <TouchableOpacity
                    style={styles.sidebarListsHeader}
                    activeOpacity={0.85}
                    onPress={() =>
                      setSidebarListsExpanded((prev) => !prev)
                    }
                  >
                    <Text style={styles.sidebarTitle}>My Lists</Text>
                    <Text style={styles.listChevron}>
                      {sidebarListsExpanded ? '⌄' : '⌃'}
                    </Text>
                  </TouchableOpacity>
                  {sidebarListsExpanded && (
                    <View style={styles.sidebarLists}>
                      {groceryLists.map((list) => (
                        <View key={list.id} style={styles.sidebarListItem}>
                          <Text style={styles.sidebarListName}>
                            {list.name}
                          </Text>
                          <Text style={styles.sidebarListMeta}>
                            {list.meta}
                          </Text>
                        </View>
                      ))}
                      <Text style={styles.sidebarListHint}>
                        Your saved grocery lists will appear here.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.sidebarFooter}>
                <View style={styles.sidebarDivider} />
                <TouchableOpacity
                  style={styles.sidebarProfileButton}
                  activeOpacity={0.85}
                  onPress={() => setSidebarOpen(false)}
                >
                  <View style={styles.sidebarProfileIcon}>
                    <Text style={styles.sidebarProfileIconText}>
                      {userDisplayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.sidebarProfileName} numberOfLines={1}>
                    {userDisplayName}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sidebarLogoutButton}
                  activeOpacity={0.85}
                  onPress={handleLogout}
                >
                  <Text style={styles.sidebarLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sidebarBackdrop}
              activeOpacity={1}
              onPress={() => setSidebarOpen(false)}
            />
          </View>
        )}

        {/* Store selector modal */}
        <Modal
          visible={isStoreModalOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsStoreModalOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select stores</Text>
              <TouchableOpacity
                onPress={() => setIsStoreModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            {storesLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.addStoreSection}>
                  <Text style={styles.preferencesSectionTitle}>Add store by address</Text>
                  <View style={styles.addStoreRow}>
                    <TextInput
                      style={styles.addStoreInput}
                      placeholder="Enter address or city (e.g. Vancouver BC)"
                      placeholderTextColor={colors.placeholder}
                      value={addStoreAddress}
                      onChangeText={setAddStoreAddress}
                    />
                    <TouchableOpacity
                        onPress={async () => {
                        const raw = addStoreAddress.trim();
                        if (!raw) return;
                        setAddStoreLoading(true);
                        setNearbyStores([]);
                        try {
                          // Bias Canadian results: if no comma (city-only) or no "Canada", append ", Canada"
                          const address =
                            raw.includes(',') && /Canada|canada/i.test(raw)
                              ? raw
                              : raw + (raw.endsWith(',') ? '' : ', ') + 'Canada';
                          const { latitude, longitude } = await getCoordinatesFromAddress(address);
                          const stores = await getNearbyStoresFromDB({
                            latitude,
                            longitude,
                            radius: 10000,
                          });
                          setNearbyStores(stores);
                        } catch {
                          Alert.alert('Error', 'Could not find stores for that address.');
                        } finally {
                          setAddStoreLoading(false);
                        }
                      }}
                      disabled={addStoreLoading || !addStoreAddress.trim()}
                      style={styles.addStoreBtn}
                    >
                      {addStoreLoading ? (
                        <ActivityIndicator size="small" color={colors.textInverse} />
                      ) : (
                        <Text style={styles.addStoreBtnText}>Search</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {nearbyStores.length > 0 && (
                    <View style={styles.nearbyStoresList}>
                      {nearbyStores.slice(0, 10).map((store) => (
                        <TouchableOpacity
                          key={store.id}
                          onPress={async () => {
                            try {
                              const added = await addUserSelectedStore({
                                store_name: store.name,
                                address: store.address,
                                postal_code: store.postal_code || '',
                                image_url: store.image_url,
                                place_id: store.place_id,
                              });
                              setSelectedStores((prev) => [...prev, added]);
                              setNearbyStores([]);
                              setAddStoreAddress('');
                              Alert.alert('Added', `${store.name} added to your stores.`);
                            } catch {
                              Alert.alert('Error', 'Could not add store.');
                            }
                          }}
                          style={styles.nearbyStoreCard}
                        >
                          <View style={styles.nearbyStoreCardTextWrap}>
                            <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                            <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
                          </View>
                          <Text style={styles.nearbyStoreAdd}>+ Add</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Text style={[styles.preferencesSectionTitle, { marginTop: spacing.lg }]}>
                  Your stores
                </Text>
                {selectedStores.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Text style={styles.modalEmptyText}>
                      No stores selected. Search by address above to add stores.
                    </Text>
                  </View>
                ) : (
                  selectedStores.map((store) => (
                    <View
                      key={store.id ?? `${store.store_name}-${store.address}`}
                      style={styles.storeCard}
                    >
                      <Text style={styles.storeName} numberOfLines={1}>{store.store_name}</Text>
                      <Text style={styles.storeAddress} numberOfLines={2} ellipsizeMode="tail">
                        {store.address}
                      </Text>
                      {store.id != null && (
                        <TouchableOpacity
                          onPress={async () => {
                            try {
                              await removeUserSelectedStore(store.id!);
                              setSelectedStores((prev) =>
                                prev.filter((s) => s.id !== store.id)
                              );
                            } catch {
                              Alert.alert('Error', 'Could not remove store.');
                            }
                          }}
                          style={styles.storeRemoveBtn}
                        >
                          <Text style={styles.storeRemoveText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* Preferences modal */}
        <Modal
          visible={isPreferencesOpen}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsPreferencesOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preferences</Text>
              <TouchableOpacity
                onPress={() => setIsPreferencesOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
            {preferencesLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                <Text style={styles.preferencesSectionTitle}>
                  Dietary restrictions
                </Text>
                <View style={styles.restrictionRow}>
                  <TextInput
                    style={styles.restrictionInput}
                    placeholder="Add restriction (e.g. gluten-free)"
                    placeholderTextColor={colors.placeholder}
                    value={newRestriction}
                    onChangeText={setNewRestriction}
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      const v = newRestriction.trim();
                      if (!v || dietaryRestrictions.includes(v)) return;
                      const updated = [...dietaryRestrictions, v];
                      setDietaryRestrictions(updated);
                      setNewRestriction('');
                      try {
                        await updateProfile({ dietaryRestrictions: updated });
                        Alert.alert('Saved', 'Dietary restriction added.');
                      } catch {
                        Alert.alert('Error', 'Could not save.');
                      }
                    }}
                    style={styles.restrictionAddBtn}
                  >
                    <Text style={styles.restrictionAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {dietaryRestrictions.map((r) => (
                  <View key={r} style={styles.restrictionTag}>
                    <Text style={styles.restrictionTagText}>{r}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        const updated = dietaryRestrictions.filter((x) => x !== r);
                        setDietaryRestrictions(updated);
                        try {
                          await updateProfile({ dietaryRestrictions: updated });
                        } catch {}
                      }}
                      style={styles.restrictionRemoveBtn}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.preferencesSectionTitle, { marginTop: spacing.lg }]}>
                  Liked brands
                </Text>
                <View style={styles.brandRow}>
                  <TextInput
                    style={styles.brandInput}
                    placeholder="Category"
                    placeholderTextColor={colors.placeholder}
                    value={newLikedCategory}
                    onChangeText={setNewLikedCategory}
                  />
                  <TextInput
                    style={styles.brandInput}
                    placeholder="Brand"
                    placeholderTextColor={colors.placeholder}
                    value={newLikedBrand}
                    onChangeText={setNewLikedBrand}
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      if (!newLikedCategory.trim() || !newLikedBrand.trim()) return;
                      const next = { ...likedBrands, [newLikedCategory.trim()]: newLikedBrand.trim() };
                      setLikedBrands(next);
                      setNewLikedCategory('');
                      setNewLikedBrand('');
                      try {
                        await updateProfile({ brandPreferences: { liked: next, disliked: dislikedBrands } });
                        Alert.alert('Saved', 'Liked brand added.');
                      } catch {
                        Alert.alert('Error', 'Could not save.');
                      }
                    }}
                    style={styles.restrictionAddBtn}
                  >
                    <Text style={styles.restrictionAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {Object.entries(likedBrands).map(([cat, brand]) => (
                  <View key={cat} style={styles.brandTagLiked}>
                    <Text style={styles.restrictionTagText}>{cat}: {brand}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        const next = { ...likedBrands };
                        delete next[cat];
                        setLikedBrands(next);
                        try {
                          await updateProfile({ brandPreferences: { liked: next, disliked: dislikedBrands } });
                        } catch {}
                      }}
                      style={styles.restrictionRemoveBtn}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.preferencesSectionTitle, { marginTop: spacing.lg }]}>
                  Disliked brands
                </Text>
                <View style={styles.brandRow}>
                  <TextInput
                    style={styles.brandInput}
                    placeholder="Category"
                    placeholderTextColor={colors.placeholder}
                    value={newDislikedCategory}
                    onChangeText={setNewDislikedCategory}
                  />
                  <TextInput
                    style={styles.brandInput}
                    placeholder="Brand"
                    placeholderTextColor={colors.placeholder}
                    value={newDislikedBrand}
                    onChangeText={setNewDislikedBrand}
                  />
                  <TouchableOpacity
                    onPress={async () => {
                      if (!newDislikedCategory.trim() || !newDislikedBrand.trim()) return;
                      const next = { ...dislikedBrands, [newDislikedCategory.trim()]: newDislikedBrand.trim() };
                      setDislikedBrands(next);
                      setNewDislikedCategory('');
                      setNewDislikedBrand('');
                      try {
                        await updateProfile({ brandPreferences: { liked: likedBrands, disliked: next } });
                        Alert.alert('Saved', 'Disliked brand added.');
                      } catch {
                        Alert.alert('Error', 'Could not save.');
                      }
                    }}
                    style={styles.restrictionAddBtn}
                  >
                    <Text style={styles.restrictionAddText}>Add</Text>
                  </TouchableOpacity>
                </View>
                {Object.entries(dislikedBrands).map(([cat, brand]) => (
                  <View key={cat} style={styles.brandTagDisliked}>
                    <Text style={styles.restrictionTagText}>{cat}: {brand}</Text>
                    <TouchableOpacity
                      onPress={async () => {
                        const next = { ...dislikedBrands };
                        delete next[cat];
                        setDislikedBrands(next);
                        try {
                          await updateProfile({ brandPreferences: { liked: likedBrands, disliked: next } });
                        } catch {}
                      }}
                      style={styles.restrictionRemoveBtn}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBtn: {
    padding: spacing.xs,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: fonts.sizeXl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 3,
    marginLeft: spacing.sm,
  },
  menuButton: {
    width: 28,
    height: 22,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  menuIconBar: {
    height: 2,
    width: 20,
    backgroundColor: colors.text,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
    padding: spacing.lg,
    gap: spacing.md,
  },
  welcomeCard: {
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
  mainRow: {
    // no-op; kept for backwards compatibility if needed
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
  },
  sidebar: {
    width: 220,
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    ...shadows.card,
    justifyContent: 'space-between',
  },
  sidebarMain: {
    flex: 1,
    minHeight: 0,
  },
  sidebarFooter: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.xs,
  },
  sidebarProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sidebarProfileIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarProfileIconText: {
    fontSize: fonts.sizeLg,
    fontWeight: '700',
    color: colors.textInverse,
  },
  sidebarProfileName: {
    flex: 1,
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.text,
  },
  sidebarLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sidebarLogoutText: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sidebarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sidebarLogo: {
    fontSize: fonts.sizeXl,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.sm,
  },
  sidebarTitle: {
    fontSize: fonts.sizeSm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  closeButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  closeButtonText: {
    fontSize: fonts.sizeLg,
    color: colors.textSecondary,
  },
  sidebarItem: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: 'transparent',
  },
  sidebarItemActive: {
    backgroundColor: colors.primarySoft,
  },
  sidebarItemText: {
    fontSize: fonts.sizeMd,
    color: colors.textSecondary,
  },
  sidebarItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  sidebarListsSection: {
    marginTop: spacing.lg,
  },
  sidebarListsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sidebarLists: {
    gap: spacing.xs,
  },
  sidebarListItem: {
    paddingVertical: 4,
  },
  sidebarListName: {
    fontSize: fonts.sizeSm,
    fontWeight: '600',
    color: colors.text,
  },
  sidebarListMeta: {
    fontSize: fonts.sizeXs,
    color: colors.textSecondary,
  },
  sidebarListHint: {
    fontSize: fonts.sizeXs,
    color: colors.placeholder,
    marginTop: spacing.xs,
  },
  mainCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
  },
  messagesContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageUser: {
    backgroundColor: colors.primary,
  },
  messageAssistant: {
    backgroundColor: colors.inputBackground,
  },
  messageText: {
    fontSize: fonts.sizeMd,
  },
  messageTextUser: {
    color: colors.textInverse,
  },
  messageTextAssistant: {
    color: colors.text,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  placeholderTitle: {
    fontSize: fonts.sizeLg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  placeholderBody: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  flyersContainer: {
    flex: 1,
  },
  cookbookContainer: {
    flex: 1,
    minHeight: 0,
  },
  cookbookTitle: {
    fontSize: fonts.sizeXl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cookbookSubtitle: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  cookbookScroll: {
    flex: 1,
    minHeight: 0,
  },
  cookbookList: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  recipeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    ...shadows.card,
  },
  recipeCardTitle: {
    fontSize: fonts.sizeLg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeCardDescription: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  recipeCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recipeMetaText: {
    fontSize: fonts.sizeXs,
    color: colors.placeholder,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  recipeCardSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recipeSectionTitle: {
    fontSize: fonts.sizeSm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeBullet: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    marginBottom: 2,
  },
  recipeStep: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  recipeMore: {
    fontSize: fonts.sizeXs,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  flyersList: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  flyerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  flyerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  flyerProduct: {
    flex: 1,
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  flyerPrice: {
    fontSize: fonts.sizeLg,
    fontWeight: '700',
    color: colors.primary,
  },
  flyerBrand: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  flyerSale: {
    fontSize: fonts.sizeSm,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  flyerDates: {
    fontSize: fonts.sizeXs,
    color: colors.textSecondary,
  },
  bottomArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  listDrawer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    ...shadows.card,
  },
  listDrawerExpanded: {
    paddingBottom: spacing.md,
  },
  listHandleRow: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listHandleBar: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.divider,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.text,
  },
  listMeta: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listChevron: {
    fontSize: fonts.sizeLg,
    color: colors.textSecondary,
  },
  listItems: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    gap: 4,
  },
  listItemText: {
    fontSize: fonts.sizeSm,
    color: colors.text,
  },
  listItemHint: {
    fontSize: fonts.sizeXs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sizeMd,
    color: colors.text,
    marginRight: spacing.sm,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButtonText: {
    color: colors.textInverse,
    fontSize: fonts.sizeMd,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: fonts.sizeLg,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalCloseText: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.primary,
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalEmptyText: {
    fontSize: fonts.sizeMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  modalEmptyHint: {
    fontSize: fonts.sizeSm,
    color: colors.placeholder,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  storeName: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.text,
  },
  storeAddress: {
    fontSize: fonts.sizeSm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    flexShrink: 1,
  },
  storeRemoveBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  storeRemoveText: {
    fontSize: fonts.sizeSm,
    fontWeight: '600',
    color: colors.error,
  },
  preferencesSectionTitle: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  restrictionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  restrictionInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sizeMd,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restrictionAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  restrictionAddText: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.textInverse,
  },
  restrictionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  restrictionTagText: {
    fontSize: fonts.sizeMd,
    color: colors.text,
  },
  restrictionRemoveBtn: {
    padding: spacing.xs,
  },
  flyerBrandTabs: {
    marginBottom: spacing.sm,
  },
  flyerBrandTabsContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  flyerBrandTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
  },
  flyerBrandTabActive: {
    backgroundColor: colors.primarySoft,
  },
  flyerBrandTabText: {
    fontSize: fonts.sizeMd,
    color: colors.textSecondary,
  },
  flyerBrandTabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  addStoreSection: {
    marginBottom: spacing.md,
  },
  addStoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addStoreInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sizeMd,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addStoreBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  addStoreBtnText: {
    fontSize: fonts.sizeMd,
    fontWeight: '600',
    color: colors.textInverse,
  },
  nearbyStoresList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  nearbyStoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nearbyStoreCardTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  nearbyStoreAdd: {
    fontSize: fonts.sizeSm,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 'auto',
  },
  brandRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.sizeMd,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTagLiked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandTagDisliked: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(231,76,60,0.15)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
});

