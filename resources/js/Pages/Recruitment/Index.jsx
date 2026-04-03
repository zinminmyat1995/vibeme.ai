import { useState, useMemo } from "react";
import { router, useForm } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";

// ── Constants ────────────────────────────────
const JOB_TYPE_OPTS = [
    { value:"full_time",  label:"Full Time"  },
    { value:"part_time",  label:"Part Time"  },
    { value:"contract",   label:"Contract"   },
    { value:"internship", label:"Internship" },
];
const APP_STATUS_OPTS = [
    { value:"new",       label:"New",       color:"#6366f1", bg:"#eef2ff" },
    { value:"reviewing", label:"Reviewing", color:"#d97706", bg:"#fef3c7" },
    { value:"interview", label:"Interview", color:"#0891b2", bg:"#e0f2fe" },
    { value:"accepted",  label:"Accepted",  color:"#059669", bg:"#d1fae5" },
    { value:"rejected",  label:"Rejected",  color:"#dc2626", bg:"#fee2e2" },
];
const JOB_STATUS_OPTS = [
    { value:"open",   label:"Open",   color:"#059669", bg:"#d1fae5" },
    { value:"paused", label:"Paused", color:"#d97706", bg:"#fef3c7" },
    { value:"closed", label:"Closed", color:"#6b7280", bg:"#f3f4f6" },
];
const sCfg = (val, opts) => opts.find(o => o.value === val) || opts[0];

