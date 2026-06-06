import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [loading, setLoading] = useState(true);

  // Requests State
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

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
    fetchRequests();
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

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/admin/requests');
      setRequests(data);
    } catch (err) {
      toast('Failed to load pending requests', 'error');
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (id) => {
    try {
      await api.patch(`/admin/requests/${id}/approve`);
      toast('Request approved successfully');
      setRequests(requests.filter(r => r.id !== id));
      fetchStats(); // Refresh stats in case a store was added
    } catch (err) {
      toast('Failed to approve request', 'error');
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

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Stores</div>
          <div className="stat-value">{stats.totalStores}</div>
        </div>
        <div className="stat-card" onClick={() => handleOpenRatings()} style={{ cursor: 'pointer', border: '1px solid #3b82f6' }}>
          <div className="stat-label" style={{ color: '#3b82f6' }}>Total Ratings (Click to view)</div>
          <div className="stat-value">{stats.totalRatings}</div>
        </div>
      </div>

      {/* --- PENDING REQUESTS SECTION --- */}
      <div className="card" style={{ marginTop: '30px' }}>
        <h2 className="card-title" style={{ marginBottom: '20px' }}>Pending Store Requests</h2>
        {loadingRequests ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="td-muted">No pending requests at this time.</p>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Request Type</th>
                  <th>Store Details</th>
                  <th>Note</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.user_name}</td>
                    <td>
                      <span className={`badge ${req.type === 'add_store' ? 'badge-green' : req.type === 'delete_store' ? 'badge-terra' : 'badge-amber'}`}>
                        {req.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {req.store_name ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{req.store_name}</div>
                          <div className="td-muted">{req.store_email}</div>
                          <div className="td-muted" style={{ fontSize: '11px' }}>{req.store_address}</div>
                        </>
                      ) : (
                        <span className="td-muted">N/A</span>
                      )}
                    </td>
                    <td className="td-muted">{req.note || 'None'}</td>
                    <td className="td-muted">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleApproveRequest(req.id)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- RATINGS MODAL --- */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget) setShowModal(false); }}>
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">All System Feedback</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <div style={{ padding: '20px' }}>
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