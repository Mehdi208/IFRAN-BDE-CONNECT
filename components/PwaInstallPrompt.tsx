import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (standaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if recently dismissed in the last 3 days
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
    if (dismissedAt) {
      const timeDiff = Date.now() - Number(dismissedAt);
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (timeDiff < threeDaysMs) {
        return;
      }
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);

    if (isIOSDevice) {
      setIsIOS(true);
      // Show prompt on iOS Safari after a short 3-second delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Chrome / Edge beforeinstallprompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 2.5 seconds after page load before showing the banner to let user see the content first
      setTimeout(() => {
        setIsVisible(true);
      }, 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Track successful install
    const handleAppInstalled = () => {
      setIsVisible(false);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      localStorage.setItem('pwa_installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsVisible(false);
        setInstalledSuccess(true);
      } else {
        handleDismiss();
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Erreur lors de l’installation PWA:', err);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed_at', Date.now().toString());
  };

  // Do not render anything if running as installed app or not visible
  if (isStandalone || (!isVisible && !installedSuccess)) {
    return null;
  }

  // Toast confirmation after install
  if (installedSuccess) {
    return (
      <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-emerald-950/95 border border-emerald-600/80 text-emerald-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
        <div className="text-xs">
          <div className="font-bold text-white">Application installée avec succès !</div>
          <div className="text-emerald-200/80 mt-0.5">
            Retrouvez BDE IFRAN directement sur votre écran d'accueil.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-50 bg-slate-900/95 dark:bg-[#0f172a]/95 text-white p-4 rounded-2xl border border-slate-700/80 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src="icon-192.png"
              alt="BDE IFRAN"
              className="w-12 h-12 rounded-xl object-cover border border-rose-500/40 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-bde-rose rounded-full flex items-center justify-center text-[9px] text-white font-bold">
              ✓
            </span>
          </div>
          <div className="min-w-0">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-bde-rose bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-800/50 mb-0.5">
              Application Officielle
            </span>
            <h4 id="pwa-install-title" className="text-sm font-extrabold text-white truncate">
              Installer BDE IFRAN
            </h4>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="Fermer"
          aria-label="Fermer la notification d'installation"
        >
          <X size={17} />
        </button>
      </div>

      <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
        {isIOS
          ? "Accédez au site en 1 clic sans passer par votre navigateur ni chercher le lien."
          : "Installez l'application sur votre téléphone ou PC pour y accéder en 1 clic sans chercher le lien !"}
      </p>

      {/* Instructions for iOS Safari */}
      {isIOS ? (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Share size={14} className="shrink-0" />
            <span>Comment installer sur iPhone / iPad :</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
            <li>
              Appuyez sur le bouton <strong>Partager</strong> en bas de Safari (<Share size={12} className="inline mx-0.5 text-blue-400" />).
            </li>
            <li>
              Sélectionnez <strong>« Sur l'écran d'accueil »</strong> (icône ➕).
            </li>
          </ol>
          <div className="pt-1 text-right">
            <button
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-white font-semibold underline"
            >
              C'est compris
            </button>
          </div>
        </div>
      ) : (
        /* Action buttons for Android / Desktop */
        <div className="mt-3.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            Plus tard
          </button>

          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 text-xs font-bold bg-bde-rose hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download size={14} />
            <span>Installer l'App</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PwaInstallPrompt;
