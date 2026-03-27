import React, { useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import {
  Keyboard,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  UIManager,
  View,
  Text as RNText,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import AccountGuard from '@/components/AccountGuard';
import { TabSearchProvider, useTabSearch } from '@/components/TabSearchContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
  },

  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
    lineHeight: 24,
    textShadowColor: 'rgba(15, 23, 42, 0.10)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  searchFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.55)',
    paddingHorizontal: 12,
    marginRight: 8,
  },

  searchInputExpanded: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    color: '#0f172a',
    paddingVertical: 0,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 18,
    flexShrink: 0,
  },

  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },

  searchIconLeading: {
    marginRight: 12,
  },

  closeSearchLeading: {
    marginRight: 12,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },

  dropdownPanel: {
    width: 210,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 12,
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  dropdownItemIconSlot: {
    width: 22,
    alignItems: 'center',
  },

  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },

  dropdownItemTextDanger: {
    color: '#b91c1c',
  },

  dropdownItemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(229, 231, 235, 1)',
    marginLeft: 16,
  },

  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },

  menuModalRoot: {
    flex: 1,
  },
});

const headerBgStyles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.35)',
  },
});

/* -------------------------------------------------------------------------- */
/*                               TAB BAR ICON                                 */
/* -------------------------------------------------------------------------- */

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { name, color, focused } = props;
  return (
    <View
      style={[
        tabBarIconStyles.slot,
        focused && {
          backgroundColor: isDark ? 'rgba(147, 197, 253, 0.16)' : 'rgba(37, 99, 235, 0.12)',
        },
      ]}>
      <FontAwesome name={name} size={22} color={color} />
    </View>
  );
}

