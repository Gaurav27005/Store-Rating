import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'admin')       navigate('/admin/dashboard');
      else if (user.role === 'store_owner') navigate('/owner/dashboard');
      else navigate('/stores');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const dots = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="auth-left-icon">RS</div>
          <div className="auth-left-brand">RateStore</div>
        </div>
        <h1 className="auth-left-heading">
          Discover.<br /><em>Review.</em><br />Trust.
        </h1>
        <p className="auth-left-sub">
          A platform for honest store ratings across India. Every review shapes a better experience for everyone.
        </p>
        <div className="auth-dots">
          {dots.map(i => <div key={i} className={`auth-dot${i % 3 === 0 ? ' lit' : ''}`} />)}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-heading">Sign in</h1>
          <p className="auth-subheading">Enter your credentials to continue</p>

          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Your password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 6 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-2)' }}>
            Don't have an account?{' '}<Link to="/register">Register here</Link>
          </p>

          <div style={{ marginTop: 22, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-2)', borderLeft: '3px solid var(--accent)' }}>
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>Demo credentials</strong>
            Admin: admin@ratestore.com / Admin@123<br />
            User: rahul.singh@gmail.com / Ratestore@1
          </div>
        </div>
      </div>
    </div>
  );
}
