<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Payroll\AttendanceRecordController;
use App\Http\Controllers\Payroll\CountryController;
use App\Http\Controllers\Payroll\EmployeePayrollProfileController;
use App\Http\Controllers\Payroll\LeavePolicyController;
use App\Http\Controllers\Payroll\LeaveRequestController;
use App\Http\Controllers\Payroll\OvertimeRequestController;
use App\Http\Controllers\Payroll\PayrollBonusController;
use App\Http\Controllers\Payroll\PayrollPeriodController;
use App\Http\Controllers\Payroll\PayrollRecordController;
use App\Http\Controllers\Payroll\PublicHolidayController;
use App\Http\Controllers\Payroll\SalaryAllowanceController;
use App\Http\Controllers\Payroll\SalaryDeductionController;
use App\Http\Controllers\Payroll\SalaryRuleController;
use App\Http\Controllers\Payroll\SocialSecurityRuleController;
use App\Http\Controllers\Payroll\TaxBracketController;
use App\Http\Controllers\Api\MobileAuthController;
use App\Http\Controllers\Payroll\ExpenseRequestController;
use App\Http\Controllers\Payroll\AttendanceRequestController;
use App\Http\Controllers\Payroll\PayslipController;
use App\Http\Controllers\DriverScheduleController;
use App\Http\Controllers\DashboardController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {

    // ─────────────────────────────────────────
    // HR & Admin Only
    // ─────────────────────────────────────────
    Route::middleware(['role:hr|admin|management|employee|driver'])->group(function () {

        // Country Setup
        Route::apiResource('payroll/countries', CountryController::class);

        // Public Holidays
        Route::apiResource('payroll/public-holidays', PublicHolidayController::class);

        // Salary Rules
        Route::apiResource('payroll/salary-rules', SalaryRuleController::class);
        Route::apiResource('payroll/salary-allowances', SalaryAllowanceController::class);
        Route::apiResource('payroll/salary-deductions', SalaryDeductionController::class);
        Route::apiResource('payroll/tax-brackets', TaxBracketController::class);
        Route::apiResource('payroll/social-security-rules', SocialSecurityRuleController::class);

        // Leave Policy Setup
        Route::apiResource('payroll/leave-policies', LeavePolicyController::class);

        // Employee Payroll Profile
        Route::apiResource('payroll/employee-profiles', EmployeePayrollProfileController::class);

        // Attendance — bulk import
        Route::post('payroll/attendance/bulk', [AttendanceRecordController::class, 'bulkStore']);

        // Leave — approve/reject
        Route::patch('payroll/leave-requests/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
        Route::patch('payroll/leave-requests/{leaveRequest}/reject', [LeaveRequestController::class, 'reject']);
        Route::delete('payroll/leave-requests/{leaveRequest}', [LeaveRequestController::class, 'destroy']);

        // Overtime — approve/reject
        Route::patch('payroll/overtime-requests/{overtimeRequest}/approve', [OvertimeRequestController::class, 'approve']);
        Route::patch('payroll/overtime-requests/{overtimeRequest}/reject', [OvertimeRequestController::class, 'reject']);
        Route::delete('payroll/overtime-requests/{id}', [OvertimeRequestController::class, 'destroy']); // ← ဒါထည့်

        // Payroll Period
        Route::apiResource('payroll/periods', PayrollPeriodController::class);
        Route::post('payroll/periods/{payrollPeriod}/calculate', [PayrollPeriodController::class, 'calculate']);
        Route::patch('payroll/periods/{payrollPeriod}/approve', [PayrollPeriodController::class, 'approve']);
        Route::patch('payroll/periods/{payrollPeriod}/mark-paid', [PayrollPeriodController::class, 'markAsPaid']);

        // Payroll Bonus
        Route::apiResource('payroll/bonuses', PayrollBonusController::class)->except(['index', 'show']);

        // Bank Export
        Route::get('payroll/export/bank-transfer', [PayrollRecordController::class, 'exportBank']);
        Route::get('payroll/export/bank-transfer/preview', [PayrollRecordController::class, 'exportBankPreview']);


        // Expense — approve/reject/delete/attachment download
        Route::patch('payroll/expense-requests/{id}/approve',              [ExpenseRequestController::class, 'approve']);
        Route::patch('payroll/expense-requests/{id}/reject',               [ExpenseRequestController::class, 'reject']);
        Route::delete('payroll/expense-requests/{id}',                     [ExpenseRequestController::class, 'destroy']);
        Route::get('payroll/expense-requests/{id}/attachments/{index}',    [ExpenseRequestController::class, 'downloadAttachment']);


        // Attendance Requests — approve/reject
        Route::patch('payroll/attendance-requests/{id}/approve', [AttendanceRequestController::class, 'approve']);
        Route::patch('payroll/attendance-requests/{id}/reject',  [AttendanceRequestController::class, 'reject']);
        Route::delete('payroll/attendance-requests/{id}',        [AttendanceRequestController::class, 'destroy']);

        // Payslip
        Route::get('payroll/payslips',                      [PayslipController::class, 'mobilePayslips']);
        Route::get('payroll/payslips/{id}/detail',          [PayslipController::class, 'mobileDetail']);
        Route::get('payroll/payslips/{payrollRecord}/pdf',  [PayslipController::class, 'downloadPdf']);

    });

    // ─────────────────────────────────────────
    // HR Only
    // ─────────────────────────────────────────
    Route::middleware(['role:hr'])->group(function () {

        // Attendance CRUD
        Route::apiResource('payroll/attendance', AttendanceRecordController::class);
    });

    // ─────────────────────────────────────────
    // HR + Admin + Management + Member (filtered by role)
    // ─────────────────────────────────────────
    Route::middleware(['role:hr|admin|management|member|employee|driver'])->group(function () {

        // Leave Requests
        Route::get('payroll/leave-requests', [LeaveRequestController::class, 'index']);
        Route::post('payroll/leave-requests', [LeaveRequestController::class, 'store']);

        // Overtime Requests
        Route::get('payroll/overtime-requests', [OvertimeRequestController::class, 'index']);
        Route::post('payroll/overtime-requests', [OvertimeRequestController::class, 'store']);

        // Attendance View (role-filtered inside controller)
        Route::get('payroll/attendance', [AttendanceRecordController::class, 'index']);

        // Payroll Records View (role-filtered inside controller)
        Route::get('payroll/records', [PayrollRecordController::class, 'index']);
        Route::get('payroll/records/{payrollRecord}', [PayrollRecordController::class, 'show']);

        // Employee own profile view
        Route::get('payroll/employee-profiles/{employeePayrollProfile}', [EmployeePayrollProfileController::class, 'show']);

        // Expense Requests
        Route::get('payroll/expense-requests',  [ExpenseRequestController::class, 'index']);
        Route::post('payroll/expense-requests', [ExpenseRequestController::class, 'store']);

        // Attendance Requests
        Route::get('payroll/attendance-requests',  [AttendanceRequestController::class, 'index']);
        Route::post('payroll/attendance-requests', [AttendanceRequestController::class, 'store']);

        // Payslip
        Route::get('payroll/payslips',                          [PayslipController::class, 'mobilePayslips']);
        Route::get('payroll/payslips/{id}/detail',              [PayslipController::class, 'mobileDetail']);
        Route::get('payroll/payslips/{payrollRecord}/pdf',      [PayslipController::class, 'downloadPdf']);

        Route::get('dashboard', [DashboardController::class, 'mobileDashboard']);
        Route::patch('hr-alerts/{id}/acknowledge', [DashboardController::class, 'acknowledgeWarning']);
    });

    Route::middleware(['role:driver'])->group(function () {
        Route::get  ('driver/schedule',                [DriverScheduleController::class, 'index']);
        Route::get  ('driver/schedule/bookings',       [DriverScheduleController::class, 'bookings']);
        Route::patch('driver/schedule/{booking}/status',[DriverScheduleController::class, 'updateStatus']);
        Route::post ('driver/schedule/{booking}/cancel',[DriverScheduleController::class, 'cancel']);
        Route::post ('driver/schedule/{booking}/note',  [DriverScheduleController::class, 'storeNote']);
    });

});

Route::prefix('v1/auth')->group(function () {
    Route::post('login', [MobileAuthController::class, 'login']);
});
 
// Mobile Auth — token လိုတဲ့ routes
Route::prefix('v1/auth')->middleware('auth:sanctum')->group(function () {
    Route::post('logout', [MobileAuthController::class, 'logout']);
    Route::get('me',     [MobileAuthController::class, 'me']);
});