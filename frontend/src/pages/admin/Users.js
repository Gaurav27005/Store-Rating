import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import SortableTh from '../../components/SortableTh';

const ROLE_BADGE = { admin: 'badge-forest', user: 'badge-green', store_owner: 'badge-amber' };
const ROLE_LABEL = { admin: 'Admin', user: 'User', store_owner: 'Store Owner' };

const validateForm = (f, isEdit = false) => {
  const name = f.name.trim();
  if (!name) return 'Name is required';
  if (name.length < 20) return 'Name must be at least 20 characters';
  if (name.length > 60) return 'Name must be at most 60 characters';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Invalid email address';
  if (!isEdit) {
    if (f.password.length < 8 || f.password.length > 16) return 'Password must be 8–16 characters';
    if (!/[A-Z]/.test(f.password)) return 'Password needs an uppercase letter';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(f.password)) return 'Password needs a special character';
  }
  if (f.address && f.address.length > 400) return 'Address is too long';
  return null;
};

const emptyForm = { name: '', email: '', password: '', address: '', role: 'user' };

export default function AdminUsers() {
  const toast    = useToast();
  const navigate = useNavigate();

  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [sort,       setSort]       = useState('created_at');
  const [order,      setOrder]      = useState('DESC');
  const [filters,    setFilters]    = useState({ name:'', email:'', address:'', role:'' });
  const [modal,      setModal]      = useState(null); // null | 'add' | {user}
  const [formError,  setFormError]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [form, setForm] = useState(emptyForm);

  const qRef = useRef({ sort, order, filters });
  qRef.current = { sort, order, filters };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { sort:s, order:o, filters:f } = qRef.current;
      const params = { sort:s, order:o };
      if (f.name) params.name = f.name;
      if (f.email) params.email = f.email;
      if (f.address) params.address = f.address;
      if (f.role) params.role = f.role;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users); setTotal(data.total);
    } catch { toast('Failed to load users','error'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUsers(); }, [sort, order, filters]);

  const handleSort = f => { if (sort===f) setOrder(o=>o==='ASC'?'DESC':'ASC'); else { setSort(f); setOrder('ASC'); } };
  const setFilter  = k => e => setFilters(f=>({...f,[k]:e.target.value}));

  const openAdd = () => { setForm(emptyForm); setFormError(''); setModal('add'); };
  const openEdit = u => { setForm({ name:u.name, email:u.email, password:'', address:u.address||'', role:u.role }); setFormError(''); setModal(u); };

  const handleSubmit = async e => {
    e.preventDefault();
    const isEdit = modal !== 'add';
    const err = validateForm(form, isEdit);
    if (err) { setFormError(err); return; }
    setFormError(''); setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/admin/users/${modal.id}`, { name:form.name.trim(), email:form.email, address:form.address, role:form.role });
        toast('User updated successfully!');
      } else {
        await api.post('/admin/users', { ...form, name:form.name.trim() });
        toast('User created successfully!');
      }
      setModal(null); fetchUsers();
    } catch(e) { setFormError(e.response?.data?.error||'Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast('User deleted.'); fetchUsers();
    } catch(e) { toast(e.response?.data?.error||'Delete failed','error'); }
    finally { setDeleting(null); }
  };

  const isEdit    = modal && modal !== 'add';
  const trimName  = form.name.trim();

  return (
    <div>
      <div className="page-header-row">
        <div><h1 className="page-title">Users</h1><p className="page-subtitle">{total} users on the platform</p></div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      <div className="filters-bar">
        {[['name','Name'],['email','Email'],['address','Address']].map(([k,lbl])=>(
          <div className="filter-group" key={k}>
            <div className="filter-label">{lbl}</div>
            <input className="filter-input" placeholder={`Search ${lbl.toLowerCase()}…`} value={filters[k]} onChange={setFilter(k)} />
          </div>
        ))}
        <div className="filter-group" style={{ minWidth:140 }}>
          <div className="filter-label">Role</div>
          <select className="filter-input form-select" value={filters.role} onChange={setFilter('role')}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="store_owner">Store Owner</option>
          </select>
        </div>
        {(filters.name||filters.email||filters.address||filters.role) && (
          <div className="filter-group" style={{ justifyContent:'flex-end' }}>
            <div className="filter-label">&nbsp;</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setFilters({name:'',email:'',address:'',role:''})}>Clear</button>
          </div>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead><tr>
            <SortableTh field="name"    label="Name"    sort={sort} order={order} onSort={handleSort}/>
            <SortableTh field="email"   label="Email"   sort={sort} order={order} onSort={handleSort}/>
            <SortableTh field="address" label="Address" sort={sort} order={order} onSort={handleSort}/>
            <SortableTh field="role"    label="Role"    sort={sort} order={order} onSort={handleSort}/>
            <th>Store Rating</th>
            <th style={{width:120}}>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:48}}><div className="spinner" style={{margin:'0 auto'}}/></td></tr>
            ) : users.length===0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-title">No users found</div></div></td></tr>
            ) : users.map(u=>(
              <tr key={u.id}>
                <td style={{fontWeight:600, cursor:'pointer'}} onClick={()=>navigate(`/admin/users/${u.id}`)}>{u.name}</td>
                <td className="td-email">{u.email}</td>
                <td className="td-muted" style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.address||'—'}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                <td>{u.role==='store_owner'&&u.avg_rating ? <span style={{color:'var(--warning)',fontWeight:700}}>★ {parseFloat(u.avg_rating).toFixed(1)}</span> : <span className="td-muted">—</span>}</td>
                <td>
                  <div style={{display:'flex',gap:5}}>
                    <button className="btn btn-ghost btn-sm" title="View" onClick={()=>navigate(`/admin/users/${u.id}`)}>View</button>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={()=>openEdit(u)}>✏</button>
                    <button className="btn btn-ghost btn-sm" title="Delete" style={{color:'var(--danger)'}}
                      disabled={deleting===u.id} onClick={()=>handleDelete(u.id)}>
                      {deleting===u.id ? <span className="spinner" style={{width:12,height:12}}/> : '🗑'}
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
              <div className="modal-title">{isEdit ? 'Edit User' : 'Add New User'}</div>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            {formError && <div className="alert alert-error"><span>⚠</span> {formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{color:'var(--text-3)',fontWeight:400}}>(20–60 chars)</span></label>
                <input className="form-input" placeholder="e.g. Rahul Pratap Singh" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                <div className="form-hint" style={{color:trimName.length>60?'var(--danger)':trimName.length>=20?'var(--success)':'var(--text-3)'}}>
                  {trimName.length}/60{trimName.length<20?` — need ${20-trimName.length} more`:'  ✓'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
              </div>
              {!isEdit && (
                <div className="form-group">
                  <label className="form-label">Password <span style={{color:'var(--text-3)',fontWeight:400}}>(8–16, 1 uppercase, 1 special)</span></label>
                  <input type="password" className="form-input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Address <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
                <textarea className="form-textarea" rows={2} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="user">Normal User</option>
                  <option value="admin">Administrator</option>
                  <option value="store_owner">Store Owner</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" style={{width:13,height:13,borderTopColor:'#fff'}}/> Saving…</> : isEdit ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
