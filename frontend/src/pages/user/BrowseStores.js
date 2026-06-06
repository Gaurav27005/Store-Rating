import React, { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import { StarDisplay, StarInput } from '../../components/StarRating';

const RATING_LABELS = ['','Poor','Fair','Good','Very Good','Excellent'];

export default function BrowseStores() {
  const toast = useToast();
  const [stores,      setStores]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [sort,        setSort]        = useState('name');
  const [order,       setOrder]       = useState('ASC');
  const [filters,     setFilters]     = useState({ name:'', address:'' });
  const [page,        setPage]        = useState(1);
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingVal,   setRatingVal]   = useState(0);
  const [submitting,  setSubmitting]  = useState(false);
  const limit = 12;

  const qRef = useRef({ sort, order, filters, page });
  qRef.current = { sort, order, filters, page };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { sort:s, order:o, filters:f, page:p } = qRef.current;
      const params = { sort:s, order:o, page:p, limit };
      if (f.name) params.name=f.name;
      if (f.address) params.address=f.address;
      const { data } = await api.get('/stores', { params });
      setStores(data.stores); setTotal(data.total);
    } catch { toast('Failed to load stores','error'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStores(); }, [sort, order, filters, page]);

  const handleSort = f => {
    if (sort===f) setOrder(o=>o==='ASC'?'DESC':'ASC');
    else { setSort(f); setOrder(f==='avg_rating'?'DESC':'ASC'); }
    setPage(1);
  };

  const openRating = store => { setRatingModal(store); setRatingVal(store.user_rating||0); };

  const submitRating = async () => {
    if (!ratingVal) { toast('Please select a rating','error'); return; }
    setSubmitting(true);
    try {
      await api.post(`/stores/${ratingModal.id}/rate`, { rating:ratingVal });
      toast(ratingModal.user_rating ? 'Rating updated!' : 'Rating submitted!');
      setRatingModal(null);
      fetchStores();
    } catch(e) { toast(e.response?.data?.error||'Failed','error'); }
    finally { setSubmitting(false); }
  };

  const totalPages = Math.ceil(total/limit);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse Stores</h1>
        <p className="page-subtitle">Discover and rate stores on the platform</p>
      </div>

      <div className="filters-bar" style={{marginBottom:22}}>
        <div className="filter-group" style={{flex:1,minWidth:180}}>
          <div className="filter-label">Search by Name</div>
          <input className="filter-input" placeholder="Store name…" value={filters.name}
            onChange={e=>{ setFilters(f=>({...f,name:e.target.value})); setPage(1); }}/>
        </div>
        <div className="filter-group" style={{flex:1,minWidth:180}}>
          <div className="filter-label">Search by Address</div>
          <input className="filter-input" placeholder="Area or city…" value={filters.address}
            onChange={e=>{ setFilters(f=>({...f,address:e.target.value})); setPage(1); }}/>
        </div>
        <div className="filter-group">
          <div className="filter-label">Sort</div>
          <div style={{display:'flex',gap:6}}>
            {[['name','Name'],['avg_rating','Rating']].map(([f,l])=>(
              <button key={f} className={`btn btn-sm ${sort===f?'btn-primary':'btn-secondary'}`} onClick={()=>handleSort(f)}>
                {l} {sort===f?(order==='ASC'?'↑':'↓'):''}
              </button>
            ))}
          </div>
        </div>
        {(filters.name||filters.address) && (
          <div className="filter-group" style={{justifyContent:'flex-end'}}>
            <div className="filter-label">&nbsp;</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>{ setFilters({name:'',address:''}); setPage(1); }}>Clear</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"/></div>
      ) : stores.length===0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">🏪</div><div className="empty-state-title">No stores found</div><div className="empty-state-desc">Try a different search</div></div></div>
      ) : (
        <>
          <div style={{marginBottom:12,fontSize:12.5,color:'var(--text-2)'}}>
            Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total} stores
          </div>
          <div className="stores-grid">
            {stores.map((store,i)=>(
              <div className="store-card" key={store.id} style={{animationDelay:`${i*30}ms`}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:6}}>
                  <div className="store-card-name">{store.name}</div>
                  {store.user_rating && <span className="badge badge-green" style={{fontSize:11,flexShrink:0}}>Rated</span>}
                </div>
                <div className="store-card-address">
                  {store.address || <em style={{color:'var(--text-3)'}}>No address listed</em>}
                </div>
                <div className="store-card-ratings">
                  {store.avg_rating ? (
                    <>
                      <span className="avg-rating-badge">★ {parseFloat(store.avg_rating).toFixed(1)}</span>
                      <StarDisplay rating={parseFloat(store.avg_rating)} size={12}/>
                      <span style={{fontSize:11.5,color:'var(--text-3)'}}>({store.rating_count} {parseInt(store.rating_count)===1?'review':'reviews'})</span>
                    </>
                  ) : <span style={{fontSize:12,color:'var(--text-3)',fontStyle:'italic'}}>No ratings yet</span>}
                </div>
                {store.user_rating && (
                  <div style={{marginBottom:12,fontSize:12,color:'var(--text-2)'}}>
                    Your rating: <span style={{color:'var(--warning)',fontWeight:700}}>{'★'.repeat(store.user_rating)}{'☆'.repeat(5-store.user_rating)}</span>
                    {' '}<span style={{color:'var(--text-3)'}}>{RATING_LABELS[store.user_rating]}</span>
                  </div>
                )}
                <div className="store-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={()=>openRating(store)}>
                    {store.user_rating ? '✏ Modify Rating' : '★ Rate Store'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages>1 && (
            <div className="pagination" style={{marginTop:20,background:'var(--surface)',borderRadius:'var(--radius)',border:'1.5px solid var(--border)'}}>
              <span>Page {page} of {totalPages} · {total} total</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(1)}>«</button>
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
                {Array.from({length:totalPages},(_,i)=>i+1)
                  .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
                  .reduce((acc,p,idx,arr)=>{ if(idx>0&&p-arr[idx-1]>1) acc.push('…'); acc.push(p); return acc; },[])
                  .map((p,i)=> p==='…'
                    ? <span key={`e${i}`} style={{padding:'0 3px',color:'var(--text-3)',alignSelf:'center',fontSize:12}}>…</span>
                    : <button key={p} className={`page-btn${page===p?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
                  )}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(totalPages)}>»</button>
              </div>
            </div>
          )}
        </>
      )}

      {ratingModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setRatingModal(null)}}>
          <div className="modal" style={{maxWidth:400}}>
            <div className="modal-header">
              <div className="modal-title">{ratingModal.user_rating?'Update Rating':'Rate Store'}</div>
              <button className="modal-close" onClick={()=>setRatingModal(null)}>✕</button>
            </div>
            <p style={{fontSize:13.5,color:'var(--text-2)',marginBottom:20}}>
              Rating <strong style={{color:'var(--text)'}}>{ratingModal.name}</strong>
            </p>
            <div style={{marginBottom:8}}>
              <div className="form-label" style={{marginBottom:12}}>Select your rating</div>
              <StarInput value={ratingVal} onChange={setRatingVal}/>
              {ratingVal>0 && (
                <div style={{marginTop:10,fontSize:13.5,color:'var(--text-2)',display:'flex',alignItems:'center',gap:8}}>
                  <span style={{color:'var(--warning)',fontWeight:700,fontSize:20}}>{'★'.repeat(ratingVal)}</span>
                  <span style={{fontWeight:600}}>{RATING_LABELS[ratingVal]}</span>
                  <span style={{color:'var(--text-3)'}}>({ratingVal}/5)</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setRatingModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitRating} disabled={submitting||!ratingVal}>
                {submitting?<><span className="spinner" style={{width:13,height:13,borderTopColor:'#fff'}}/> Submitting…</>:ratingModal.user_rating?'Update':'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
