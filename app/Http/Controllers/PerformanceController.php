<?php
namespace App\Http\Controllers;

use App\Models\Country;
use App\Services\PerformanceAnalysisService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PerformanceController extends Controller
{
    public function __construct(private PerformanceAnalysisService $service) {}

    // ── GET /performance — main page ─────────────────────────────
    public function index(Request $request)
    {
        $user      = Auth::user();
        $role      = $user->role?->name;
        $countryId = $role === 'admin' ? null : $user->country_id;

        // Countries list for admin dropdown
        $countries = $role === 'admin'
            ? Country::orderBy('name')->get(['id', 'name'])
            : collect();

        // Default: user's country (admin picks from dropdown)
        $selectedCountry = $role === 'admin'
            ? ($request->country_id ?? Country::first()?->id)
            : $countryId;

        $year    = (int) $request->get('year', now()->year);
        $filters = $request->get('filters') ?? ['late','absent','leave'];
        if (is_string($filters)) $filters = array_filter(explode(',', $filters));
        $filters = array_values($filters ?: ['late','absent','leave']);


        // DB-only metrics (fast, no AI)
        $metrics = $this->service->getMetrics($selectedCountry, $year, $filters);

        return Inertia::render('Performance/Index', [
            'metrics'         => $metrics,
            'countries'       => $countries,
            'selectedCountry' => $selectedCountry,
            'selectedYear'    => $year,
            'selectedFilters' => $filters,
            'userRole'        => $role,
            'availableYears'  => range(now()->year, now()->year - 4),
            'countryName'     => Country::find($selectedCountry)?->name ?? '',
        ]);
    }

    // ── GET /performance/metrics — AJAX refresh on filter change ─
    public function metrics(Request $request)
    {
        $user      = Auth::user();
        $role      = $user->role?->name;
        $countryId = $role === 'admin'
            ? $request->country_id
            : $user->country_id;

        $year    = (int) $request->get('year', now()->year);
        $filters = $request->get('filters') ?? ['late','absent','leave'];
        if (is_string($filters)) $filters = array_filter(explode(',', $filters));
        $filters = array_values($filters ?: ['late','absent','leave']);


        if (is_string($filters)) {
            $filters = explode(',', $filters);
        }

        $metrics = $this->service->getMetrics($countryId, $year, $filters);

        return response()->json($metrics);
    }

    // ── GET /performance/analyze — SSE stream ────────────────────
    // Frontend: EventSource('/performance/analyze?country_id=1&year=2025')
    public function analyze(Request $request): StreamedResponse
    {
        $user      = Auth::user();
        $role      = $user->role?->name;
        $countryId = $role === 'admin'
            ? (int) $request->country_id
            : $user->country_id;

        $year = (int) $request->get('year', now()->year);

        return new StreamedResponse(function () use ($countryId, $year) {

            // Helper: emit SSE event
            $emit = function (string $event, array $data) {
                echo "event: {$event}\n";
                echo 'data: ' . json_encode($data) . "\n\n";
                ob_flush();
                flush();
            };

            $this->service->analyzeAllSSE($countryId, $year, $emit);

        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no', // Nginx: disable buffering
            'Connection'        => 'keep-alive',
        ]);
    }
}