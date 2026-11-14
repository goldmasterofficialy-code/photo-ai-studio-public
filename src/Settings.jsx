import React, { useEffect, useRef, useState } from 'react';
import {
  User, Camera, Mail, ShieldCheck, LockKeyhole, Crown,
  Sparkles, LogOut, Save, Eye, EyeOff, CheckCircle2,
  ImagePlus, Globe2, BadgeCheck, KeyRound, AlertCircle,
  RefreshCw, Gem,Check
} from 'lucide-react';

import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
} from 'firebase/auth';

import { auth } from './firebase';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ur', name: 'اردو' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'ar', name: 'العربية' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ru', name: 'Русский' },
  { code: 'it', name: 'Italiano' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'mr', name: 'मराठी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' }
];

export default function Settings({ user, language = 'en', setLanguage }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState(user?.displayName || '');
  const [photo, setPhoto] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [activeTab, setActiveTab] = useState('profile');

  const email = user?.email || auth.currentUser?.email || '';
  const uid = user?.uid || auth.currentUser?.uid || '';
  const providerIds = auth.currentUser?.providerData?.map(item => item.providerId) || [];
  const isGoogleAccount = providerIds.includes('google.com');

  useEffect(() => {
    setName(user?.displayName || auth.currentUser?.displayName || '');
    if (!uid) return;

    try {
      const savedPhoto = localStorage.getItem(`photoai-profile-photo-${uid}`);
      if (savedPhoto) setPhoto(savedPhoto);
      else setPhoto(auth.currentUser?.photoURL || '');
    } catch {
      setPhoto(auth.currentUser?.photoURL || '');
    }
  }, [uid, user?.displayName]);

  const notify = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    window.setTimeout(() => setMessage(''), 4500);
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Please select an image file.', 'error');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      notify('Profile photo must be smaller than 3 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || '');
      setPhoto(image);

      try {
        localStorage.setItem(`photoai-profile-photo-${uid}`, image);
        notify('Profile photo updated on this device.');
      } catch {
        notify('Could not save this photo. Try a smaller image.', 'error');
      }
    };
    reader.onerror = () => notify('Unable to read this image.', 'error');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      notify('Please log in again to update your profile.', 'error');
      return;
    }

    if (!name.trim()) {
      notify('Please enter your name.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(currentUser, { displayName: name.trim() });
      notify('Your profile name has been updated.');
    } catch (error) {
      notify(error.message || 'Could not update your profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    if (isGoogleAccount) {
      notify('This account uses Google sign-in. Manage its password through Google.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      notify('New password must contain at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      notify('New password and confirmation do not match.', 'error');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      notify('Please log in again before changing your password.', 'error');
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify('Your password has been changed successfully.');
    } catch (error) {
      const friendlyMessage =
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
          ? 'Current password is incorrect.'
          : error.code === 'auth/weak-password'
          ? 'Please choose a stronger password.'
          : error.message || 'Could not change your password.';

      notify(friendlyMessage, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;

    try {
      await signOut(auth);
    } catch {
      notify('Unable to log out. Please try again.', 'error');
    }
  };

  const initials = (name || email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  const joinedDate = auth.currentUser?.metadata?.creationTime
    ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString()
    : 'Account active';

  return (
    <div className="prime-settings">
      <div className="prime-settings-heading">
        <div>
          <div className="prime-eyebrow"><Gem size={15} /> PERSONAL CONTROL CENTER</div>
          <h1>Account <span>Studio</span></h1>
          <p>Manage your identity, security and creative workspace.</p>
        </div>
        <div className="prime-heading-mark"><Sparkles size={25} /></div>
      </div>

      {message && (
        <div className={`prime-alert ${messageType}`}>
          {messageType === 'success'
            ? <CheckCircle2 size={18} />
            : <AlertCircle size={18} />}
          <span>{message}</span>
        </div>
      )}

      <section className="prime-profile-banner">
        <div className="prime-banner-glow" />
        <div className="prime-avatar-wrap">
          <div className="prime-avatar">
            {photo
              ? <img src={photo} alt="Profile" />
              : <span>{initials}</span>}
          </div>
          <button
            className="prime-camera-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload profile photo"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={handlePhoto}
          />
        </div>

        <div className="prime-profile-info">
          <div className="prime-member-label"><BadgeCheck size={14} /> MEMBER ACCOUNT</div>
          <h2>{name || 'Creative Member'}</h2>
          <p>{email}</p>
          <div className="prime-profile-tags">
            <span><ShieldCheck size={13} /> Account active</span>
            <span><Sparkles size={13} /> PhotoAI Studio</span>
          </div>
        </div>

        <div className="prime-banner-plan">
          <span>YOUR CURRENT PLAN</span>
          <strong><Gem size={17} /> FREE</strong>
          <small>Upgrade options coming soon</small>
        </div>
      </section>

      <div className="prime-settings-layout">
        <aside className="prime-settings-nav">
          <div className="prime-nav-caption">ACCOUNT MENU</div>

          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
            type="button"
          >
            <User size={18} /> Profile details
          </button>

          <button
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
            type="button"
          >
            <LockKeyhole size={18} /> Security
          </button>

          <button
            className={activeTab === 'preferences' ? 'active' : ''}
            onClick={() => setActiveTab('preferences')}
            type="button"
          >
            <Globe2 size={18} /> Preferences
          </button>

          <button
            className={activeTab === 'plan' ? 'active' : ''}
            onClick={() => setActiveTab('plan')}
            type="button"
          >
            <Crown size={18} /> Membership
          </button>

          <div className="prime-nav-divider" />

          <button className="prime-logout-link" onClick={handleLogout} type="button">
            <LogOut size={18} /> Log out
          </button>
        </aside>

        <main className="prime-settings-panel">
          {activeTab === 'profile' && (
            <section>
              <div className="prime-panel-heading">
                <div>
                  <span className="prime-section-kicker">YOUR IDENTITY</span>
                  <h3>Profile details</h3>
                  <p>Keep your account information up to date.</p>
                </div>
                <div className="prime-panel-icon"><User size={21} /></div>
              </div>

              <form onSubmit={saveProfile}>
                <label className="prime-field-label">DISPLAY NAME</label>
                <div className="prime-input-wrap">
                  <User size={18} />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    maxLength={60}
                  />
                </div>

                <label className="prime-field-label">EMAIL ADDRESS</label>
                <div className="prime-input-wrap prime-input-disabled">
                  <Mail size={18} />
                  <input value={email} readOnly />
                  <span className="prime-verified"><BadgeCheck size={14} /> Login email</span>
                </div>
                <p className="prime-field-note">
                  Your login email is managed by your sign-in provider.
                </p>

                <label className="prime-field-label">PROFILE PHOTO</label>
                <button
                  className="prime-upload-photo"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={19} />
                  <span>Choose a profile image</span>
                  <small>JPG, PNG or WEBP · Max 3 MB</small>
                </button>

                <button className="prime-primary-button" type="submit" disabled={saving}>
                  {saving ? <RefreshCw size={17} className="prime-spin" /> : <Save size={17} />}
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </form>

              <div className="prime-account-meta">
                <div><span>Account created</span><strong>{joinedDate}</strong></div>
                <div><span>Account ID</span><strong>{uid ? `${uid.slice(0, 8)}…` : '—'}</strong></div>
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section>
              <div className="prime-panel-heading">
                <div>
                  <span className="prime-section-kicker">PROTECT YOUR WORKSPACE</span>
                  <h3>Security center</h3>
                  <p>Manage how you access your PhotoAI account.</p>
                </div>
                <div className="prime-panel-icon"><ShieldCheck size={21} /></div>
              </div>

              <div className="prime-security-status">
                <div className="prime-security-symbol"><ShieldCheck size={23} /></div>
                <div>
                  <strong>Your account is active</strong>
                  <p>Signed in with {isGoogleAccount ? 'Google' : 'email and password'}.</p>
                </div>
                <span className="prime-status-dot">ACTIVE</span>
              </div>

              {isGoogleAccount ? (
                <div className="prime-info-box">
                  <KeyRound size={20} />
                  <div>
                    <strong>Google account detected</strong>
                    <p>Your password is managed by Google. Use your Google Account settings to change it.</p>
                  </div>
                </div>
              ) : (
                <form className="prime-password-form" onSubmit={changePassword}>
                  <h4>Change password</h4>

                  <label className="prime-field-label">CURRENT PASSWORD</label>
                  <div className="prime-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}>
                      {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <label className="prime-field-label">NEW PASSWORD</label>
                  <div className="prime-input-wrap">
                    <KeyRound size={18} />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}>
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <label className="prime-field-label">CONFIRM NEW PASSWORD</label>
                  <div className="prime-input-wrap">
                    <LockKeyhole size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  <button className="prime-primary-button" type="submit" disabled={passwordSaving}>
                    {passwordSaving ? <RefreshCw size={17} className="prime-spin" /> : <ShieldCheck size={17} />}
                    {passwordSaving ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              )}
            </section>
          )}

          {activeTab === 'preferences' && (
            <section>
              <div className="prime-panel-heading">
                <div>
                  <span className="prime-section-kicker">MAKE IT YOURS</span>
                  <h3>Preferences</h3>
                  <p>Choose the language for your creative workspace.</p>
                </div>
                <div className="prime-panel-icon"><Globe2 size={21} /></div>
              </div>

              <label className="prime-field-label">DISPLAY LANGUAGE</label>
              <div className="prime-input-wrap prime-select-wrap">
                <Globe2 size={18} />
                <select
                  value={language}
                  onChange={(event) => setLanguage?.(event.target.value)}
                >
                  {LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="prime-info-box">
                <Sparkles size={20} />
                <div>
                  <strong>Your workspace, your style</strong>
                  <p>Your language selection is handled by the main PhotoAI Studio app.</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'plan' && (
  <section className="prime-membership">
    <div className="prime-membership-heading">
      <div>
        <span className="prime-section-kicker">MEMBERSHIP EXPERIENCE</span>
        <h2>Your creative plan</h2>
        <p>Choose the creative experience that matches your ambition.</p>
      </div>
      <div className="prime-membership-crown">
        <Crown size={28} />
      </div>
    </div>

    <div className="prime-membership-current">
      <div className="prime-current-icon"><Gem size={25} /></div>
      <div className="prime-current-copy">
        <span>YOUR CURRENT MEMBERSHIP</span>
        <h3>Free Plan</h3>
        <p>Your account is active. You can use the available PhotoAI tools.</p>
      </div>
      <span className="prime-active-status">
        <CheckCircle2 size={15} /> ACTIVE
      </span>
    </div>

    <div className="prime-membership-grid">
      <article className="prime-membership-card prime-free-card">
        <div className="prime-card-topline">
          <span className="prime-plan-tag">STARTER</span>
          <span className="prime-plan-symbol"><User size={20} /></span>
        </div>
        <h3>Free <span>Plan</span></h3>
        <p className="prime-plan-description">
          Everything you need to begin creating.
        </p>
        <div className="prime-plan-price">
          <strong>₹0</strong>
          <span>/ always free</span>
        </div>
        <div className="prime-plan-divider" />
        <p className="prime-feature-title">YOUR INCLUDED BENEFITS</p>
        <ul className="prime-feature-list">
          <li><CheckCircle2 /> Account access and profile settings</li>
          <li><CheckCircle2 /> Available browser-based photo tools</li>
          <li><CheckCircle2 /> Background removal and enhancement</li>
          <li><CheckCircle2 /> Image resize and compression</li>
          <li><CheckCircle2 /> Personal creative workspace</li>
        </ul>
        <div className="prime-current-label">
          <Check size={16} /> YOUR CURRENT PLAN
        </div>
      </article>

      <article className="prime-membership-card prime-pro-card">
        <div className="prime-pro-glow" />
        <div className="prime-card-topline">
          <span className="prime-plan-tag prime-pro-tag">
            <Crown size={14} /> NEXT LEVEL
          </span>
          <span className="prime-plan-symbol prime-pro-symbol">
            <Sparkles size={21} />
          </span>
        </div>
        <h3>PhotoAI <span>Pro</span></h3>
        <p className="prime-plan-description">
          A premium creative experience for ambitious creators.
        </p>
        <div className="prime-plan-price">
          <strong>Coming soon</strong>
        </div>
        <div className="prime-plan-divider" />
        <p className="prime-feature-title">PLANNED PRO BENEFITS</p>
        <ul className="prime-feature-list">
          <li><CheckCircle2 /> Future premium creative features</li>
          <li><CheckCircle2 /> Potential higher usage limits</li>
          <li><CheckCircle2 /> Advanced workflow options</li>
          <li><CheckCircle2 /> Priority support options</li>
          <li><CheckCircle2 /> Future membership benefits</li>
        </ul>
        <button
          type="button"
          className="prime-upgrade-button"
          disabled
        >
          <Sparkles size={17} /> PRO ACCESS COMING SOON
        </button>
        <p className="prime-pro-note">
          Paid plans and payments are not enabled yet.
        </p>
      </article>
    </div>

    <div className="prime-membership-trust">
      <ShieldCheck size={19} />
      <div>
        <strong>Transparent membership</strong>
        <p>You will not be charged unless a payment plan is officially enabled and you choose to subscribe.</p>
      </div>
    </div>
  </section>
)}
        </main>
      </div>

      <footer className="prime-settings-footer">
        <span><ShieldCheck size={14} /> Your account settings</span>
        <span>PHOTOAI STUDIO · CREATIVE CONTROL</span>
      </footer>
    </div>
  );
}