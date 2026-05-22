import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Button from '../components/ui/Button';

const Signup = () => {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      return setError('Please fill in all fields.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setError('');
    setLoading(true);
    try {
      await signup(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to register account');
    } finally {
      setLoading(false);
    }
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

      {/* Right Section: Signup Form */}
      <section className="flex flex-1 items-center justify-center bg-surface-container px-margin_mobile md:px-margin_desktop py-stack_lg">
        <div className="w-full max-w-md space-y-stack_lg">
          {/* Mobile Branding */}
          <div className="md:hidden text-center mb-stack_lg">
            <h1 className="font-outfit text-headline-md text-primary font-bold">DevTrackr</h1>
          </div>
          
          <header className="space-y-stack_sm">
            <h2 className="font-outfit text-headline-md text-on-surface font-semibold">Get started</h2>
            <p className="font-outfit text-body-md text-on-surface-variant">Create your developer account</p>
          </header>

          {error && (
            <div className="bg-error-container/10 border border-error/25 text-error px-4 py-3 rounded-lg text-[13px] font-outfit flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-gutter" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="space-y-2">
              <label className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]" htmlFor="username">
                Developer Username
              </label>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-lg font-outfit text-body-md text-on-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                id="username" 
                placeholder="Coder123" 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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
              <label className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]" htmlFor="password">
                Password
              </label>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-lg font-outfit text-body-md text-on-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                id="password" 
                placeholder="At least 6 characters" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="font-mono text-label-caps text-on-surface-variant uppercase tracking-widest text-[11px]" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-lg font-outfit text-body-md text-on-surface px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                id="confirmPassword" 
                placeholder="••••••••" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              loading={loading}
              className="w-full py-4 text-headline-sm font-bold bg-primary-container text-on-primary-container"
            >
              Sign Up
            </Button>
          </form>

          <footer className="text-center pt-stack_sm">
            <p className="font-outfit text-body-md text-on-surface-variant">
              Already have an account? 
              <Link className="text-primary font-medium hover:underline ml-1" to="/login">Sign in</Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default Signup;
