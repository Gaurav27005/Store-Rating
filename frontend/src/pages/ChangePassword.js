import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const validatePwd = (p) => {
  if (p.length < 8 || p.length > 16) return 'Password must be 8–16 characters';
  if (!/[A-Z]/.test(p)) return 'Must include at least one uppercase letter';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(p)) return 'Must include at least one special character';
  return null;
};

export default function ChangePassword() {
  const { updatePassword } = useAuth();
  const toast              = useToast();

  const [form,    setForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(''); setSuccess(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!form.currentPassword) { setError('Please enter your current password'); return; }
    const err = validatePwd(form.newPassword);
    if (err) { setError(err); return; }
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match'); return; }
    if (form.newPassword === form.currentPassword) { setError('New password must be different from current password'); return; }

    setLoading(true);
    try {
      await updatePassword(form.currentPassword, form.newPassword);
      toast('Password updated successfully!');
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div className="page-header">
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">Update your account password</p>
      </div>

      <div className="card">
        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <span>✓</span> Your password has been updated successfully.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={set('currentPassword')}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="divider" />

          <div className="form-group">
            <label className="form-label">
              New Password{' '}
              <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(8–16 chars, 1 uppercase, 1 special)</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={set('newPassword')}
              autoComplete="new-password"
              required
            />
            {form.newPassword && (
              <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  [form.newPassword.length >= 8 && form.newPassword.length <= 16, '8–16 characters'],
                  [/[A-Z]/.test(form.newPassword), 'Contains uppercase letter'],
                  [/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword), 'Contains special character'],
                ].map(([ok, label]) => (
                  <div key={label} style={{ fontSize: 12, color: ok ? 'var(--success)' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{ok ? '✓' : '○'}</span> {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Repeat new password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              autoComplete="new-password"
              required
            />
            {form.confirmPassword && form.newPassword && (
              <div style={{ marginTop: 5, fontSize: 12, color: form.confirmPassword === form.newPassword ? 'var(--success)' : 'var(--danger)' }}>
                {form.confirmPassword === form.newPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <><span className="spinner" style={{ width: 15, height: 15 }} /> Updating…</>
              : 'Update Password'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
