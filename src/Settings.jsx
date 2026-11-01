import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Globe,
  Bell,
  Shield,
  Palette,
  Save,
  RotateCcw,
  CheckCircle,
  Mail
} from 'lucide-react';

export default function Settings({ user, language, setLanguage }) {
  const [name, setName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [notifications, setNotifications] = useState(
    localStorage.getItem('photoai-notifications') !== 'false'
  );
  const [autoSave, setAutoSave] = useState(
    localStorage.getItem('photoai-autosave') !== 'false'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    setName(user?.displayName || '');
  }, [user]);

  const saveSettings = () => {
    localStorage.setItem('photoai-profile-name', name);
    localStorage.setItem('photoai-notifications', String(notifications));
    localStorage.setItem('photoai-autosave', String(autoSave));

    setMessage('Your settings have been saved successfully.');

    window.setTimeout(() => setMessage(''), 3000);
  };

  const resetSettings = () => {
    setName(user?.displayName || '');
    setNotifications(true);
    setAutoSave(true);
    setMessage('Settings restored. Click Save Changes to apply.');
  };

  const cardStyle = {
    background: '#ffffff08',
    border: '1px solid #ffffff18',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16
  };

  const labelStyle = {
    display: 'block',
    color: '#b5b8cc',
    fontSize: 12,
    marginBottom: 8
  };

  const inputStyle = {
    width: '100%',
    maxWidth: 440,
    height: 42,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid #ffffff25',
    background: '#101529',
    color: '#ffffff',
    outline: 'none'
  };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'bn', label: 'বাংলা' },
    { value: 'ur', label: 'اردو' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'pt', label: 'Português' },
    { value: 'ar', label: 'العربية' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'ru', label: 'Русский' },
    { value: 'it', label: 'Italiano' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'gu', label: 'ગુજરાતી' },
    { value: 'mr', label: 'मराठी' },
    { value: 'ta', label: 'தமிழ்' },
    { value: 'te', label: 'తెలుగు' },
    { value: 'pa', label: 'ਪੰਜਾਬੀ' }
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1050, margin: '0 auto', padding: '12px 0 35px', color: '#f3f3fb' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SettingsIcon size={27} color="#a78bfa" />
          <h1 style={{ fontSize: 27, margin: 0, fontWeight: 800 }}>
            Settings
          </h1>
        </div>
        <p style={{ color: '#929ab3', fontSize: 13 }}>
          Manage your PhotoAI Studio account and preferences.
        </p>
      </div>

      <section style={cardStyle}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 0 }}>
          <User size={18} color="#a78bfa" />
          Profile Information
        </h3>

        <label style={labelStyle}>Display Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={60}
        />

        <label style={{ ...labelStyle, marginTop: 17 }}>Email Address</label>
        <input
          style={{ ...inputStyle, opacity: 0.65 }}
          value={email}
          readOnly
        />
        <p style={{ color: '#929ab3', fontSize: 11 }}>
          Your email is managed by Firebase Authentication.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 0 }}>
          <Globe size={18} color="#a78bfa" />
          Language
        </h3>

        <label style={labelStyle}>Website Language</label>
        <select
          style={inputStyle}
          value={language || 'en'}
          onChange={(e) => setLanguage?.(e.target.value)}
        >
          {languages.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </section>

      <section style={cardStyle}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 0 }}>
          <Bell size={18} color="#a78bfa" />
          Preferences
        </h3>

        <label style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '17px 0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          <span>
            <strong style={{ display: 'block', fontSize: 13 }}>Notifications preference</strong>
            <small style={{ color: '#929ab3' }}>Save your notification preference.</small>
          </span>
        </label>

        <label style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '17px 0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
          />
          <span>
            <strong style={{ display: 'block', fontSize: 13 }}>Auto-save preference</strong>
            <small style={{ color: '#929ab3' }}>Save your auto-save preference.</small>
          </span>
        </label>
      </section>

      <section style={cardStyle}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 0 }}>
          <Shield size={18} color="#a78bfa" />
          Account & Privacy
        </h3>
        <p style={{ color: '#929ab3', fontSize: 12, lineHeight: 1.7 }}>
          Your account is managed through Firebase Authentication.
          Your profile preferences on this page are stored in this browser.
          Clearing browser data may reset these preferences.
        </p>
      </section>

      {message && (
        <div role="status" style={{ color: '#79dfb2', fontSize: 12, marginBottom: 14 }}>
          <CheckCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button
          onClick={saveSettings}
          style={{ background: 'linear-gradient(110deg,#785cf1,#a17aff)', color: '#fff', border: 0, borderRadius: 8, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}
        >
          <Save size={16} /> Save Changes
        </button>

        <button
          onClick={resetSettings}
          style={{ background: '#ffffff10', color: '#ddd9f3', border: '1px solid #ffffff25', borderRadius: 8, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>
    </div>
  );
}