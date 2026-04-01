// resources/js/Pages/UserRoles.jsx

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useForm, usePage, router } from '@inertiajs/react';

// ─────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────
const COUNTRIES = [
    { code: 'myanmar',  label: 'Myanmar'  },
    { code: 'vietnam',  label: 'Vietnam'  },
    { code: 'korea',    label: 'Korea'    },
    { code: 'cambodia', label: 'Cambodia' },
    { code: 'japan',    label: 'Japan'    },
];

// ─────────────────────────────────────────────────────
// CountryFlag
// ─────────────────────────────────────────────────────
function CountryFlag({ code, size = 20 }) {
    const h = Math.round(size * 0.6);
    const flags = {
        myanmar: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}>
                <rect width="900" height="200" y="0"   fill="#FECB00"/>
                <rect width="900" height="200" y="200" fill="#34B233"/>
                <rect width="900" height="200" y="400" fill="#EA2839"/>
                <polygon points="450,30 480,140 600,140 505,210 540,320 450,250 360,320 395,210 300,140 420,140" fill="white"/>
            </svg>
        ),
        vietnam: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}>
                <rect width="900" height="600" fill="#DA251D"/>
                <polygon points="450,120 492,250 630,250 518,330 560,460 450,380 340,460 382,330 270,250 408,250" fill="#FFFF00"/>
            </svg>
        ),
        korea: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}>
                <rect width="900" height="600" fill="#ffffff"/>
                <circle cx="450" cy="300" r="150" fill="#C60C30"/>
                <path d="M450,150 A150,150 0 0,1 450,450" fill="#003478"/>
                <circle cx="450" cy="225" r="75" fill="#C60C30"/>
                <circle cx="450" cy="375" r="75" fill="#003478"/>
                <g stroke="#000" strokeWidth="20">
                    <line x1="170" y1="155" x2="265" y2="120"/><line x1="180" y1="185" x2="275" y2="150"/><line x1="190" y1="215" x2="285" y2="180"/>
                    <line x1="615" y1="120" x2="710" y2="155"/><line x1="605" y1="150" x2="700" y2="185"/><line x1="595" y1="180" x2="690" y2="215"/>
                    <line x1="170" y1="445" x2="265" y2="480"/><line x1="180" y1="415" x2="275" y2="450"/><line x1="190" y1="385" x2="285" y2="420"/>
                    <line x1="615" y1="480" x2="710" y2="445"/><line x1="605" y1="450" x2="700" y2="415"/><line x1="595" y1="420" x2="690" y2="385"/>
                </g>
            </svg>
        ),
        cambodia: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}>
                <rect width="900" height="600" fill="#032EA1"/>
                <rect width="900" height="300" y="150" fill="#E00025"/>
                <g fill="white">
                    <rect x="375" y="215" width="150" height="170"/>
                    <rect x="363" y="195" width="40"  height="25"/>
                    <rect x="430" y="175" width="40"  height="45"/>
                    <rect x="497" y="195" width="40"  height="25"/>
                    <rect x="330" y="235" width="48"  height="150"/>
                    <rect x="522" y="235" width="48"  height="150"/>
                </g>
            </svg>
        ),
        japan: (
            <svg width={size} height={h} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'block' }}>
                <rect width="900" height="600" fill="#ffffff"/>
                <circle cx="450" cy="300" r="180" fill="#BC002D"/>
            </svg>
        ),
    };
    return flags[code] || <span>🌏</span>;
}

