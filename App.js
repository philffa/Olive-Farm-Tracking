import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase, getProfile, signInWithGoogle, signOut } from './lib/supabase';
import CalendarView from './components/CalendarView';
import RecordsView from './components/RecordsView';
import FinanceView from './components/FinanceView';
import AssetsView from './components/AssetsView';
import CropPlanView from './components/CropPlanView';
import './App.css';

export const AppContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch (e) {
      console.error('Profile load error:', e);
      setAuthError('Could not load your farm profile. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen onLogin={signInWithGoogle} error={authError} />;

  const farmId = profile?.farm_id;

  return (
    <AppContext.Provider value={{ user, profile, farmId }}>
      <div className="app">
        <header className="app-header">
          <div className="header-brand">
            <span className="brand-icon">🫒</span>
            <div>
              <div className="brand-name">Olive Farm Tracking</div>
              <div className="brand-farm">{profile?.farms?.name || 'Your Farm'}</div>
            </div>
          </div>
          <nav className="header-nav">
            {['calendar', 'records', 'finance', 'assets', 'crops'].map(tab => (
              <button
                key={tab}
                className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_ICONS[tab]} {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>
          <button className="signout-btn" onClick={signOut} title="Sign out">
            {profile?.full_name?.split(' ')[0] || 'Sign out'} ↗
          </button>
        </header>

        <main className="app-main">
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'records'  && <RecordsView />}
          {activeTab === 'finance'  && <FinanceView />}
          {activeTab === 'assets'   && <AssetsView />}
          {activeTab === 'crops'    && <CropPlanView />}
        </main>
      </div>
    </AppContext.Provider>
  );
}

const TAB_ICONS = { calendar: '📅', records: '📋', finance: '💰', assets: '🐐', crops: '🌱' };
const TAB_LABELS = { calendar: 'Calendar', records: 'Records', finance: 'Finance', assets: 'Assets', crops: 'Crop Plan' };

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-olive">🫒</div>
      <div className="loading-text">Loading Olive Farm Tracking…</div>
    </div>
  );
}

function LoginScreen({ onLogin, error }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-icon">🫒</div>
        <h1 className="login-title">Olive Farm Tracking</h1>
        <p className="login-sub">Farm calendar, records & finance — all in one place</p>
        {error && <div className="login-error">{error}</div>}
        <button className="login-btn" onClick={onLogin}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
        <p className="login-note">Your data is stored privately in your own database</p>
      </div>
    </div>
  );
}
