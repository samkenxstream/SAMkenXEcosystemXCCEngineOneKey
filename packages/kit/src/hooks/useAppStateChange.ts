import { useEffect, useRef } from 'react';

import { AppState, DeviceEventEmitter } from 'react-native';

import debugLogger from '@onekeyhq/shared/src/logger/debugLogger';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import type { AppStateStatus, NativeEventSubscription } from 'react-native';

export const isFromBackgroundToForeground = (
  currentState: AppStateStatus,
  nextAppState: AppStateStatus,
) => {
  if (platformEnv.isNative) {
    return !!(
      /inactive|background/.exec(currentState) && nextAppState === 'active'
    );
  }

  return false;
};

export const useAppStateChange = (
  onHandler: (state: AppStateStatus) => void | undefined,
  options?: {
    unFilter?: boolean;
  },
) => {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    let listener: NativeEventSubscription | undefined;

    const onCall = (nextState: AppStateStatus) => {
      debugLogger.common.debug(
        `AppState changed callback trigger from: ${appState.current} , to: ${nextState}`,
      );
      if (
        options?.unFilter ||
        isFromBackgroundToForeground(appState.current, nextState)
      ) {
        onHandler?.(nextState);
      }
      appState.current = nextState;
    };

    if (platformEnv.isNativeIOS) {
      listener = AppState.addEventListener('change', onCall);
    } else if (platformEnv.isNativeAndroid) {
      listener = DeviceEventEmitter.addListener('android_lifecycle', onCall);
    }

    return () => {
      listener?.remove?.();
    };
  }, [options?.unFilter, onHandler]);
};