// ─────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────
function Avatar({ user, size = 36 }) {
    const colors = { admin: '#7c3aed', hr: '#059669', management: '#2563eb', employee: '#d97706' };
    const color = colors[user?.role?.name] || '#6b7280';
    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
    if (user?.avatar_url) {
        return <img src={`/storage/${user.avatar_url}`} alt={user.name} style={{ width: size, height: size, borderRadius: size / 3, objectFit: 'cover', flexShrink: 0 }} />;
    }
    return (
        <div style={{ width: size, height: size, borderRadius: size / 3, background: `${color}20`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0 }}>
            {initials}
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Role Badge
// ─────────────────────────────────────────────────────
function RoleBadge({ role }) {
    const map = { admin: { bg: '#ede9fe', color: '#7c3aed' }, hr: { bg: '#d1fae5', color: '#059669' }, management: { bg: '#dbeafe', color: '#2563eb' }, employee: { bg: '#fef3c7', color: '#d97706' } };
    const c = map[role?.name] || { bg: '#f3f4f6', color: '#6b7280' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
            {role?.display_name || 'No Role'}
        </span>
    );
}

// ─────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, icon, children }) {
    if (!open) return null;
    return (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(15,10,40,0.5)', backdropFilter:'blur(6px)' }} />
            <div style={{ position:'relative', background:'#fff', borderRadius:22, boxShadow:'0 32px 80px rgba(0,0,0,0.28)', width:'100%', maxWidth:520, maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

                {/* Gradient Header */}
                <div style={{ background:'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)', padding:'20px 24px 18px', flexShrink:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                            <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                                {icon || '👤'}
                            </div>
                            <div>
                                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:3 }}>
                                    {subtitle || 'User Management'}
                                </div>
                                <div style={{ fontSize:16, fontWeight:900, color:'#fff', letterSpacing:'-0.2px' }}>{title}</div>
                            </div>
                        </div>
                        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:10, width:32, height:32, cursor:'pointer', color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ overflowY:'auto', flex:1, padding:'20px 24px 24px' }}>{children}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Field Error
// ─────────────────────────────────────────────────────
function FieldError({ msg }) {
    if (!msg) return null;
    return (
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚠</span> {msg}
        </p>
    );
}

// ─────────────────────────────────────────────────────
// UserForm
// ─────────────────────────────────────────────────────
function UserForm({ roles, editUser, onClose, onSuccess }) {
    const isEdit = !!editUser;

    const form = useForm({
        name:          editUser?.name       || '',
        email:         editUser?.email      || '',
        password:      '',
        role_id:       editUser?.role?.id   ? String(editUser.role.id) : '',
        department:    editUser?.department || '',
        position:      editUser?.position   || '',
        phone:         editUser?.phone      || '',
        is_active:     editUser?.is_active  ?? true,
        avatar:        null,
        remove_avatar: false,
        _method:       isEdit ? 'PUT' : 'POST',
        country:         editUser?.country         || '',
        joined_date: editUser?.joined_date
            ? String(editUser.joined_date).split('T')[0]
            : new Date().toISOString().split('T')[0],
        employment_type:    editUser?.employment_type    || 'probation',
        contract_end_date: editUser?.contract_end_date
            ? String(editUser.contract_end_date).split('T')[0]
            : '',
    });

    const [countryOpen, setCountryOpen] = useState(false);
    const dropdownRef  = useRef(null);
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(
        editUser?.avatar_url ? `/storage/${editUser.avatar_url}` : null
    );

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setCountryOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const inp = (field) => ({
        width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13,
        outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
        border: `1px solid ${form.errors[field] ? '#fca5a5' : '#e5e7eb'}`,
        background: form.errors[field] ? '#fef9f9' : '#f9fafb',
        color: '#111827',
    });

    const lbl = { fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 5 };

    const submit = (e) => {
        e.preventDefault();
        const url = isEdit ? `/users/${editUser.id}` : '/users';
        form.post(url, {
            forceFormData: true,
            onSuccess: () => {
                onClose();
                window.dispatchEvent(new CustomEvent('global-toast', {
                    detail: {
                        message: isEdit ? 'User updated successfully!' : 'User created successfully!',
                        type: 'success'
                    }
                }));
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                if (firstErr) {
                    window.dispatchEvent(new CustomEvent('global-toast', {
                        detail: { message: firstErr, type: 'error' }
                    }));
                }
            },
        });
    };

    return (
        <form onSubmit={submit} encType="multipart/form-data">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

                {/* Full Name */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="John Doe" style={inp('name')} />
                    <FieldError msg={form.errors.name} />
                </div>

                {/* Email */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="email" value={form.data.email} onChange={e => form.setData('email', e.target.value)} placeholder="john@vibeme.ai" style={inp('email')} />
                    <FieldError msg={form.errors.email} />
                </div>

                {/* Country Dropdown */}
                <div style={{ gridColumn: '1/-1', position: 'relative' }} ref={dropdownRef}>
                    <label style={lbl}>Country <span style={{ color: '#ef4444' }}>*</span></label>
                    <div
                        onClick={() => setCountryOpen(o => !o)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                            border: `1px solid ${form.errors.country ? '#fca5a5' : '#e5e7eb'}`,
                            background: form.errors.country ? '#fef9f9' : '#f9fafb',
                            userSelect: 'none',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {form.data.country ? (
                                <>
                                    <CountryFlag code={form.data.country} size={20} />
                                    <span style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>
                                        {COUNTRIES.find(c => c.code === form.data.country)?.label}
                                    </span>
                                </>
                            ) : (
                                <span style={{ fontSize: 13, color: '#9ca3af' }}>Select country...</span>
                            )}
                        </div>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                            style={{ transform: countryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                            <path d="M2 4L6 8L10 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>

                    {countryOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', marginTop: 4,
                        }}>
                            {COUNTRIES.map((c, i) => (
                                <div
                                    key={c.code}
                                    onClick={() => { form.setData('country', c.code); setCountryOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', cursor: 'pointer',
                                        background: form.data.country === c.code ? '#ede9fe' : '#fff',
                                        borderBottom: i < COUNTRIES.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    }}
                                    onMouseEnter={e => { if (form.data.country !== c.code) e.currentTarget.style.background = '#f9fafb'; }}
                                    onMouseLeave={e => { if (form.data.country !== c.code) e.currentTarget.style.background = '#fff'; }}
                                >
                                    <CountryFlag code={c.code} size={22} />
                                    <span style={{ fontSize: 13, fontWeight: form.data.country === c.code ? 700 : 500, color: form.data.country === c.code ? '#7c3aed' : '#374151', flex: 1 }}>
                                        {c.label}
                                    </span>
                                    {form.data.country === c.code && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M2 7L5.5 10.5L12 3.5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <FieldError msg={form.errors.country} />
                </div>

                {/* Password */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>
                        {isEdit ? 'New Password' : 'Password'} {!isEdit && <span style={{ color: '#ef4444' }}>*</span>}
                        {isEdit && <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}> (leave blank to keep)</span>}
                    </label>
                    <input type="password" value={form.data.password} onChange={e => form.setData('password', e.target.value)} placeholder="••••••••" style={inp('password')} />
                    <FieldError msg={form.errors.password} />
                </div>

                {/* Role */}
                <div>
                    <label style={lbl}>Role <span style={{ color: '#ef4444' }}>*</span></label>
                    <select value={form.data.role_id} onChange={e => form.setData('role_id', e.target.value)} style={{ ...inp('role_id'), cursor: 'pointer' }}>
                        <option value="">Select role...</option>
                        {roles.map(r => <option key={r.id} value={String(r.id)}>{r.display_name}</option>)}
                    </select>
                    <FieldError msg={form.errors.role_id} />
                </div>

                {/* Department */}
                <div>
                    <label style={lbl}>Department</label>
                    <input value={form.data.department} onChange={e => form.setData('department', e.target.value)} placeholder="Engineering" style={inp('department')} />
                    <FieldError msg={form.errors.department} />
                </div>

                {/* Position */}
                <div>
                    <label style={lbl}>Position</label>
                    <input value={form.data.position} onChange={e => form.setData('position', e.target.value)} placeholder="Senior Developer" style={inp('position')} />
                    <FieldError msg={form.errors.position} />
                </div>

                {/* Phone */}
                <div>
                    <label style={lbl}>Phone</label>
                    <input value={form.data.phone} onChange={e => form.setData('phone', e.target.value)} placeholder="+855 12 345 678" style={inp('phone')} />
                    <FieldError msg={form.errors.phone} />
                </div>
                {/* Joined Date */}
                <div>
                    <label style={lbl}>Joined Date</label>
                    <input type="date"
                        value={form.data.joined_date || ''}
                        onChange={e => form.setData('joined_date', e.target.value)}
                        style={inp('joined_date')}
                    />
                    <FieldError msg={form.errors.joined_date} />
                </div>

                {/* Employment Type */}
                <div>
                    <label style={lbl}>Employment Type</label>
                    <select
                        value={form.data.employment_type || 'probation'}
                        onChange={e => form.setData('employment_type', e.target.value)}
                        style={{ ...inp('employment_type'), cursor:'pointer' }}>
                        <option value="probation">Probation</option>
                        <option value="permanent">Permanent</option>
                        <option value="contract">Contract</option>
                    </select>
                    <FieldError msg={form.errors.employment_type} />
                </div>
                {/* Contract End Date — contract ရွေးမှ ပေါ်မယ် */}
                {form.data.employment_type === 'contract' && (
                    <div style={{ gridColumn: '1/-1' }}>
                        <label style={lbl}>
                            Contract End Date <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input type="date"
                            value={form.data.contract_end_date || ''}
                            onChange={e => form.setData('contract_end_date', e.target.value)}
                            style={{
                                ...inp('contract_end_date'),
                                borderColor: form.errors.contract_end_date ? '#fca5a5' : '#e5e7eb',
                            }}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <FieldError msg={form.errors.contract_end_date} />
                    </div>
                )}
                {/* Avatar */}
                <div style={{ gridColumn: '1/-1' }}>
                    <label style={lbl}>Profile Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', background: '#f9fafb' }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) { form.setData('avatar', file); setPreviewUrl(URL.createObjectURL(file)); }
                                }}
                                style={{ fontSize: 13, color: '#374151', width: '100%' }}
                            />
                        </div>
                        {previewUrl && (
                            <button
                                type="button"
                                onClick={() => { setPreviewUrl(null); form.setData('avatar', null); form.setData('remove_avatar', true); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, flexShrink: 0, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', padding: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M1 1L13 13M13 1L1 13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        )}
                    </div>
                    {previewUrl && (
                        <div style={{ marginTop: 10 }}>
                            <img src={previewUrl} alt="preview" style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', border: '2px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'block' }} />
                        </div>
                    )}
                    <FieldError msg={form.errors.avatar} />
                </div>

                {/* Active Status — edit only */}
                {isEdit && (
                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 0, flex: 1 }}>Active Status</label>
                        <button
                            type="button"
                            onClick={() => form.setData('is_active', !form.data.is_active)}
                            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: form.data.is_active ? '#7c3aed' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                        >
                            <span style={{ position: 'absolute', top: 2, left: form.data.is_active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </button>
                        <span style={{ fontSize: 12, color: form.data.is_active ? '#059669' : '#9ca3af', fontWeight: 700, minWidth: 50 }}>
                            {form.data.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={form.processing}
                    style={{ padding: '9px 28px', borderRadius: 10, border: 'none', background: form.processing ? '#c4b5fd' : '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 700, cursor: form.processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    {form.processing && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
                    {form.processing ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
                </button>
            </div>
        </form>
    );
}

// ─────────────────────────────────────────────────────
// Delete Confirm
// ─────────────────────────────────────────────────────
function DeleteConfirm({ user, onClose, onConfirm, loading }) {
    return (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🗑️</div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Delete User?</h4>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to delete <strong style={{ color: '#111827' }}>{user?.name}</strong>?<br />This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={onClose} style={{ padding: '9px 24px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={onConfirm} disabled={loading} style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: loading ? '#fca5a5' : '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────
export default function UserRoles({ users = [], roles = [], roleName = '' }) {
    const { flash } = usePage().props;
   
    const [search, setSearch]         = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser]     = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [deleting, setDeleting]     = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(`/users/${deleteUser.id}`, {
            onSuccess: () => { window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'User deleted successfully!', type: 'success' }})); setDeleteUser(null); setDeleting(false); },
            onError:   () => { window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: 'Failed to delete user.', type: 'error' }})); setDeleting(false); },
        });
    };

    const handleToggle = (user) => {
        router.patch(`/users/${user.id}/toggle`, {}, {
            onSuccess: () => window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: `${user.name} marked as ${user.is_active ? 'inactive' : 'active'}!`, type: 'success' }})),
            onError:   () => showToast('Failed to update status.', 'error'),
        });
    };

    const filtered = users.filter(u => {
        const s = search.toLowerCase();
        const matchSearch = u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
        const matchRole   = filterRole ? u.role?.name === filterRole : true;
        return matchSearch && matchRole;
    });

    const roleMap = {
        admin:      { bg: '#ede9fe', color: '#7c3aed' },
        hr:         { bg: '#d1fae5', color: '#059669' },
        management: { bg: '#dbeafe', color: '#2563eb' },
        employee:   { bg: '#fef3c7', color: '#d97706' },
    };
console.log("filtered",filtered)
    return (
        <AppLayout title="User & Roles">
            <style>{`
                @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes spin    { to { transform: rotate(360deg); } }
            `}</style>

            {/* Role Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {roles.map(role => {
                    const count = users.filter(u => u.role?.name === role.name).length;
                    const c = roleMap[role.name] || { bg: '#f3f4f6', color: '#6b7280' };
                    const icons = { admin: '👑', hr: '🧑‍💼', management: '📊', employee: '👤' };
                    return (
                        <div key={role.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: 42, height: 42, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                {icons[role.name] || '👤'}
                            </div>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1 }}>{count}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 2 }}>{role.display_name}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search + Filter + Add Button — တစ်တန်းတည်း */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>

                {/* Search */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1 }}
                    />
                    {search && (
                        <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>
                    )}
                </div>

                {/* Country Filter — admin only */}
                {roleName === 'admin' && (
                    <select
                        onChange={e => router.get('/users', { country: e.target.value }, { preserveState: true })}
                        style={{ padding:'8px 14px', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, color:'#374151', background:'#fff', cursor:'pointer', outline:'none', height:38 }}
                    >
                        <option value="">All Countries</option>
                        {['cambodia','myanmar','vietnam','korea','japan'].map(c => (
                            <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                        ))}
                    </select>
                )}

                {/* Role Filter */}
                <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none', height: 38 }}
                >
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.display_name}</option>)}
                </select>

                {/* Divider */}
                <div style={{ width: 1, height: 28, background: '#e5e7eb', flexShrink: 0 }} />

                {/* Add New User Button */}
                <button
                    onClick={() => setShowCreate(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '8px 18px', height: 38,
                        background: '#7c3aed', color: '#fff',
                        border: 'none', borderRadius: 10,
                        fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,58,237,0.35)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(124,58,237,0.25)'; }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add New User
                </button>
            </div>



            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            {['User', 'Country', 'Role', 'Department', 'Position', 'Phone', 'Employment', 'Joined', 'Status', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#6b7280', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: 48, textAlign: 'center' }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                                    <div style={{ fontSize: 13, color: '#9ca3af' }}>No users found.</div>
                                </td>
                            </tr>
                        ) : filtered.map((user, i) => (
                            <tr
                                key={user.id}
                                style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', transition: 'background 0.1s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* User */}
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Avatar user={user} size={36} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{user.name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Country */}
                                <td style={{ padding: '12px 16px' }}>
                                    {user.country ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                            <CountryFlag code={user.country} size={20} />
                                            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                                                {user.country.charAt(0).toUpperCase() + user.country.slice(1)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                                    )}
                                </td>

                                <td style={{ padding: '12px 16px' }}><RoleBadge role={user.role} /></td>
                                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{user.department || '—'}</td>
                                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{user.position || '—'}</td>
                                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{user.phone || '—'}</td>

                                {/* Employment Type */}
                                <td style={{ padding: '12px 16px' }}>
                                    {(() => {
                                        const cfg = {
                                            probation: { bg:'#fef3c7', color:'#d97706', label:'Probation' },
                                            permanent: { bg:'#d1fae5', color:'#059669', label:'Permanent' },
                                            contract:  { bg:'#dbeafe', color:'#2563eb', label:'Contract' },
                                        };
                                        const c = cfg[user.employment_type] || cfg.probation;
                                        return (
                                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, background:c.bg, color:c.color }}>
                                              {c.label}
                                            </span>
                                        );
                                    })()}
                                </td>

                                {/* Joined Date */}
                                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace:'nowrap' }}>
                                    {user.joined_date
                                        ? new Date(String(user.joined_date).split('T')[0] + 'T00:00:00')
                                            .toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
                                        : '—'}
                                    {user.employment_type === 'contract' && user.contract_end_date && (
                                        <div style={{ fontSize:10, color:'#2563eb', fontWeight:600, marginTop:2 }}>
                                            ends {new Date(String(user.contract_end_date).split('T')[0] + 'T00:00:00')
                                                    .toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
                                                }
                                        </div>
                                    )}
                                </td>

                                <td style={{ padding: '12px 16px' }}>
                                    <button onClick={() => handleToggle(user)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', background: user.is_active ? '#d1fae5' : '#fee2e2', color: user.is_active ? '#065f46' : '#991b1b' }}
                                    >
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.is_active ? '#059669' : '#ef4444', display: 'inline-block' }} />
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setEditUser(user)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                            ✏️
                                        </button>
                                        <button onClick={() => setDeleteUser(user)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New User" subtitle="User Management" icon="➕">
                <UserForm roles={roles} onClose={() => setShowCreate(false)} onSuccess={(msg) => { window.dispatchEvent(new CustomEvent('global-toast', { detail: { message: msg, type: 'success' }})); setShowCreate(false); }} />
            </Modal>

            {/* Edit Modal */}
            <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" subtitle="Update Profile" icon="✏️">
                {editUser && (
                    <UserForm key={editUser.id} roles={roles} editUser={editUser} onClose={() => setEditUser(null)} onSuccess={(msg) => { showToast(msg); setEditUser(null); }} />
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal open={!!deleteUser} onClose={() => setDeleteUser(null)} title="Confirm Delete" subtitle="Danger Zone" icon="🗑️">
                <DeleteConfirm user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDelete} loading={deleting} />
            </Modal>

        </AppLayout>
    );
}