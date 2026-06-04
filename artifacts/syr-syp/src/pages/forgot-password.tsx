import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedLogo } from '@/components/animated-logo';
import { Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) { setError('حدث خطأ، يرجى التحقق من البريد الإلكتروني'); return; }
    setDone(true);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <div className="rounded-2xl px-5 py-3 border border-border shadow-sm bg-card">
            <AnimatedLogo fontSize="clamp(1.1rem, 4vw, 1.4rem)" />
          </div>
        </div>

        {done ? (
          <div className="bg-card rounded-3xl p-8 shadow-sm border border-border text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-black mb-2">تم إرسال رابط الاسترداد</h2>
            <p className="text-sm text-muted-foreground mb-6">
              تحقق من بريدك الإلكتروني واضغط على الرابط لإعادة تعيين كلمة المرور.
            </p>
            <Link href="/sign-in">
              <Button variant="outline" className="w-full h-11 rounded-2xl gap-2">
                <ArrowRight className="w-4 h-4" />
                العودة لتسجيل الدخول
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
            <h1 className="text-xl font-black mb-1 text-center">استرداد كلمة المرور</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">أدخل بريدك الإلكتروني وسنرسل لك رابط الاسترداد</p>

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

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="h-12 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال رابط الاسترداد'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/sign-in" className="text-sm text-muted-foreground hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
