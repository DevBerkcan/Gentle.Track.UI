// src/components/auth/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, BarChart3, CheckCircle2, Users } from 'lucide-react';
import lockupDark from '@/assets/brand/gentle-track-lockup-dark.svg';
import lockupLight from '@/assets/brand/gentle-track-lockup-light.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Linke Branding-Seite */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <img src={lockupDark} alt="Gentle Track" className="h-8 w-auto" />


        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight">
              Projekte im Blick.
              <br />
              <span className="text-primary">Kunden begeistert.</span>
            </h2>
            <p className="text-sidebar-foreground/60 mt-4 text-lg leading-relaxed">
              Verwalten Sie Ihre Projekte, Phasen und Kundenkommunikation — alles an einem Ort.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: BarChart3, text: 'Echtzeit-Projektübersicht für alle Beteiligten' },
              { icon: Users, text: 'Kunden können den Fortschritt jederzeit einsehen' },
              { icon: CheckCircle2, text: 'Transparente Phasenverfolgung mit Kommentaren' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sidebar-foreground/70 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sidebar-foreground/30 text-xs">
          © {new Date().getFullYear()} Gentle Webdesign
        </p>
      </div>

      {/* Rechte Formular-Seite */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center">
            <img src={lockupLight} alt="Gentle Track" className="h-7 w-auto" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Willkommen zurück</h1>
            <p className="text-muted-foreground mt-1 text-sm">Melden Sie sich mit Ihrem Admin-Konto an</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 bg-destructive/8 border border-destructive/20 text-destructive p-3.5 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Anmeldung läuft…</>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Kein Admin?{' '}
              <a
                href="/kundenansicht"
                className="text-primary hover:text-primary/80 font-medium no-underline transition-colors"
              >
                Zur Kundenansicht →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
