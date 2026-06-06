import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';

export default function BrowseStores() {
  const toast = useToast();
  const [stores, setStores] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', address: '' });
  
  // Modal states
  const [selectedStore, setSelectedStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rating: 0, feedback: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.address) params.address = filters.address;
      const { data } = await api.get('/stores', { params });
      setStores(data.stores);
      setTotal(data.total);
    } catch (err) {
      toast('Failed to load stores', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [filters]);

  const openStoreDetails = async (store) => {
    setSelectedStore(store);
    setRatingForm({
      rating: store.user_rating || 0,
      feedback: store.user_feedback || ''
    });
    setLoadingReviews(true);
    try {
      const { data } = await api.get(`/stores/${store.id}/reviews`);
      setReviews(data);
    } catch (err) {
      toast('Failed to load reviews', 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  const closeStoreDetails = () => {
    setSelectedStore(null);
    setReviews([]);
    setRatingForm({ rating: 0, feedback: '' });
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (ratingForm.rating === 0) return toast('Please select a rating', 'error');
    setSubmitting(true);
    try {
      await api.post(`/stores/${selectedStore.id}/rate`, ratingForm);
      toast('Feedback submitted successfully!');
      
      // Refresh list
      await fetchStores();
      
      // Close Modal
      closeStoreDetails();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return [1, 2, 3, 4, 5].map(star => (
      <span
        key={star}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          color: star <= rating ? '#fbbf24' : '#e5e7eb',
          fontSize: '1.5rem',
          marginRight: '2px'
        }}
        onClick={() => interactive && setRatingForm({ ...ratingForm, rating: star })}
      >
        ★
      </span>
    ));
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Browse Stores</h1>
          <p className="page-subtitle">Discover and rate stores ({total} available)</p>
        </div>
      </div>

      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <input className="filter-input" placeholder="Search by name..." value={filters.name} onChange={e => setFilters({ ...filters, name: e.target.value })} />
        <input className="filter-input" placeholder="Search by address..." value={filters.address} onChange={e => setFilters({ ...filters, address: e.target.value })} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {stores.map(store => (
            <div 
              key={store.id} 
              style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', cursor: 'pointer', backgroundColor: '#fff' }}
              onClick={() => openStoreDetails(store)}
            >
              <h3 style={{ margin: '0 0 5px 0' }}>{store.name}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{store.address || 'No address'}</p>
              <p style={{ color: '#3b82f6', fontSize: '0.85rem' }}>Owner: {store.owner_email || 'Not assigned'}</p>
              <div><strong>{store.avg_rating || 'No'}</strong> ★ ({store.rating_count} reviews)</div>
            </div>
          ))}
        </div>
      )}

      {selectedStore && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeStoreDetails()}>
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">{selectedStore.name}</div>
              <button className="modal-close" onClick={closeStoreDetails}>✕</button>
            </div>
            
            <div style={{ padding: '20px', backgroundColor: '#f9fafb' }}>
              <h4>Leave a Review</h4>
              <form onSubmit={handleRatingSubmit}>
                {renderStars(ratingForm.rating, true)}
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  style={{ width: '100%', margin: '10px 0' }}
                  value={ratingForm.feedback}
                  onChange={e => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                />
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            <div style={{ padding: '20px' }}>
              <h4>Community Reviews</h4>
              {loadingReviews ? <p>Loading...</p> : reviews.map(r => (
                <div key={r.id} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                  <strong>{r.reviewer_name}</strong> {renderStars(r.rating)}
                  <p>"{r.feedback}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}