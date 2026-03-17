<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $content['proposal_number'] ?? 'Proposal' }}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#222; background:#fff; }
@page { margin:0; size:A4 portrait; }
.pb { page-break-after:always; }
.nb { page-break-inside:avoid; }

/* COVER */
.cover { width:210mm; height:297mm; background:#fff; position:relative; }
.c-accent { background:#00b4a0; width:5px; height:297mm; position:absolute; top:0; left:0; }
.c-inner  { padding:64px 64px 64px 70px; }
.c-top    { width:100%; border-collapse:collapse; margin-bottom:72px; }
.c-top td { vertical-align:middle; }
.c-brand  { font-size:9px; font-weight:bold; color:#222; letter-spacing:3px; text-transform:uppercase; }
.c-dot    { display:inline-block; width:5px; height:5px; background:#00b4a0; }
.c-refno  { font-size:8px; color:#aaa; letter-spacing:1px; text-align:right; }
.c-lbl    { font-size:8px; font-weight:bold; color:#00b4a0; letter-spacing:3px; text-transform:uppercase; margin-bottom:16px; }
.c-title  { font-size:40px; color:#222; line-height:1.15; margin-bottom:7px; font-weight:bold; }
.c-for    { font-size:12px; color:#aaa; margin-bottom:32px; }
.c-rule   { width:44px; height:2px; background:#00b4a0; margin-bottom:20px; }
.c-sum    { font-size:11px; line-height:1.9; color:#555; max-width:380px; }
.c-footer { width:100%; border-collapse:collapse; border-top:1px solid #eee; margin-top:44px; padding-top:0; }
.c-footer td { padding-top:20px; vertical-align:top; }
.cfl { font-size:7px; font-weight:bold; color:#aaa; text-transform:uppercase; letter-spacing:1.5px; display:block; margin-bottom:4px; }
.cfv { font-size:10px; font-weight:bold; color:#222; }

/* PAGE SHELL */
.phd  { width:100%; background:#fff; border-bottom:1px solid #eee; position:relative; }
.phdt { width:100%; border-collapse:collapse; }
.phdt td { padding:13px 56px 13px 70px; }
.phb  { font-size:8px; font-weight:bold; color:#00b4a0; letter-spacing:2px; text-transform:uppercase; }
.phi  { font-size:8px; color:#bbb; text-align:right; }
.phacc { width:3px; background:#00b4a0; }
.pbdy { padding:32px 56px 44px 70px; }

/* Swiss section */
.sw-lbl { font-size:7px; font-weight:bold; color:#00b4a0; text-transform:uppercase; letter-spacing:3px; margin-bottom:2px; }
.sw-hd  { font-size:17px; color:#222; border-bottom:1px solid #eee; padding-bottom:9px; margin-bottom:16px; }

.bp  { font-size:10px; line-height:2; color:#444; margin-bottom:13px; }
.bq  { border-left:2px solid #00b4a0; padding:9px 14px; font-size:10px; font-style:italic; color:#555; margin:10px 0; }

/* Client block */
.cb2 { width:100%; border-collapse:collapse; margin-bottom:22px; }
.cb2 td { vertical-align:top; }
.cfor2 { border-top:2px solid #00b4a0; padding:16px; background:#f8f8f8; }
.cby2  { border-top:2px solid #222; padding:16px; background:#f8f8f8; }
.cbl   { font-size:7px; font-weight:bold; color:#aaa; text-transform:uppercase; letter-spacing:2px; margin-bottom:10px; }
.crt   { width:100%; border-collapse:collapse; }
.crt tr { border-bottom:1px solid #f0f0f0; }
.crt tr:last-child { border-bottom:none; }
.crt td { padding:5px 0; font-size:9px; }
.ck { color:#aaa; }
.cv { font-weight:bold; text-align:right; }

/* Tech */
.techt { width:100%; border-collapse:collapse; margin-top:10px; }
.techt td { background:#f8f8f8; border:1px solid #fff; padding:8px 10px; vertical-align:top; }
.tk { font-size:7px; font-weight:bold; color:#00b4a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px; }
.tv { font-size:9px; color:#333; }

/* SCOPE */
.scpt { width:100%; border-collapse:collapse; }
.scpt tr { border-bottom:1px solid #f0f0f0; }
.scpt td { padding:10px 0; vertical-align:top; }
.sidx { font-size:9px; font-weight:bold; color:#00b4a0; width:28px; }
.snm  { font-size:11px; font-weight:bold; color:#222; margin-bottom:2px; }
.sdc  { font-size:9px; color:#666; line-height:1.6; }
.bh { font-size:7px; font-weight:bold; color:#e53e3e; letter-spacing:0.5px; text-transform:uppercase; }
.bm { font-size:7px; font-weight:bold; color:#d97706; letter-spacing:0.5px; text-transform:uppercase; }
.bl { font-size:7px; font-weight:bold; color:#38a169; letter-spacing:0.5px; text-transform:uppercase; }

/* TIMELINE */
.tlt { width:100%; border-collapse:collapse; }
.tlt tr { border-bottom:1px solid #f5f5f5; }
.tlt td { padding:10px 0; vertical-align:top; }
.tlnb { width:22px; height:22px; background:#00b4a0; color:#fff; font-size:9px; font-weight:bold; text-align:center; line-height:22px; }
.tlbd { padding-left:12px; }
.tlna { font-size:11px; font-weight:bold; color:#222; margin-bottom:2px; }
.tldr { font-size:8px; font-weight:bold; color:#00b4a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
.tltg { display:inline-block; font-size:8px; color:#888; background:#f8f8f8; padding:1px 6px; margin:1px; }

/* INVESTMENT */
.invt { width:100%; border-collapse:collapse; }
.invt tr { border-bottom:1px solid #f8f8f8; }
.in  { font-size:9px; color:#444; padding:7px 0; width:38%; }
.ib  { width:28%; padding:7px 7px; }
.ibg { background:#eee; height:2px; }
.ibf { background:#00b4a0; height:2px; }
.ip  { font-size:8px; color:#bbb; text-align:right; width:10%; padding:7px 3px; }
.ia  { font-size:9px; font-weight:bold; text-align:right; width:24%; padding:7px 0; }
.itrt { border-top:2px solid #222; }
.itrt td { padding:13px 0; }
.itl { font-size:10px; font-weight:bold; color:#222; width:76%; }
.itv { font-size:20px; color:#00b4a0; text-align:right; }
.pmin { border-top:1px solid #f0f0f0; padding-top:13px; margin-top:7px; }
.pmtl { font-size:7px; font-weight:bold; color:#00b4a0; text-transform:uppercase; letter-spacing:1px; margin-bottom:7px; }
.pmtx { border-left:2px solid #00b4a0; padding-left:10px; font-size:9px; color:#555; margin-bottom:4px; }

/* TEAM */
.tmt { width:100%; border-collapse:collapse; }
.tmt td { width:50%; vertical-align:top; padding:0 7px 7px 0; }
.tmt td:nth-child(2n) { padding-right:0; }
.tmc { background:#fff; border:1px solid #f0f0f0; padding:12px; border-top:2px solid #00b4a0; }
.tmct { font-size:22px; color:#00b4a0; line-height:1; margin-bottom:3px; }
.tmcr { font-size:10px; font-weight:bold; color:#222; margin-bottom:2px; }
.tmcd { font-size:8px; color:#aaa; line-height:1.5; }

/* TERMS / STEPS */
.tert { width:100%; border-collapse:collapse; }
.tert tr { border-bottom:1px solid #f5f5f5; }
.tert td { padding:7px 0; font-size:9px; vertical-align:top; }
.ten { font-size:9px; font-weight:bold; color:#00b4a0; width:22px; }
.stt { width:100%; border-collapse:collapse; }
.stt tr { border-bottom:1px solid #f5f5f5; }
.stt td { padding:8px 0; vertical-align:middle; }
.stn { width:24px; height:24px; border:1.5px solid #00b4a0; color:#00b4a0; font-size:9px; font-weight:bold; text-align:center; line-height:21px; display:inline-block; }

/* CLOSING */
.clv { width:210mm; height:297mm; background:#fff; position:relative; border-collapse:collapse; }
.cl-vtd { text-align:center; vertical-align:middle; padding:60px 72px; }
.cl-acc { background:#00b4a0; width:5px; position:absolute; top:0; left:0; bottom:0; }
.cl-cr-tl { position:absolute; top:28px; left:28px; width:44px; height:44px; border-top:2px solid #00b4a0; border-left:2px solid #00b4a0; }
.cl-cr-tr { position:absolute; top:28px; right:28px; width:44px; height:44px; border-top:2px solid #00b4a0; border-right:2px solid #00b4a0; }
.cl-cr-bl { position:absolute; bottom:28px; left:28px; width:44px; height:44px; border-bottom:2px solid #00b4a0; border-left:2px solid #00b4a0; }
.cl-cr-br { position:absolute; bottom:28px; right:28px; width:44px; height:44px; border-bottom:2px solid #00b4a0; border-right:2px solid #00b4a0; }
.cl-lbl { font-size:7px; font-weight:bold; color:#00b4a0; text-transform:uppercase; letter-spacing:4px; margin-bottom:20px; }
.cl-ti  { font-size:33px; color:#222; line-height:1.2; margin-bottom:7px; font-weight:bold; }
.cl-sub { font-size:11px; color:#aaa; margin-bottom:36px; }
.cl-rule { width:44px; height:1px; background:#00b4a0; margin:0 auto 36px; }
.cl-stt { width:60%; border-collapse:collapse; margin:0 auto; }
.cl-stt td { text-align:center; padding:0 28px; border-right:1px solid #eee; }
.cl-stt td:last-child { border-right:none; }
.clsn { font-size:22px; color:#00b4a0; margin-bottom:5px; }
.clst { font-size:8px; color:#bbb; text-transform:uppercase; letter-spacing:1px; max-width:76px; }
.cl-brd { font-size:8px; font-weight:bold; color:#ddd; letter-spacing:3px; text-transform:uppercase; margin-top:52px; }
</style>
</head>
<body>

{{-- COVER --}}
<div class="cover pb">
    <div class="c-accent"></div>
    <div class="c-inner">
        <table class="c-top"><tr>
            <td><span class="c-brand">VibeMe<span class="c-dot"></span>AI</span></td>
            <td><span class="c-refno">{{ $content['proposal_number'] ?? '' }}</span></td>
        </tr></table>
        <div class="c-lbl">Project Proposal</div>
        <div class="c-title">{{ $analysis->project_title }}</div>
        <div class="c-for">Prepared for {{ $client->company_name }}</div>
        <div class="c-rule"></div>
        <div class="c-sum">{{ Str::limit($content['executive_summary'] ?? '', 240) }}</div>
        <table class="c-footer"><tr>
        @foreach([['Date',\Carbon\Carbon::parse($proposal->created_at)->format('d M Y')],['Valid',$content['validity_period']??'30 days'],['Language',ucfirst($proposal->language??'English')],['Investment',$content['total_investment']??'TBD']] as [$l,$v])
        <td><span class="cfl">{{ $l }}</span><span class="cfv">{{ $v }}</span></td>
        @endforeach
        </tr></table>
    </div>
</div>

{{-- PAGE 2: OVERVIEW --}}
<div class="pb nb" style="position:relative;">
<div style="width:3px; background:#00b4a0; height:100%; position:absolute; left:0; top:0;"></div>
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">{{ $content['proposal_number']??'' }} · Overview</td></tr></table></div>
<div class="pbdy">
    <div class="sw-lbl">01 — Overview</div>
    <div class="sw-hd">Project Summary</div>
    <table class="cb2 nb"><tr>
    <td style="width:48%; padding-right:16px;">
        <div class="cfor2">
            <div class="cbl">Prepared For</div>
            <table class="crt">
            @foreach([['Company',$client->company_name],['Contact',$client->contact_person],['Email',$client->email],['Phone',$client->phone],['Industry',$client->industry]] as [$l,$v])
            @if($v)<tr><td class="ck">{{ $l }}</td><td class="cv">{{ $v }}</td></tr>@endif
            @endforeach
            </table>
        </div>
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%;">
        <div class="cby2">
            <div class="cbl">Prepared By</div>
            <div style="font-size:13px; font-weight:bold; color:#222; margin-bottom:2px;">VibeMe.AI</div>
            <div style="font-size:7px; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Software Development Co.</div>
            @foreach(array_slice($content['company_strengths']??[],0,3) as $s)
            <div style="font-size:9px; color:#666; margin-bottom:5px; border-left:2px solid #00b4a0; padding-left:7px;">{{ $s }}</div>
            @endforeach
        </div>
    </td>
    </tr></table>
    <div class="bp">{{ $content['executive_summary']??'' }}</div>
    <div class="bq">{{ $content['proposed_solution']??'' }}</div>
    @if(!empty($content['technical_approach']))
    <div class="sw-lbl" style="margin-bottom:7px;">Technical Approach</div>
    <table class="techt nb"><tr>
    @foreach(array_slice(array_keys($content['technical_approach']),0,6) as $k)
    <td style="width:33%;"><div class="tk">{{ str_replace('_',' ',$k) }}</div><div class="tv">{{ is_array($content['technical_approach'][$k]) ? implode(', ',$content['technical_approach'][$k]) : $content['technical_approach'][$k] }}</div></td>
    @endforeach
    </tr></table>
    @endif
</div>
</div>

{{-- PAGE 3: SCOPE --}}
<div class="pb nb" style="position:relative;">
<div style="width:3px; background:#00b4a0; height:100%; position:absolute; left:0; top:0;"></div>
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">{{ $content['proposal_number']??'' }} · Scope</td></tr></table></div>
<div class="pbdy">
    <div class="sw-lbl">02 — Deliverables</div>
    <div class="sw-hd">Scope of Work</div>
    <table class="scpt">
    @foreach($content['scope_of_work']??[] as $i=>$item)
    <tr class="nb">
        <td class="sidx" style="width:28px;">{{ str_pad($i+1,2,'0',STR_PAD_LEFT) }}</td>
        <td style="width:30%; padding-right:12px; vertical-align:top;">
            <div class="snm">{{ $item['item'] }}</div>
            <span class="b{{ strtolower(substr($item['priority']??'m',0,1)) }}">{{ strtoupper($item['priority']??'MEDIUM') }}</span>
        </td>
        <td><div class="sdc">{{ $item['description'] }}</div></td>
    </tr>
    @endforeach
    </table>
</div>
</div>

{{-- PAGE 4: TIMELINE + INVESTMENT --}}
<div class="pb nb" style="position:relative;">
<div style="width:3px; background:#00b4a0; height:100%; position:absolute; left:0; top:0;"></div>
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">{{ $content['proposal_number']??'' }} · Timeline &amp; Investment</td></tr></table></div>
<div class="pbdy">
    <div class="sw-lbl">03 — Schedule</div>
    <div class="sw-hd">Project Timeline</div>
    <table class="tlt">
    @foreach($content['project_timeline']??[] as $i=>$phase)
    <tr class="nb">
        <td style="width:24px; vertical-align:top; padding:8px 0;"><div class="tlnb">{{ $i+1 }}</div></td>
        <td class="tlbd"><div class="tlna">{{ $phase['name'] }}</div><div class="tldr">{{ $phase['duration'] }}</div><div>@foreach($phase['deliverables']??[] as $d)<span class="tltg">{{ $d }}</span>@endforeach</div></td>
    </tr>
    @endforeach
    </table>
    <div style="margin-top:26px;">
        <div class="sw-lbl">04 — Budget</div>
        <div class="sw-hd">Investment Breakdown</div>
        <table class="invt">
        @foreach($content['investment_breakdown']??[] as $item)
        <tr class="nb"><td class="in">{{ $item['name'] }}</td><td class="ib"><div class="ibg"><div class="ibf" style="width:{{ $item['percentage'] }}%;"></div></div></td><td class="ip">{{ $item['percentage'] }}%</td><td class="ia">${{ number_format($item['cost']) }}</td></tr>
        @endforeach
        <tr class="itrt nb"><td class="itl" colspan="3">Total Investment</td><td class="itv">{{ $content['total_investment'] }}</td></tr>
        </table>
        @if(!empty($content['payment_terms']))
        <div class="pmin nb">
            <div class="pmtl">Payment Schedule</div>
            @foreach($content['payment_terms'] as $t)
            <div class="pmtx">{{ $t }}</div>
            @endforeach
        </div>
        @endif
    </div>
</div>
</div>

{{-- PAGE 5: TEAM + TERMS + STEPS --}}
<div class="pb nb" style="position:relative;">
<div style="width:3px; background:#00b4a0; height:100%; position:absolute; left:0; top:0;"></div>
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">{{ $content['proposal_number']??'' }} · Team &amp; Terms</td></tr></table></div>
<div class="pbdy">
    <div class="sw-lbl">05 — People</div>
    <div class="sw-hd">Project Team</div>
    <table class="tmt" style="margin-bottom:24px;">
    @foreach(array_chunk($content['team_overview']??[],2) as $row)
    <tr>
    @foreach($row as $m)
    <td><div class="tmc nb"><div class="tmct">{{ $m['count'] }}</div><div class="tmcr">{{ $m['role'] }}</div><div class="tmcd">{{ $m['responsibility'] }}</div></div></td>
    @endforeach
    @if(count($row)<2)<td></td>@endif
    </tr>
    @endforeach
    </table>
    <table style="width:100%; border-collapse:collapse;"><tr>
    <td style="width:56%; vertical-align:top; padding-right:20px;">
        <div class="sw-lbl" style="margin-bottom:8px;">06 — Legal</div>
        <table class="tert">
        @foreach($content['terms_and_conditions']??[] as $i=>$t)
        <tr class="nb"><td class="ten">{{ str_pad($i+1,2,'0',STR_PAD_LEFT) }}</td><td style="line-height:1.7;">{{ $t }}</td></tr>
        @endforeach
        </table>
    </td>
    <td style="width:44%; vertical-align:top;">
        <div class="sw-lbl" style="margin-bottom:8px;">07 — Action</div>
        <table class="stt">
        @foreach($content['next_steps']??[] as $i=>$step)
        <tr class="nb"><td style="width:30px;"><span class="stn">{{ $i+1 }}</span></td><td style="font-size:10px; font-weight:bold; color:#333; padding-left:8px;">{{ $step }}</td></tr>
        @endforeach
        </table>
    </td>
    </tr></table>
</div>
</div>

{{-- CLOSING --}}
<table class="clv" style="width:210mm; height:297mm; position:relative;">
<tr><td class="cl-vtd">
    <div class="cl-acc"></div>
    <div class="cl-cr-tl"></div><div class="cl-cr-tr"></div>
    <div class="cl-cr-bl"></div><div class="cl-cr-br"></div>
    <div class="cl-lbl">VibeMe.AI · Proposal</div>
    <div class="cl-ti">Let's Get Started</div>
    <div class="cl-sub">Valid for {{ $content['validity_period']??'30 days' }}</div>
    <div class="cl-rule"></div>
    <table class="cl-stt"><tr>
    @foreach(array_slice($content['next_steps']??[],0,3) as $i=>$step)
    <td><div class="clsn">{{ $i+1 }}</div><div class="clst">{{ Str::limit($step,22) }}</div></td>
    @endforeach
    </tr></table>
    <div class="cl-brd">VibeMe.AI · Software Development</div>
</td></tr></table>

</body>
</html>