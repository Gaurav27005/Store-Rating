import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true);

  // Global Feedback Modal State
  const [showModal, setShowModal] = useState(false);
  const [allReviews, setAllReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Filtering states
  const [filterStore, setFilterStore] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (err) {
      toast('Failed to load dashboard stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRatings = async (storeSearch = '', order = 'DESC') => {
    setShowModal(true);
    setLoadingReviews(true);
    try {
      const { data } = await api.get('/admin/all-ratings', { 
        params: { storeName: storeSearch, sort: 'updated_at', order: order } 
      });
      setAllReviews(data);
    } catch (err) {
      toast('Failed to load ratings', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/ratings/${id}`);
      toast('Rating deleted successfully');
      setAllReviews(allReviews.filter(r => r.id !== id));
      fetchStats(); 
    } catch (err) {
      toast('Failed to delete rating', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating) => {
    return [1,2,3,4,5].map(s => <span key={s} style={{color: s<=rating ? '#fbbf24' : '#e5e7eb'}}>★</span>);
  };

  if (loading) return <div className="page-header"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
      </div>

      {/* Stats Grid using your original CSS classes */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Stores</div>
          <div className="stat-value">{stats.totalStores}</div>
        </div>
        {/* Clickable Ratings Box */}
        <div className="stat-card" onClick={() => handleOpenRatings()} style={{ cursor: 'pointer', border: '1px solid #3b82f6' }}>
          <div className="stat-label" style={{ color: '#3b82f6' }}>Total Ratings (Click to view)</div>
          <div className="stat-value">{stats.totalRatings}</div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">All System Feedback</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {/* Filter Bar */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input className="filter-input" placeholder="Filter by store name..." value={filterStore} onChange={e => setFilterStore(e.target.value)} />
                <select className="filter-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                  <option value="DESC">Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
                <button className="btn btn-primary" onClick={() => handleOpenRatings(filterStore, sortOrder)}>Apply</button>
              </div>

              {loadingReviews ? (
                <p>Loading...</p>
              ) : allReviews.length === 0 ? (
                <p>No feedback found.</p>
              ) : (
                allReviews.map(review => (
                  <div key={review.id} className="card" style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{review.reviewer_name}</strong> on <strong>{review.store_name}</strong>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(review.id)} disabled={deletingId === review.id}>
                        {deletingId === review.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                    <div>{renderStars(review.rating)}</div>
                    {review.feedback && <p>"{review.feedback}"</p>}
                    <small>{new Date(review.updated_at).toLocaleString()}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}