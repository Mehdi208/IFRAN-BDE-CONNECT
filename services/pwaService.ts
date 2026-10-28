export interface PwaInstallState {
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
}

// Track deferred prompt globally at the window level
let deferredPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    localStorage.setItem('pwa_installed', 'true');
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export const isPwaInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
  return isStandalone;
};

export const getPwaState = (): PwaInstallState => {
  const isInstalled = isPwaInstalled();
  const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(ua) && !(window as any)?.MSStream;
  const canInstall = !isInstalled;
  return { isInstalled, canInstall, isIOS };
};

export const installPwa = async (): Promise<'accepted' | 'dismissed' | 'ios' | 'manual'> => {
  if (isPwaInstalled()) return 'accepted';

  const { isIOS } = getPwaState();
  if (isIOS) {
    return 'ios';
  }

  if (deferredPrompt) {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem('pwa_installed', 'true');
        deferredPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-installed'));
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  }

  return 'manual';
};
