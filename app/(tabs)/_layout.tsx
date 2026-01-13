import React, { useCallback, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  View,
  Alert,
  Text as RNText,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import AccountGuard from '@/components/AccountGuard';
import { getMyAddresses } from '@/api/address';

/* -------------------------------------------------------------------------- */
/*                                   STYLES                                   */
/* -------------------------------------------------------------------------- */

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  gradientBar: {
    width: 4,
    height: 42,
    borderRadius: 2,
    marginRight: 12,
  },

  textContainer: {
    justifyContent: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
  },

  caption: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/* -------------------------------------------------------------------------- */
/*                               TAB BAR ICON                                 */
/* -------------------------------------------------------------------------- */

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={26} {...props} />;
}

/* -------------------------------------------------------------------------- */
/*                              HEADER - LEFT                                 */
/* -------------------------------------------------------------------------- */

function LocationsHeaderLeft() {
  const [addressCount, setAddressCount] = useState(0);

  const fetchAddressCount = useCallback(() => {
    getMyAddresses()
      .then((res) => setAddressCount(res?.length ?? 0))
      .catch(() => setAddressCount(0));
  }, []);

  useFocusEffect(fetchAddressCount);

  return (
    <View style={headerStyles.container}>
      <LinearGradient
        colors={['#3b82f6', '#06b6d4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={headerStyles.gradientBar}
      />

      <View style={headerStyles.textContainer}>
        <RNText style={headerStyles.title}>My Locations</RNText>
        <RNText style={headerStyles.caption}>
          {addressCount} {addressCount === 1 ? 'address' : 'addresses'} saved
        </RNText>
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HEADER - RIGHT                                */
/* -------------------------------------------------------------------------- */

function LocationsHeaderRight() {
  const router = useRouter();

  return (
    <View style={headerStyles.right}>
      <Pressable
        style={headerStyles.iconButton}
        onPress={() => Alert.alert('Settings', 'Settings coming soon')}>
        <FontAwesome name="gear" size={17} color="#4b5563" />
      </Pressable>

      <Pressable
        style={headerStyles.logoutIcon}
        onPress={() => router.replace('/login')}>
        <FontAwesome name="sign-out" size={16} color="#ef4444" />
      </Pressable>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               TAB LAYOUT                                   */
/* -------------------------------------------------------------------------- */

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AccountGuard required="user">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: useClientOnlyValue(false, true),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            headerTitle: '',
            headerLeft: () => <LocationsHeaderLeft />,
            headerRight: () => <LocationsHeaderRight />,

            headerStyle: {
              backgroundColor: '#ffffff',
              height: 92,

              // OPTIONAL POLISH 👇
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
            },

            headerShadowVisible: false,

            tabBarIcon: ({ color }) => (
              <TabBarIcon name="bookmark" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="two"
          options={{
            title: 'Forgot Places',
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="lock" color={color} />
            ),
          }}
        />
      </Tabs>
    </AccountGuard>
  );
}
