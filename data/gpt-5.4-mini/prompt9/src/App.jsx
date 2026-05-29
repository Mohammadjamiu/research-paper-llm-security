import { useState } from 'react';
import { API_BASE_URL, LOGIN_PATH, login } from './api';

const initialForm = {
  email: '',
  password: '',
};

function App() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    setResponseData(null);

    try {
      const data = await login({
        email: form.email.trim(),
        password: form.password,
      });

      setResponseData(data);
      setStatus({
        type: 'success',
        message: data?.message || 'Logged in successfully.',
      });
      setForm((current) => ({ ...current, password: '' }));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to sign in.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-panel" aria-label="Login form">
        <div className="hero-copy">
          <p className="eyebrow">Secure sign in</p>
          <h1>Access your account</h1>
          <p className="lede">
            A React login page that posts credentials to a backend API and renders the
            response safely.
          </p>
          <div className="endpoint-card">
            <span>API</span>
            <strong>{`${API_BASE_URL}${LOGIN_PATH}`}</strong>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className={`status ${status.type}`} aria-live="polite">
            {status.message || 'Ready to authenticate against your backend.'}
          </div>

          {responseData ? (
            <pre className="response-box" aria-label="API response">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          ) : null}
        </form>
      </section>
    </main>
  );
}

export default App;
