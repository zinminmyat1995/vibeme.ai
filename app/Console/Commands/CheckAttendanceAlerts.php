<?php
namespace App\Console\Commands;

use App\Services\HrAlertService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckAttendanceAlerts extends Command
{
    protected $signature   = 'hr:check-alerts';
    protected $description = 'Check attendance thresholds and generate HR alerts with AI warning letters';

    public function handle(HrAlertService $service): int
    {
        $this->info('🔍 Checking attendance alerts...');

        $results = $service->runDailyCheck();

        $this->info("✅ Late alerts created  : {$results['late']}");
        $this->info("✅ Absent alerts created : {$results['absent']}");

        if ($results['errors'] > 0) {
            $this->warn("⚠️  Errors: {$results['errors']}");
        }

        Log::info('hr:check-alerts completed', $results);

        return self::SUCCESS;
    }
}