import React, { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import SortableTh from '../../components/SortableTh';
import { StarDisplay } from '../../components/StarRating';

const validateStore = (f, isEdit=false) => {
  const name = f.name.trim();
  if (!name) return 'Store name is required';
  if (name.length > 60) return 'Name must be at most 60 characters';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Invalid email address';
  if (f.address && f.address.length > 400) return 'Address too long';
  return null;
};

const emptyForm = { name:'', email:'', address:'', owner_id:'' };

export default function AdminStores() {
  const toast = useToast();
  const [stores,     setStores]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [owners,     setOwners]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [sort,       setSort]       = useState('created_at');
  const [order,      setOrder]      = useState('DESC');
  const [filters,    setFilters]    = useState({ name:'', email:'', address:'' });
  const [modal,      setModal]      = useState(null);
  const [formError,  setFormError]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [form, setForm] = useState(emptyForm);

  const qRef = useRef({ sort, order, filters });
  qRef.current = { sort, order, filters };

  const fetchStores = async () => {
    setLoading(true);
    try {
      const { sort:s, order:o, filters:f } = qRef.current;
      const params = { sort:s, order:o };
      if (f.name) params.name=f.name;
      if (f.email) params.email=f.email;
      if (f.address) params.address=f.address;
      const { data } = await api.get('/admin/stores', { params });
      setStores(data.stores); setTotal(data.total);
    } catch { toast('Failed to load stores','error'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchStores(); }, [sort, order, filters]);
  useEffect(() => { api.get('/admin/store-owners').then(r=>setOwners(r.data)).catch(()=>{}); }, []);

  const handleSort = f => { if (sort===f) setOrder(o=>o==='ASC'?'DESC':'ASC'); else { setSort(f); setOrder('ASC'); } };
  const setFilter  = k => e => setFilters(f=>({...f,[k]:e.target.value}));

  const openAdd  = () => { setForm(emptyForm); setFormError(''); setModal('add'); };
  const openEdit = s => { setForm({ name:s.name, email:s.email, address:s.address||'', owner_id:s.owner_id||'' }); setFormError(''); setModal(s); };

  const handleSubmit = async e => {
    e.preventDefault();
    const isEdit = modal !== 'add';
    const err = validateStore(form, isEdit);
    if (err) { setFormError(err); return; }
    setFormError(''); setSubmitting(true);
    try {
      const payload = { name:form.name.trim(), email:form.email, address:form.address||undefined, owner_id:form.owner_id||undefined };
      if (isEdit) { await api.put(`/admin/stores/${modal.id}`, payload); toast('Store updated!'); }
      else        { await api.post('/admin/stores', payload); toast('Store created!'); }
      setModal(null); fetchStores();
    } catch(e) { setFormError(e.response?.data?.error||'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this store? All ratings will be removed permanently.')) return;
    setDeleting(id);
    try { await api.delete(`/admin/stores/${id}`); toast('Store deleted.'); fetchStores(); }
    catch(e) { toast(e.response?.data?.error||'Delete failed','error'); }
    finally { setDeleting(null); }
  };

  const isEdit   = modal && modal !== 'add';
  const trimName = form.name.trim();

  return (
    <div>
      <div className="page-header-row">
        <div><h1 className="page-title">Stores</h1><p className="page-subtitle">{total} stores on the platform</p></div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Store
        </button>
      </div>

      <div className="filters-bar">
        {[['name','Name'],['email','Email'],['address','Address']].map(([k,lbl])=>(
          <div className="filter-group" key={k}>
            <div className="filter-label">{lbl}</div>
            <input className="filter-input" placeholder={`Search ${lbl.toLowerCase()}…`} value={filters[k]} onChange={setFilter(k)}/>
          </div>
        ))}
        {(filters.name||filters.email||filters.address) && (
          <div className="filter-group" style={{justifyContent:'flex-end'}}>
            <div className="filter-label">&nbsp;</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setFilters({name:'',email:'',address:''})}>Clear</button>
          </div>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead><tr>
            <SortableTh field="name"       label="Store Name" sort={sort} order={order} onSort={handleSort}/>
            <SortableTh field="email"      label="Email"      sort={sort} order={order} onSort={handleSort}/>
            <SortableTh field="address"    label="Address"    sort={sort} order={order} onSort={handleSort}/>
            <th>Owner</th>
            <SortableTh field="avg_rating" label="Rating"     sort={sort} order={order} onSort={handleSort}/>
            <th>Reviews</th>
            <th style={{width:110}}>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{textAlign:'center',padding:48}}><div className="spinner" style={{margin:'0 auto'}}/></td></tr>
            ) : stores.length===0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">🏪</div><div className="empty-state-title">No stores found</div></div></td></tr>
            ) : stores.map(s=>(
              <tr key={s.id}>
                <td style={{fontWeight:600}}>{s.name}</td>
                <td className="td-email">{s.email}</td>
                <td className="td-muted" style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.address||'—'}</td>
                <td className="td-muted">{s.owner_name||<span style={{color:'var(--text-3)'}}>Unassigned</span>}</td>
                <td>
                  {s.avg_rating ? (
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <StarDisplay rating={parseFloat(s.avg_rating)} size={12}/>
                      <span style={{fontWeight:700,color:'var(--warning)',fontSize:12.5}}>{parseFloat(s.avg_rating).toFixed(1)}</span>
                    </div>
                  ) : <span className="td-muted">—</span>}
                </td>
                <td className="td-muted">{s.rating_count}</td>
                <td>
                  <div style={{display:'flex',gap:5}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(s)}>✏</button>
                    <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}}
                      disabled={deleting===s.id} onClick={()=>handleDelete(s.id)}>
                      {deleting===s.id ? <span className="spinner" style={{width:12,height:12}}/> : '🗑'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{isEdit ? 'Edit Store' : 'Add New Store'}</div>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            {formError && <div className="alert alert-error"><span>⚠</span> {formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input className="form-input" placeholder="e.g. Sharma General Store" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <div className="form-hint" style={{color:trimName.length>60?'var(--danger)':'var(--text-3)'}}>{trimName.length}/60</div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Address <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
                <textarea className="form-textarea" rows={2} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Owner <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
                <select className="form-select" value={form.owner_id} onChange={e=>setForm({...form,owner_id:e.target.value})}>
                  <option value="">— No owner —</option>
                  {owners.map(o=><option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" style={{width:13,height:13,borderTopColor:'#fff'}}/> Saving…</> : isEdit ? 'Save Changes' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