const tabBarIconStyles = StyleSheet.create({
  slot: {
    width: 48,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* -------------------------------------------------------------------------- */
/*                              HEADER - LEFT                                 */
/* -------------------------------------------------------------------------- */

function TabHeaderLeft() {
  return (
    <View style={headerStyles.container}>
      <RNText style={headerStyles.appName}>Locatify</RNText>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HEADER - RIGHT                                */
/* -------------------------------------------------------------------------- */

function TabHeaderRight({ routeName }: { routeName: string }) {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const {
    getQueryForRoute,
    setQueryForRoute,
    headerSearchOpen,
    setHeaderSearchOpen,
  } = useTabSearch();
  const query = getQueryForRoute(routeName);
  const searchInputRef = useRef<TextInput>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const profileAnchorRef = useRef<View>(null);

  const panelWidth = 210;
  const margin = 12;

  const searchFieldWidth = Math.min(248, Math.max(150, windowWidth * 0.42));

  const placeholder =
    routeName === 'index'
      ? 'Search saved addresses'
      : routeName === 'two'
        ? 'Search pinned places'
        : 'Search';

  const triggerHeaderLayoutAnimation = () => {
    LayoutAnimation.configureNext({
      duration: 280,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
  };

  const openSearch = () => {
    triggerHeaderLayoutAnimation();
    setHeaderSearchOpen(true);
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    triggerHeaderLayoutAnimation();
    setHeaderSearchOpen(false);
  };

  useEffect(() => {
    if (!headerSearchOpen) return;
    const t = setTimeout(() => searchInputRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [headerSearchOpen]);

  const openOrToggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    if (headerSearchOpen) {
      Keyboard.dismiss();
      setHeaderSearchOpen(false);
    }
    requestAnimationFrame(() => {
      profileAnchorRef.current?.measureInWindow((x, y, w, h) => {
        setAnchor({ x, y, width: w, height: h });
        setMenuOpen(true);
      });
    });
  };

  const alignedLeft = anchor.x + anchor.width - panelWidth;
  const dropdownTop = anchor.y + anchor.height + 6;
  const dropdownLeft = Math.max(margin, Math.min(alignedLeft, windowWidth - panelWidth - margin));

  return (
    <View style={headerStyles.right}>
      <View style={headerStyles.headerRightRow}>
        {!headerSearchOpen ? (
          <Pressable
            style={[headerStyles.iconActionButton, headerStyles.searchIconLeading]}
            onPress={openSearch}
            accessibilityRole="button"
            accessibilityLabel="Open search">
            <FontAwesome name="search" size={18} color="#0f172a" />
          </Pressable>
        ) : (
          <>
            <View style={[headerStyles.searchFieldRow, { width: searchFieldWidth }]}>
              <FontAwesome name="search" size={14} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                ref={searchInputRef}
                value={query}
                onChangeText={(t) => setQueryForRoute(routeName, t)}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
                style={headerStyles.searchInputExpanded}
                returnKeyType="search"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
            <Pressable
              style={[headerStyles.iconActionButton, headerStyles.closeSearchLeading]}
              onPress={closeSearch}
              accessibilityRole="button"
              accessibilityLabel="Close search">
              <FontAwesome name="times" size={18} color="#64748b" />
            </Pressable>
          </>
        )}

        <View ref={profileAnchorRef} collapsable={false}>
          <Pressable style={headerStyles.profileButton} onPress={openOrToggleMenu}>
            <FontAwesome name="user" size={18} color="#0f172a" />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuOpen(false)}>
        <View style={headerStyles.menuModalRoot} pointerEvents="box-none">
          <Pressable style={headerStyles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View
            style={[
              headerStyles.dropdownPanel,
              {
                position: 'absolute',
                top: dropdownTop,
                left: dropdownLeft,
              },
            ]}
            pointerEvents="box-none">
            <Pressable
              style={({ pressed }) => [headerStyles.dropdownItem, pressed && { backgroundColor: '#f8fafc' }]}
              onPress={() => {
                setMenuOpen(false);
                router.push('/profile');
              }}>
              <View style={headerStyles.dropdownItemIconSlot}>
                <FontAwesome name="user" size={16} color="#2563eb" />
              </View>
              <RNText style={headerStyles.dropdownItemText}>Profile</RNText>
            </Pressable>

            <View style={headerStyles.dropdownItemDivider} />

            <Pressable
              style={({ pressed }) => [headerStyles.dropdownItem, pressed && { backgroundColor: '#fef2f2' }]}
              onPress={() => {
                setMenuOpen(false);
                router.replace('/login');
              }}>
              <View style={headerStyles.dropdownItemIconSlot}>
                <FontAwesome name="sign-out" size={16} color="#ef4444" />
              </View>
              <RNText style={[headerStyles.dropdownItemText, headerStyles.dropdownItemTextDanger]}>Logout</RNText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               TAB LAYOUT                                   */
/* -------------------------------------------------------------------------- */

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const tabBarBottomPad = Math.max(insets.bottom, 10);

  return (
    <AccountGuard required="user">
      <TabSearchProvider>
        <Tabs
          screenOptions={({ route }) => ({
            tabBarActiveTintColor: theme.tint,
            tabBarInactiveTintColor: theme.tabIconDefault,
            tabBarHideOnKeyboard: true,
            tabBarShowLabel: true,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.2,
              marginTop: 4,
            },
            tabBarStyle: {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: isDark ? 'rgba(51, 65, 85, 0.9)' : 'rgba(226, 232, 240, 0.95)',
              paddingTop: 8,
              paddingBottom: tabBarBottomPad,
              minHeight: 56 + tabBarBottomPad,
              ...Platform.select({
                ios: {
                  shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: isDark ? 0.35 : 0.06,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 12,
                },
                default: {},
              }),
            },
            tabBarItemStyle: {
              paddingTop: 4,
            },
            headerShown: useClientOnlyValue(false, true),
            headerTitle: '',
            headerLeft: () => <TabHeaderLeft />,
            headerRight: () => <TabHeaderRight routeName={route.name} />,
            headerBackground: () => <View style={headerBgStyles.wrap} />,
            headerStyle: {
              backgroundColor: 'transparent',
              height: 104,
            },
            headerShadowVisible: false,
          })}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'My Loc',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name="bookmark" color={color} focused={focused} />
              ),
            }}
          />

          <Tabs.Screen
            name="two"
            options={{
              title: 'Pin Loc',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name="map-pin" color={color} focused={focused} />
              ),
            }}
          />
        </Tabs>
      </TabSearchProvider>
    </AccountGuard>
  );
}
