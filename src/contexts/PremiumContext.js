import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { getPremium, setPremiumUnlocked } from '../utils/storage';

// IAP module is lazy-loaded — Expo Go doesn't support native modules.
// In dev builds / production it loads normally.
let IAP = null;
try {
  // eslint-disable-next-line global-require
  IAP = require('react-native-iap');
} catch (e) {
  IAP = null;
}

// Product identifier — must match the IAP product configured in
// App Store Connect / Google Play Console.
export const PREMIUM_PRODUCT_ID = 'com.hqelektrotechnik.app.premium_unlock';
export const PREMIUM_PRICE_FALLBACK = '9,99 €';

// Versions before this one were sold as a paid app for 9,99 €.
// Anyone whose original App Store purchase predates 1.1.0 already
// paid for the app and gets premium for free (legacy grandfather rule).
const FREEMIUM_PIVOT_VERSION = '1.1.0';

// Compare two semver-ish strings ("1.0.1" vs "1.1.0") → -1 / 0 / 1
function compareVersions(a, b) {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const ai = pa[i] ?? 0;
    const bi = pb[i] ?? 0;
    if (ai > bi) return 1;
    if (ai < bi) return -1;
  }
  return 0;
}

const PremiumContext = createContext({
  isPremium: false,
  isLoading: true,
  priceLabel: PREMIUM_PRICE_FALLBACK,
  iapAvailable: false,
  purchase: async () => false,
  restore: async () => false,
  setPremiumDev: () => {},
});

export function PremiumProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [priceLabel, setPriceLabel] = useState(PREMIUM_PRICE_FALLBACK);
  const [iapAvailable, setIapAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const purchaseListener = useRef(null);
  const errorListener = useRef(null);

  // ---- Load persisted state on mount ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getPremium();
      if (!cancelled) {
        setIsPremium(!!stored.unlocked);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Init IAP, fetch products, set up listeners ----
  useEffect(() => {
    if (!IAP) return;
    let mounted = true;

    (async () => {
      try {
        await IAP.initConnection();
        if (!mounted) return;
        setConnected(true);
        setIapAvailable(true);

        // Fetch product info to display localized price
        try {
          const result = await IAP.fetchProducts({
            skus: [PREMIUM_PRODUCT_ID],
            type: 'in-app',
          });
          // Some versions return the array, some return undefined and store internally
          const products = Array.isArray(result) ? result : (result?.products || []);
          const product = products.find((p) => p.productId === PREMIUM_PRODUCT_ID || p.id === PREMIUM_PRODUCT_ID);
          if (product && mounted) {
            const label = product.localizedPrice || product.displayPrice || product.price;
            if (label) setPriceLabel(label);
          }
        } catch (e) {
          // Products may not be set up yet — keep fallback price
          console.warn('fetchProducts failed:', e?.message || e);
        }

        // Listen for successful purchases
        purchaseListener.current = IAP.purchaseUpdatedListener(async (purchase) => {
          try {
            const productId = purchase?.productId || purchase?.id;
            if (productId === PREMIUM_PRODUCT_ID) {
              await setPremiumUnlocked(true);
              setIsPremium(true);
            }
            // Always finish the transaction
            await IAP.finishTransaction({
              purchase,
              isConsumable: false,
            }).catch(() => {});
          } catch (err) {
            console.warn('purchaseUpdated handling failed:', err);
          }
        });

        // Listen for errors (user cancelled etc.)
        errorListener.current = IAP.purchaseErrorListener((err) => {
          // Silently ignore user-cancelled errors
          if (err?.code === 'E_USER_CANCELLED') return;
          console.warn('purchaseError:', err);
        });

        // ---- Legacy grandfather rule (iOS only) ----
        // Anyone who bought the app before it became freemium gets premium
        // for free. We check the App Store receipt's originalAppVersion.
        if (Platform.OS === 'ios' && !isPremium) {
          try {
            if (typeof IAP.getAppTransactionIOS === 'function') {
              const tx = await IAP.getAppTransactionIOS();
              const originalAppVersion = tx?.originalAppVersion;
              if (
                originalAppVersion &&
                compareVersions(originalAppVersion, FREEMIUM_PIVOT_VERSION) < 0
              ) {
                await setPremiumUnlocked(true);
                if (mounted) setIsPremium(true);
              }
            }
          } catch (e) {
            // Best effort – don't block the app if receipt is unavailable
            console.warn('getAppTransactionIOS failed:', e?.message || e);
          }
        }
      } catch (e) {
        console.warn('IAP initConnection failed:', e?.message || e);
        if (mounted) setIapAvailable(false);
      }
    })();

    return () => {
      mounted = false;
      try { purchaseListener.current?.remove(); } catch {}
      try { errorListener.current?.remove(); } catch {}
      if (IAP && connected) {
        IAP.endConnection().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const purchase = useCallback(async () => {
    if (!IAP || !iapAvailable) {
      Alert.alert(
        'Käufe nicht verfügbar',
        'In-App-Käufe sind auf diesem Gerät derzeit nicht verfügbar. Bitte versuche es später erneut.'
      );
      return false;
    }
    try {
      // react-native-iap v15: platform key must be nested under 'apple' / 'google'
      await IAP.requestPurchase({
        request: Platform.OS === 'ios'
          ? { apple: { sku: PREMIUM_PRODUCT_ID } }
          : { google: { skus: [PREMIUM_PRODUCT_ID] } },
        type: 'in-app',
      });
      // Resolution happens in purchaseUpdatedListener.
      // Return true to signal that the sheet was shown (not that purchase is done).
      return true;
    } catch (e) {
      // null = user intentionally cancelled → no error alert
      if (e?.code === 'E_USER_CANCELLED') return null;
      console.warn('purchase failed:', e?.message || e);
      return false;
    }
  }, [iapAvailable]);

  const restore = useCallback(async () => {
    if (!IAP || !iapAvailable) {
      // Fall back to local state if IAP isn't available
      const stored = await getPremium();
      setIsPremium(!!stored.unlocked);
      return !!stored.unlocked;
    }
    try {
      // getAvailablePurchases returns past non-consumable purchases
      const result = await IAP.getAvailablePurchases();
      const purchases = Array.isArray(result) ? result : (result?.purchases || []);
      const hasPremium = purchases.some((p) =>
        (p.productId === PREMIUM_PRODUCT_ID) || (p.id === PREMIUM_PRODUCT_ID)
      );
      if (hasPremium) {
        await setPremiumUnlocked(true);
        setIsPremium(true);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('restore failed:', e);
      return false;
    }
  }, [iapAvailable]);

  const setPremiumDev = useCallback(async (unlocked) => {
    await setPremiumUnlocked(unlocked);
    setIsPremium(!!unlocked);
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        priceLabel,
        iapAvailable,
        purchase,
        restore,
        setPremiumDev,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
