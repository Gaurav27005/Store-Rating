import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

export default function OwnerProfile() {
  const { user, updateUser } = useAuth(); // Assuming updateUser exists in context
  const toast    = useToast();
  const [form,    setForm]    = useState({ name: user?.name||'', address: user?.address||'' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const trimName = form.name.trim();

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (!trimName) { setError('Name is required'); return; }
    if (trimName.length < 20) { setError('Name must be at least 20 characters'); return; }
    if (trimName.length > 60) { setError('Name must be at most 60 characters'); return; }
    if (form.address && form.address.length > 400) { setError('Address too long'); return; }
    setLoading(true);
    try {
      await api.put('/owner/profile', { name: trimName, address: form.address });
      toast('Profile updated!');
      setSuccess(true);
      // Synchronize context and local storage
      updateUser({ ...user, name: trimName, address: form.address });
      const stored = JSON.parse(localStorage.getItem('user')||'{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: trimName, address: form.address }));
    } catch(e) { setError(e.response?.data?.error||'Update failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth:520 }}>
      <div className="page-header">
        <h1 className="page-title">Edit Profile</h1>
        <p className="page-subtitle">Update your personal information</p>
      </div>

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:22, paddingBottom:20, borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:52,height:52,borderRadius:'50%',background:'var(--accent-dim)',border:'2px solid var(--accent)',display:'grid',placeItems:'center',fontSize:20,fontWeight:700,color:'var(--accent)',flexShrink:0 }}>
            {(user?.name||'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:16}}>{user?.name}</div>
            <div style={{fontSize:12.5,color:'var(--text-2)'}}>{user?.email}</div>
            <span className="badge badge-amber" style={{marginTop:4,fontSize:11}}>Store Owner</span>
          </div>
        </div>

        {error   && <div className="alert alert-error"><span>⚠</span> {error}</div>}
        {success && <div className="alert alert-success"><span>✓</span> Profile updated successfully.</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name <span style={{color:'var(--text-3)',fontWeight:400}}>(20–60 characters)</span></label>
            <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
            <div className="form-hint" style={{color:trimName.length>60?'var(--danger)':trimName.length>=20?'var(--success)':'var(--text-3)'}}>
              {trimName.length}/60 {trimName.length<20?`— need ${20-trimName.length} more`:'✓'}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
            <textarea className="form-textarea" rows={2} value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading?<><span className="spinner" style={{width:14,height:14,borderTopColor:'#fff'}}/> Saving…</>:'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}