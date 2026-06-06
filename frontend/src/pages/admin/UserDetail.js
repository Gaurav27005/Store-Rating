import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';

const ROLE_LABEL = { admin:'Administrator', user:'Normal User', store_owner:'Store Owner' };
const ROLE_BADGE = { admin:'badge-forest',  user:'badge-green', store_owner:'badge-amber' };

export default function UserDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get(`/admin/users/${id}`)
      .then(r => setUser(r.data))
      .catch(() => setError('User not found or failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  if (error || !user) {
    return (
      <div style={{ maxWidth:600 }}>
        <div className="alert alert-error"><span>⚠</span> {error||'User not found.'}</div>
        <button className="btn btn-secondary" onClick={()=>navigate('/admin/users')}>← Back to Users</button>
      </div>
    );
  }

  const stores = user.stores || [];

  return (
    <div style={{ maxWidth:740 }}>
      <div className="breadcrumb">
        <Link to="/admin/users">Users</Link>
        <span>›</span>
        <span>{user.name}</span>
      </div>

      <div className="page-header-row">
        <div>
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">Full account details</p>
        </div>
        <span className={`badge ${ROLE_BADGE[user.role]}`} style={{fontSize:13,padding:'6px 16px'}}>
          {ROLE_LABEL[user.role]}
        </span>
      </div>

      <div className="card">
        {/* Avatar row */}
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
          <div style={{
            width:54,height:54,borderRadius:'50%',
            background:'var(--accent-dim)',border:'2px solid var(--accent)',
            display:'grid',placeItems:'center',
            fontSize:22,fontWeight:700,color:'var(--accent)',
            fontFamily:'var(--font-display)',flexShrink:0,
          }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:18,marginBottom:2}}>{user.name}</div>
            <div style={{color:'var(--text-2)',fontSize:13}}>
              Member since {new Date(user.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <label>Email Address</label>
            <p style={{wordBreak:'break-all'}}>{user.email}</p>
          </div>
          <div className="detail-field">
            <label>Role</label>
            <p>{ROLE_LABEL[user.role]}</p>
          </div>
          <div className="detail-field" style={{gridColumn:'1 / -1'}}>
            <label>Address</label>
            <p>{user.address||<span style={{color:'var(--text-3)',fontStyle:'italic'}}>Not provided</span>}</p>
          </div>
          {user.role==='store_owner' && (
            <>
              <div className="detail-field">
                <label>Assigned Stores</label>
                <p>
                  {stores.length>0
                    ? stores.map(s=><div key={s.id} style={{marginBottom:2}}>{s.name}</div>)
                    : <span style={{color:'var(--text-3)',fontStyle:'italic'}}>No stores assigned</span>}
                </p>
              </div>
              <div className="detail-field">
                <label>Store Average Rating</label>
                <p>
                  {user.store_rating
                    ? <span style={{color:'var(--warning)',fontWeight:700,fontSize:16}}>★ {parseFloat(user.store_rating).toFixed(2)}</span>
                    : <span style={{color:'var(--text-3)',fontStyle:'italic'}}>No ratings yet</span>}
                </p>
              </div>
            </>
          )}
        </div>

        <div style={{marginTop:22,paddingTop:18,borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end'}}>
          <button className="btn btn-secondary" onClick={()=>navigate('/admin/users')}>← Back to Users</button>
        </div>
      </div>
    </div>
  );
}
