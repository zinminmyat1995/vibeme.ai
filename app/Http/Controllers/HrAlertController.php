<?php
namespace App\Http\Controllers;

use App\Models\HrAlert;
use App\Services\HrAlertService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HrAlertController extends Controller
{
    public function __construct(private HrAlertService $service) {}

    public function index(Request $request)
    {
        $user      = Auth::user();
        $role      = $user->role?->name;
        $countryId = $role === 'admin' ? null : $user->country_id;

        $status = $request->get('status', 'pending');

        $query = HrAlert::with([
            'user:id,name,avatar_url,department,position',
            'actionedByUser:id,name',
        ])->orderBy('status')->orderByDesc('created_at');

        if ($countryId) $query->where('country_id', $countryId);
        if ($status !== 'all') $query->where('status', $status);

        $alerts = $query->paginate(20);

        // Stats for summary cards
        $statsQuery = HrAlert::when($countryId, fn($q) => $q->where('country_id', $countryId));
        $stats = [
            'pending'   => (clone $statsQuery)->where('status', 'pending')->count(),
            'sent'      => (clone $statsQuery)->where('status', 'sent')->count(),
            'dismissed' => (clone $statsQuery)->where('status', 'dismissed')->count(),
            'late'      => (clone $statsQuery)->where('type', 'late')->count(),
            'absent'    => (clone $statsQuery)->where('type', 'absent')->count(),
            'total'     => (clone $statsQuery)->count(),
        ];

        return Inertia::render('HrAlerts/Index', [
            'alerts'       => $alerts,
            'statusFilter' => $status,
            'stats'        => $stats,
        ]);
    }

    public function send(Request $request, HrAlert $alert)
    {
        $request->validate(['letter' => 'required|string|min:20']);
        $this->service->sendWarning($alert, Auth::user(), $request->letter);
        return back()->with('success', 'Warning letter sent.');
    }

    public function dismiss(HrAlert $alert)
    {
        $this->service->dismiss($alert, Auth::user());
        return back()->with('success', 'Alert dismissed.');
    }

    public function run()
    {
        $results = $this->service->runDailyCheck();
        return response()->json(['success' => true, 'results' => $results]);
    }
}