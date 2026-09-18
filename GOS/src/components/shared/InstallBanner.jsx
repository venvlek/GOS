import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { C } from '../../lib/theme';

const DISMISS_KEY = 'gos-install-dismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Browsers don't reliably prompt people to install a PWA on their own —
// Chrome/Android sometimes does, unpredictably; Safari/iOS never does at
// all (Apple doesn't allow it). This banner handles both: a real "Install"
// button where the browser supports it, plain instructions where it
// doesn't. Dismissing it is remembered per-device (a UI preference, not
// app data, so plain localStorage is the right tool here).
export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [standalone] = useState(() => { try { return isStandalone(); } catch { return false; } });
  const ios = (() => { try { return isIOS(); } catch { return false; } })();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (standalone || dismissed) return null;
  if (!deferredPrompt && !ios) return null; // nothing installable to offer right now

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5" style={{ background: C.green, color: '#fff' }}>
      <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
        {deferredPrompt ? (
          'Install this app on your device for quicker access.'
        ) : (
          <span className="inline-flex items-center gap-1 flex-wrap">
            Install this app: tap <Share size={12} /> Share, then "Add to Home Screen."
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {deferredPrompt && (
          <button onClick={install} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#fff', color: C.green }}>
            <Download size={12} /> Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss"><X size={14} color="#fff" /></button>
      </div>
    </div>
  );
}
