import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Ico = ({ children }) => children;

const ICONS = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  users:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  stores:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  star:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  lock:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  logout:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  user:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const ROLE_LABELS = { admin: 'Administrator', user: 'Normal User', store_owner: 'Store Owner' };

const NAV = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard',       icon: ICONS.dashboard },
    { to: '/admin/users',     label: 'Manage Users',    icon: ICONS.users },
    { to: '/admin/stores',    label: 'Manage Stores',   icon: ICONS.stores },
    { to: '/change-password', label: 'Change Password', icon: ICONS.lock },
  ],
  store_owner: [
    { to: '/owner/dashboard', label: 'My Stores',       icon: ICONS.star },
    { to: '/owner/profile',   label: 'Edit Profile',    icon: ICONS.user },
    { to: '/change-password', label: 'Change Password', icon: ICONS.lock },
  ],
  user: [
    { to: '/stores',          label: 'Browse Stores',   icon: ICONS.stores },
    { to: '/change-password', label: 'Change Password', icon: ICONS.lock },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const handleLogout = () => {
    logout();
    toast('You have been signed out.');
    navigate('/login');
  };

  const links = NAV[user?.role] || NAV.user;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">RS</div>
        <div className="sidebar-logo-text">Rate<span>Store</span></div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            <Ico>{link.icon}</Ico>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
            <div className="sidebar-user-role">{ROLE_LABELS[user?.role]}</div>
          </div>
        </div>
        <button className="sidebar-item" onClick={handleLogout}>
          <Ico>{ICONS.logout}</Ico>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
