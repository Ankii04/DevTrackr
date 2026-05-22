import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as githubApi from '../api/githubApi';
import Button from '../components/ui/Button';

const Login = () => {
  const { login, isAuthenticated, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show session expiration warnings & GitHub login redirect parameters
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setError('Your security session has expired. Please sign in again.');
    }
    
    const ghToken = searchParams.get('token');
    const ghError = searchParams.get('error');
    
    if (ghToken) {
      const authViaGithub = async () => {
        setLoading(true);
        setError('');
        try {
          await loginWithToken(ghToken);
          navigate('/dashboard');
        } catch (err) {
          setError(err || 'Failed to authenticate via GitHub');
        } finally {
          setLoading(false);
        }
      };
      authViaGithub();
    } else if (ghError) {
      setError(ghError);
    }
  }, [searchParams, loginWithToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubConnect = () => {
    let apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    if (apiBase && !apiBase.endsWith('/api') && !apiBase.endsWith('/api/')) {
      apiBase = apiBase.replace(/\/$/, '') + '/api';
    }
    window.location.href = `${apiBase}/github/login`;
  };

  return (
    <main className="flex min-h-screen flex-col md:flex-row overflow-hidden bg-background text-on-background">
      {/* Left Section: Animated Terminal Brand Space */}
      <section className="relative hidden md:flex md:w-1/2 lg:w-3/5 bg-surface-container-lowest items-center justify-center overflow-hidden">
        {/* Git Log Animation Background */}
        <div className="absolute inset-0 opacity-20 font-mono text-[14px] text-secondary select-none no-scrollbar">
          <div className="commit-line flex flex-col gap-2 p-8">
            <div className="space-y-4">
              <p className="glow-secondary">{"commit 7f2a1b9c4d8e (HEAD -> main, origin/main)"}</p>
              <p className="text-on-surface-variant">Author: DevTrackr Bot &lt;bot@devtrackr.ai&gt;</p>
              <p className="text-on-surface-variant">Date:   Tue Oct 24 14:02:11 2026 -0700</p>
              <p className="pl-4 py-1">feat: optimize repository indexing for sprint analysis</p>
              
              <p className="glow-secondary">commit a1b2c3d4e5f6</p>
              <p className="text-on-surface-variant">Author: Sarah Jenkins &lt;sarah@devtrackr.ai&gt;</p>
              <p className="text-on-surface-variant">Date:   Mon Oct 23 09:15:00 2026 -0700</p>
              <p className="pl-4 py-1">fix: resolve websocket latency in live metrics dashboard</p>
              
              <p className="glow-secondary">commit e8f7a6b5c4d3</p>
              <p className="text-on-surface-variant">Author: Mike Chen &lt;mike@devtrackr.ai&gt;</p>
              <p className="pl-4 py-1">docs: update contribution guidelines for new microservices</p>
              
              <p className="glow-secondary">commit 9283f4e1d2c0</p>
              <p className="pl-4 py-1">chore: bump dependencies for security compliance</p>
              
              {/* Repeated for loop */}
              <p className="glow-secondary">{"commit 7f2a1b9c4d8e (HEAD -> main, origin/main)"}</p>
              <p className="text-on-surface-variant">Author: DevTrackr Bot &lt;bot@devtrackr.ai&gt;</p>
              <p className="pl-4 py-1">feat: optimize repository indexing for sprint analysis</p>
              
              <p className="glow-secondary">commit a1b2c3d4e5f6</p>
              <p className="text-on-surface-variant">Author: Sarah Jenkins &lt;sarah@devtrackr.ai&gt;</p>
              <p className="pl-4 py-1">fix: resolve websocket latency in live metrics dashboard</p>
            </div>
          </div>
        </div>
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-surface-container-lowest"></div>
        {/* Central Branding */}
        <div className="relative z-10 text-center px-gutter animate-in fade-in zoom-in duration-700">
          <h1 className="font-outfit text-headline-lg text-on-surface mb-stack_sm">DevTrackr</h1>
          <p className="font-outfit text-body-lg text-on-surface-variant tracking-wide">Ship smarter. Code better.</p>
        </div>
      </section>

      {/* Right Section: Login Form */}
      <section className="flex flex-1 items-center justify-center bg-surface-container px-margin_mobile md:px-margin_desktop py-stack_lg">
        <div className="w-full max-w-md space-y-stack_lg">
          {/* Mobile Branding */}
          <div className="md:hidden text-center mb-stack_lg">
            <h1 className="font-outfit text-headline-md text-primary font-bold">DevTrackr</h1>
          </div>
          
          <header className="space-y-stack_sm">
            <h2 className="font-outfit text-headline-md text-on-surface font-semibold">Welcome back</h2>
            <p className="font-outfit text-body-md text-on-surface-variant">Sign in to your productivity dashboard</p>
          </header>

          {error && (
            <div className="bg-error-container/10 border border-error/25 text-error px-4 py-3 rounded-lg text-[13px] font-outfit flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-gutter" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]" htmlFor="email">
                Email Address
              </label>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-lg font-outfit text-body-md text-on-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                id="email" 
                placeholder="name@company.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]" htmlFor="password">
                  Password
                </label>
                <a className="font-outfit text-body-md text-primary hover:underline text-[13px]" href="#">Forgot?</a>
              </div>
              <div className="relative group">
                <input 
                  className="w-full bg-surface-container-highest border-none rounded-lg font-outfit text-body-md text-on-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-12" 
                  id="password" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors" 
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              loading={loading}
              className="w-full py-4 text-headline-sm font-bold bg-primary-container text-on-primary-container"
            >
              Sign In
            </Button>
            
            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-outline-variant"></div>
              <span className="font-mono text-label-caps text-on-surface-variant text-[11px]">OR</span>
              <div className="h-[1px] flex-1 bg-outline-variant"></div>
            </div>

            {/* GitHub Button */}
            <button 
              className="w-full bg-transparent border border-outline text-on-surface font-outfit text-body-lg py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-surface-variant transition-colors group" 
              type="button"
              onClick={handleGitHubConnect}
            >
              <svg aria-hidden="true" className="w-6 h-6 fill-current text-on-surface group-hover:text-primary transition-colors" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </form>

          <footer className="text-center pt-stack_sm">
            <p className="font-outfit text-body-md text-on-surface-variant">
              Don't have an account? 
              <Link className="text-primary font-medium hover:underline ml-1" to="/signup">Sign up</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default Login;
