'use client';

import { useState, useEffect, useRef } from 'react';
import { Page } from '@/components/PageLayout';
import { Transaction } from '@/components/Transaction';
import { Marble, TopBar, Typography, Toaster, useToast } from '@worldcoin/mini-apps-ui-kit-react';
import { BrowseMeals } from '@/components/BrowseMeals';
import { CreateMeal } from '@/components/CreateMeal';
import { useSession } from 'next-auth/react';

type Screen = 'home' | 'browse' | 'create';

export default function Home() {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [isVerified, setIsVerified] = useState(false);
  const lastUrlRef = useRef<string>(window.location.href);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!session?.user?.username) return;
      try {
        const storedVerified = localStorage.getItem(`user_verified_${session.user.username}`);
        if (storedVerified === 'true') { setIsVerified(true); return; }
        const response = await fetch('/api/check-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: session.user.username }),
        });
        const data = await response.json();
        if (data.verified) {
          setIsVerified(true);
          localStorage.setItem(`user_verified_${session.user.username}`, 'true');
        } else {
          setIsVerified(false);
          localStorage.removeItem(`user_verified_${session.user.username}`);
        }
      } catch { setIsVerified(false); }
    };
    fetchVerificationStatus();
  }, [session?.user?.username]);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as Screen | null;
      setScreen(tab && ['home', 'browse', 'create'].includes(tab) ? tab : 'home');
      lastUrlRef.current = window.location.href;
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('tabchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('tabchange', handleUrlChange);
    };
  }, []);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    localStorage.setItem(`user_verified_${session?.user?.username}`, 'true');
    toast.success({ title: 'Identity verified!' });
  };

  const renderScreen = () => {
    switch (screen) {
      case 'browse':
        return (
          <>
            <BrowseMeals userId={session?.user?.username || ''} username={session?.user?.username || ''} verified={isVerified} />
            <div className="hidden"><Transaction /></div>
          </>
        );
      case 'create':
        return (
          <>
            <CreateMeal
              hostId={session?.user?.username || ''}
              hostUsername={session?.user?.username || ''}
              hostAddress={session?.user?.walletAddress || undefined}
              verified={isVerified}
              onVerificationSuccess={handleVerificationSuccess}
            />
            <div className="hidden"><Transaction /></div>
          </>
        );
      default:
        return (
          <HomePage
            isVerified={isVerified}
            username={session?.user?.username}
            onBrowse={() => setScreen('browse')}
            onCreate={() => setScreen('create')}
          />
        );
    }
  };

  return (
    <>
      <Toaster />
      <Page.Header className="p-0">
        <TopBar
          title={screen === 'browse' ? 'Browse Meals' : screen === 'create' ? 'Create Meal' : 'MealMesh'}
          endAdornment={
            <div className="flex items-center gap-2">
              <Typography variant="label" level={2} className="text-gray-500 capitalize">
                {session?.user?.username}
              </Typography>
              <Marble src={session?.user?.profilePictureUrl} className="w-10" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start min-h-screen">
        <div style={{ backgroundColor: 'rgb(var(--gray-50))' }} className="w-full">
          {renderScreen()}
        </div>
      </Page.Main>
    </>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function HomePage({
  isVerified,
  username,
  onBrowse,
  onCreate,
}: {
  isVerified: boolean;
  username?: string;
  onBrowse: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col pb-32">

      {/* ── Hero Banner ───────────────────────────────────────────── */}
      <div
        className="w-full px-6 pt-8 pb-10 flex flex-col gap-3"
        style={{ background: 'linear-gradient(135deg, rgb(var(--gray-900)) 0%, rgb(40,40,40) 100%)' }}
      >
        <Typography variant="body" level={2} className="text-gray-400">
          {username ? `Hey, ${username} 👋` : 'Welcome 👋'}
        </Typography>

        <Typography
          variant="heading"
          level={1}
          as="h1"
          className="text-gray-0"
          style={{ fontSize: '1.875rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}
        >
          Discover meals,{'\n'}share moments.
        </Typography>

        <Typography variant="body" level={3} className="text-gray-400" style={{ maxWidth: '85%' }}>
          Discover Restaurants dining meals by real, verified people — near you or worldwide while you travel.
        </Typography>

        {/* Stat pills */}
        <div className="flex gap-2 mt-2">
          {[
            { value: '1.2k+', label: 'Meals shared' },
            { value: '800+', label: 'Verified hosts' },
            { value: '50+', label: 'Cities' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <Typography variant="label" level={1} className="text-gray-0">{s.value}</Typography>
              <span style={{ fontSize: '0.65rem', color: 'rgb(var(--gray-400))' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Verification Banner ───────────────────────────────────── */}
      {!isVerified && (
        <div className="px-6 -mt-4">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'rgb(var(--warning-100))',
              border: '1px solid rgb(var(--warning-300))',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
              style={{ background: 'rgb(var(--warning-200))' }}
            >
              🔐
            </div>
            <div className="flex-1 flex flex-col gap-0.5">
              <Typography variant="label" level={2} className="text-warning-700">
                Verify your identity
              </Typography>
              <span style={{ fontSize: '0.75rem', color: 'rgb(var(--warning-700))', opacity: 0.75 }}>
                Required to join or host meals
              </span>
            </div>
            <button
              className="rounded-full px-4 py-3 flex-shrink-0"
              style={{ background: 'rgb(var(--warning-600))', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {/* ── Main Actions ──────────────────────────────────────────── */}
      <div className="px-6 mt-8 flex flex-col gap-3">
        <SectionLabel>Get started</SectionLabel>

        <ActionCard
          emoji="🌍"
          emojiBg="rgb(var(--info-100))"
          title="Browse Meals"
          subtitle="Explore nearby or worldwide events"
          badge="Live"
          badgeBg="rgb(var(--info-600))"
          onClick={onBrowse}
        />

        <ActionCard
          emoji="👨‍🍳"
          emojiBg="rgb(var(--bitcoin-secondary))"
          title="Create a Meal"
          subtitle="Host your own food experience"
          onClick={onCreate}
        />
      </div>

      {/* ── How it works ──────────────────────────────────────────── */}
      <div className="px-6 mt-10 flex flex-col gap-4">
        <SectionLabel>How it works</SectionLabel>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgb(var(--gray-200))' }}
        >
          {[
            { step: '01', icon: '🔒', title: 'Verify with World ID', desc: 'Proof of humanity — private and instant' },
            { step: '02', icon: '🍽️', title: 'Join or host a meal', desc: 'Browse events near you or create your own' },
            { step: '03', icon: '🤝', title: 'Connect & enjoy', desc: 'Meet real people, share great food' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                backgroundColor: 'rgb(var(--gray-0))',
                borderTop: i > 0 ? '1px solid rgb(var(--gray-100))' : undefined,
              }}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgb(var(--gray-300))', width: '1.5rem', flexShrink: 0 }}>
                {item.step}
              </span>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                style={{ background: 'rgb(var(--gray-50))', border: '1px solid rgb(var(--gray-100))' }}
              >
                {item.icon}
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <Typography variant="label" level={2} className="text-gray-900">{item.title}</Typography>
                <Typography variant="body" level={4} className="text-gray-400">{item.desc}</Typography>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature Pills ─────────────────────────────────────────── */}
      <div className="px-6 mt-10 flex flex-col gap-4">
        <SectionLabel>Why MealMesh</SectionLabel>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🔒', label: 'Transparent', bg: 'rgb(var(--info-100))', border: 'rgb(var(--info-200))' },
            { icon: '✅', label: 'Verified users',      bg: 'rgb(var(--success-100))', border: 'rgb(var(--success-200))' },
            { icon: '📍', label: 'Location based',      bg: 'rgb(var(--warning-100))', border: 'rgb(var(--warning-200))' },
            { icon: '🌍', label: 'Global community',    bg: 'rgb(var(--info-100))',    border: 'rgb(var(--info-200))' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2.5 rounded-xl px-3 py-3"
              style={{ background: f.bg, border: `1px solid ${f.border}` }}
            >
              <span className="text-base">{f.icon}</span>
              <Typography variant="body" level={4} className="text-gray-700" style={{ fontWeight: 500 }}>
                {f.label}
              </Typography>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div className="px-6 mt-12 flex flex-col items-center gap-1">
        <Typography variant="body" level={4} className="text-gray-400">Powered by World ID</Typography>
        <Typography variant="body" level={4} className="text-gray-300">© 2026 MealMesh</Typography>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgb(var(--gray-400))', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function ActionCard({
  emoji, emojiBg, title, subtitle, badge, badgeBg, onClick,
}: {
  emoji: string;
  emojiBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeBg?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl text-left active:scale-[0.98] transition-transform"
      style={{
        background: 'rgb(var(--gray-0))',
        border: '1px solid rgb(var(--gray-200))',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: emojiBg }}
        >
          {emoji}
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <div className="flex items-center gap-2">
            <Typography variant="label" level={1} className="text-gray-900">{title}</Typography>
            {badge && (
              <span
                className="rounded-full px-2 py-0.5 text-white"
                style={{ background: badgeBg, fontSize: '0.6rem', fontWeight: 700 }}
              >
                {badge}
              </span>
            )}
          </div>
          <Typography variant="body" level={4} className="text-gray-400">{subtitle}</Typography>
        </div>
        <span className="text-xl flex-shrink-0" style={{ color: 'rgb(var(--gray-300))' }}>›</span>
      </div>
    </button>
  );
}