// ── List helpers ─────────────────────────────
const toArr = str => {
    if (!str) return [""];
    const lines = str.split("\n").map(l => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    return lines.length ? lines : [""];
};
const toStr = arr => arr.filter(s => s.trim()).map(s => `- ${s.trim()}`).join("\n");

// ── Shared tokens ────────────────────────────
const inp = {
    width:"100%", padding:"10px 13px",
    border:"1px solid #e5e7eb", borderRadius:10,
    fontSize:13, color:"#111827", outline:"none",
    fontFamily:"inherit", background:"#fff",
    transition:"border-color 0.15s, box-shadow 0.15s",
    boxSizing:"border-box",
};
const lbl = {
    display:"block", fontSize:11, fontWeight:600,
    color:"#6b7280", letterSpacing:"0.07em",
    textTransform:"uppercase", marginBottom:7,
};
const onF = e => { e.target.style.borderColor="#7c3aed"; e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"; };
const onB = e => { e.target.style.borderColor="#e5e7eb"; e.target.style.boxShadow="none"; };

// ── ListField ────────────────────────────────
function ListField({ label, required, items, onChange, placeholder, error }) {
    const add    = () => onChange([...items, ""]);
    const remove = i  => onChange(items.filter((_,idx) => idx !== i));
    const upd    = (i,v) => { const n=[...items]; n[i]=v; onChange(n); };
    return (
        <div style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <label style={lbl}>{label}{required && " *"}</label>
                <button type="button" onClick={add}
                    style={{fontSize:11,color:"#7c3aed",background:"#ede9fe",border:"none",
                        padding:"3px 11px",borderRadius:6,cursor:"pointer",fontWeight:600}}>
                    + Add
                </button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {items.map((item,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{color:"#a78bfa",fontSize:15,flexShrink:0,width:14}}>•</span>
                        <input value={item} onChange={e=>upd(i,e.target.value)}
                            onFocus={onF} onBlur={onB}
                            placeholder={placeholder || "Add item..."}
                            style={{...inp,flex:1,padding:"8px 11px",
                                borderColor: error && !item.trim() ? "#fca5a5" : "#e5e7eb"}} />
                        {items.length > 1 && (
                            <button type="button" onClick={()=>remove(i)}
                                style={{background:"none",border:"none",color:"#d1d5db",
                                    cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 2px",flexShrink:0}}>
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {error && (
                <div className="field-err" style={{fontSize:11,color:"#dc2626",marginTop:5,display:"flex",alignItems:"center",gap:4}}>
                    <span>⚠</span> {error}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function RecruitmentIndex({ offices=[], jobs=[], recentApps=[] }) {
    const [tab, setTab]                   = useState("jobs");
    // Auto-select first job on mount
    const [selectedJob, setSelectedJob]   = useState(()=>jobs.length>0?jobs[0]:null);
    const [jobModal, setJobModal]         = useState(false);
    const [editJob, setEditJob]           = useState(null);
    const [filterOffice, setFilterOffice] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [appFilter, setAppFilter]       = useState("all");
    const [appSort, setAppSort]           = useState("latest");   // latest | name | score
    const [jobSearch, setJobSearch]       = useState("");
    const [noteModal, setNoteModal]       = useState(null);
    const [interviewModal, setInterviewModal] = useState(null);
    const [scoreModal, setScoreModal]         = useState(null);
    const [selectedApps, setSelectedApps]     = useState([]);
    const [bulkModal, setBulkModal]           = useState(false);
    const [deleteModal, setDeleteModal]       = useState(null); // app object
    const [deleteJobModal, setDeleteJobModal] = useState(null); // job object

    const totalJobs = jobs.length;
    const openJobs  = jobs.filter(j=>j.status==="open").length;
    const totalApps = jobs.reduce((s,j)=>s+(j.applications_count||0),0);
    const newApps   = recentApps.filter(a=>a.status==="new").length;

    const filteredJobs = useMemo(()=>jobs.filter(j=>{
        if(filterOffice!=="all"&&j.office?.id!==parseInt(filterOffice)) return false;
        if(filterStatus!=="all"&&j.status!==filterStatus) return false;
        if(jobSearch && !j.title.toLowerCase().includes(jobSearch.toLowerCase())
            && !j.office?.company_name?.toLowerCase().includes(jobSearch.toLowerCase())) return false;
        return true;
    }),[jobs,filterOffice,filterStatus,jobSearch]);

    const selectedJobApps = useMemo(()=>
        selectedJob ? recentApps.filter(a=>a.job_posting_id===selectedJob.id) : [],
    [selectedJob,recentApps]);

    const filteredApps = useMemo(()=>{
        let apps = appFilter==="all" ? selectedJobApps : selectedJobApps.filter(a=>a.status===appFilter);
        if(appSort==="name")   apps=[...apps].sort((a,b)=>a.name.localeCompare(b.name));
        if(appSort==="score")  apps=[...apps].sort((a,b)=>(b.interview?.score??-1)-(a.interview?.score??-1));
        if(appSort==="latest") apps=[...apps]; // already ordered by created_at desc from controller
        return apps;
    },[selectedJobApps,appFilter,appSort]);

    // Bulk select helpers
    const toggleSelect = (id) => setSelectedApps(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
    const toggleAll    = ()    => setSelectedApps(p=>p.length===filteredApps.length?[]:filteredApps.map(a=>a.id));
    const allSelected  = filteredApps.length>0 && selectedApps.length===filteredApps.length;

    // When switching jobs, reset filters & bulk select
    const handleSelectJob = (job) => {
        setSelectedJob(job);
        setAppFilter("all");
        setSelectedApps([]);
    };

    return (
        <AppLayout title="Recruitment">
            <style>{`
                @keyframes popIn { from{opacity:0;transform:scale(0.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
                .rc * { font-family:'Outfit','Segoe UI',sans-serif; box-sizing:border-box; }
                .sg { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
                .sc { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:18px 20px; }
                .sn { font-size:30px; font-weight:700; color:#111827; letter-spacing:-0.03em; }
                .sn.v { color:#7c3aed; }
                .sl { font-size:12px; color:#9ca3af; margin-top:2px; }
                .tabs { display:flex; gap:4px; background:#f3f4f6; border-radius:10px; padding:4px; margin-bottom:20px; width:fit-content; }
                .tb { padding:7px 20px; border-radius:7px; font-size:13px; font-weight:500; border:none; cursor:pointer; transition:all 0.15s; background:transparent; color:#6b7280; }
                .tb.a { background:#fff; color:#111827; box-shadow:0 1px 4px rgba(0,0,0,0.08); }
                .tb-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
                .tl { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
                .sel { padding:7px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:13px; color:#374151; background:#fff; outline:none; cursor:pointer; }
                .bp { padding:8px 18px; background:#7c3aed; border:none; border-radius:8px; color:#fff; font-size:13px; font-weight:500; cursor:pointer; display:flex; align-items:center; gap:6px; transition:background 0.15s; white-space:nowrap; }
                .bp:hover { background:#6d28d9; }
                .bs { padding:5px 12px; border-radius:7px; font-size:12px; font-weight:500; cursor:pointer; border:1px solid #e5e7eb; background:#fff; color:#374151; transition:all 0.15s; }
                .bs:hover { background:#f3f4f6; }
                .bd { border-color:#fecaca; color:#dc2626; }
                .bd:hover { background:#fee2e2; }
                .tw { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
                .tbl { width:100%; border-collapse:collapse; }
                .tbl th { font-size:11px; font-weight:600; color:#9ca3af; letter-spacing:0.06em; text-transform:uppercase; padding:12px 16px; text-align:left; background:#f9fafb; border-bottom:1px solid #e5e7eb; }
                .tbl td { padding:13px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
                .tbl tr:last-child td { border-bottom:none; }
                .tbl tr:hover td { background:#fafafa; }
                .pl { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:100px; font-size:11px; font-weight:500; white-space:nowrap; }
                .al { display:grid; grid-template-columns:230px 1fr; gap:16px; align-items:start; }
                .js { background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
                .ji { padding:12px 14px; cursor:pointer; border-bottom:1px solid #f3f4f6; transition:background 0.12s; }
                .ji:last-child { border-bottom:none; }
                .ji:hover { background:#f9fafb; }
                .ji.a { background:#ede9fe; }
                .jt { font-weight:500; color:#111827; font-size:13px; margin-bottom:2px; }
                .jc { font-size:11px; color:#9ca3af; }
                .jn { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; border-radius:100px; background:#7c3aed; color:#fff; font-size:10px; font-weight:600; margin-top:4px; }
                .ag { display:grid; grid-template-columns:repeat(auto-fill,minmax(295px,1fr)); gap:12px; }
                .ac { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:18px; transition:box-shadow 0.15s; }
                .ac:hover { box-shadow:0 4px 16px rgba(0,0,0,0.06); }
                .es { text-align:center; padding:48px 24px; color:#9ca3af; }
                .ei { font-size:36px; margin-bottom:12px; }
                .et { font-size:15px; font-weight:500; color:#374151; margin-bottom:4px; }
                /* modal overlay */
                .mo { position:fixed; inset:0; z-index:200; background:rgba(17,24,39,0.55); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:16px; }
            `}</style>

            <div className="rc">
                {/* Stats */}
                <div className="sg">
                    {[
                        {n:totalJobs, l:"Total Job Postings", v:false},
                        {n:openJobs,  l:"Open Positions",     v:true },
                        {n:totalApps, l:"Total Applications", v:false},
                        {n:newApps,   l:"New (Unread)",       v:true },
                    ].map(s=>(
                        <div key={s.l} className="sc">
                            <div className={`sn ${s.v?"v":""}`}>{s.n}</div>
                            <div className="sl">{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="tabs">
                    {[{k:"jobs",l:"Job Postings"},{k:"applications",l:"Applications"}].map(t=>(
                        <button key={t.k} className={`tb ${tab===t.k?"a":""}`} onClick={()=>setTab(t.k)}>{t.l}</button>
                    ))}
                </div>

                {/* ── Jobs Tab ── */}
                {tab==="jobs"&&(
                    <>
                        <div className="tb-row">
                            <div className="tl">
                                <select className="sel" value={filterOffice} onChange={e=>setFilterOffice(e.target.value)}>
                                    <option value="all">All Countries</option>
                                    {offices.map(o=><option key={o.id} value={o.id}>{o.company_name}</option>)}
                                </select>
                                <select className="sel" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                                    <option value="all">All Status</option>
                                    {JOB_STATUS_OPTS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <button className="bp" onClick={()=>{setEditJob(null);setJobModal(true);}}>+ New Job Posting</button>
                        </div>
                        <div className="tw">
                            {filteredJobs.length===0?(
                                <div className="es"><div className="ei">📋</div><div className="et">No job postings yet</div><div style={{fontSize:13}}>Create your first job posting.</div></div>
                            ):(
                                <table className="tbl">
                                    <thead><tr>
                                        <th>Position</th><th>Company</th><th>Type</th><th>Positions</th><th>Applications</th><th>Deadline</th><th>Status</th><th>Actions</th>
                                    </tr></thead>
                                    <tbody>
                                        {filteredJobs.map(job=>{
                                            const sc=sCfg(job.status,JOB_STATUS_OPTS);
                                            return (
                                                <tr key={job.id}>
                                                    <td><div style={{fontWeight:600,color:"#111827"}}>{job.title}</div>{job.department&&<div style={{fontSize:11,color:"#9ca3af"}}>{job.department}</div>}</td>
                                                    <td style={{color:"#6b7280"}}>{job.office?.company_name}</td>
                                                    <td><span className="pl" style={{background:"#ede9fe",color:"#7c3aed"}}>{JOB_TYPE_OPTS.find(t=>t.value===job.type)?.label}</span></td>
                                                    <td style={{fontWeight:600}}>{job.slots} person{job.slots>1?"s":""}</td>
                                                    <td><button className="bs" style={{color:"#7c3aed",borderColor:"#ddd6fe"}} onClick={()=>{setSelectedJob(job);setTab("applications");}}>{job.applications_count||0} applicants</button></td>
                                                    <td style={{color:"#9ca3af",fontSize:12}}>{job.deadline||"—"}</td>
                                                    <td><span className="pl" style={{background:sc.bg,color:sc.color}}>{sc.label}</span></td>
                                                    <td>
                                                        <div style={{display:"flex",gap:6}}>
                                                            <button className="bs" onClick={()=>{setEditJob(job);setJobModal(true);}}>Edit</button>
                                                            <button className="bs bd" onClick={()=>setDeleteJobModal(job)}>Delete</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {/* ── Applications Tab ── */}
                {tab==="applications"&&(
                    <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:20,alignItems:"start"}}>

                        {/* ── Job Sidebar ── */}
                        <div style={{
                            background:"#fff", border:"1px solid #e5e7eb",
                            borderRadius:14, overflow:"hidden",
                            boxShadow:"0 1px 3px rgba(0,0,0,0.04)",
                        }}>
                            {/* Header */}
                            <div style={{
                                padding:"14px 18px",
                                background:"linear-gradient(135deg,#5b21b6,#7c3aed)",
                                display:"flex",alignItems:"center",gap:8,
                            }}>
                                <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:"-0.01em"}}>Job Postings</div>
                                <div style={{marginLeft:"auto",background:"rgba(255,255,255,0.2)",color:"#fff",fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:100}}>
                                    {filteredJobs.length}
                                </div>
                            </div>

                            {/* Search */}
                            <div style={{padding:"10px 12px",borderBottom:"1px solid #f3f4f6"}}>
                                <input
                                    value={jobSearch}
                                    onChange={e=>setJobSearch(e.target.value)}
                                    placeholder="Search job or company..."
                                    style={{
                                        width:"100%",padding:"7px 10px",
                                        border:"1px solid #e5e7eb",borderRadius:8,
                                        fontSize:12,color:"#374151",outline:"none",
                                        fontFamily:"inherit",
                                    }}
                                    onFocus={e=>{e.target.style.borderColor="#7c3aed";}}
                                    onBlur={e=>{e.target.style.borderColor="#e5e7eb";}}
                                />
                            </div>

                            {/* Filters row */}
                            <div style={{padding:"8px 12px",borderBottom:"1px solid #f3f4f6",display:"flex",gap:6}}>
                                <select value={filterOffice} onChange={e=>setFilterOffice(e.target.value)}
                                    style={{flex:1,padding:"5px 8px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:11,color:"#374151",background:"#fff",outline:"none",cursor:"pointer"}}>
                                    <option value="all">All Offices</option>
                                    {offices.map(o=><option key={o.id} value={o.id}>{o.company_name}</option>)}
                                </select>
                                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                                    style={{flex:1,padding:"5px 8px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:11,color:"#374151",background:"#fff",outline:"none",cursor:"pointer"}}>
                                    <option value="all">All Status</option>
                                    {JOB_STATUS_OPTS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>

                            {/* List */}
                            <div style={{maxHeight:480,overflowY:"auto"}}>
                                {filteredJobs.length===0 ? (
                                    <div style={{padding:"32px 18px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                                        No matching jobs
                                    </div>
                                ) : filteredJobs.map(job=>{
                                    const isActive = selectedJob?.id===job.id;
                                    const appCount = recentApps.filter(a=>a.job_posting_id===job.id).length;
                                    const sc = sCfg(job.status, JOB_STATUS_OPTS);
                                    return (
                                        <div key={job.id}
                                            onClick={()=>handleSelectJob(job)}
                                            style={{
                                                padding:"13px 18px",
                                                borderBottom:"1px solid #f3f4f6",
                                                cursor:"pointer",
                                                background: isActive ? "#faf5ff" : "#fff",
                                                borderLeft: isActive ? "3px solid #7c3aed" : "3px solid transparent",
                                                transition:"all 0.15s",
                                            }}
                                            onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background="#fafafa"; }}
                                            onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background=isActive?"#faf5ff":"#fff"; }}
                                        >
                                            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
                                                <div style={{fontSize:13,fontWeight:600,color:isActive?"#6d28d9":"#111827",lineHeight:1.3}}>
                                                    {job.title}
                                                </div>
                                                <div style={{
                                                    flexShrink:0,minWidth:20,height:20,borderRadius:100,
                                                    background: appCount>0?(isActive?"#7c3aed":"#e5e7eb"):"transparent",
                                                    color: appCount>0?(isActive?"#fff":"#6b7280"):"transparent",
                                                    fontSize:10,fontWeight:700,
                                                    display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px",
                                                }}>
                                                    {appCount>0?appCount:""}
                                                </div>
                                            </div>
                                            <div style={{fontSize:11,color:"#9ca3af",marginBottom:5}}>{job.office?.company_name}</div>
                                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                                                <span style={{fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:100,background:sc.bg,color:sc.color}}>
                                                    {sc.label}
                                                </span>
                                                {job.deadline&&<span style={{fontSize:10,color:"#9ca3af"}}>· {job.deadline}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Applicants Panel ── */}
                        <div>
                            {!selectedJob ? null : (
                                <>
                                    {/* Panel header */}
                                    <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,padding:"16px 20px",marginBottom:12}}>
                                        {/* Top row */}
                                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                                            <div>
                                                <div style={{fontSize:16,fontWeight:700,color:"#111827",letterSpacing:"-0.02em",marginBottom:3}}>
                                                    {selectedJob.title}
                                                </div>
                                                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#9ca3af",flexWrap:"wrap"}}>
                                                    <span>{selectedJob.office?.company_name}</span>
                                                    <span>·</span>
                                                    <span style={{fontWeight:600,color:selectedJobApps.length>0?"#7c3aed":"#9ca3af"}}>
                                                        {selectedJobApps.length} total applicant{selectedJobApps.length!==1?"s":""}
                                                    </span>
                                                    {selectedJobApps.length>0&&(
                                                        <span style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                                            {APP_STATUS_OPTS.map(s=>{
                                                                const cnt=selectedJobApps.filter(a=>a.status===s.value).length;
                                                                return cnt>0?(<span key={s.value} style={{padding:"1px 7px",borderRadius:100,background:s.bg,color:s.color,fontSize:10,fontWeight:600}}>{s.label}: {cnt}</span>):null;
                                                            })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                                                <select value={appSort} onChange={e=>setAppSort(e.target.value)}
                                                    style={{padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:12,color:"#374151",background:"#fff",outline:"none",cursor:"pointer"}}>
                                                    <option value="latest">Latest First</option>
                                                    <option value="name">Name A–Z</option>
                                                    <option value="score">By Score</option>
                                                </select>
                                                {selectedApps.length>0&&(
                                                    <button onClick={()=>setBulkModal(true)}
                                                        style={{padding:"6px 14px",borderRadius:8,background:"#7c3aed",border:"none",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                                                        ✏️ Update {selectedApps.length} selected
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* Filter pills + select all */}
                                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                                            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                                {[{value:"all",label:"All"},...APP_STATUS_OPTS].map(s=>(
                                                    <button key={s.value} type="button"
                                                        onClick={()=>{setAppFilter(s.value);setSelectedApps([]);}}
                                                        style={{
                                                            padding:"5px 12px",borderRadius:100,fontSize:11,fontWeight:500,cursor:"pointer",transition:"all 0.15s",
                                                            border:appFilter===s.value?`1.5px solid ${s.color||"#7c3aed"}`:"1.5px solid #e5e7eb",
                                                            background:appFilter===s.value?(s.bg||"#ede9fe"):"#fff",
                                                            color:appFilter===s.value?(s.color||"#7c3aed"):"#6b7280",
                                                        }}>
                                                        {s.label}{s.value!=="all"&&selectedJobApps.filter(a=>a.status===s.value).length>0&&(
                                                            <span style={{marginLeft:5,opacity:0.7}}>({selectedJobApps.filter(a=>a.status===s.value).length})</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {filteredApps.length>1&&(
                                                <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#6b7280",cursor:"pointer",userSelect:"none"}}>
                                                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                                                        style={{width:14,height:14,accentColor:"#7c3aed",cursor:"pointer"}}/>
                                                    Select all ({filteredApps.length})
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Applicant cards */}
                                    {filteredApps.length===0 ? (
                                        <div style={{
                                            background:"#fff",border:"1px solid #e5e7eb",
                                            borderRadius:14,padding:"48px 32px",
                                            textAlign:"center",
                                        }}>
                                            <div style={{fontSize:36,marginBottom:12}}>📭</div>
                                            <div style={{fontSize:14,fontWeight:500,color:"#374151",marginBottom:4}}>
                                                No applications yet
                                            </div>
                                            <div style={{fontSize:12,color:"#9ca3af"}}>
                                                Applications will appear here once candidates apply.
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                                            {filteredApps.map((app,idx)=>{
                                                const sc=sCfg(app.status,APP_STATUS_OPTS);
                                                const initials = app.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                                                const avatarColors = ["#7c3aed","#0891b2","#059669","#d97706","#dc2626","#6366f1"];
                                                const avatarBg = avatarColors[app.name.charCodeAt(0)%avatarColors.length];
                                                return (
                                                    <div key={app.id} style={{
                                                        background:"#fff",
                                                        border: selectedApps.includes(app.id)
                                                            ? "1.5px solid #7c3aed"
                                                            : "1px solid #e5e7eb",
                                                        borderRadius:14,padding:"16px 20px",
                                                        display:"grid",
                                                        gridTemplateColumns:"20px 48px 1fr auto",
                                                        gap:14,alignItems:"start",
                                                        transition:"box-shadow 0.15s, border-color 0.15s",
                                                        background: selectedApps.includes(app.id) ? "#faf5ff" : "#fff",
                                                    }}
                                                        onMouseEnter={e=>{ if(!selectedApps.includes(app.id)){ e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor="#d1d5db"; }}}
                                                        onMouseLeave={e=>{ if(!selectedApps.includes(app.id)){ e.currentTarget.style.boxShadow="none"; e.currentTarget.style.borderColor="#e5e7eb"; }}}
                                                    >
                                                        {/* Checkbox */}
                                                        <div style={{paddingTop:14}}>
                                                            <input type="checkbox"
                                                                checked={selectedApps.includes(app.id)}
                                                                onChange={()=>toggleSelect(app.id)}
                                                                style={{width:14,height:14,accentColor:"#7c3aed",cursor:"pointer"}}/>
                                                        </div>

                                                        {/* Avatar */}
                                                        <div style={{
                                                            width:48,height:48,borderRadius:12,
                                                            background:avatarBg,
                                                            display:"flex",alignItems:"center",justifyContent:"center",
                                                            fontSize:16,fontWeight:700,color:"#fff",
                                                            letterSpacing:"-0.02em",flexShrink:0,
                                                        }}>
                                                            {initials}
                                                        </div>

                                                        {/* Info */}
                                                        <div style={{minWidth:0}}>
                                                            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3,flexWrap:"wrap"}}>
                                                                <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>
                                                                    {app.name}
                                                                </div>
                                                                <span style={{
                                                                    fontSize:10,fontWeight:600,
                                                                    padding:"2px 10px",borderRadius:100,
                                                                    background:sc.bg,color:sc.color,
                                                                    letterSpacing:"0.03em",
                                                                }}>
                                                                    {sc.label}
                                                                </span>
                                                            </div>
                                                            <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginBottom:8}}>
                                                                <a href={`mailto:${app.email}`} style={{
                                                                    fontSize:12,color:"#6b7280",
                                                                    textDecoration:"none",display:"flex",alignItems:"center",gap:5,
                                                                }}>
                                                                    <span style={{opacity:0.5}}>✉</span> {app.email}
                                                                </a>
                                                                {app.phone&&(
                                                                    <span style={{fontSize:12,color:"#6b7280",display:"flex",alignItems:"center",gap:5}}>
                                                                        <span style={{opacity:0.5}}>☎</span> {app.phone}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                                                                <span style={{
                                                                    fontSize:10,color:"#9ca3af",
                                                                    background:"#f9fafb",border:"1px solid #f3f4f6",
                                                                    padding:"2px 8px",borderRadius:5,fontFamily:"monospace",
                                                                }}>
                                                                    #{app.reference_code}
                                                                </span>
                                                                <span style={{fontSize:11,color:"#9ca3af"}}>
                                                                    Applied {app.applied_at}
                                                                </span>
                                                            </div>
                                                            {app.hr_note&&(
                                                                <div style={{
                                                                    marginTop:10,
                                                                    fontSize:12,color:"#6b7280",
                                                                    background:"#f9fafb",border:"1px solid #f3f4f6",
                                                                    borderRadius:8,padding:"8px 12px",
                                                                    fontStyle:"italic",lineHeight:1.6,
                                                                    borderLeft:"3px solid #ddd6fe",
                                                                }}>
                                                                    {app.hr_note}
                                                                </div>
                                                            )}

                                                            {/* Interview info */}
                                                            {app.interview && (
                                                                <div style={{
                                                                    marginTop:10,
                                                                    background:"#f0f9ff",border:"1px solid #bae6fd",
                                                                    borderRadius:8,padding:"10px 12px",
                                                                    borderLeft:"3px solid #0891b2",
                                                                }}>
                                                                    <div style={{fontSize:10,fontWeight:700,color:"#0891b2",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:5}}>
                                                                        Interview Scheduled
                                                                    </div>
                                                                    <div style={{fontSize:12,color:"#0c4a6e",fontWeight:500}}>
                                                                        📅 {app.interview.scheduled_at}
                                                                    </div>
                                                                    {app.interview.meeting_link && (
                                                                        <a href={app.interview.meeting_link} target="_blank" rel="noopener noreferrer"
                                                                            style={{fontSize:11,color:"#0891b2",display:"block",marginTop:3,wordBreak:"break-all"}}>
                                                                            🔗 {app.interview.meeting_link}
                                                                        </a>
                                                                    )}
                                                                    {app.interview.location && (
                                                                        <div style={{fontSize:11,color:"#0c4a6e",marginTop:3}}>
                                                                            📍 {app.interview.location}
                                                                        </div>
                                                                    )}
                                                                    {/* Score badge */}
                                                                    {app.interview.score !== null && app.interview.score !== undefined && (
                                                                        <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                                                                            <div style={{
                                                                                fontSize:13,fontWeight:700,
                                                                                color: app.interview.score>=70?"#059669":app.interview.score>=50?"#d97706":"#dc2626",
                                                                            }}>
                                                                                Score: {app.interview.score}/100
                                                                            </div>
                                                                            {app.interview.recommendation && (
                                                                                <span style={{
                                                                                    fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:100,
                                                                                    background: app.interview.recommendation==="proceed"?"#d1fae5":app.interview.recommendation==="hold"?"#fef3c7":"#fee2e2",
                                                                                    color: app.interview.recommendation==="proceed"?"#059669":app.interview.recommendation==="hold"?"#d97706":"#dc2626",
                                                                                }}>
                                                                                    {app.interview.recommendation.charAt(0).toUpperCase()+app.interview.recommendation.slice(1)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end",flexShrink:0}}>
                                                            <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    display:"inline-flex",alignItems:"center",gap:6,
                                                                    padding:"7px 14px",borderRadius:8,
                                                                    background:"#f9fafb",border:"1px solid #e5e7eb",
                                                                    color:"#374151",fontSize:12,fontWeight:500,
                                                                    textDecoration:"none",transition:"all 0.15s",
                                                                    whiteSpace:"nowrap",
                                                                }}
                                                                onMouseEnter={e=>{ e.currentTarget.style.background="#f3f4f6"; e.currentTarget.style.borderColor="#d1d5db"; }}
                                                                onMouseLeave={e=>{ e.currentTarget.style.background="#f9fafb"; e.currentTarget.style.borderColor="#e5e7eb"; }}>
                                                                📄 CV
                                                            </a>
                                                            <button onClick={()=>setNoteModal(app)}
                                                                style={{
                                                                    display:"inline-flex",alignItems:"center",gap:6,
                                                                    padding:"7px 14px",borderRadius:8,
                                                                    background:"#ede9fe",border:"1px solid #ddd6fe",
                                                                    color:"#7c3aed",fontSize:12,fontWeight:500,
                                                                    cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",
                                                                }}
                                                                onMouseEnter={e=>e.currentTarget.style.background="#ddd6fe"}
                                                                onMouseLeave={e=>e.currentTarget.style.background="#ede9fe"}>
                                                                ✏️ Status
                                                            </button>
                                                            <button onClick={()=>setInterviewModal(app)}
                                                                style={{
                                                                    display:"inline-flex",alignItems:"center",gap:6,
                                                                    padding:"7px 14px",borderRadius:8,
                                                                    background: app.interview ? "#f0f9ff" : "#fff",
                                                                    border: app.interview ? "1px solid #bae6fd" : "1px solid #e5e7eb",
                                                                    color: app.interview ? "#0891b2" : "#6b7280",
                                                                    fontSize:12,fontWeight:500,
                                                                    cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",
                                                                }}
                                                                onMouseEnter={e=>e.currentTarget.style.background=app.interview?"#e0f2fe":"#f9fafb"}
                                                                onMouseLeave={e=>e.currentTarget.style.background=app.interview?"#f0f9ff":"#fff"}>
                                                                📅 {app.interview ? "Reschedule" : "Interview"}
                                                            </button>
                                                            {app.status==="interview" && (
                                                                <button onClick={()=>setScoreModal(app)}
                                                                    style={{
                                                                        display:"inline-flex",alignItems:"center",gap:6,
                                                                        padding:"7px 14px",borderRadius:8,
                                                                        background: app.interview?.score!=null ? "#d1fae5" : "#fff7ed",
                                                                        border: app.interview?.score!=null ? "1px solid #6ee7b7" : "1px solid #fed7aa",
                                                                        color: app.interview?.score!=null ? "#059669" : "#d97706",
                                                                        fontSize:12,fontWeight:500,
                                                                        cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",
                                                                    }}
                                                                    onMouseEnter={e=>e.currentTarget.style.opacity="0.8"}
                                                                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                                                                    ⭐ {app.interview?.score!=null ? `Score: ${app.interview.score}` : "Add Score"}
                                                                </button>
                                                            )}
                                                            {/* Delete — rejected only */}
                                                            {app.status==="rejected" && (
                                                                <button
                                                                    onClick={()=>setDeleteModal(app)}
                                                                    style={{
                                                                        display:"inline-flex",alignItems:"center",gap:6,
                                                                        padding:"7px 14px",borderRadius:8,
                                                                        background:"#fff",border:"1px solid #fecaca",
                                                                        color:"#dc2626",fontSize:12,fontWeight:500,
                                                                        cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap",
                                                                    }}
                                                                    onMouseEnter={e=>{ e.currentTarget.style.background="#fee2e2"; e.currentTarget.style.borderColor="#fca5a5"; }}
                                                                    onMouseLeave={e=>{ e.currentTarget.style.background="#fff"; e.currentTarget.style.borderColor="#fecaca"; }}>
                                                                    🗑️ Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {jobModal&&<JobModal offices={offices} editJob={editJob} onClose={()=>{setJobModal(false);setEditJob(null);}}/>}
            {noteModal&&<StatusModal app={noteModal} onClose={()=>setNoteModal(null)}/>}
            {interviewModal&&<InterviewModal app={interviewModal} onClose={()=>setInterviewModal(null)}/>}
            {scoreModal&&<ScoreModal app={scoreModal} onClose={()=>setScoreModal(null)}/>}
            {bulkModal&&<BulkModal ids={selectedApps} onClose={()=>setBulkModal(false)} onDone={()=>{setBulkModal(false);setSelectedApps([]);}}/>}
            {deleteModal&&<DeleteModal app={deleteModal} onClose={()=>setDeleteModal(null)}/>}
            {deleteJobModal&&<DeleteJobModal job={deleteJobModal} onClose={()=>setDeleteJobModal(null)}/>}
        </AppLayout>
    );
}

// ─────────────────────────────────────────────
// JobModal — reference design style
// ─────────────────────────────────────────────
function JobModal({ offices, editJob, onClose }) {
    const isEdit = !!editJob;
    const [descItems,  setDescItems]  = useState(()=>toArr(editJob?.description      || ""));
    const [reqItems,   setReqItems]   = useState(()=>toArr(editJob?.requirements     || ""));
    const [respItems,  setRespItems]  = useState(()=>toArr(editJob?.responsibilities || ""));
    const [negotiate,  setNegotiate]  = useState(()=>editJob?.salary_range==="Negotiable"||false);
    const [errs,       setErrs]       = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [data, setDataState] = useState({
        brycen_office_id: editJob?.brycen_office_id ? String(editJob.brycen_office_id) : "",
        title:            editJob?.title            || "",
        department:       editJob?.department       || "",
        type:             editJob?.type             || "full_time",
        slots:            editJob?.slots            || 1,
        salary_range:     editJob?.salary_range     || "",
        status:           editJob?.status           || "open",
        deadline:         editJob?.deadline         || "",
    });
    const setData = (k, v) => setDataState(p => ({...p, [k]: v}));

    // ── Frontend validation ──────────────────
    const validate = () => {
        const e = {};
        if (!data.brycen_office_id)
            e.brycen_office_id = "Please select a company office.";
        if (!data.type)
            e.type = "Please select a job type.";
        if (!data.title.trim())
            e.title = "Job title is required.";
        if (!data.slots || parseInt(data.slots) < 1)
            e.slots = "At least 1 position required.";
        if (!negotiate && !data.salary_range.trim())
            e.salary_range = "Enter salary range or check Negotiable.";
        const validDesc = descItems.filter(s => s.trim());
        if (validDesc.length === 0)
            e.description = "Add at least one description point.";
        const validReq = reqItems.filter(s => s.trim());
        if (validReq.length === 0)
            e.requirements = "Add at least one requirement.";
        return e;
    };

    const submit = (e) => {
        e.preventDefault();
        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrs(validation);
            // Scroll to first error
            const first = document.querySelector(".field-err");
            if (first) first.scrollIntoView({ behavior:"smooth", block:"center" });
            return;
        }
        setErrs({});
        setSubmitting(true);

        const payload = {
            ...data,
            description:      toStr(descItems),
            requirements:     toStr(reqItems),
            responsibilities: toStr(respItems),
            salary_range:     negotiate ? "Negotiable" : data.salary_range,
        };

        const opts = {
            preserveScroll: true,
            onSuccess: () => { setSubmitting(false); onClose(); },
            onError:   () => setSubmitting(false),
        };

        if (isEdit) {
            router.put(`/recruitment/jobs/${editJob.id}`, payload, opts);
        } else {
            router.post("/recruitment/jobs", payload, opts);
        }
    };

    const errMsg = (key) => errs[key] ? (
        <div className="field-err" style={{fontSize:11,color:"#dc2626",marginTop:5,display:"flex",alignItems:"center",gap:4}}>
            <span>⚠</span> {errs[key]}
        </div>
    ) : null;

    const pill = (selected, errKey) => ({
        padding:"7px 16px", borderRadius:100, cursor:"pointer",
        border: errs[errKey] && !selected
            ? "1.5px solid #fca5a5"
            : selected ? "2px solid #7c3aed" : "1.5px solid #e5e7eb",
        background: selected ? "#ede9fe" : "#fff",
        color: selected ? "#6d28d9" : "#374151",
        fontSize:13, fontWeight: selected ? 600 : 400,
        transition:"all 0.15s", lineHeight:1,
    });

    const fInp = (errKey, extra={}) => ({
        ...inp, ...extra,
        borderColor: errs[errKey] ? "#fca5a5" : "#e5e7eb",
        boxShadow: errs[errKey] ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
    });

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%", maxWidth:600,
                maxHeight:"92vh",
                borderRadius:20, overflow:"hidden",
                display:"flex", flexDirection:"column",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}>

                {/* ── Purple gradient header ── */}
                <div style={{
                    background:"linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#8b5cf6 100%)",
                    padding:"22px 26px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexShrink:0,
                }}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:46,height:46,borderRadius:13,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                            {isEdit ? "✏️" : "📋"}
                        </div>
                        <div>
                            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>
                                {isEdit ? "Edit Posting" : "Job Recruitment"}
                            </div>
                            <div style={{fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>
                                {isEdit ? editJob.title : "New Job Posting"}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:20,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s",flexShrink:0}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.28)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"}>×</button>
                </div>

                {/* ── Scrollable body ── */}
                <form onSubmit={submit} style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,background:"#fff"}}>
                    <div style={{overflowY:"auto",flex:1,padding:"24px 26px 16px"}}>

                        {/* Summary error banner */}
                        {Object.keys(errs).length > 0 && (
                            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 14px",marginBottom:18,fontSize:13,color:"#dc2626",display:"flex",alignItems:"center",gap:8}}>
                                <span style={{fontSize:16}}>⚠️</span>
                                Please fill in all required fields before saving.
                            </div>
                        )}

                        {/* Company Office — pills */}
                        <div style={{marginBottom:20}}>
                            <label style={lbl}>Company Office *</label>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                {offices.map(o=>(
                                    <button key={o.id} type="button"
                                        onClick={()=>{setData("brycen_office_id",String(o.id));setErrs(p=>({...p,brycen_office_id:undefined}));}}
                                        style={pill(String(data.brycen_office_id)===String(o.id),"brycen_office_id")}>
                                        {o.company_name}
                                    </button>
                                ))}
                            </div>
                            {errMsg("brycen_office_id")}
                        </div>

                        {/* Job Type — pills */}
                        <div style={{marginBottom:20}}>
                            <label style={lbl}>Job Type *</label>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                {JOB_TYPE_OPTS.map(t=>(
                                    <button key={t.value} type="button"
                                        onClick={()=>{setData("type",t.value);setErrs(p=>({...p,type:undefined}));}}
                                        style={pill(data.type===t.value,"type")}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            {errMsg("type")}
                        </div>

                        <div style={{height:1,background:"#f3f4f6",margin:"4px 0 20px"}}/>

                        {/* Job Title */}
                        <div style={{marginBottom:14}}>
                            <label style={lbl}>Job Title *</label>
                            <input style={fInp("title")} value={data.title}
                                onChange={e=>{setData("title",e.target.value);setErrs(p=>({...p,title:undefined}));}}
                                onFocus={e=>{if(!errs.title){e.target.style.borderColor="#7c3aed";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)";}}}
                                onBlur={e=>{if(!errs.title){e.target.style.borderColor="#e5e7eb";e.target.style.boxShadow="none";}}}
                                placeholder="e.g. Senior Infrastructure Engineer"/>
                            {errMsg("title")}
                        </div>

                        {/* Department + Positions */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                            <div>
                                <label style={lbl}>Department</label>
                                <input style={inp} value={data.department}
                                    onChange={e=>setData("department",e.target.value)}
                                    onFocus={onF} onBlur={onB}
                                    placeholder="e.g. Engineering"/>
                            </div>
                            <div>
                                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                                    <label style={{...lbl,marginBottom:0}}>Number of Positions *</label>
                                    <span title="How many people to hire for this role"
                                        style={{width:15,height:15,borderRadius:"50%",background:"#e5e7eb",color:"#6b7280",fontSize:10,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"help",flexShrink:0}}>
                                        ?
                                    </span>
                                </div>
                                <input type="number" style={fInp("slots")} value={data.slots}
                                    onChange={e=>{setData("slots",e.target.value);setErrs(p=>({...p,slots:undefined}));}}
                                    onFocus={onF} onBlur={onB} min={1}/>
                                {errMsg("slots")}
                            </div>
                        </div>

                        {/* Salary + Deadline */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                            <div>
                                <label style={lbl}>Salary Range {!negotiate && "*"}</label>
                                <input style={{...fInp("salary_range"), opacity:negotiate?0.45:1}}
                                    value={negotiate?"Negotiable":data.salary_range}
                                    onChange={e=>{setData("salary_range",e.target.value);setErrs(p=>({...p,salary_range:undefined}));}}
                                    onFocus={onF} onBlur={onB}
                                    placeholder="e.g. $800 – $1,200"
                                    disabled={negotiate}/>
                                <label style={{display:"flex",alignItems:"center",gap:7,marginTop:8,cursor:"pointer",fontSize:13,color:"#374151",userSelect:"none"}}>
                                    <input type="checkbox" checked={negotiate}
                                        onChange={e=>{setNegotiate(e.target.checked);setErrs(p=>({...p,salary_range:undefined}));}}
                                        style={{width:15,height:15,accentColor:"#7c3aed",cursor:"pointer"}}/>
                                    Negotiable
                                </label>
                                {errMsg("salary_range")}
                            </div>
                            <div>
                                <label style={lbl}>Application Deadline</label>
                                <input type="date" style={inp} value={data.deadline}
                                    onChange={e=>setData("deadline",e.target.value)}
                                    onFocus={onF} onBlur={onB}/>
                            </div>
                        </div>

                        {/* Status (edit only) */}
                        {isEdit&&(
                            <div style={{marginBottom:14}}>
                                <label style={lbl}>Posting Status</label>
                                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                    {JOB_STATUS_OPTS.map(s=>(
                                        <button key={s.value} type="button"
                                            onClick={()=>setData("status",s.value)}
                                            style={{...pill(data.status===s.value),
                                                border:data.status===s.value?`2px solid ${s.color}`:"1.5px solid #e5e7eb",
                                                background:data.status===s.value?s.bg:"#fff",
                                                color:data.status===s.value?s.color:"#374151",
                                            }}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{height:1,background:"#f3f4f6",margin:"8px 0 20px"}}/>

                        {/* List fields */}
                        <ListField label="Description" required items={descItems}
                            onChange={v=>{setDescItems(v);setErrs(p=>({...p,description:undefined}));}}
                            placeholder="e.g. Lead a team of engineers..."
                            error={errs.description}/>
                        <ListField label="Requirements" required items={reqItems}
                            onChange={v=>{setReqItems(v);setErrs(p=>({...p,requirements:undefined}));}}
                            placeholder="e.g. 3+ years of experience in..."
                            error={errs.requirements}/>
                        <ListField label="Responsibilities" items={respItems}
                            onChange={setRespItems}
                            placeholder="e.g. Review and approve pull requests..."/>
                    </div>

                    {/* ── Sticky footer ── */}
                    <div style={{padding:"16px 26px",borderTop:"1px solid #f3f4f6",display:"flex",gap:10,justifyContent:"flex-end",background:"#fff",flexShrink:0}}>
                        <button type="button" onClick={onClose} style={{padding:"10px 24px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fff",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} style={{padding:"10px 28px",border:"none",borderRadius:10,background:"#7c3aed",color:"#fff",fontSize:13,fontWeight:600,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit",opacity:submitting?0.65:1,transition:"background 0.15s"}}
                            onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background="#6d28d9"; }}
                            onMouseLeave={e=>{ e.currentTarget.style.background="#7c3aed"; }}>
                            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Job Posting"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// StatusModal — same design language
// ─────────────────────────────────────────────
function StatusModal({ app, onClose }) {
    const { data, setData, patch, processing } = useForm({
        status:  app.status  || "new",
        hr_note: app.hr_note || "",
    });

    const submit = (e) => {
        e.preventDefault();
        patch(`/recruitment/applications/${app.id}`, { preserveScroll:true, onSuccess:onClose });
    };

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%", maxWidth:460,
                borderRadius:20, overflow:"hidden",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                display:"flex", flexDirection:"column",
            }}>
                {/* Header */}
                <div style={{
                    background:"linear-gradient(135deg,#5b21b6 0%,#7c3aed 60%,#8b5cf6 100%)",
                    padding:"22px 26px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:46,height:46,borderRadius:13,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👤</div>
                        <div>
                            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Application</div>
                            <div style={{fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>{app.name}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:20,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.28)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"}>×</button>
                </div>

                {/* Body */}
                <form onSubmit={submit} style={{background:"#fff",padding:"24px 26px 0",display:"flex",flexDirection:"column"}}>
                    <div style={{fontSize:12,color:"#9ca3af",marginBottom:20}}>
                        {app.job_posting?.title || ""} · {app.job_posting?.office?.company_name || ""}
                    </div>

                    {/* Status pills */}
                    <div style={{marginBottom:20}}>
                        <label style={lbl}>Status</label>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                            {APP_STATUS_OPTS.map(s=>(
                                <button key={s.value} type="button"
                                    onClick={()=>setData("status",s.value)}
                                    style={{
                                        padding:"8px 18px", borderRadius:100, cursor:"pointer",
                                        border: data.status===s.value ? `2px solid ${s.color}` : "1.5px solid #e5e7eb",
                                        background: data.status===s.value ? s.bg : "#fff",
                                        color: data.status===s.value ? s.color : "#374151",
                                        fontSize:13, fontWeight: data.status===s.value ? 600 : 400,
                                        transition:"all 0.15s",
                                    }}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* HR Note */}
                    <div style={{marginBottom:8}}>
                        <label style={lbl}>HR Note</label>
                        <textarea style={{...inp,minHeight:72,resize:"vertical"}}
                            value={data.hr_note}
                            onChange={e=>setData("hr_note",e.target.value)}
                            onFocus={onF} onBlur={onB}
                            placeholder="Internal note about this applicant..."/>
                    </div>

                    {/* Footer */}
                    <div style={{padding:"16px 0 24px",display:"flex",gap:10,justifyContent:"flex-end"}}>
                        <button type="button" onClick={onClose} style={{padding:"10px 24px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fff",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        <button type="submit" disabled={processing} style={{padding:"10px 28px",border:"none",borderRadius:10,background:"#7c3aed",color:"#fff",fontSize:13,fontWeight:600,cursor:processing?"not-allowed":"pointer",fontFamily:"inherit",opacity:processing?0.65:1}}>
                            {processing?"Saving...":"Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// InterviewModal
// ─────────────────────────────────────────────
const PLATFORM_LABELS = {
    zoom:"Zoom", google_meet:"Google Meet",
    teams:"Microsoft Teams", physical:"Physical / Onsite", other:"Other",
};

function InterviewModal({ app, onClose }) {
    const existing = app.interview;
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [data, setDataState] = useState({
        scheduled_at:      existing?.scheduled_at_raw || "",
        type:              existing?.type              || "online",
        platform:          existing?.platform          || "zoom",
        meeting_link:      existing?.meeting_link      || "",
        location:          existing?.location          || "",
        interviewer_name:  existing?.interviewer_name  || "",
        note_to_candidate: existing?.note_to_candidate || "",
    });
    const set = (k,v) => { setDataState(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:undefined})); };

    // Frontend validation
    const validate = () => {
        const e = {};
        if (!data.scheduled_at) {
            e.scheduled_at = "Please select a date and time.";
        } else {
            const selected = new Date(data.scheduled_at);
            const now = new Date();
            if (selected <= now) {
                e.scheduled_at = "Interview must be scheduled for a future date and time.";
            }
        }
        return e;
    };

    const submit = (e) => {
        e.preventDefault();
        const fe = validate();
        if (Object.keys(fe).length > 0) { setErrors(fe); return; }

        setSubmitting(true);
        router.post(
            `/recruitment/applications/${app.id}/interview`,
            data,
            {
                preserveScroll: true,
                onSuccess: () => { setSubmitting(false); onClose(); },
                onError: (errs) => {
                    setSubmitting(false);
                    // Map backend errors to our state
                    const mapped = {};
                    if (errs.scheduled_at) mapped.scheduled_at = "Interview must be scheduled for a future date and time.";
                    if (errs.meeting_link) mapped.meeting_link = errs.meeting_link;
                    if (errs.location)     mapped.location     = errs.location;
                    setErrors(mapped);
                },
            }
        );
    };

    const errMsg = (key) => errors[key] ? (
        <div style={{fontSize:11,color:"#dc2626",marginTop:5,display:"flex",alignItems:"center",gap:4}}>
            <span>⚠</span> {errors[key]}
        </div>
    ) : null;

    const fInpErr = (key) => ({
        ...inp,
        borderColor: errors[key] ? "#fca5a5" : "#e5e7eb",
        boxShadow:   errors[key] ? "0 0 0 3px rgba(220,38,38,0.08)" : "none",
    });

    const pill = (selected) => ({
        padding:"7px 18px", borderRadius:100, cursor:"pointer",
        border: selected?"2px solid #0891b2":"1.5px solid #e5e7eb",
        background: selected?"#e0f2fe":"#fff",
        color: selected?"#0c4a6e":"#374151",
        fontSize:13, fontWeight: selected?600:400,
        transition:"all 0.15s",
    });

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%", maxWidth:540,
                maxHeight:"92vh", borderRadius:20, overflow:"hidden",
                display:"flex", flexDirection:"column",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
                {/* Header */}
                <div style={{
                    background:"linear-gradient(135deg,#0369a1,#0891b2)",
                    padding:"22px 26px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexShrink:0,
                }}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:46,height:46,borderRadius:13,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                            📅
                        </div>
                        <div>
                            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>
                                {existing ? "Reschedule Interview" : "Schedule Interview"}
                            </div>
                            <div style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>
                                {app.name}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:20,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.28)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"}>×</button>
                </div>

                {/* Body */}
                <form onSubmit={submit} style={{background:"#fff",display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
                    <div style={{overflowY:"auto",flex:1,padding:"24px 26px 16px"}}>

                        {/* Date & Time */}
                        <div style={{marginBottom:16}}>
                            <label style={lbl}>Date & Time *</label>
                            <input type="datetime-local" style={fInpErr("scheduled_at")}
                                value={data.scheduled_at}
                                onChange={e=>set("scheduled_at",e.target.value)}
                                required/>
                            {errMsg("scheduled_at")}
                        </div>

                        {/* Type */}
                        <div style={{marginBottom:16}}>
                            <label style={lbl}>Interview Type *</label>
                            <div style={{display:"flex",gap:8}}>
                                {["online","onsite"].map(t=>(
                                    <button key={t} type="button" onClick={()=>set("type",t)} style={pill(data.type===t)}>
                                        {t==="online"?"💻 Online":"🏢 Onsite"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Platform */}
                        {data.type==="online" && (
                            <div style={{marginBottom:16}}>
                                <label style={lbl}>Platform</label>
                                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                    {["zoom","google_meet","teams","other"].map(p=>(
                                        <button key={p} type="button" onClick={()=>set("platform",p)} style={pill(data.platform===p)}>
                                            {PLATFORM_LABELS[p]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Meeting Link / Location */}
                        {data.type==="online" ? (
                            <div style={{marginBottom:16}}>
                                <label style={lbl}>Meeting Link</label>
                                <input style={fInpErr("meeting_link")} value={data.meeting_link}
                                    onChange={e=>set("meeting_link",e.target.value)}
                                    onFocus={onF} onBlur={onB}
                                    placeholder="https://zoom.us/j/..."/>
                                {errMsg("meeting_link")}
                            </div>
                        ) : (
                            <div style={{marginBottom:16}}>
                                <label style={lbl}>Location</label>
                                <input style={fInpErr("location")} value={data.location}
                                    onChange={e=>set("location",e.target.value)}
                                    onFocus={onF} onBlur={onB}
                                    placeholder="Office address or room number"/>
                                {errMsg("location")}
                            </div>
                        )}

                        {/* Interviewer */}
                        <div style={{marginBottom:16}}>
                            <label style={lbl}>Interviewer Name</label>
                            <input style={inp} value={data.interviewer_name}
                                onChange={e=>set("interviewer_name",e.target.value)}
                                onFocus={onF} onBlur={onB}
                                placeholder="e.g. Daw Aye Aye (HR Manager)"/>
                        </div>

                        {/* Note */}
                        <div style={{marginBottom:8}}>
                            <label style={lbl}>Note to Candidate</label>
                            <textarea style={{...inp,minHeight:80,resize:"vertical"}}
                                value={data.note_to_candidate}
                                onChange={e=>set("note_to_candidate",e.target.value)}
                                onFocus={onF} onBlur={onB}
                                placeholder="What to prepare, dress code, documents to bring..."/>
                        </div>

                        {/* Email notice */}
                        <div style={{
                            background:"#f0fdf4",border:"1px solid #bbf7d0",
                            borderRadius:8,padding:"10px 14px",
                            fontSize:12,color:"#166534",
                            display:"flex",alignItems:"center",gap:8,
                        }}>
                            <span>✉️</span>
                            An invitation email will be sent automatically to <strong>{app.email}</strong>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{padding:"16px 26px 22px",borderTop:"1px solid #f3f4f6",display:"flex",gap:10,justifyContent:"flex-end",background:"#fff",flexShrink:0}}>
                        <button type="button" onClick={onClose} style={{padding:"10px 22px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fff",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} style={{padding:"10px 26px",border:"none",borderRadius:10,background:"#0891b2",color:"#fff",fontSize:13,fontWeight:600,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit",opacity:submitting?0.65:1}}>
                            {submitting?"Scheduling...":existing?"Reschedule & Send Email":"Schedule & Send Email"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// ScoreModal
// ─────────────────────────────────────────────
function ScoreModal({ app, onClose }) {
    const existing = app.interview;
    const [submitting, setSubmitting] = useState(false);
    const [data, setDataState] = useState({
        score:          existing?.score          ?? 70,
        strengths:      existing?.strengths      || "",
        weaknesses:     existing?.weaknesses     || "",
        recommendation: existing?.recommendation || "proceed",
        internal_note:  existing?.internal_note  || "",
    });
    const set = (k,v) => setDataState(p=>({...p,[k]:v}));

    const submit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            `/recruitment/applications/${app.id}/score`,
            data,
            {
                preserveScroll:true,
                onSuccess:()=>{ setSubmitting(false); onClose(); },
                onError:()=>setSubmitting(false),
            }
        );
    };

    const scoreColor = data.score>=70?"#059669":data.score>=50?"#d97706":"#dc2626";
    const recOpts = [
        {value:"proceed", label:"✅ Proceed",  color:"#059669", bg:"#d1fae5"},
        {value:"hold",    label:"⏸ Hold",      color:"#d97706", bg:"#fef3c7"},
        {value:"reject",  label:"❌ Reject",    color:"#dc2626", bg:"#fee2e2"},
    ];

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%", maxWidth:500,
                maxHeight:"92vh", borderRadius:20, overflow:"hidden",
                display:"flex", flexDirection:"column",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
                {/* Header */}
                <div style={{
                    background:"linear-gradient(135deg,#d97706,#f59e0b)",
                    padding:"22px 26px",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    flexShrink:0,
                }}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:46,height:46,borderRadius:13,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                            ⭐
                        </div>
                        <div>
                            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.7)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>
                                Interview Score
                            </div>
                            <div style={{fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>
                                {app.name}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",fontSize:20,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.35)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.2)"}>×</button>
                </div>

                {/* Body */}
                <form onSubmit={submit} style={{background:"#fff",display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
                    <div style={{overflowY:"auto",flex:1,padding:"24px 26px 16px"}}>

                        {/* Score slider */}
                        <div style={{marginBottom:24}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                                <label style={lbl}>Score *</label>
                                <div style={{
                                    fontSize:28,fontWeight:800,
                                    color:scoreColor,
                                    letterSpacing:"-0.04em",
                                }}>
                                    {data.score}<span style={{fontSize:14,fontWeight:400,color:"#9ca3af"}}>/100</span>
                                </div>
                            </div>
                            <input type="range" min={0} max={100} step={1}
                                value={data.score}
                                onChange={e=>set("score",parseInt(e.target.value))}
                                style={{width:"100%",accentColor:scoreColor,cursor:"pointer"}}/>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#9ca3af",marginTop:4}}>
                                <span>Poor</span><span>Average</span><span>Excellent</span>
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div style={{marginBottom:18}}>
                            <label style={lbl}>Recommendation *</label>
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                {recOpts.map(r=>(
                                    <button key={r.value} type="button"
                                        onClick={()=>set("recommendation",r.value)}
                                        style={{
                                            padding:"8px 18px",borderRadius:100,cursor:"pointer",
                                            border: data.recommendation===r.value?`2px solid ${r.color}`:"1.5px solid #e5e7eb",
                                            background: data.recommendation===r.value?r.bg:"#fff",
                                            color: data.recommendation===r.value?r.color:"#374151",
                                            fontSize:13,fontWeight:data.recommendation===r.value?600:400,
                                            transition:"all 0.15s",
                                        }}>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Strengths */}
                        <div style={{marginBottom:14}}>
                            <label style={lbl}>Strengths</label>
                            <textarea style={{...inp,minHeight:68,resize:"vertical"}}
                                value={data.strengths}
                                onChange={e=>set("strengths",e.target.value)}
                                onFocus={onF} onBlur={onB}
                                placeholder="What stood out positively..."/>
                        </div>

                        {/* Weaknesses */}
                        <div style={{marginBottom:14}}>
                            <label style={lbl}>Areas for Improvement</label>
                            <textarea style={{...inp,minHeight:68,resize:"vertical"}}
                                value={data.weaknesses}
                                onChange={e=>set("weaknesses",e.target.value)}
                                onFocus={onF} onBlur={onB}
                                placeholder="Skills gaps or concerns..."/>
                        </div>

                        {/* Internal note */}
                        <div>
                            <label style={lbl}>Internal Note</label>
                            <textarea style={{...inp,minHeight:60,resize:"vertical"}}
                                value={data.internal_note}
                                onChange={e=>set("internal_note",e.target.value)}
                                onFocus={onF} onBlur={onB}
                                placeholder="HR internal notes (not visible to candidate)..."/>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{padding:"16px 26px 22px",borderTop:"1px solid #f3f4f6",display:"flex",gap:10,justifyContent:"flex-end",background:"#fff",flexShrink:0}}>
                        <button type="button" onClick={onClose} style={{padding:"10px 22px",border:"1px solid #e5e7eb",borderRadius:10,background:"#fff",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting} style={{padding:"10px 26px",border:"none",borderRadius:10,background:"#d97706",color:"#fff",fontSize:13,fontWeight:600,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit",opacity:submitting?0.65:1}}>
                            {submitting?"Saving...":"Save Score"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// BulkModal — bulk status update
// ─────────────────────────────────────────────
function BulkModal({ ids, onClose, onDone }) {
    const [status, setStatus]       = useState("reviewing");
    const [submitting, setSubmitting] = useState(false);

    const submit = () => {
        setSubmitting(true);
        router.post("/recruitment/applications/bulk-update",
            { ids, status },
            {
                preserveScroll:true,
                onSuccess:onDone,
                onError:()=>setSubmitting(false),
            }
        );
    };

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%",maxWidth:400,borderRadius:18,overflow:"hidden",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
                <div style={{background:"linear-gradient(135deg,#5b21b6,#7c3aed)",padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                        <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.65)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Bulk Action</div>
                        <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>Update {ids.length} Applicant{ids.length!==1?"s":""}</div>
                    </div>
                    <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
                <div style={{background:"#fff",padding:"24px"}}>
                    <label style={lbl}>Set Status To</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
                        {APP_STATUS_OPTS.map(s=>(
                            <button key={s.value} type="button" onClick={()=>setStatus(s.value)}
                                style={{
                                    padding:"8px 16px",borderRadius:100,cursor:"pointer",fontSize:12,fontWeight:500,
                                    border:status===s.value?`2px solid ${s.color}`:"1.5px solid #e5e7eb",
                                    background:status===s.value?s.bg:"#fff",
                                    color:status===s.value?s.color:"#6b7280",
                                    transition:"all 0.15s",
                                }}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                        <button onClick={onClose} style={{padding:"9px 20px",border:"1px solid #e5e7eb",borderRadius:9,background:"#fff",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        <button onClick={submit} disabled={submitting}
                            style={{padding:"9px 24px",border:"none",borderRadius:9,background:"#7c3aed",color:"#fff",fontSize:13,fontWeight:600,cursor:submitting?"not-allowed":"pointer",fontFamily:"inherit",opacity:submitting?0.65:1}}>
                            {submitting?"Updating...":"Apply to All"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DeleteModal — premium confirmation UI
// ─────────────────────────────────────────────
function DeleteModal({ app, onClose }) {
    const [submitting, setSubmitting] = useState(false);

    const confirm = () => {
        setSubmitting(true);
        router.delete(`/recruitment/applications/${app.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: () => setSubmitting(false),
        });
    };

    const initials = app.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
    const avatarColors = ["#7c3aed","#0891b2","#059669","#d97706","#dc2626","#6366f1"];
    const avatarBg = avatarColors[app.name.charCodeAt(0) % avatarColors.length];

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%", maxWidth:420,
                borderRadius:20, overflow:"hidden",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                background:"#fff",
            }}>
                {/* Red top accent */}
                <div style={{height:4, background:"linear-gradient(90deg,#dc2626,#ef4444)"}}/>

                <div style={{padding:"32px 32px 28px"}}>

                    {/* Warning icon */}
                    <div style={{
                        width:56, height:56, borderRadius:16,
                        background:"#fee2e2",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:26, marginBottom:20,
                    }}>
                        🗑️
                    </div>

                    {/* Title */}
                    <div style={{fontSize:18,fontWeight:700,color:"#111827",letterSpacing:"-0.3px",marginBottom:8}}>
                        Delete Application
                    </div>
                    <div style={{fontSize:14,color:"#6b7280",lineHeight:1.65,marginBottom:24}}>
                        This will permanently delete the application record and the uploaded CV file.
                        <strong style={{color:"#dc2626"}}> This action cannot be undone.</strong>
                    </div>

                    {/* Applicant info card */}
                    <div style={{
                        background:"#f9fafb", border:"1px solid #f3f4f6",
                        borderRadius:12, padding:"14px 16px",
                        display:"flex", alignItems:"center", gap:14,
                        marginBottom:28,
                    }}>
                        <div style={{
                            width:40, height:40, borderRadius:10,
                            background:avatarBg, color:"#fff",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:14, fontWeight:700, flexShrink:0,
                        }}>
                            {initials}
                        </div>
                        <div style={{minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:"#111827",marginBottom:2}}>
                                {app.name}
                            </div>
                            <div style={{fontSize:12,color:"#9ca3af",display:"flex",alignItems:"center",gap:8}}>
                                <span>{app.email}</span>
                                <span style={{
                                    padding:"1px 8px",borderRadius:100,
                                    background:"#fee2e2",color:"#dc2626",
                                    fontSize:10,fontWeight:600,
                                }}>
                                    Rejected
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Checklist of what gets deleted */}
                    <div style={{
                        background:"#fff7f7", border:"1px solid #fecaca",
                        borderRadius:10, padding:"12px 16px", marginBottom:28,
                    }}>
                        <div style={{fontSize:11,fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
                            Will be deleted
                        </div>
                        {[
                            "Application record & all details",
                            "Uploaded CV file",
                            "Interview record & score",
                        ].map((item,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<2?6:0}}>
                                <span style={{width:5,height:5,borderRadius:"50%",background:"#dc2626",flexShrink:0}}/>
                                <span style={{fontSize:13,color:"#6b7280"}}>{item}</span>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{display:"flex",gap:10}}>
                        <button type="button" onClick={onClose}
                            style={{
                                flex:1, padding:"11px",border:"1px solid #e5e7eb",
                                borderRadius:10,background:"#fff",color:"#374151",
                                fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",
                                transition:"background 0.15s",
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            Cancel
                        </button>
                        <button type="button" onClick={confirm} disabled={submitting}
                            style={{
                                flex:1, padding:"11px", border:"none",
                                borderRadius:10,
                                background: submitting ? "#fca5a5" : "#dc2626",
                                color:"#fff", fontSize:13, fontWeight:600,
                                cursor: submitting ? "not-allowed" : "pointer",
                                fontFamily:"inherit", transition:"background 0.15s",
                                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                            }}
                            onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background="#b91c1c"; }}
                            onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background="#dc2626"; }}>
                            {submitting ? (
                                <>Deleting...</>
                            ) : (
                                <>🗑️ Delete Permanently</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// DeleteJobModal — job posting delete confirmation
// ─────────────────────────────────────────────
function DeleteJobModal({ job, onClose }) {
    const [submitting, setSubmitting] = useState(false);
    const appCount = job.applications_count || 0;

    const confirm = () => {
        setSubmitting(true);
        router.delete(`/recruitment/jobs/${job.id}`, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: () => setSubmitting(false),
        });
    };

    const sc = (() => {
        const t = JOB_TYPE_OPTS.find(t=>t.value===job.type);
        return t?.label || job.type;
    })();

    return (
        <div className="mo" onClick={onClose}>
            <div onClick={e=>e.stopPropagation()} style={{
                width:"100%", maxWidth:440,
                borderRadius:20, overflow:"hidden",
                boxShadow:"0 32px 80px rgba(0,0,0,0.22)",
                animation:"popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                background:"#fff",
            }}>
                {/* Red top accent */}
                <div style={{height:4, background:"linear-gradient(90deg,#dc2626,#ef4444)"}}/>

                <div style={{padding:"32px 32px 28px"}}>

                    {/* Warning icon */}
                    <div style={{
                        width:56, height:56, borderRadius:16,
                        background:"#fee2e2",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:26, marginBottom:20,
                    }}>
                        📋
                    </div>

                    <div style={{fontSize:18,fontWeight:700,color:"#111827",letterSpacing:"-0.3px",marginBottom:8}}>
                        Delete Job Posting
                    </div>
                    <div style={{fontSize:14,color:"#6b7280",lineHeight:1.65,marginBottom:24}}>
                        Are you sure you want to delete this job posting?
                        <strong style={{color:"#dc2626"}}> This action cannot be undone.</strong>
                    </div>

                    {/* Job info card */}
                    <div style={{
                        background:"#f9fafb", border:"1px solid #f3f4f6",
                        borderRadius:12, padding:"16px 18px",
                        marginBottom:20,
                    }}>
                        <div style={{fontSize:15,fontWeight:700,color:"#111827",marginBottom:6,letterSpacing:"-0.2px"}}>
                            {job.title}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span style={{fontSize:12,color:"#6b7280"}}>{job.office?.company_name}</span>
                            <span style={{
                                fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:100,
                                background:"#ede9fe",color:"#7c3aed",
                            }}>
                                {sc}
                            </span>
                            <span style={{fontSize:12,color:"#9ca3af"}}>·</span>
                            <span style={{fontSize:12,color:"#9ca3af"}}>{job.slots} position{job.slots>1?"s":""}</span>
                        </div>
                    </div>

                    {/* Warning — if has applications */}
                    {appCount > 0 ? (
                        <div style={{
                            background:"#fff7ed", border:"1px solid #fed7aa",
                            borderLeft:"4px solid #f59e0b",
                            borderRadius:"0 10px 10px 0",
                            padding:"12px 16px", marginBottom:28,
                            display:"flex", gap:10, alignItems:"flex-start",
                        }}>
                            <span style={{fontSize:18,flexShrink:0,lineHeight:1,marginTop:1}}>⚠️</span>
                            <div>
                                <div style={{fontSize:12,fontWeight:700,color:"#d97706",marginBottom:3}}>
                                    {appCount} application{appCount>1?"s":""} will also be deleted
                                </div>
                                <div style={{fontSize:12,color:"#92400e",lineHeight:1.5}}>
                                    All related CVs, interview records, and scores will be permanently removed.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background:"#f0fdf4", border:"1px solid #bbf7d0",
                            borderRadius:10, padding:"11px 16px",
                            marginBottom:28,
                            display:"flex", gap:10, alignItems:"center",
                        }}>
                            <span style={{fontSize:16}}>✅</span>
                            <span style={{fontSize:12,color:"#166534"}}>
                                No applications — safe to delete.
                            </span>
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{display:"flex",gap:10}}>
                        <button type="button" onClick={onClose}
                            style={{
                                flex:1, padding:"11px", border:"1px solid #e5e7eb",
                                borderRadius:10, background:"#fff", color:"#374151",
                                fontSize:13, fontWeight:500, cursor:"pointer",
                                fontFamily:"inherit", transition:"background 0.15s",
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                            Cancel
                        </button>
                        <button type="button" onClick={confirm} disabled={submitting}
                            style={{
                                flex:1, padding:"11px", border:"none",
                                borderRadius:10,
                                background: submitting ? "#fca5a5" : "#dc2626",
                                color:"#fff", fontSize:13, fontWeight:600,
                                cursor: submitting ? "not-allowed" : "pointer",
                                fontFamily:"inherit", transition:"background 0.15s",
                                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                            }}
                            onMouseEnter={e=>{ if(!submitting) e.currentTarget.style.background="#b91c1c"; }}
                            onMouseLeave={e=>{ if(!submitting) e.currentTarget.style.background="#dc2626"; }}>
                            {submitting ? "Deleting..." : "🗑️ Delete Posting"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}