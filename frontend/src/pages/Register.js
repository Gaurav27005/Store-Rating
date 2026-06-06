import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const validate = (form) => {
  const name = form.name.trim();
  if (!name) return 'Name is required';
  if (name.length < 20) return 'Name must be at least 20 characters';
  if (name.length > 60) return 'Name must be at most 60 characters';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Invalid email address';
  if (form.password.length < 8 || form.password.length > 16) return 'Password must be 8–16 characters';
  if (!/[A-Z]/.test(form.password)) return 'Password must include an uppercase letter';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return 'Password must include a special character';
  if (form.address && form.address.length > 400) return 'Address must be at most 400 characters';
  return null;
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const trimmed = form.name.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate(form);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim() });
      toast('Account created! Welcome to RateStore.');
      navigate(form.role === 'store_owner' ? '/owner/dashboard' : '/stores');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const dots = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="auth-left-icon">RS</div>
          <div className="auth-left-brand">RateStore</div>
        </div>
        <h1 className="auth-left-heading">Join the<br /><em>community.</em></h1>
        <p className="auth-left-sub">Create your account and start rating stores across India. Your reviews help others make better choices.</p>
        <div className="auth-dots">
          {dots.map(i => <div key={i} className={`auth-dot${i % 4 === 1 ? ' lit' : ''}`} />)}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap" style={{ maxWidth: 440 }}>
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">Fill in your details to get started</p>

          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" placeholder="e.g. Rahul Pratap Singh"
                value={form.name} onChange={set('name')} required />
              <div className="form-hint" style={{ color: trimmed.length > 60 ? 'var(--danger)' : trimmed.length >= 20 ? 'var(--success)' : 'var(--text-3)' }}>
                {trimmed.length}/60 {trimmed.length < 20 ? `— need ${20 - trimmed.length} more` : '✓'}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="Create a strong password"
                value={form.password} onChange={set('password')} required />
            </div>

            <div className="form-group">
              <label className="form-label">I am a...</label>
              <select className="form-input" value={form.role} onChange={set('role')}>
                <option value="user">Normal User</option>
                <option value="store_owner">Store Owner</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Address <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="form-textarea" placeholder="Your address…"
                value={form.address} onChange={set('address')} rows={2} />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><span className="spinner" style={{ width: 15, height: 15, borderTopColor: '#fff' }} /> Creating…</> : 'Create Account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--text-2)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}