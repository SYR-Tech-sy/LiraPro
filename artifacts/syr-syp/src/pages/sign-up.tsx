import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedLogo } from '@/components/animated-logo';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined
  ?? '10000000-ffff-ffff-ffff-000000000001';

function getPasswordStrength(pw: string) {
  const checks = {
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

const STRENGTH_LABELS = ['', 'ضعيفة جداً', 'متوسطة', 'جيدة', 'قوية جداً'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#84cc16', '#22c55e'];

const PASSWORD_REQS = [
  { key: 'length', label: '6 أحرف على الأقل' },
  { key: 'upper', label: 'حرف كبير (A-Z)' },
  { key: 'number', label: 'أرقام (0-9)' },
  { key: 'symbol', label: 'رموز (!@#$...)' },
] as const;

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);

  const { score, checks } = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (!captchaToken) {
      setError('يرجى إتمام التحقق من أنك لست روبوتاً');
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, undefined, captchaToken);
    setLoading(false);
    if (err) {
      if (err.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجّل مسبقاً');
      } else {
        setError(err.message);
      }
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-8" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-card rounded-3xl p-8 shadow-sm border border-border text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-black mb-2">تم إنشاء حسابك!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            أرسلنا رابط تأكيد إلى <strong>{email}</strong>. يرجى تفقّد بريدك الإلكتروني وتأكيد الحساب.
          </p>
          <Button className="w-full h-11 rounded-2xl font-bold text-white" style={{ background: '#D20073' }} onClick={() => navigate('/sign-in')}>
            الذهاب لتسجيل الدخول
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <div className="rounded-2xl px-5 py-3 border border-border shadow-sm bg-card">
            <AnimatedLogo fontSize="clamp(1.1rem, 4vw, 1.4rem)" />
          </div>
        </div>

        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
          <h1 className="text-xl font-black text-foreground mb-1 text-center">إنشاء حساب جديد</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">انضم إلى LiraPro مجاناً</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="ادخل 6 أحرف على الأقل"
                  dir="ltr"
                  required
                  className="h-11 rounded-xl pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={i <= score ? { background: STRENGTH_COLORS[score] } : { background: 'var(--border)' }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold" style={{ color: score > 0 ? STRENGTH_COLORS[score] : 'var(--muted-foreground)' }}>
                      {score > 0 ? STRENGTH_LABELS[score] : ''}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PASSWORD_REQS.map(req => (
                      <div key={req.key} className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          checks[req.key] ? 'bg-green-500' : 'border border-border bg-background'
                        }`}>
                          {checks[req.key] && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-[10px] transition-colors ${
                          checks[req.key] ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                        }`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm" className="text-sm font-semibold">تأكيد كلمة المرور</Label>
              <Input
                id="confirm"
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="أعد كتابة كلمة المرور"
                dir="ltr"
                required
                className="h-11 rounded-xl"
              />
            </div>

            {/* hCaptcha */}
            <div className="flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={HCAPTCHA_SITE_KEY}
                onVerify={token => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken('')}
                languageOverride="ar"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !captchaToken}
              className="h-12 rounded-2xl font-bold text-white"
              style={{ background: '#D20073' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء حساب'}
            </Button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">لديك حساب بالفعل؟ </span>
          <Link href="/sign-in" className="text-sm font-bold text-primary">
            تسجيل الدخول
          </Link>
        </div>

        <div className="mt-3 text-center">
          <Link href="/app/home" className="text-sm text-muted-foreground hover:underline">
            المتابعة كضيف
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
