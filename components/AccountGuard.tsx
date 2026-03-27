import { type Href, useRouter } from 'expo-router';
import { PropsWithChildren, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getAccountType } from '@/store/session';

type AccountGuardProps = PropsWithChildren<{
  required: 'user' | 'delivery';
}>;

export default function AccountGuard({ required, children }: AccountGuardProps) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  const enforceAccess = useCallback(() => {
    const accountType = getAccountType();
    if (!accountType) {
      router.replace('/login');
      setIsAllowed(false);
      return;
    }

    const allowed =
      required === 'delivery'
        ? accountType === 'delivery'
        : accountType === required;

    if (!allowed) {
      const destination: Href =
        accountType === 'delivery' ? '/delivery-search' : '/(tabs)';
      router.replace(destination);
      setIsAllowed(false);
      return;
    }

    setIsAllowed(true);
  }, [required, router]);

  useFocusEffect(enforceAccess);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}

