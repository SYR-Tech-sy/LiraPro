import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedLogo } from '@/components/animated-logo';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import HCaptcha from '@hcaptcha/react-hcaptcha';

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined
  ?? '10000000-ffff-ffff-ffff-000000000001';

export default function SignInPage() {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HCaptcha>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!captchaToken) {
      setError('يرجى إتمام التحقق من أنك لست روبوتاً');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password, captchaToken);
    setLoading(false);
    if (err) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      captchaRef.current?.resetCaptcha();
      setCaptchaToken('');
      return;
    }
    navigate('/app/home');
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
          <h1 className="text-xl font-black text-foreground mb-1 text-center">تسجيل الدخول</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">مرحباً بعودتك إلى LiraPro</p>

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
                  placeholder="••••••••"
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
              className="h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'دخول'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-muted-foreground hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm text-muted-foreground">ليس لديك حساب؟ </span>
          <Link href="/sign-up" className="text-sm font-bold" style={{ color: '#D20073' }}>
            إنشاء حساب
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
