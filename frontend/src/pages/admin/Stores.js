import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import SortableTh from '../../components/SortableTh';

export default function AdminStores() {
  const toast = useToast();
  const [stores, setStores] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  
  // Modal states: 'add', 'edit' (store object), or 'reviews' (store object)
  const [modalType, setModalType] = useState(null); 
  const [activeStore, setActiveStore] = useState(null);
  
  // Review specific states
  const [reviews, setReviews] = useState([]);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [deletingStoreId, setDeletingStoreId] = useState(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = { sort, order };
      if (filters.name) params.name = filters.name;
      if (filters.email) params.email = filters.email;
      if (filters.address) params.address = filters.address;
      const { data } = await api.get('/admin/stores', { params });
      setStores(data.stores); setTotal(data.total);
    } catch { toast('Failed to load stores', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStores(); }, [sort, order, filters]);

  const handleSort = f => { if (sort===f) setOrder(o=>o==='ASC'?'DESC':'ASC'); else { setSort(f); setOrder('ASC'); } };
  const setFilter  = k => e => setFilters(f=>({...f,[k]:e.target.value}));

  // --- DELETE STORE LOGIC ---
  const handleDeleteStore = async (store) => {
    if (!window.confirm(`Are you sure you want to delete the store "${store.name}"? This action will also delete all ratings associated with it.`)) return;
    setDeletingStoreId(store.id);
    try {
      await api.delete(`/admin/stores/${store.id}`);
      toast('Store deleted successfully');
      setStores(stores.filter(s => s.id !== store.id));
      setTotal(t => t - 1);
    } catch (err) {
      toast('Failed to delete store', 'error');
    } finally {
      setDeletingStoreId(null);
    }
  };

  // --- REVIEWS MODAL LOGIC ---
  const openReviews = async (store) => {
    setActiveStore(store);
    setModalType('reviews');
    fetchReviews(store.id);
  };

  const fetchReviews = async (storeId) => {
    try {
      const { data } = await api.get(`/stores/${storeId}/reviews`);
      setReviews(data);
    } catch (err) { toast('Failed to load reviews', 'error'); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    setDeletingReviewId(reviewId);
    try {
      await api.delete(`/admin/ratings/${reviewId}`);
      toast('Review deleted successfully');
      fetchReviews(activeStore.id); // Refresh list
    } catch (err) {
      toast('Failed to delete review', 'error');
    } finally {
      setDeletingReviewId(null);
    }
  };

  const renderStars = (rating) => {
    return [1,2,3,4,5].map(s => <span key={s} style={{color: s<=rating ? '#fbbf24' : '#e5e7eb'}}>★</span>);
  };

  return (
    <div>
      <div className="page-header-row">
        <div><h1 className="page-title">Stores</h1><p className="page-subtitle">{total} stores registered</p></div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <div className="filter-label">Name</div>
          <input className="filter-input" value={filters.name} onChange={setFilter('name')} />
        </div>
        <div className="filter-group">
          <div className="filter-label">Address</div>
          <input className="filter-input" value={filters.address} onChange={setFilter('address')} />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortableTh field="name" label="Store Name" sort={sort} order={order} onSort={handleSort}/>
              <SortableTh field="address" label="Address" sort={sort} order={order} onSort={handleSort}/>
              <th>Owner Email</th>
              <SortableTh field="avg_rating" label="Avg Rating" sort={sort} order={order} onSort={handleSort}/>
              <th style={{width: 180}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{textAlign:'center',padding:48}}>Loading...</td></tr>
            ) : stores.map(s => (
              <tr key={s.id}>
                <td style={{fontWeight:600}}>{s.name}</td>
                <td className="td-muted" style={{maxWidth:200, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{s.address || '—'}</td>
                <td className="td-email">{s.owner_email || '—'}</td>
                <td>
                  {s.avg_rating ? (
                    <span style={{color:'var(--warning)',fontWeight:700}}>★ {parseFloat(s.avg_rating).toFixed(1)} <span style={{color:'var(--text-3)', fontSize:'0.8rem'}}>({s.rating_count})</span></span>
                  ) : <span className="td-muted">—</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openReviews(s)}>View Reviews</button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDeleteStore(s)}
                      disabled={deletingStoreId === s.id}
                    >
                      {deletingStoreId === s.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalType === 'reviews' && activeStore && (
        <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) setModalType(null); }}>
          <div className="modal" style={{ maxWidth: 650, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div className="modal-title">Reviews for {activeStore.name}</div>
              <button className="modal-close" onClick={()=>setModalType(null)}>✕</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {reviews.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280' }}>No reviews found for this store.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <strong>{review.reviewer_name}</strong>
                        <button 
                          className="btn btn-sm" 
                          style={{ color: 'var(--danger)', background: 'transparent', padding: '0 5px' }}
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deletingReviewId === review.id}
                        >
                          {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                      <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{renderStars(review.rating)}</div>
                      {review.feedback ? (
                        <p style={{ margin: 0, color: '#374151', whiteSpace: 'pre-wrap' }}>"{review.feedback}"</p>
                      ) : (
                        <p style={{ margin: 0, color: '#9ca3af', fontStyle: 'italic' }}>No text feedback provided.</p>
                      )}
                      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#9ca3af' }}>
                        Posted on: {new Date(review.updated_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}