import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, ShoppingCart, XCircle, KeyRound, Mail } from 'lucide-react';
import cartService, { BuildStoreCartResponse, StoreCredentialStatus } from '@/services/cartService';

// Empire-family stores all order via Voila and require login credentials
const CREDENTIAL_STORES = ['voila', 'sobeys', 'safeway', 'freshco', 'foodland'];

// Metro uses async Playwright job (like Voila) but no credentials needed
const METRO_STORES = ['metro'];

interface BuildCartModalProps {
  open: boolean;
  onClose: () => void;
  groceryListId: string;
  sessionId: string;
  storeKey: string;
  storeName: string;
  itemQuantities?: Record<string, number>;
}

type Step = 'checking' | 'credentials' | 'confirm' | 'voila_progress' | 'metro_progress' | 'verification' | 'result';

// Status messages for the Voila progress step
const VOILA_STATUS_MESSAGES: Record<string, string> = {
  starting: 'Starting cart build...',
  logging_in: 'Logging into Voila... This may take 15-30 seconds.',
  verifying: 'Verifying code...',
  building_cart: 'Adding items to your Voila cart...',
};

// Status messages for the Metro progress step
const METRO_STATUS_MESSAGES: Record<string, string> = {
  starting: 'Starting Metro cart build...',
  setting_up: 'Setting up Metro session... This may take 15-30 seconds.',
  building_cart: 'Adding items to your Metro cart...',
};

