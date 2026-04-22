<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $content['proposal_number'] ?? 'Proposal' }}</title>
<style>
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#1a1a1a; background:#fff; }
@page { margin:0; size:A4 portrait; }
.pb { page-break-after:always; }
.nb { page-break-inside:avoid; }

/* COVER */
.cover { width:210mm; height:297mm; background:#0a0a0a; position:relative; }
.cover-gold-top { background:#c9a84c; height:5px; width:100%; }
.cover-inner { padding:56px 60px; }
.cover-eyebrow { font-size:8px; font-weight:bold; color:#c9a84c; letter-spacing:4px; text-transform:uppercase; margin-bottom:52px; }
.cover-title { font-size:46px; color:#ffffff; line-height:1.05; margin-bottom:10px; font-style:italic; }
.cover-client { font-size:13px; color:#555555; margin-bottom:52px; }
.cover-rule { width:40px; height:1px; background:#c9a84c; margin-bottom:24px; }
.cover-summary { font-size:10px; color:#555555; line-height:1.8; margin-bottom:52px; max-width:400px; }
.cmeta { width:100%; border-collapse:collapse; border-top:1px solid #222; }
.cmeta td { padding:16px 0 16px 18px; border-left:1px solid #222; }
.cmeta td:first-child { border-left:none; padding-left:0; }
.cml { font-size:7px; font-weight:bold; color:#555; text-transform:uppercase; letter-spacing:1.5px; display:block; margin-bottom:4px; }
.cmv { font-size:11px; color:#c9a84c; }
.cover-gold-bot { background:#c9a84c; height:3px; width:100%; position:absolute; bottom:0; left:0; }

/* PAGE LAYOUT */
.pg { width:210mm; min-height:297mm; border-collapse:collapse; }
.rail { width:52mm; background:#0a0a0a; vertical-align:top; padding:36px 22px; }
.rail-logo { font-size:9px; font-weight:bold; color:#c9a84c; letter-spacing:2px; margin-bottom:36px; line-height:1.6; }
.rail-num  { font-size:36px; color:#1e1e1e; line-height:1; margin-bottom:3px; }
.rail-name { font-size:7px; font-weight:bold; color:#c9a84c; text-transform:uppercase; letter-spacing:2px; }
.rail-pg   { font-size:8px; color:#333; padding-top:16px; }
.cnt { vertical-align:top; padding:36px 40px; }
.eye { font-size:7px; font-weight:bold; color:#c9a84c; text-transform:uppercase; letter-spacing:3px; margin-bottom:4px; }
.hd  { font-size:19px; color:#0a0a0a; margin-bottom:18px; border-bottom:1px solid #e8e0d0; padding-bottom:9px; }
.bp  { font-size:10px; line-height:1.85; color:#333; margin-bottom:12px; }
.bq  { border-left:2px solid #c9a84c; padding:9px 14px; font-size:10px; font-style:italic; color:#555; margin:10px 0; }

/* INFO CARDS */
.ic2 { width:100%; border-collapse:collapse; margin-bottom:20px; }
.ic-card  { border:1px solid #e8e0d0; padding:12px; }
.ic-dark  { background:#0a0a0a; padding:12px; }
.irt { width:100%; border-collapse:collapse; }
.irt tr   { border-bottom:1px solid #f0ebe0; }
.irt tr:last-child { border-bottom:none; }
.irt td   { padding:5px 0; font-size:9px; }
.ik { color:#999; }
.iv { font-weight:bold; text-align:right; }

/* TECH */
.techt { width:100%; border-collapse:collapse; margin-top:10px; }
.techt td { border:1px solid #e8e0d0; padding:7px 9px; vertical-align:top; }
.tk { font-size:7px; font-weight:bold; color:#c9a84c; text-transform:uppercase; margin-bottom:2px; }
.tv { font-size:9px; color:#333; }

/* SCOPE */
.scpt { width:100%; border-collapse:collapse; }
.scpt thead tr { background:#0a0a0a; }
.scpt thead td { padding:7px 9px; font-size:7px; font-weight:bold; color:#c9a84c; text-transform:uppercase; letter-spacing:1px; }
.scpt tbody tr { border-bottom:1px solid #f0ebe0; }
.scpt tbody tr:nth-child(even) { background:#faf8f4; }
.scpt tbody td { padding:8px 9px; font-size:9px; vertical-align:middle; }
.scpt tbody td:nth-child(2) { vertical-align:top; }
.scpt tbody td:nth-child(3) { vertical-align:top; }
.scpt tbody td:nth-child(4) { vertical-align:top; }
.sn { display:inline-block; width:20px; height:20px; background:#0a0a0a; color:#c9a84c; text-align:center; line-height:20px; font-size:8px; font-weight:bold; }
.bh { background:#1a0a0a; color:#c9a84c; padding:1px 5px; font-size:7px; font-weight:bold; text-transform:uppercase; }
.bm { background:#1a1500; color:#c9a84c; padding:1px 5px; font-size:7px; font-weight:bold; text-transform:uppercase; }
.bl { background:#0a1a0a; color:#4a9a4a; padding:1px 5px; font-size:7px; font-weight:bold; text-transform:uppercase; }

/* TIMELINE */
.tlt { width:100%; border-collapse:collapse; }
.tlt td { vertical-align:top; }
.tl-dot { width:24px; text-align:center; padding-right:10px; }
.tl-nb  { display:inline-block; width:20px; height:20px; background:#c9a84c; color:#0a0a0a; text-align:center; line-height:20px; font-size:8px; font-weight:bold; }
.tl-ln  { width:1px; background:#e8e0d0; margin:0 auto; }
.tl-bd  { padding-bottom:14px; }
.tl-nm  { font-size:11px; font-weight:bold; color:#0a0a0a; margin-bottom:2px; }
.tl-dr  { font-size:8px; color:#c9a84c; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
.tl-tg  { display:inline-block; border:1px solid #e8e0d0; padding:1px 5px; font-size:8px; color:#666; margin:1px; }

/* INVESTMENT */
.invt { width:100%; border-collapse:collapse; }
.invt tr { border-bottom:1px solid #f0ebe0; }
.in  { font-size:9px; color:#333; padding:6px 0; width:38%; }
.ib  { width:28%; padding:6px 7px; }
.ibg { background:#f0ebe0; height:3px; }
.ibf { background:#c9a84c; height:3px; }
.ip  { font-size:8px; color:#999; text-align:right; width:10%; padding:6px 3px; }
.ia  { font-size:9px; font-weight:bold; text-align:right; width:24%; padding:6px 0; }
.itr { background:#0a0a0a; }
.itr td { padding:11px 0; }
.itl { font-size:10px; font-weight:bold; color:#fff; width:76%; }
.itv { font-size:19px; color:#c9a84c; text-align:right; }
.pb2 { background:#faf8f4; padding:10px; margin-top:10px; }
.pb2t { font-size:7px; font-weight:bold; color:#c9a84c; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }

/* TEAM */
.tmt { width:100%; border-collapse:collapse; }
.tmt td { width:50%; vertical-align:top; padding:0 7px 7px 0; }
.tmt td:nth-child(2n) { padding-right:0; }
.tmc { border:1px solid #e8e0d0; padding:11px; }
.tmct { font-size:24px; color:#c9a84c; line-height:1; margin-bottom:3px; }
.tmcr { font-size:10px; font-weight:bold; color:#0a0a0a; margin-bottom:2px; }
.tmcd { font-size:8px; color:#888; line-height:1.5; }

/* TERMS / STEPS */
.tert { width:100%; border-collapse:collapse; }
.tert tr { border-bottom:1px solid #f0ebe0; }
.tert td { padding:7px 0; font-size:9px; vertical-align:top; }
.ten { color:#c9a84c; font-weight:bold; width:18px; }
.stt { width:100%; border-collapse:collapse; }
.stt tr { border-bottom:1px solid #f0ebe0; }
.stt td { padding:7px 0; vertical-align:middle; }
.stn { width:24px; height:24px; border:1.5px solid #c9a84c; color:#c9a84c; text-align:center; line-height:21px; font-size:10px; font-weight:bold; display:inline-block; }

/* CLOSING */
.clv { width:210mm; height:297mm; background:#0a0a0a; position:relative; border-collapse:collapse; }
.clv-td { text-align:center; vertical-align:middle; padding:60px; }
.clv-mk { font-size:8px; color:#c9a84c; letter-spacing:4px; text-transform:uppercase; margin-bottom:28px; }
.clv-ti { font-size:32px; color:#fff; margin-bottom:10px; font-style:italic; }
.clv-su { font-size:11px; color:#555; margin-bottom:44px; }
.clv-st { width:60%; border-collapse:collapse; margin:0 auto 52px; }
.clv-st td { text-align:center; padding:0 18px; border-right:1px solid #222; }
.clv-st td:last-child { border-right:none; }
.csn { width:34px; height:34px; border:1px solid #c9a84c; color:#c9a84c; font-size:13px; text-align:center; line-height:32px; margin:0 auto 7px; }
.cst { font-size:7px; color:#555; text-transform:uppercase; letter-spacing:1px; }
.clv-br { background:#c9a84c; height:2px; width:56px; margin:0 auto; }
</style>
</head>
<body>

{{-- COVER --}}
<div class="cover pb">
    <div class="cover-gold-top"></div>
    <div class="cover-inner">
        <div class="cover-eyebrow">Project Proposal &nbsp;·&nbsp; {{ $content['proposal_number'] ?? '' }}</div>
        <div class="cover-title">{{ $analysis->project_title }}</div>
        <div class="cover-client">Prepared exclusively for {{ $client->company_name }}</div>
        <div class="cover-rule"></div>
        <div class="cover-summary">{{ Str::limit($content['executive_summary'] ?? '', 240) }}</div>
        <table class="cmeta"><tr>
        @foreach([['DATE',\Carbon\Carbon::parse($proposal->created_at)->format('d M Y')],['VALID',$content['validity_period']??'30 days'],['LANGUAGE',ucfirst($proposal->language??'English')],['INVESTMENT',$content['total_investment']??'TBD']] as [$l,$v])
        <td><span class="cml">{{ $l }}</span><span class="cmv">{{ $v }}</span></td>
        @endforeach
        </tr></table>
    </div>
    <div class="cover-gold-bot"></div>
</div>

{{-- PAGE 2: OVERVIEW --}}
<table class="pg pb nb"><tr>
<td class="rail">
    <div class="rail-logo">VIBE<br>ME.AI</div>
    <div class="rail-num">01</div>
    <div class="rail-name">Overview</div>
    <div class="rail-pg">— 02</div>
</td>
<td class="cnt">
    <div class="eye">Client Information</div>
    <div class="hd">Prepared For &amp; By</div>
    <table class="ic2 nb"><tr>
    <td style="width:48%; vertical-align:top;">
        <div class="ic-card">
        <table class="irt">
        @foreach([['Company',$client->company_name],['Contact',$client->contact_person],['Email',$client->email],['Phone',$client->phone],['Industry',$client->industry]] as [$l,$v])
        @if($v)<tr><td class="ik">{{ $l }}</td><td class="iv">{{ $v }}</td></tr>@endif
        @endforeach
        </table></div>
    </td>
    <td style="width:4%;"></td>
    <td style="width:48%; vertical-align:top;">
        <div class="ic-dark">
        <div style="font-size:13px; font-weight:bold; color:#c9a84c; margin-bottom:2px;">VibeMe.AI</div>
        <div style="font-size:7px; color:#555; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Software Development</div>
        @foreach(array_slice($content['company_strengths']??[],0,4) as $s)
        <div style="font-size:9px; color:#888; margin-bottom:5px;">› {{ $s }}</div>
        @endforeach
        </div>
    </td>
    </tr></table>
    <div class="eye">Executive Summary</div>
    <div class="hd">Project Overview</div>
    <div class="bp">{{ $content['executive_summary'] ?? '' }}</div>
    <div class="bq">{{ $content['proposed_solution'] ?? '' }}</div>
    @if(!empty($content['technical_approach']))
    <div class="eye" style="margin-top:12px;">Technical Approach</div>
    <table class="techt nb"><tr>
    @foreach(array_slice(array_keys($content['technical_approach']),0,6) as $k)
    <td><div class="tk">{{ str_replace('_',' ',$k) }}</div><div class="tv">{{ is_array($content['technical_approach'][$k]) ? implode(', ',$content['technical_approach'][$k]) : $content['technical_approach'][$k] }}</div></td>
    @endforeach
    </tr></table>
    @endif
</td>
</tr></table>

{{-- PAGE 3: SCOPE --}}
<table class="pg pb nb"><tr>
<td class="rail">
    <div class="rail-logo">VIBE<br>ME.AI</div>
    <div class="rail-num">02</div>
    <div class="rail-name">Scope</div>
    <div class="rail-pg">— 03</div>
</td>
<td class="cnt">
    <div class="eye">Deliverables</div>
    <div class="hd">Scope of Work</div>
    <table class="scpt">
    <thead><tr><td width="5%">#</td><td width="28%">Module</td><td width="51%">Description</td><td width="16%">Priority</td></tr></thead>
    <tbody>
    @foreach($content['scope_of_work']??[] as $i=>$item)
    <tr class="nb">
        <td style="text-align:center; vertical-align:middle;"><span class="sn">{{ $i+1 }}</span></td>
        <td style="font-weight:bold;">{{ $item['item'] }}</td>
        <td style="color:#555; line-height:1.6;">{{ $item['description'] }}</td>
        <td><span class="b{{ strtolower(substr($item['priority']??'m',0,1)) }}">{{ strtoupper($item['priority']??'MED') }}</span></td>
    </tr>
    @endforeach
    </tbody>
    </table>
</td>
</tr></table>

{{-- PAGE 4: TIMELINE + INVESTMENT --}}
<table class="pg pb nb"><tr>
<td class="rail">
    <div class="rail-logo">VIBE<br>ME.AI</div>
    <div class="rail-num">03</div>
    <div class="rail-name">Timeline</div>
    <div class="rail-pg">— 04</div>
</td>
<td class="cnt">
    <div class="eye">Schedule</div>
    <div class="hd">Project Timeline</div>
    <table class="tlt">
    @foreach($content['project_timeline']??[] as $i=>$phase)
    <tr class="nb">
    <td class="tl-dot" style="text-align:center; vertical-align:top;">
        <div class="tl-nb">{{ $i+1 }}</div>
        @if(!$loop->last)<div class="tl-ln" style="height:36px;"></div>@endif
    </td>
    <td class="tl-bd">
        <div class="tl-nm">{{ $phase['name'] }}</div>
        <div class="tl-dr">{{ $phase['duration'] }}</div>
        <div>@foreach($phase['deliverables']??[] as $d)<span class="tl-tg">{{ $d }}</span>@endforeach</div>
    </td>
    </tr>
    @endforeach
    </table>
    <div style="margin-top:20px;">
    <div class="eye">Budget</div>
    <div class="hd">Investment Breakdown</div>
    <table class="invt">
    @foreach($content['investment_breakdown']??[] as $item)
    <tr class="nb">
        <td class="in">{{ $item['name'] }}</td>
        <td class="ib"><div class="ibg"><div class="ibf" style="width:{{ $item['percentage'] }}%;"></div></div></td>
        <td class="ip">{{ $item['percentage'] }}%</td>
        <td class="ia">${{ number_format($item['cost']) }}</td>
    </tr>
    @endforeach
    <tr class="itr nb"><td class="itl" colspan="3">Total Investment</td><td class="itv">{{ $content['total_investment'] }}</td></tr>
    </table>
    @if(!empty($content['payment_terms']))
    <div class="pb2 nb"><div class="pb2t">Payment Schedule</div>
    @foreach($content['payment_terms'] as $i=>$t)
    <div style="font-size:9px; color:#555; margin-bottom:3px;">{{ $i+1 }}. {{ $t }}</div>
    @endforeach
    </div>
    @endif
    </div>
</td>
</tr></table>

{{-- PAGE 5: TEAM + TERMS + STEPS --}}
<table class="pg pb nb"><tr>
<td class="rail">
    <div class="rail-logo">VIBE<br>ME.AI</div>
    <div class="rail-num">04</div>
    <div class="rail-name">Team &amp;<br>Terms</div>
    <div class="rail-pg">— 05</div>
</td>
<td class="cnt">
    <div class="eye">Our People</div>
    <div class="hd">Project Team</div>
    <table class="tmt" style="margin-bottom:20px;">
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
    <td style="width:55%; vertical-align:top; padding-right:18px;">
        <div class="eye">Legal</div><div class="hd">Terms &amp; Conditions</div>
        <table class="tert">
        @foreach($content['terms_and_conditions']??[] as $i=>$t)
        <tr class="nb"><td class="ten">{{ $i+1 }}</td><td style="line-height:1.6;">{{ $t }}</td></tr>
        @endforeach
        </table>
    </td>
    <td style="width:45%; vertical-align:top;">
        <div class="eye">Action</div><div class="hd">Next Steps</div>
        <table class="stt">
        @foreach($content['next_steps']??[] as $i=>$step)
        <tr class="nb"><td style="width:32px;"><span class="stn">{{ $i+1 }}</span></td><td style="font-size:10px; color:#333; padding-left:8px;">{{ $step }}</td></tr>
        @endforeach
        </table>
    </td>
    </tr></table>
</td>
</tr></table>

{{-- CLOSING --}}
<table class="clv" style="width:210mm; height:297mm;"><tr><td class="clv-td">
    <div class="clv-mk">VibeMe.AI &nbsp;·&nbsp; Project Proposal</div>
    <div class="clv-ti">Ready to Build Something Great?</div>
    <div class="clv-su">Valid for {{ $content['validity_period']??'30 days' }} &nbsp;·&nbsp; {{ $client->email }}</div>
    <table class="clv-st"><tr>
    @foreach(array_slice($content['next_steps']??[],0,3) as $i=>$step)
    <td><div class="csn">{{ $i+1 }}</div><div class="cst">{{ Str::limit($step,22) }}</div></td>
    @endforeach
    </tr></table>
    <div class="clv-br"></div>
</td></tr></table>

</body>
</html>