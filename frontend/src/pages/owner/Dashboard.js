import React, { useEffect, useState } from 'react';

import api from '../../api';
import { StarDisplay } from '../../components/StarRating';
import SortableTh from '../../components/SortableTh';
import { useToast } from '../../context/ToastContext';

const RATING_LABELS = ['','Poor','Fair','Good','Very Good','Excellent'];

function StoreCard({ store, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding:'14px 18px', borderRadius:'var(--radius)', border:`2px solid ${active?'var(--accent)':'var(--border)'}`,
      background: active?'var(--accent-dim)':'var(--surface)', cursor:'pointer',
      transition:'all 0.15s', marginBottom:10,
    }}>
      <div style={{fontWeight:700,fontSize:14,color:active?'var(--accent)':'var(--text)'}}>{store.name}</div>
      <div style={{fontSize:12,color:'var(--text-2)',marginTop:3}}>{store.address||'No address'}</div>
      {store.avg_rating && (
        <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6}}>
          <StarDisplay rating={parseFloat(store.avg_rating)} size={11}/>
          <span style={{fontSize:12,fontWeight:700,color:'var(--warning)'}}>{parseFloat(store.avg_rating).toFixed(1)}</span>
          <span style={{fontSize:11,color:'var(--text-3)'}}>({store.total_ratings})</span>
        </div>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const toast = useToast();
  
  const [stores,       setStores]       = useState([]);
  const [activeStore,  setActiveStore]  = useState(null);
  const [storeData,    setStoreData]    = useState(null);
  const [loadingList,  setLoadingList]  = useState(true);
  const [loadingStore, setLoadingStore] = useState(false);
  const [sort,         setSort]         = useState('updated_at');
  const [order,        setOrder]        = useState('DESC');
  const [editModal,    setEditModal]    = useState(false);
  const [reqModal,     setReqModal]     = useState(false);
  const [editForm,     setEditForm]     = useState({ name:'',email:'',address:'' });
  const [reqForm,      setReqForm]      = useState({ type:'add_store',store_name:'',store_email:'',store_address:'',note:'' });
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState('');

  useEffect(() => {
    api.get('/owner/stores').then(r => {
      setStores(r.data);
      if (r.data.length > 0) setActiveStore(r.data[0]);
    }).catch(()=>{}).finally(()=>setLoadingList(false));
  }, []);

  useEffect(() => {
    if (!activeStore) return;
    setLoadingStore(true);
    api.get(`/owner/stores/${activeStore.id}`)
      .then(r => { setStoreData(r.data); setEditForm({ name:r.data.store.name, email:r.data.store.email, address:r.data.store.address||'' }); })
      .catch(()=>{})
      .finally(()=>setLoadingStore(false));
  }, [activeStore]);

  const handleSort = f => { if(sort===f) setOrder(o=>o==='ASC'?'DESC':'ASC'); else { setSort(f); setOrder('ASC'); } };

  const sorted = storeData?.raters ? [...storeData.raters].sort((a,b)=>{
    let va=a[sort], vb=b[sort];
    if (sort==='updated_at') { va=new Date(va).getTime(); vb=new Date(vb).getTime(); }
    else if (sort==='rating') { va=Number(va); vb=Number(vb); }
    else { va=String(va||'').toLowerCase(); vb=String(vb||'').toLowerCase(); }
    return (va<vb?-1:va>vb?1:0)*(order==='ASC'?1:-1);
  }) : [];

  const ratingDist = storeData ? [5,4,3,2,1].map(r=>({
    r, count: storeData.raters.filter(u=>u.rating===r).length,
    pct: storeData.totalRatings ? Math.round((storeData.raters.filter(u=>u.rating===r).length/storeData.totalRatings)*100) : 0,
  })) : [];

  const handleEditStore = async e => {
    e.preventDefault();
    setFormError('');
    if (!editForm.name.trim()) { setFormError('Name is required'); return; }
    if (editForm.name.trim().length > 60) { setFormError('Name must be at most 60 characters'); return; }
    setSubmitting(true);
    try {
      await api.put(`/owner/stores/${activeStore.id}`, editForm);
      toast('Store updated!');
      setEditModal(false);
      // refresh
      const [list, detail] = await Promise.all([
        api.get('/owner/stores'),
        api.get(`/owner/stores/${activeStore.id}`),
      ]);
      setStores(list.data);
      setActiveStore(list.data.find(s=>s.id===activeStore.id)||list.data[0]);
      setStoreData(detail.data);
    } catch(e) { setFormError(e.response?.data?.error||'Update failed'); }
    finally { setSubmitting(false); }
  };

  const handleRequest = async e => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = { type: reqForm.type, note: reqForm.note };
      if (reqForm.type==='add_store') {
        if (!reqForm.store_name.trim()) { setFormError('Store name required'); setSubmitting(false); return; }
        payload.store_name    = reqForm.store_name.trim();
        payload.store_email   = reqForm.store_email;
        payload.store_address = reqForm.store_address;
      } else {
        payload.store_id = activeStore?.id;
      }
      await api.post('/owner/requests', payload);
      toast('Request submitted to admin for review!');
      setReqModal(false);
      setReqForm({ type:'add_store', store_name:'', store_email:'', store_address:'', note:'' });
    } catch(e) { setFormError(e.response?.data?.error||'Request failed'); }
    finally { setSubmitting(false); }
  };

  if (loadingList) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header-row">
        <div><h1 className="page-title">My Stores</h1><p className="page-subtitle">{stores.length} store{stores.length!==1?'s':''} under your ownership</p></div>
        <button className="btn btn-secondary" onClick={()=>{ setFormError(''); setReqForm({ type:'add_store',store_name:'',store_email:'',store_address:'',note:'' }); setReqModal(true); }}>
          + Request New Store
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏪</div>
            <div className="empty-state-title">No stores assigned yet</div>
            <div className="empty-state-desc">Contact your administrator or submit a store request.</div>
            <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>{ setFormError(''); setReqModal(true); }}>Submit Store Request</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
          {/* Left: store list */}
          <div>
            <div className="card" style={{ padding:'16px 14px' }}>
              <div style={{fontWeight:700,fontSize:12,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.9px',marginBottom:10}}>Your Stores</div>
              {stores.map(s=>(
                <StoreCard key={s.id} store={s} active={activeStore?.id===s.id} onClick={()=>setActiveStore(s)}/>
              ))}
            </div>
          </div>

          {/* Right: store detail */}
          <div>
            {loadingStore ? (
              <div className="loading-screen" style={{minHeight:300}}><div className="spinner"/></div>
            ) : storeData ? (
              <>
                {/* Store header */}
                <div className="card" style={{marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                    <div>
                      <h2 style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:700,marginBottom:4}}>{storeData.store.name}</h2>
                      <div style={{fontSize:13,color:'var(--text-2)'}}>{storeData.store.email}</div>
                      {storeData.store.address && <div style={{fontSize:13,color:'var(--text-3)',marginTop:2}}>📍 {storeData.store.address}</div>}
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-secondary btn-sm" onClick={()=>{ setFormError(''); setEditModal(true); }}>✏ Edit data</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{ setFormError(''); setReqForm({type:'delete_store',store_name:'',store_email:'',store_address:'',note:''}); setReqModal(true); }} style={{color:'var(--danger)'}}>Request Delete</button>
                    </div>
                  </div>

                  <div className="divider" style={{margin:'14px 0'}}/>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    <div style={{textAlign:'center',padding:'12px',background:'var(--bg)',borderRadius:'var(--radius-sm)'}}>
                      <div style={{fontFamily:'var(--font-display)',fontSize:32,fontWeight:700,color:'var(--warning)'}}>
                        {storeData.avgRating ? parseFloat(storeData.avgRating).toFixed(2) : '—'}
                      </div>
                      <div style={{fontSize:12,color:'var(--text-2)',marginTop:4}}>Average Rating</div>
                      {storeData.avgRating && <StarDisplay rating={storeData.avgRating} size={14} style={{justifyContent:'center',marginTop:4}}/>}
                    </div>
                    <div style={{textAlign:'center',padding:'12px',background:'var(--bg)',borderRadius:'var(--radius-sm)'}}>
                      <div style={{fontFamily:'var(--font-display)',fontSize:32,fontWeight:700,color:'var(--accent)'}}>{storeData.totalRatings}</div>
                      <div style={{fontSize:12,color:'var(--text-2)',marginTop:4}}>Total Reviews</div>
                    </div>
                  </div>
                </div>

                {/* Rating breakdown */}
                {storeData.avgRating && (
                  <div className="card" style={{marginBottom:14}}>
                    <div className="card-title" style={{marginBottom:14}}>Rating Breakdown</div>
                    {ratingDist.map(({r,count,pct})=>(
                      <div key={r} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                        <span style={{color:'var(--warning)',width:55,fontSize:12.5,flexShrink:0}}>{'★'.repeat(r)} {r}</span>
                        <div style={{flex:1,height:7,background:'var(--surface-2)',borderRadius:99,overflow:'hidden'}}>
                          <div style={{width:`${pct}%`,height:'100%',borderRadius:99,transition:'width 0.5s ease',
                            background:r>=4?'var(--success)':r===3?'var(--warning)':'var(--danger)'}}/>
                        </div>
                        <span style={{fontSize:12,color:'var(--text-2)',width:65,textAlign:'right',flexShrink:0}}>{count} ({pct}%)</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviewers table */}
                <div className="card">
                  <div className="card-title" style={{marginBottom:14}}>Customer Reviews ({storeData.raters.length})</div>
                  {storeData.raters.length===0 ? (
                    <div className="empty-state" style={{padding:'30px 0'}}><div className="empty-state-icon">⭐</div><div className="empty-state-title">No reviews yet</div></div>
                  ) : (
                    <div className="table-container" style={{border:'none'}}>
                      <table>
                        <thead><tr>
                          <SortableTh field="name"       label="Customer"   sort={sort} order={order} onSort={handleSort}/>
                          <SortableTh field="email"      label="Email"      sort={sort} order={order} onSort={handleSort}/>
                          <th>Address</th>
                          <SortableTh field="rating"     label="Rating"     sort={sort} order={order} onSort={handleSort}/>
                          <SortableTh field="updated_at" label="Date"       sort={sort} order={order} onSort={handleSort}/>
                        </tr></thead>
                        <tbody>
                          {sorted.map(u=>(
                            <tr key={u.id}>
                              <td style={{fontWeight:600}}>{u.name}</td>
                              <td className="td-email">{u.email}</td>
                              <td className="td-muted" style={{maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.address||'—'}</td>
                              <td>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <StarDisplay rating={u.rating} size={12}/>
                                  <span style={{fontWeight:700,color:'var(--warning)',fontSize:12.5}}>{u.rating}/5</span>
                                  <span style={{fontSize:11,color:'var(--text-3)'}}>{RATING_LABELS[u.rating]}</span>
                                </div>
                              </td>
                              <td className="td-muted">{new Date(u.updated_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setEditModal(false)}}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Edit Store Details</div><button className="modal-close" onClick={()=>setEditModal(false)}>✕</button></div>
            {formError && <div className="alert alert-error"><span>⚠</span> {formError}</div>}
            <form onSubmit={handleEditStore}>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input className="form-input" value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} required/>
                <div className="form-hint">{editForm.name.trim().length}/60</div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-textarea" rows={2} value={editForm.address} onChange={e=>setEditForm({...editForm,address:e.target.value})}/>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting?<><span className="spinner" style={{width:13,height:13,borderTopColor:'#fff'}}/> Saving…</>:'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store Request Modal */}
      {reqModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setReqModal(false)}}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">Submit Store Request</div><button className="modal-close" onClick={()=>setReqModal(false)}>✕</button></div>
            {formError && <div className="alert alert-error"><span>⚠</span> {formError}</div>}
            <div className="alert alert-info" style={{marginBottom:14}}>
              <span>ℹ</span> Requests are reviewed by an administrator before being actioned.
            </div>
            <form onSubmit={handleRequest}>
              <div className="form-group">
                <label className="form-label">Request Type</label>
                <select className="form-select" value={reqForm.type} onChange={e=>setReqForm({...reqForm,type:e.target.value})}>
                  <option value="add_store">Add New Store</option>
                  {activeStore && <option value="edit_store">Request Store Edit</option>}
                  {activeStore && <option value="delete_store">Request Store Deletion</option>}
                </select>
              </div>
              {reqForm.type==='add_store' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Store Name</label>
                    <input className="form-input" placeholder="New store name" value={reqForm.store_name} onChange={e=>setReqForm({...reqForm,store_name:e.target.value})} required/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Store Email</label>
                    <input type="email" className="form-input" placeholder="store@email.com" value={reqForm.store_email} onChange={e=>setReqForm({...reqForm,store_email:e.target.value})}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Store Address</label>
                    <textarea className="form-textarea" rows={2} placeholder="Store address…" value={reqForm.store_address} onChange={e=>setReqForm({...reqForm,store_address:e.target.value})}/>
                  </div>
                </>
              )}
              {reqForm.type==='delete_store' && (
                <div className="alert alert-error" style={{marginBottom:14}}>
                  <span>⚠</span> You are requesting deletion of <strong>{activeStore?.name}</strong>. This will remove all ratings.
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Note to Admin <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
                <textarea className="form-textarea" rows={2} placeholder="Any additional context…" value={reqForm.note} onChange={e=>setReqForm({...reqForm,note:e.target.value})}/>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setReqModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting?<><span className="spinner" style={{width:13,height:13,borderTopColor:'#fff'}}/> Submitting…</>:'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
