// resources/js/Pages/Surveys/Closed.jsx
import { Head } from '@inertiajs/react';

export default function SurveyClosed({ title }) {
    return (
        <>
        <Head title="Survey Closed"/>
        <style>{`
            * { box-sizing: border-box; }
            body { margin:0; background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%); font-family:'Segoe UI',system-ui,sans-serif; }
            @keyframes sv-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            @keyframes sv-float { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-10px) rotate(3deg)} }
        `}</style>

        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div style={{ maxWidth:440, width:'100%', animation:'sv-fade .4s ease' }}>

                <div style={{ background:'#fff', borderRadius:24, overflow:'hidden', boxShadow:'0 12px 48px rgba(124,58,237,0.12)', border:'1px solid #ede9fe' }}>

                    {/* Top accent */}
                    <div style={{ height:5, background:'linear-gradient(90deg,#475569,#64748b)' }}/>

                    <div style={{ padding:'44px 36px', textAlign:'center' }}>

                        {/* Icon */}
                        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#475569,#334155)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px', boxShadow:'0 8px 24px rgba(71,85,105,0.25)', animation:'sv-float 3s ease-in-out infinite' }}>
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>

                        {/* Title */}
                        <h2 style={{ fontSize:22, fontWeight:900, color:'#0f172a', margin:'0 0 10px', letterSpacing:'-0.3px' }}>
                            Survey Closed
                        </h2>

                        {/* Survey name */}
                        <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:99, background:'#f8fafc', border:'1px solid #e2e8f0', fontSize:13, fontWeight:700, color:'#475569', marginBottom:16 }}>
                            📋 {title}
                        </div>

                        <p style={{ fontSize:14, color:'#64748b', lineHeight:1.65, margin:'0 0 24px' }}>
                            This survey is no longer accepting responses. The submission window has ended.
                        </p>

                        {/* Info pill */}
                        <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:99, background:'#f1f5f9', border:'1px solid #e2e8f0' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span style={{ fontSize:12, fontWeight:600, color:'#64748b' }}>
                                Responses are no longer being collected
                            </span>
                        </div>
                    </div>
                </div>

                <p style={{ textAlign:'center', fontSize:12, color:'#a78bfa', marginTop:16 }}>
                    Contact HR if you have any questions 💜
                </p>
            </div>
        </div>
        </>
    );
}