import { useState } from 'react';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

import { auth, googleProvider } from './firebase';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  function showMessage(text, type = 'error') {
    setMessage(text);
    setMessageType(type);
  }

  function getErrorMessage(error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'यह Email पहले से रजिस्टर है। Login करें।';

      case 'auth/invalid-email':
        return 'कृपया सही Email Address डालें।';

      case 'auth/weak-password':
        return 'Password कम से कम 6 अक्षरों का होना चाहिए।';

      case 'auth/user-not-found':
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Email या Password गलत है।';

      case 'auth/popup-closed-by-user':
        return 'Google Login बंद कर दिया गया। दोबारा कोशिश करें।';

      case 'auth/popup-blocked':
        return 'Browser ने Popup रोक दिया। Popup की अनुमति दें।';

      case 'auth/unauthorized-domain':
        return 'Firebase में इस Website Domain को Authorized करें।';

      case 'auth/operation-not-allowed':
        return 'Firebase Console में Login Method Enable करें।';

      case 'auth/network-request-failed':
        return 'Internet Connection जाँचें और फिर कोशिश करें।';

      case 'auth/too-many-requests':
        return 'बहुत बार कोशिश हुई है। कुछ समय बाद प्रयास करें।';

      case 'auth/cancelled-popup-request':
        return 'एक Login प्रक्रिया पहले से चल रही है।';

      default:
        console.error('Firebase Auth Error:', error);
        return 'कुछ समस्या हुई है। कृपया दोबारा कोशिश करें।';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showMessage('Email Address डालें।');
      return;
    }

    if (!password || password.length < 6) {
      showMessage('Password कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        showMessage('कृपया अपना पूरा नाम डालें।');
        return;
      }

      if (password !== confirmPassword) {
        showMessage('दोनों Password एक जैसे नहीं हैं।');
        return;
      }
    }

    setLoading(true);

    try {
      let result;

      if (mode === 'signup') {
        result = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        try {
          await updateProfile(result.user, {
            displayName: name.trim()
          });
        } catch (profileError) {
          console.error('Profile update error:', profileError);
        }

        showMessage(
          'आपका Account सफलतापूर्वक बन गया है!',
          'success'
        );

      } else {
        result = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        showMessage(
          'Login सफल रहा! स्वागत है।',
          'success'
        );
      }

      if (typeof onLogin === 'function') {
        onLogin(result.user);
      }

    } catch (error) {
      showMessage(getErrorMessage(error));

    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      showMessage(
        'Google Login सफल रहा!',
        'success'
      );

      if (typeof onLogin === 'function') {
        onLogin(result.user);
      }

    } catch (error) {
      showMessage(getErrorMessage(error));

    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showMessage('पहले अपना Email Address डालें।');
      return;
    }

    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, cleanEmail);

      showMessage(
        'यदि इस Email पर Account मौजूद है, तो Password Reset Link भेज दिया गया है। अपना Inbox और Spam Folder जाँचें।',
        'success'
      );

    } catch (error) {
      showMessage(getErrorMessage(error));

    } finally {
      setLoading(false);
    }
  }

  function changeMode() {
    if (loading) return;

    setMode(mode === 'login' ? 'signup' : 'login');

    setName('');
    setPassword('');
    setConfirmPassword('');
    setMessage('');
  }

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>

        <div style={logoStyle}>📸</div>

        <h1 style={headingStyle}>
          PHOTO AI STUDIO
        </h1>

        <h2 style={subHeadingStyle}>
          {mode === 'login'
            ? 'Welcome Back'
            : 'Create Your Account'}
        </h2>

        <p style={descriptionStyle}>
          {mode === 'login'
            ? 'Login करके अपने Photo AI Studio Account में जाएँ।'
            : 'अपना नया Photo AI Studio Account बनाएँ।'}
        </p>

        {mode === 'signup' && (
          <input
            required
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldStyle}
            disabled={loading}
            autoComplete="name"
            maxLength={80}
          />
        )}

        <input
          required
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={fieldStyle}
          disabled={loading}
          autoComplete="email"
        />

        <input
          required
          type="password"
          minLength={6}
          placeholder="Password (minimum 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={fieldStyle}
          disabled={loading}
          autoComplete={
            mode === 'login'
              ? 'current-password'
              : 'new-password'
          }
        />

        {mode === 'signup' && (
          <input
            required
            type="password"
            minLength={6}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={fieldStyle}
            disabled={loading}
            autoComplete="new-password"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading
            ? 'Please wait...'
            : mode === 'login'
              ? 'Login'
              : 'Create Account'}
        </button>

        <div style={dividerStyle}>
          <span>OR</span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          style={{
            ...googleStyle,
            opacity: loading ? 0.6 : 1
          }}
        >
          <span style={{ fontWeight: 'bold', marginRight: 8 }}>
            G
          </span>
          Continue with Google
        </button>

        {mode === 'login' && (
          <button
            type="button"
            disabled={loading}
            onClick={handleReset}
            style={linkStyle}
          >
            Forgot Password?
          </button>
        )}

        {message && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              ...messageStyle,
              color: messageType === 'success'
                ? '#7df5a5'
                : '#ffaaaa'
            }}
          >
            {message}
          </div>
        )}

        <div style={bottomTextStyle}>
          {mode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'}

          <button
            type="button"
            disabled={loading}
            onClick={changeMode}
            style={linkStyle}
          >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>

        <p style={footerStyle}>
          Secure Authentication powered by Firebase
        </p>

      </form>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#101426',
  padding: 20,
  color: 'white',
  boxSizing: 'border-box'
};

const formStyle = {
  width: '100%',
  maxWidth: 420,
  background: '#1b2238',
  padding: 30,
  borderRadius: 18,
  boxSizing: 'border-box',
  boxShadow: '0 15px 50px rgba(0,0,0,0.35)'
};

const logoStyle = {
  textAlign: 'center',
  fontSize: 38,
  marginBottom: 8
};

const headingStyle = {
  textAlign: 'center',
  fontSize: 25,
  margin: '5px 0'
};

const subHeadingStyle = {
  textAlign: 'center',
  fontSize: 21,
  margin: '20px 0 8px'
};

const descriptionStyle = {
  textAlign: 'center',
  color: '#aab3ca',
  fontSize: 13,
  marginBottom: 20
};

const fieldStyle = {
  width: '100%',
  padding: 13,
  margin: '9px 0',
  borderRadius: 8,
  border: '1px solid #46506b',
  background: '#11182b',
  color: 'white',
  boxSizing: 'border-box',
  fontSize: 14,
  outline: 'none'
};

const buttonStyle = {
  ...fieldStyle,
  background: '#7257ed',
  border: 0,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: 15
};

const googleStyle = {
  ...fieldStyle,
  background: 'white',
  color: '#222',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const dividerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#8993aa',
  fontSize: 12,
  margin: '12px 0'
};

const linkStyle = {
  display: 'inline-block',
  background: 'none',
  border: 0,
  color: '#a99aff',
  cursor: 'pointer',
  padding: 8,
  fontSize: 13
};

const messageStyle = {
  marginTop: 15,
  padding: 12,
  borderRadius: 8,
  background: '#11182b',
  fontSize: 13,
  overflowWrap: 'anywhere'
};

const bottomTextStyle = {
  textAlign: 'center',
  marginTop: 18,
  fontSize: 13,
  color: '#c5cbe0'
};

const footerStyle = {
  textAlign: 'center',
  color: '#78839d',
  fontSize: 11,
  marginTop: 22
};