export default function BuildCartModal({
  open,
  onClose,
  groceryListId,
  sessionId,
  storeKey,
  storeName,
  itemQuantities,
}: BuildCartModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BuildStoreCartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('checking');

  // Credential form state
  const [credStatus, setCredStatus] = useState<StoreCredentialStatus | null>(null);
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);

  // Voila job polling state
  const [voilaJobId, setVoilaJobId] = useState<string | null>(null);
  const [voilaStatus, setVoilaStatus] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [submittingCode, setSubmittingCode] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Metro job polling state
  const [metroStatus, setMetroStatus] = useState<string>('');
  const metroPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canonicalKey = storeKey.split('::')[0].toLowerCase().replace(/[^a-z]/g, '');
  const needsCredentials = CREDENTIAL_STORES.includes(canonicalKey);
  const isMetro = METRO_STORES.includes(canonicalKey);
  const orderStoreName = needsCredentials ? 'Voila' : storeName;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (metroPollRef.current) clearInterval(metroPollRef.current);
    };
  }, []);

  // Check credential status when modal opens
  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setCredEmail('');
    setCredPassword('');
    setVerificationCode('');
    setVoilaJobId(null);
    setVoilaStatus('');
    setMetroStatus('');
    if (pollRef.current) clearInterval(pollRef.current);
    if (metroPollRef.current) clearInterval(metroPollRef.current);

    if (!needsCredentials) {
      setStep('confirm');
      return;
    }

    setStep('checking');
    cartService.hasStoreCredentials(canonicalKey)
      .then((status) => {
        setCredStatus(status);
        setStep(status.has_credentials ? 'confirm' : 'credentials');
      })
      .catch(() => {
        setStep('credentials');
      });
  }, [open, storeKey, needsCredentials, canonicalKey]);

  // Poll Voila job status
  const startPolling = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    const poll = async () => {
      try {
        const status = await cartService.getVoilaJobStatus(jobId);
        setVoilaStatus(status.status);

        switch (status.status) {
          case 'needs_verification':
            // Stop polling — user needs to enter code
            if (pollRef.current) clearInterval(pollRef.current);
            setStep('verification');
            break;

          case 'complete': {
            if (pollRef.current) clearInterval(pollRef.current);
            const cartResult = status.result as BuildStoreCartResponse;
            setResult(cartResult);
            setStep('result');
            break;
          }

          case 'error':
            if (pollRef.current) clearInterval(pollRef.current);
            setError(status.error || 'Cart build failed');
            setStep('result');
            break;

          // starting, logging_in, verifying, building_cart — keep polling
          default:
            break;
        }
      } catch {
        // Network error — keep polling (may be transient)
      }
    };

    // First check immediately, then every 2 seconds
    poll();
    pollRef.current = setInterval(poll, 2000);
  }, []);

  // Poll Metro job status
  const startMetroPolling = useCallback((jobId: string) => {
    if (metroPollRef.current) clearInterval(metroPollRef.current);

    const poll = async () => {
      try {
        const status = await cartService.getMetroJobStatus(jobId);
        setMetroStatus(status.status);

        switch (status.status) {
          case 'complete': {
            if (metroPollRef.current) clearInterval(metroPollRef.current);
            const cartResult = status.result as BuildStoreCartResponse;
            setResult(cartResult);
            setStep('result');
            break;
          }

          case 'error':
            if (metroPollRef.current) clearInterval(metroPollRef.current);
            setError(status.error || 'Metro cart build failed');
            setStep('result');
            break;

          // starting, setting_up, building_cart — keep polling
          default:
            break;
        }
      } catch {
        // Network error — keep polling
      }
    };

    poll();
    metroPollRef.current = setInterval(poll, 2000);
  }, []);

  const handleSaveCredentials = async () => {
    if (!credEmail.trim() || !credPassword.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (!credStatus?.store_id) {
      setError('Voila store not configured. Please contact support.');
      return;
    }

    setSavingCreds(true);
    setError(null);
    try {
      await cartService.saveStoreCredentials(credStatus.store_id, credEmail.trim(), credPassword);
      setStep('confirm');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to save credentials';
      setError(msg);
    } finally {
      setSavingCreds(false);
    }
  };

  const handleBuild = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cartService.buildStoreCart({
        grocery_list_id: groceryListId,
        session_id: sessionId,
        store_key: storeKey,
        item_quantities: itemQuantities,
      });

      // Voila stores return a job_id for async processing
      if (res.voila_job_id) {
        setVoilaJobId(res.voila_job_id);
        setVoilaStatus('starting');
        setStep('voila_progress');
        setLoading(false);
        startPolling(res.voila_job_id);
        return;
      }

      // Metro stores return a job_id for async processing
      if (res.metro_job_id) {
        setMetroStatus('starting');
        setStep('metro_progress');
        setLoading(false);
        startMetroPolling(res.metro_job_id);
        return;
      }

      // PCX stores return synchronous result
      setResult(res);
      setStep('result');
      if (!res.success) {
        setError(res.error || 'Failed to create cart');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to build cart';
      setError(msg);
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async () => {
    const code = verificationCode.trim();
    if (!code || code.length < 4) {
      setError('Please enter the verification code from your email.');
      return;
    }
    if (!voilaJobId) return;

    setSubmittingCode(true);
    setError(null);
    try {
      await cartService.submitVoilaCode(voilaJobId, code);
      // Switch to progress view and resume polling
      setStep('voila_progress');
      setVoilaStatus('verifying');
      startPolling(voilaJobId);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to submit code';
      setError(msg);
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (metroPollRef.current) clearInterval(metroPollRef.current);
    setResult(null);
    setError(null);
    setStep('checking');
    setVoilaJobId(null);
    setMetroStatus('');
    onClose();
  };

  const unavailable = result?.unavailable_items || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order on {orderStoreName}
          </DialogTitle>
        </DialogHeader>

        {/* Checking credential status */}
        {step === 'checking' && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking account status...
          </div>
        )}

        {/* Credential entry for Voila */}
        {step === 'credentials' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <KeyRound className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">{orderStoreName} account required</p>
                  <p>
                    To add items to your {orderStoreName} cart, we need to log into your account.
                    Your credentials are encrypted and stored securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1">Email</label>
                <input
                  type="email"
                  value={credEmail}
                  onChange={(e) => setCredEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Password</label>
                <input
                  type="password"
                  value={credPassword}
                  onChange={(e) => setCredPassword(e.target.value)}
                  placeholder="Your Voila password"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCredentials()}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300" style={{ overflowWrap: 'anywhere' }}>{error}</div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSaveCredentials} disabled={savingCreds}>
                {savingCreds ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Confirm step */}
        {step === 'confirm' && !error && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {needsCredentials ? (
                <>
                  This will log into your {orderStoreName} account and add your selected products to your cart.
                  You'll be able to review the results before opening {orderStoreName}.
                </>
              ) : (
                <>
                  This will create a cart on {orderStoreName}'s website with your selected products.
                  You'll be able to review the results before opening {orderStoreName}.
                </>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleBuild} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Create Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && error && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300" style={{ overflowWrap: 'anywhere' }}>{error}</div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => { setError(null); }}>
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Voila progress (polling) */}
        {step === 'voila_progress' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                {VOILA_STATUS_MESSAGES[voilaStatus] || 'Processing...'}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Metro progress (polling) */}
        {step === 'metro_progress' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                {METRO_STATUS_MESSAGES[metroStatus] || 'Processing...'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Metro carts are session-based. Items will be added but you'll need to re-add them on metro.ca.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Verification code entry */}
        {step === 'verification' && (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Email verification required</p>
                  <p>
                    Voila sent a verification code to your email. Enter the 6-digit code below to continue.
                    This is a one-time step — future orders won't need it.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-sm text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitVerification()}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300" style={{ overflowWrap: 'anywhere' }}>{error}</div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmitVerification} disabled={submittingCode || verificationCode.length < 4}>
                {submittingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Verify & Build Cart'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Result: success */}
        {step === 'result' && result?.success && (
          <div className="space-y-4" style={{ overflow: 'hidden' }}>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Cart created — {result.items_added} item{result.items_added !== 1 ? 's' : ''} added
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 ml-7 mt-1">
                {needsCredentials
                  ? 'Items have been added to your Voila cart. Open voila.ca to checkout.'
                  : isMetro
                    ? 'Your Metro cart was built successfully. See the items below.'
                    : `Review the items below, then open your cart on ${orderStoreName} when ready.`}
              </p>
            </div>

            {unavailable.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-1.5">
                  <XCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {unavailable.length} item{unavailable.length !== 1 ? 's' : ''} unavailable
                  </span>
                </div>
                <ul className="ml-6 space-y-0.5">
                  {unavailable.map((name, i) => (
                    <li key={i} className="text-xs text-amber-600 dark:text-amber-400" style={{ overflowWrap: 'anywhere' }}>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto" style={{ overflowX: 'hidden' }}>
              <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col />
                  <col style={{ width: '70px' }} />
                </colgroup>
                <tbody>
                  {result.items.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <td className="py-1.5 pr-3 align-top" style={{ overflowWrap: 'anywhere' }}>
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}
                        {item.brand ? `${item.brand} ` : ''}{item.name}
                      </td>
                      <td className="py-1.5 text-right font-medium tabular-nums whitespace-nowrap align-top">
                        ${item.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isMetro && result.estimated_total > 0 && (
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Est. Total</span>
                <span className="tabular-nums">${result.estimated_total.toFixed(2)}</span>
              </div>
            )}

            {isMetro && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Metro carts are session-based and cannot be transferred to your browser.
                  Use this list to add items manually on metro.ca.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
              {!isMetro && (
                <Button
                  onClick={() => window.open(result.cart_review_url, '_blank')}
                  className="text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Open Cart on {orderStoreName}
                </Button>
              )}
              {isMetro && result.site_url && (
                <Button
                  onClick={() => window.open(result.site_url, '_blank')}
                  className="text-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Go to Metro
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Result: error */}
        {step === 'result' && !result?.success && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300" style={{ overflowWrap: 'anywhere' }}>
                {result?.error || error || 'Unknown error'}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={() => { setStep('confirm'); setError(null); setResult(null); }}>
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
