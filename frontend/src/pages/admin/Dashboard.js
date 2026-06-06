import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function StatCard({ label, value, icon, color, delay, link }) {
  const inner = (
    <div className="stat-card" style={{ animationDelay: delay, cursor: link ? 'pointer' : 'default' }}>
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value ?? <span className="spinner" style={{ width: 22, height: 22 }} />}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

const ICONS = {
  users:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  stores:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  ratings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  pending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

const TYPE_LABEL = { add_store: 'Add Store', edit_store: 'Edit Store', delete_store: 'Delete Store' };
const TYPE_COLOR = { add_store: 'badge-green', edit_store: 'badge-amber', delete_store: 'badge-terra' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast    = useToast();
  const [stats,    setStats]    = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard').then(r => setStats(r.data)),
      api.get('/admin/requests?status=pending').then(r => setRequests(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    setActioning(id + action);
    try {
      await api.patch(`/admin/requests/${id}/${action}`);
      toast(action === 'approve' ? 'Request approved!' : 'Request rejected.', action === 'approve' ? 'success' : 'error');
      const [s, r] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/requests?status=pending'),
      ]);
      setStats(s.data);
      setRequests(r.data);
    } catch (e) {
      toast(e.response?.data?.error || 'Action failed', 'error');
    } finally { setActioning(null); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name?.split(' ')[0]}. Here's your platform at a glance.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Users"        value={loading ? null : stats?.totalUsers}   color="forest" delay="0ms"   icon={ICONS.users}   link="/admin/users" />
        <StatCard label="Total Stores"       value={loading ? null : stats?.totalStores}  color="green"  delay="60ms"  icon={ICONS.stores}  link="/admin/stores" />
        <StatCard label="Ratings Submitted"  value={loading ? null : stats?.totalRatings} color="amber"  delay="120ms" icon={ICONS.ratings} />
        <StatCard label="Pending Requests"   value={loading ? null : requests.length}     color="terra"  delay="180ms" icon={ICONS.pending} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { to: '/admin/users',  label: 'Add New User',  icon: '+ User' },
              { to: '/admin/stores', label: 'Add New Store', icon: '+ Store' },
              { to: '/admin/users',  label: 'Manage Users',  icon: '→' },
              { to: '/admin/stores', label: 'Manage Stores', icon: '→' },
            ].map((a, i) => (
              <Link key={i} to={a.to} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s',
                  fontSize: 13.5, fontWeight: 500, color: 'var(--text)',
                }}>
                  {a.label}
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{a.icon}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <div className="card-header"><div className="card-title">Platform Summary</div></div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}><div className="spinner" /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Registered Users',     val: stats?.totalUsers },
                { label: 'Active Stores',         val: stats?.totalStores },
                { label: 'Total Reviews',         val: stats?.totalRatings },
                { label: 'Avg. Reviews / Store',  val: stats?.totalStores ? (stats.totalRatings / stats.totalStores).toFixed(1) : '0.0' },
                { label: 'Pending Requests',      val: requests.length },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: 15 }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Store Requests */}
      {requests.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Pending Store Requests</div>
            <span className="badge badge-terra">{requests.length} pending</span>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Owner</th><th>Type</th><th>Store Name</th><th>Email</th><th>Address</th><th>Requested</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.user_name}<div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.user_email}</div></td>
                    <td><span className={`badge ${TYPE_COLOR[r.type]}`}>{TYPE_LABEL[r.type]}</span></td>
                    <td>{r.store_name || r.store_name_ref || '—'}</td>
                    <td className="td-email">{r.store_email || '—'}</td>
                    <td className="td-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.store_address || '—'}</td>
                    <td className="td-muted">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-primary"
                          disabled={actioning === r.id+'approve'}
                          onClick={() => handleAction(r.id, 'approve')}>
                          {actioning === r.id+'approve' ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} /> : '✓ Approve'}
                        </button>
                        <button className="btn btn-sm btn-danger"
                          disabled={actioning === r.id+'reject'}
                          onClick={() => handleAction(r.id, 'reject')}>
                          {actioning === r.id+'reject' ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '✕ Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
