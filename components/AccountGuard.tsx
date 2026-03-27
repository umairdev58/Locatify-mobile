import { useRouter } from 'expo-router';
import { PropsWithChildren, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { getAccountType } from '@/store/session';

type AccountGuardProps = PropsWithChildren<{
  required: 'user' | 'delivery' | 'rider';
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
        ? accountType === 'delivery' || accountType === 'rider'
        : accountType === required;

    if (!allowed) {
      let destination: string = '/(tabs)';
      if (accountType === 'delivery' || accountType === 'rider') {
        destination = '/delivery-search';
      }
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

