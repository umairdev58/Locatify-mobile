import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useToast } from '@/components/ToastProvider';
import AddressCardSkeleton from '@/components/AddressCardSkeleton';
import { getMyAddresses, AddressResponse } from '@/api/address';
import {
  getIncomingShares,
  getOutgoingShares,
  acceptShare,
  declineShare,
  type AddressShareResponse,
} from '@/api/share';
import { useTabSearch } from '@/components/TabSearchContext';

function matchesQuery(q: string, ...parts: (string | undefined)[]) {
  const n = q.trim().toLowerCase();
  if (!n) return true;
  const hay = parts.filter(Boolean).join(' ').toLowerCase();
  return hay.includes(n);
}

export default function SharedAddressTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { sharedLocQuery } = useTabSearch();

  const [loading, setLoading] = useState(false);
  const [incoming, setIncoming] = useState<AddressShareResponse[]>([]);
  const [outgoing, setOutgoing] = useState<AddressShareResponse[]>([]);
  const [allAddresses, setAllAddresses] = useState<AddressResponse[]>([]);
  const [actingId, setActingId] = useState<string | null>(null);

  const sharedOnly = useMemo(
    () => allAddresses.filter((a) => a.sharedFromUser != null),
    [allAddresses],
  );

  const q = sharedLocQuery.trim().toLowerCase();

  const pendingFiltered = useMemo(() => {
    if (!q) return incoming;
    return incoming.filter((s) => {
      const src = s.sourceAddress;
      return matchesQuery(
        q,
        s.fromUser?.name,
        s.fromUser?.email,
        src?.cardName,
        src?.fullTextAddress,
        src?.publicCode,
      );
    });
  }, [incoming, q]);

  const sharedFiltered = useMemo(() => {
    if (!q) return sharedOnly;
    return sharedOnly.filter((a) =>
      matchesQuery(
        q,
        a.cardName,
        a.fullTextAddress,
        typeof a.sharedFromUser === 'object' ? a.sharedFromUser?.name : undefined,
        a.publicCode,
      ),
    );
  }, [sharedOnly, q]);

  const outgoingFiltered = useMemo(() => {
    if (!q) return outgoing;
    return outgoing.filter((s) =>
      matchesQuery(
        q,
        s.toUser?.name,
        s.toUser?.email,
        s.sourceAddress?.cardName,
        s.status,
      ),
    );
  }, [outgoing, q]);

  const load = useCallback(() => {
    let canceled = false;
    setLoading(true);
    Promise.all([getIncomingShares(), getOutgoingShares(), getMyAddresses()])
      .then(([inc, out, addresses]) => {
        if (canceled) return;
        setIncoming(inc ?? []);
        setOutgoing(out ?? []);
        setAllAddresses(addresses ?? []);
      })
      .catch((e) => {
        if (canceled) return;
        showToast(e instanceof Error ? e.message : 'Unable to load shared data', 'error');
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });
    return () => {
      canceled = true;
    };
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      return load();
    }, [load]),
  );

  const onAccept = async (shareId: string) => {
    setActingId(shareId);
    try {
      await acceptShare(shareId);
      showToast('Address saved to Shared address', 'success');
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not accept', 'error');
    } finally {
      setActingId(null);
    }
  };

  const onDecline = async (shareId: string) => {
    setActingId(shareId);
    try {
      await declineShare(shareId);
      showToast('Invitation declined', 'success');
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not decline', 'error');
    } finally {
      setActingId(null);
    }
  };

  const openAddressDetail = (item: AddressResponse) => {
    router.push({
      pathname: '/address-detail',
      params: {
        address: item.fullTextAddress,
        landmark: item.landmark ?? '',
        notes: item.notes ?? '',
        lat: item.location.latitude.toString(),
        lng: item.location.longitude.toString(),
        code: item.publicCode,
        name: item.cardName,
        addressId: item._id,
        mode: 'user',
        readOnly: '1',
        houseImages: JSON.stringify(item.houseImages ?? []),
      },
    });
  };

  const empty =
    !loading &&
    pendingFiltered.length === 0 &&
    sharedFiltered.length === 0 &&
    outgoingFiltered.length === 0;

  const fabBottom = 20 + insets.bottom;

  return (
    <View style={styles.root}>
      <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
        <View style={styles.savedCountBar}>
          <FontAwesome name="share-alt" size={16} color="#2563eb" style={styles.savedCountIcon} />
          <Text style={styles.savedCountText}>
            {loading
              ? 'Loading…'
              : `${pendingFiltered.length} pending · ${sharedFiltered.length} saved`}
          </Text>
        </View>

        {loading ? (
          <ScrollView contentContainerStyle={styles.listContentPadded} showsVerticalScrollIndicator={false}>
            {[1, 2, 3].map((k) => (
              <AddressCardSkeleton key={k} />
            ))}
          </ScrollView>
        ) : empty ? (
          <View style={styles.emptyCard}>
            <FontAwesome name="inbox" size={28} color="#2563eb" />
            <Text style={[styles.emptyText, { color: '#1f2937' }]}>No shared addresses yet</Text>
            <Text style={[styles.emptySubText, { color: '#6b7280' }]}>
              When someone shares a card with your email, it will appear here. You can also share from
              My Loc using “Share with Locatify user”.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.listContentPadded, { paddingBottom: fabBottom + 24 }]}
            showsVerticalScrollIndicator={false}>
            {pendingFiltered.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Invitations</Text>
                {pendingFiltered.map((s) => {
                  const src = s.sourceAddress;
                  const busy = actingId === s._id;
                  return (
                    <View key={s._id} style={styles.inviteCard}>
                      <Text style={styles.inviteFrom}>
                        From <Text style={styles.inviteFromName}>{s.fromUser?.name ?? 'Someone'}</Text>
                      </Text>
                      <Text style={styles.inviteCardName}>{src?.cardName ?? 'Address card'}</Text>
                      <Text style={styles.invitePreview} numberOfLines={2}>
                        {src?.fullTextAddress ?? ''}
                      </Text>
                      <View style={styles.inviteActions}>
                        <Pressable
                          style={[styles.inviteBtn, styles.declineBtn]}
                          onPress={() => onDecline(s._id)}
                          disabled={busy}>
                          <Text style={styles.declineBtnText}>Decline</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.inviteBtn, styles.acceptBtn]}
                          onPress={() => onAccept(s._id)}
                          disabled={busy}>
                          {busy ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.acceptBtnText}>Accept</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {sharedFiltered.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shared with you</Text>
                {sharedFiltered.map((item) => {
                  const bannerImage = item.houseImages?.[0] || null;
                  const fromName =
                    typeof item.sharedFromUser === 'object' && item.sharedFromUser?.name
                      ? item.sharedFromUser.name
                      : 'Friend';
                  return (
                    <Pressable
                      key={item._id}
                      style={styles.addressCard}
                      onPress={() => openAddressDetail(item)}>
                      <View style={styles.bannerContainer}>
                        {bannerImage ? (
                          <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
                        ) : (
                          <View style={[styles.bannerImage, styles.bannerPlaceholder]}>
                            <FontAwesome name="home" size={40} color="#9ca3af" />
                          </View>
                        )}
                        <View style={styles.bannerOverlay}>
                          <Text style={styles.bannerLocationName}>{item.cardName || 'Home'}</Text>
                        </View>
                      </View>
                      <View style={styles.sharedMeta}>
                        <FontAwesome name="user" size={12} color="#64748b" />
                        <Text style={styles.sharedMetaText}>From {fromName}</Text>
                      </View>
                      <Text style={styles.cardAddressLine} numberOfLines={2}>
                        {item.fullTextAddress}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {outgoingFiltered.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>You&apos;ve shared</Text>
                {outgoingFiltered.map((s) => (
                  <View key={s._id} style={styles.outRow}>
                    <View style={styles.outRowText}>
                      <Text style={styles.outCardName} numberOfLines={1}>
                        {s.sourceAddress?.cardName ?? 'Address'}
                      </Text>
                      <Text style={styles.outTo} numberOfLines={1}>
                        → {s.toUser?.email ?? s.toUser?.name ?? 'Recipient'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.outStatus,
                        s.status === 'pending' && styles.outStatusPending,
                        s.status === 'accepted' && styles.outStatusOk,
                        s.status === 'declined' && styles.outStatusNo,
                      ]}>
                      {s.status}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
  },
  scroll: { flex: 1 },
  savedCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedCountIcon: { marginRight: 8 },
  savedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  listContentPadded: {
    flexGrow: 1,
    paddingBottom: 88,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  inviteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inviteFrom: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  inviteFromName: {
    fontWeight: '700',
    color: '#0f172a',
  },
  inviteCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  invitePreview: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
  },
  inviteActions: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  inviteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: '#f1f5f9',
  },
  declineBtnText: {
    fontWeight: '600',
    color: '#475569',
  },
  acceptBtn: {
    backgroundColor: '#2563eb',
  },
  acceptBtnText: {
    fontWeight: '700',
    color: '#fff',
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bannerContainer: {
    height: 140,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  bannerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerLocationName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  sharedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  sharedMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  cardAddressLine: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 6,
    fontSize: 14,
    color: '#64748b',
  },
  outRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  outRowText: { flex: 1, marginRight: 8 },
  outCardName: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 15,
  },
  outTo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  outStatus: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  outStatusPending: { color: '#d97706' },
  outStatusOk: { color: '#16a34a' },
  outStatusNo: { color: '#dc2626' },
  emptyCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderStyle: 'dotted',
    borderWidth: 1.2,
    borderColor: '#94a3ff',
    backgroundColor: '#eef2ff',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
