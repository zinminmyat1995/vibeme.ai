<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $content['proposal_number'] ?? 'Proposal' }}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size:10px; color:#111; background:#fff; }
@page { margin:0; size:A4 portrait; }
.pb  { page-break-after:always; }
.nb  { page-break-inside:avoid; }

/* COVER */
.cover { width:210mm; height:297mm; background:#fff; position:relative; overflow:hidden; }
.stripe { background:#ff4500; height:6px; width:100%; }
.c-hdr  { width:100%; border-collapse:collapse; }
.c-hdr td { padding:18px 48px; }
.c-brand { font-size:10px; font-weight:bold; color:#111; letter-spacing:3px; text-transform:uppercase; }
.c-ref   { font-size:8px; color:#ff4500; font-weight:bold; background:#fff5f0; padding:3px 10px; text-align:right; }
.c-hero  { padding:36px 48px 0; }
.c-lbl   { font-size:8px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:3px; margin-bottom:14px; }
.c-title { font-size:54px; font-weight:bold; color:#111; line-height:0.95; text-transform:uppercase; margin-bottom:18px; }
.c-rule  { width:100%; border-collapse:collapse; margin-bottom:14px; }
.c-rline { background:#ff4500; height:2px; }
.c-rdot  { width:8px; }
.c-rdoti { width:8px; height:8px; background:#ff4500; }
.c-intro { font-size:11px; line-height:1.8; color:#444; padding:0 48px; }
.c-stats { background:#111; width:100%; position:absolute; bottom:0; left:0; }
.c-stt   { width:100%; border-collapse:collapse; }
.c-stt td { padding:16px 20px; border-right:1px solid #333; }
.c-stt td:last-child { border-right:none; }
.csl { font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:1.5px; display:block; margin-bottom:3px; }
.csv { font-size:11px; font-weight:bold; color:#fff; }

/* PAGE SHELL */
.phd  { background:#111; width:100%; }
.phdt { width:100%; border-collapse:collapse; }
.phdt td { padding:9px 48px; }
.phb  { font-size:8px; font-weight:bold; color:#ff4500; letter-spacing:2px; text-transform:uppercase; }
.phi  { font-size:8px; color:#555; text-align:right; }
.pbdy { padding:26px 48px; }

/* Section big number */
.mn  { font-size:50px; font-weight:bold; color:#f0f0f0; line-height:1; margin-bottom:-14px; }
.mti { font-size:17px; font-weight:bold; color:#111; text-transform:uppercase; letter-spacing:1px; border-bottom:3px solid #ff4500; padding-bottom:6px; margin-bottom:14px; display:inline-block; }

/* 2col */
.t2 { width:100%; border-collapse:collapse; }
.t2 td { vertical-align:top; }
.cm { width:60%; padding-right:20px; }
.cs { width:40%; }

/* Cards */
.cfor { background:#fff5f0; border-left:4px solid #ff4500; padding:14px; margin-bottom:10px; }
.cby  { background:#111; padding:14px; }
.crt  { width:100%; border-collapse:collapse; }
.crt tr { border-bottom:1px solid #ffe8e0; }
.crt tr:last-child { border-bottom:none; }
.crt td { padding:4px 0; font-size:9px; }
.ck { color:#888; }
.cv { font-weight:bold; text-align:right; }
.bp  { font-size:10px; line-height:1.85; color:#333; margin-bottom:12px; }
.bq  { border-left:3px solid #ff4500; padding:9px 13px; font-size:10px; font-style:italic; color:#555; margin:10px 0; }
.techt { width:100%; border-collapse:collapse; margin-top:10px; }
.techt td { background:#f5f5f5; padding:7px 9px; border:1px solid #fff; vertical-align:top; }
.tk { font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; margin-bottom:2px; }
.tv { font-size:9px; color:#333; }

/* SCOPE — number centered via nested table */
.scpt { width:100%; border-collapse:collapse; }
.scpt tr { border-bottom:1px solid #eee; }
.scpt td { padding:8px 0; vertical-align:middle; }
.snb-t { width:34px; border-collapse:collapse; }
.snb-t td { text-align:center; vertical-align:middle; padding:0; }
.snb { width:30px; height:30px; background:#ff4500; color:#fff; font-size:12px; font-weight:bold; line-height:30px; text-align:center; display:inline-block; }
.stitle { font-size:10px; font-weight:bold; color:#111; margin-bottom:2px; }
.sdesc  { font-size:9px; color:#666; line-height:1.55; }
.bh { font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; }
.bm { font-size:7px; font-weight:bold; color:#f59e0b; text-transform:uppercase; }
.bl { font-size:7px; font-weight:bold; color:#22c55e; text-transform:uppercase; }

/* TIMELINE — number centered via nested table */
.tlt { width:100%; border-collapse:collapse; }
.tlt tr { border-bottom:1px solid #f0f0f0; }
.tlt td { padding:8px 0; vertical-align:top; }
.tlnm-t { width:30px; border-collapse:collapse; }
.tlnm-t td { text-align:center; vertical-align:top; padding-top:2px; }
.tlnm { width:28px; height:28px; background:#ff4500; color:#fff; font-size:11px; font-weight:bold; line-height:28px; text-align:center; display:inline-block; }
.tlbd { padding-left:10px; }
.tlna { font-size:11px; font-weight:bold; color:#111; margin-bottom:2px; }
.tldr { font-size:8px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:1px; margin-bottom:3px; }
.tltg { display:inline-block; font-size:8px; color:#555; background:#f5f5f5; padding:1px 5px; margin:1px; }

/* INVESTMENT */
.invt { width:100%; border-collapse:collapse; }
.invt tr { border-bottom:1px solid #f5f5f5; }
.in  { font-size:9px; font-weight:bold; padding:6px 0; width:38%; }
.ib  { width:28%; padding:6px 7px; }
.ibg { background:#f0f0f0; height:4px; }
.ibf { background:#ff4500; height:4px; }
.ip  { font-size:8px; color:#999; text-align:right; width:10%; padding:6px 3px; }
.ia  { font-size:9px; font-weight:bold; text-align:right; width:24%; padding:6px 0; }
.itr { background:#111; }
.itr td { padding:11px 0; }
.itl { font-size:10px; font-weight:bold; color:#fff; width:76%; }
.itv { font-size:18px; font-weight:bold; color:#ff4500; text-align:right; }
.pmg { background:#fff5f0; padding:10px; margin-top:10px; }
.pmt { font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; }

/* TEAM */
.tmt { width:100%; border-collapse:collapse; }
.tmt td { width:50%; vertical-align:top; padding:0 7px 7px 0; }
.tmt td:nth-child(2n) { padding-right:0; }
.tmg { background:#fff5f0; border-top:3px solid #ff4500; padding:11px; }
.tmct { font-size:23px; font-weight:bold; color:#ff4500; line-height:1; margin-bottom:3px; }
.tmcr { font-size:10px; font-weight:bold; color:#111; margin-bottom:2px; }
.tmcd { font-size:8px; color:#888; line-height:1.5; }

/* TERMS / STEPS */
.tert { width:100%; border-collapse:collapse; }
.tert tr { border-bottom:1px solid #f5f5f5; }
.tert td { padding:7px 0; font-size:9px; vertical-align:top; }
.ten { color:#ff4500; font-weight:bold; width:18px; }
.stt { width:100%; border-collapse:collapse; }
.stt tr { border-bottom:1px solid #f5f5f5; }
.stt td { padding:7px 0; vertical-align:middle; }
.stn { width:26px; height:26px; background:#ff4500; color:#fff; font-size:10px; font-weight:bold; line-height:26px; text-align:center; display:inline-block; }

/* CLOSING — no height on table, use position absolute for backgrounds */
.cl-wrap { width:210mm; height:297mm; position:relative; overflow:hidden; }
.cl-bg-left  { position:absolute; top:0; left:0; width:80mm; height:297mm; background:#ff4500; }
.cl-bg-right { position:absolute; top:0; left:80mm; right:0; height:297mm; background:#111; }
.cl-table { width:100%; height:297mm; border-collapse:collapse; position:relative; }
.cl-left  { width:80mm; vertical-align:middle; padding:56px 38px; text-align:center; }
.cl-right { vertical-align:middle; padding:56px 38px; }
.clln { font-size:100px; font-weight:bold; color:rgba(255,255,255,0.2); line-height:1; display:block; margin-bottom:18px; }
.cllt { font-size:9px; font-weight:bold; color:#fff; text-transform:uppercase; letter-spacing:2px; line-height:2; }
.cll2 { font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:3px; margin-bottom:14px; }
.clt2 { font-size:28px; font-weight:bold; color:#fff; line-height:1.15; margin-bottom:14px; }
.cls2 { font-size:10px; color:#555; margin-bottom:32px; line-height:1.7; }
.clst { width:100%; border-collapse:collapse; }
.clst td { padding:5px 0; vertical-align:middle; }
.cldn { width:20px; height:20px; border:1.5px solid #ff4500; color:#ff4500; font-size:8px; font-weight:bold; line-height:18px; text-align:center; display:inline-block; }
.cldt { font-size:9px; color:#888; padding-left:9px; }
</style>
</head>
<body>

{{-- COVER --}}
<div class="cover pb">
    <div class="stripe"></div>
    <table class="c-hdr"><tr><td class="c-brand">VibeMe.AI</td><td class="c-ref">{{ $content['proposal_number'] ?? '' }}</td></tr></table>
    <div class="c-hero">
        <div class="c-lbl">Project Proposal</div>
        <div class="c-title">{{ strtoupper($analysis->project_title) }}</div>
        <table class="c-rule"><tr><td class="c-rline"></td><td class="c-rdot"><div class="c-rdoti"></div></td></tr></table>
    </div>
    <div class="c-intro">{{ Str::limit($content['executive_summary'] ?? '', 220) }}</div>
    <div class="c-stats"><table class="c-stt"><tr>
    @foreach([['Client',$client->company_name],['Date',\Carbon\Carbon::parse($proposal->created_at)->format('d M Y')],['Language',ucfirst($proposal->language??'English')],['Investment',$content['total_investment']??'TBD']] as [$l,$v])
    <td><span class="csl">{{ $l }}</span><span class="csv">{{ $v }}</span></td>
    @endforeach
    </tr></table></div>
</div>

{{-- PAGE 2: OVERVIEW --}}
<div class="pb nb">
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">{{ $analysis->project_title }} · {{ $content['proposal_number']??'' }}</td></tr></table></div>
<div class="pbdy">
    <div class="mn">01</div><div class="mti">Overview</div>
    <table class="t2 nb"><tr>
    <td class="cm">
        <div class="bp">{{ $content['executive_summary']??'' }}</div>
        <div class="bq">{{ $content['proposed_solution']??'' }}</div>
        @if(!empty($content['technical_approach']))
        <div style="font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:2px; margin:10px 0 7px;">Technical Stack</div>
        <table class="techt"><tr>
        @foreach(array_slice(array_keys($content['technical_approach']),0,6) as $k)
        <td style="width:33%;"><div class="tk">{{ str_replace('_',' ',$k) }}</div><div class="tv">{{ is_array($content['technical_approach'][$k]) ? implode(', ',$content['technical_approach'][$k]) : $content['technical_approach'][$k] }}</div></td>
        @endforeach
        </tr></table>
        @endif
    </td>
    <td class="cs">
        <div class="cfor">
            <div style="font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:2px; margin-bottom:9px;">Prepared For</div>
            <table class="crt">
            @foreach([['Company',$client->company_name],['Contact',$client->contact_person],['Email',$client->email],['Phone',$client->phone]] as [$l,$v])
            @if($v)<tr><td class="ck">{{ $l }}</td><td class="cv">{{ $v }}</td></tr>@endif
            @endforeach
            </table>
        </div>
        <div class="cby">
            <div style="font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:2px; margin-bottom:9px;">Prepared By</div>
            <div style="font-size:15px; font-weight:bold; color:#fff; margin-bottom:2px;">VibeMe.AI</div>
            <div style="font-size:7px; color:#555; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Software Development</div>
            @foreach(array_slice($content['company_strengths']??[],0,3) as $s)
            <div style="font-size:9px; color:#888; margin-bottom:5px;">› {{ $s }}</div>
            @endforeach
        </div>
    </td>
    </tr></table>
</div>
</div>

{{-- PAGE 3: SCOPE --}}
<div class="pb nb">
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">Scope of Work</td></tr></table></div>
<div class="pbdy">
    <div class="mn">02</div><div class="mti">Scope of Work</div>
    <table class="scpt">
    @foreach($content['scope_of_work']??[] as $i=>$item)
    <tr class="nb">
        <td style="width:38px; padding-right:8px; vertical-align:middle; text-align:center;">
            <span class="snb">{{ $i+1 }}</span>
        </td>
        <td style="width:30%; padding-right:10px; vertical-align:top;">
            <div class="stitle">{{ $item['item'] }}</div>
            <span class="b{{ strtolower(substr($item['priority']??'m',0,1)) }}">{{ strtoupper($item['priority']??'MEDIUM') }}</span>
        </td>
        <td style="vertical-align:top;"><div class="sdesc">{{ $item['description'] }}</div></td>
    </tr>
    @endforeach
    </table>
</div>
</div>

{{-- PAGE 4: TIMELINE + INVESTMENT --}}
<div class="pb nb">
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">Timeline &amp; Investment</td></tr></table></div>
<div class="pbdy">
    <table class="t2"><tr>
    <td style="width:54%; vertical-align:top; padding-right:22px;">
        <div class="mn">03</div><div class="mti">Timeline</div>
        <table class="tlt">
        @foreach($content['project_timeline']??[] as $i=>$phase)
        <tr class="nb">
            <td style="width:32px; text-align:center; vertical-align:top; padding:7px 8px 7px 0;">
                <span class="tlnm">{{ $i+1 }}</span>
            </td>
            <td class="tlbd"><div class="tlna">{{ $phase['name'] }}</div><div class="tldr">{{ $phase['duration'] }}</div><div>@foreach($phase['deliverables']??[] as $d)<span class="tltg">{{ $d }}</span>@endforeach</div></td>
        </tr>
        @endforeach
        </table>
    </td>
    <td style="width:46%; vertical-align:top;">
        <div class="mn">04</div><div class="mti">Budget</div>
        <table class="invt">
        @foreach($content['investment_breakdown']??[] as $item)
        <tr class="nb"><td class="in">{{ $item['name'] }}</td><td class="ib"><div class="ibg"><div class="ibf" style="width:{{ $item['percentage'] }}%;"></div></div></td><td class="ip">{{ $item['percentage'] }}%</td><td class="ia">${{ number_format($item['cost']) }}</td></tr>
        @endforeach
        <tr class="itr nb"><td class="itl" colspan="3">TOTAL</td><td class="itv">{{ $content['total_investment'] }}</td></tr>
        </table>
        @if(!empty($content['payment_terms']))
        <div class="pmg nb"><div class="pmt">Payment Schedule</div>
        @foreach($content['payment_terms'] as $i=>$t)
        <div style="font-size:9px; color:#555; margin-bottom:3px;">{{ $i+1 }}. {{ $t }}</div>
        @endforeach
        </div>
        @endif
    </td>
    </tr></table>
</div>
</div>

{{-- PAGE 5: TEAM + TERMS + STEPS --}}
<div class="pb nb">
<div class="phd"><table class="phdt"><tr><td class="phb">VibeMe.AI</td><td class="phi">Team · Terms · Steps</td></tr></table></div>
<div class="pbdy">
    <div class="mn">05</div><div class="mti">Our Team</div>
    <table class="tmt" style="margin-bottom:22px;">
    @foreach(array_chunk($content['team_overview']??[],2) as $row)
    <tr>
    @foreach($row as $m)
    <td><div class="tmg nb"><div class="tmct">{{ $m['count'] }}</div><div class="tmcr">{{ $m['role'] }}</div><div class="tmcd">{{ $m['responsibility'] }}</div></div></td>
    @endforeach
    @if(count($row)<2)<td></td>@endif
    </tr>
    @endforeach
    </table>
    <table style="width:100%; border-collapse:collapse;"><tr>
    <td style="width:55%; vertical-align:top; padding-right:18px;">
        <div style="font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:2px; margin-bottom:9px;">Terms &amp; Conditions</div>
        <table class="tert">
        @foreach($content['terms_and_conditions']??[] as $i=>$t)
        <tr class="nb"><td class="ten">{{ $i+1 }}.</td><td style="line-height:1.6;">{{ $t }}</td></tr>
        @endforeach
        </table>
    </td>
    <td style="width:45%; vertical-align:top;">
        <div style="font-size:7px; font-weight:bold; color:#ff4500; text-transform:uppercase; letter-spacing:2px; margin-bottom:9px;">Next Steps</div>
        <table class="stt">
        @foreach($content['next_steps']??[] as $i=>$step)
        <tr class="nb"><td style="width:32px; text-align:center;"><span class="stn">{{ $i+1 }}</span></td><td style="font-size:10px; color:#333; padding-left:7px;">{{ $step }}</td></tr>
        @endforeach
        </table>
    </td>
    </tr></table>
</div>
</div>

{{-- CLOSING — position:absolute backgrounds, no height on table --}}
<div class="cl-wrap">
    <div class="cl-bg-left"></div>
    <div class="cl-bg-right"></div>
    <table class="cl-table">
    <tr>
    <td class="cl-left">
        <span class="clln">GO</span>
        <div class="cllt">Let's<br>Build<br>This</div>
    </td>
    <td class="cl-right">
        <div class="cll2">Ready to proceed?</div>
        <div class="clt2">Accept &amp;<br>Get Started</div>
        <div class="cls2">Valid for {{ $content['validity_period']??'30 days' }}<br>{{ $client->email }}</div>
        <table class="clst">
        @foreach(array_slice($content['next_steps']??[],0,3) as $i=>$step)
        <tr><td style="width:28px; text-align:center;"><span class="cldn">{{ $i+1 }}</span></td><td class="cldt">{{ Str::limit($step,40) }}</td></tr>
        @endforeach
        </table>
    </td>
    </tr>
    </table>
</div>

</body>
</html>