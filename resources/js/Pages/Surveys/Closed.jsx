// resources/js/Pages/Surveys/Closed.jsx
import { Head } from '@inertiajs/react';

export default function SurveyClosed({ title }) {
    return (
        <>
        <Head title="Survey Closed"/>
        <style>{`body{margin:0;background:#f4f0ff;}`}</style>
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div style={{ background:'#fff', borderRadius:20, padding:'48px 40px', maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(124,58,237,0.1)' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Survey Closed</h2>
                <p style={{ fontSize:14, color:'#64748b', lineHeight:1.6 }}>
                    "<strong>{title}</strong>" is no longer accepting responses.
                </p>
            </div>
        </div>
        </>
    );
}