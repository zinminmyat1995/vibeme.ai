<?php

namespace App\Providers;

use App\Models\AttendanceRecord;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\PayrollRecord;
use App\Models\SalaryRule;
use App\Policies\Payroll\AttendancePolicy;
use App\Policies\Payroll\LeaveRequestPolicy;
use App\Policies\Payroll\OvertimePolicy;
use App\Policies\Payroll\PayrollPolicy;
use App\Policies\Payroll\PayrollSetupPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
        // Register Payroll Policies
        Gate::policy(AttendanceRecord::class, AttendancePolicy::class);
        Gate::policy(LeaveRequest::class, LeaveRequestPolicy::class);
        Gate::policy(OvertimeRequest::class, OvertimePolicy::class);
        Gate::policy(PayrollRecord::class, PayrollPolicy::class);
        Gate::policy(SalaryRule::class, PayrollSetupPolicy::class);
    }
}