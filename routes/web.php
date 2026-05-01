<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RequirementAnalysisController;
use App\Http\Controllers\ProposalController;
use App\Http\Controllers\DocumentTranslationController;
use App\Http\Controllers\SmartMailController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Admin\ProjectController;
use App\Http\Controllers\Admin\ProjectAssignmentController;
use App\Http\Controllers\Payroll\AttendanceRecordController;
use App\Http\Controllers\Payroll\LeaveRequestController;
use App\Http\Controllers\Payroll\OvertimeRequestController;
use App\Http\Controllers\HRPolicySetupController;
use App\Http\Controllers\Payroll\EmployeePayrollProfileController;
use App\Http\Controllers\Payroll\AttendanceImportController;
use App\Http\Controllers\Payroll\PayrollRecordController;
use App\Http\Controllers\Payroll\PayslipController;
use App\Http\Controllers\Payroll\BankExportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RecruitmentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Payroll\AttendanceRequestController;
use App\Http\Controllers\Payroll\ExpenseRequestController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\HrChatbotController;
use App\Http\Controllers\ResourceBookingController;


// Home page (existing route ကို replace)
Route::get('/', [RecruitmentController::class, 'home']);

// Country detail
Route::get('/brycen/{countryKey}', [RecruitmentController::class, 'show'])
    ->name('brycen.show');

// Job detail
Route::get('/brycen/{countryKey}/jobs/{job}', [RecruitmentController::class, 'jobDetail'])
    ->name('brycen.job');

// Apply (CV submit)
Route::post('/brycen/{countryKey}/jobs/{job}/apply', [RecruitmentController::class, 'apply'])
    ->name('brycen.apply');

Route::get('/track/{code}', [RecruitmentController::class, 'track'])
    ->name('application.track');

// ── HR routes (login + role required) ──────────────────────────

Route::middleware(['auth', 'role:hr,admin'])->group(function () {

    // Recruitment dashboard
    Route::get('/recruitment', [RecruitmentController::class, 'hrIndex'])
        ->name('recruitment.index');

    Route::get('/recruitment/applications/{application}/cv', [RecruitmentController::class, 'downloadCv'])
        ->name('recruitment.cv.download');

    // Job Posting CRUD
    Route::post('/recruitment/jobs', [RecruitmentController::class, 'storeJob'])
        ->name('recruitment.jobs.store');
    Route::put('/recruitment/jobs/{job}', [RecruitmentController::class, 'updateJob'])
        ->name('recruitment.jobs.update');
    Route::delete('/recruitment/jobs/{job}', [RecruitmentController::class, 'destroyJob'])
        ->name('recruitment.jobs.destroy');

    // Applications
    Route::get('/recruitment/jobs/{job}/applications', [RecruitmentController::class, 'applications'])
        ->name('recruitment.applications');
    Route::patch('/recruitment/applications/{application}', [RecruitmentController::class, 'updateApplication'])
        ->name('recruitment.application.update');
    Route::post('/recruitment/applications/{application}/interview',
        [RecruitmentController::class, 'scheduleInterview'])
        ->name('recruitment.interview.schedule');
 
    Route::post('/recruitment/applications/{application}/score',
        [RecruitmentController::class, 'saveScore'])
        ->name('recruitment.interview.score');

    Route::post('/recruitment/applications/bulk-update',
        [RecruitmentController::class, 'bulkUpdateApplications'])
        ->name('recruitment.applications.bulk-update');

    Route::delete('/recruitment/applications/{application}',
        [RecruitmentController::class, 'deleteApplication'])
        ->name('recruitment.application.delete');

});


// ── HR/Admin Only ──────────────────────────────────────────────────
Route::middleware(['auth', 'role:hr,admin'])
    ->prefix('bookings')->name('bookings.')
    ->group(function () {
        Route::post  ('/resources',            [ResourceBookingController::class, 'storeResource'])   ->name('resources.store');
        Route::put   ('/resources/{resource}', [ResourceBookingController::class, 'updateResource'])  ->name('resources.update');
        Route::delete('/resources/{resource}', [ResourceBookingController::class, 'destroyResource']) ->name('resources.destroy');
        Route::patch ('/{booking}/approve',    [ResourceBookingController::class, 'approve'])         ->name('approve');
        Route::patch ('/{booking}/reject',     [ResourceBookingController::class, 'reject'])          ->name('reject');
        Route::patch ('/{booking}/returned',   [ResourceBookingController::class, 'markReturned'])    ->name('returned');
    });
 
// ── All Auth Users ─────────────────────────────────────────────────
Route::middleware(['auth'])
    ->prefix('bookings')->name('bookings.')
    ->group(function () {
        Route::get  ('/',                    [ResourceBookingController::class, 'index'])              ->name('index');
        Route::get  ('/calendar',            [ResourceBookingController::class, 'calendarBookings'])   ->name('calendar');   // AJAX
        Route::get  ('/available-resources', [ResourceBookingController::class, 'availableResources']) ->name('available');  // AJAX
        Route::post ('/',                    [ResourceBookingController::class, 'store'])              ->name('store');
        Route::patch('/{booking}/cancel',    [ResourceBookingController::class, 'cancel'])            ->name('cancel');
        Route::get('/search-users',          [ResourceBookingController::class, 'searchUsers'])        ->name('search-users');
        Route::get('/check-conflict',   [ResourceBookingController::class, 'checkConflict'])  ->name('check-conflict'); // ← ထည့်
        Route::get('/{booking}/detail',      [ResourceBookingController::class, 'detail'])             ->name('detail');
    });
 


// ── HR Survey Management (auth required) ──
Route::middleware(['auth', 'role:admin,hr'])->prefix('hr/surveys')->name('surveys.')->group(function () {
    Route::get    ('/',                [App\Http\Controllers\SurveyController::class, 'index'])          ->name('index');
    Route::get    ('/create',          [App\Http\Controllers\SurveyController::class, 'create'])         ->name('create');
    Route::post   ('/',                [App\Http\Controllers\SurveyController::class, 'store'])          ->name('store');
    Route::get    ('/{survey}/edit',   [App\Http\Controllers\SurveyController::class, 'edit'])           ->name('edit');
    Route::put    ('/{survey}',        [App\Http\Controllers\SurveyController::class, 'update'])         ->name('update');
    Route::delete ('/{survey}',        [App\Http\Controllers\SurveyController::class, 'destroy'])        ->name('destroy');
    Route::patch  ('/{survey}/toggle', [App\Http\Controllers\SurveyController::class, 'toggleStatus'])   ->name('toggle');
    Route::get    ('/{survey}/results',[App\Http\Controllers\SurveyController::class, 'results'])        ->name('results');
    Route::post   ('/{survey}/insight',[App\Http\Controllers\SurveyController::class, 'generateInsight'])->name('insight');
    Route::get    ('/{survey}/export', [App\Http\Controllers\SurveyController::class, 'exportCsv'])      ->name('export');
});
 
// ── Public Survey (no auth required) ──────
Route::get  ('/survey/{token}',        [App\Http\Controllers\SurveyController::class, 'publicShow'])   ->name('survey.public');
Route::post ('/survey/{token}/submit', [App\Http\Controllers\SurveyController::class, 'publicSubmit']) ->name('survey.submit');




Route::middleware(['auth'])->prefix('hr-chatbot')->name('hr-chatbot.')->group(function () {
    Route::get   ('messages',      [App\Http\Controllers\HrChatbotController::class, 'messages'])     ->name('messages');
    Route::post  ('ask',           [App\Http\Controllers\HrChatbotController::class, 'ask'])          ->name('ask');
    Route::delete('messages',      [App\Http\Controllers\HrChatbotController::class, 'clear'])        ->name('clear');
    Route::get   ('quick-actions', [App\Http\Controllers\HrChatbotController::class, 'quickActions']) ->name('quick-actions');
});
 

Route::middleware(['auth', 'role:hr'])->prefix('hr-alerts')->name('hr-alerts.')->group(function () {
    Route::get   ('/',                [App\Http\Controllers\HrAlertController::class, 'index'])   ->name('index');
    Route::patch ('/{alert}/send',    [App\Http\Controllers\HrAlertController::class, 'send'])    ->name('send');
    Route::patch ('/{alert}/dismiss', [App\Http\Controllers\HrAlertController::class, 'dismiss']) ->name('dismiss');
    Route::post  ('/run',             [App\Http\Controllers\HrAlertController::class, 'run'])     ->name('run');
});


Route::middleware(['auth'])->group(function () {
    Route::patch('/hr-alerts/{alert}/acknowledge', [App\Http\Controllers\HrAlertController::class, 'acknowledge'])
        ->name('hr-alerts.acknowledge');
});

Route::middleware(['auth', 'role:admin,hr,management'])
    ->prefix('performance')
    ->name('performance.')
    ->group(function () {
 
    // Main page (Inertia)
    Route::get('/', [App\Http\Controllers\PerformanceController::class, 'index'])
        ->name('index');
 
    // AJAX: refresh metrics on filter change
    Route::get('/metrics', [App\Http\Controllers\PerformanceController::class, 'metrics'])
        ->name('metrics');
 
    // SSE: AI analysis stream
    Route::get('/analyze', [App\Http\Controllers\PerformanceController::class, 'analyze'])
        ->name('analyze');
});



// Forgot Password
Route::get('/forgot-password', [ForgotPasswordController::class, 'showForgotForm'])
    ->name('password.request')
    ->middleware('guest');
 
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink'])
    ->name('password.email')
    ->middleware('guest');
 
// Reset Password
Route::get('/reset-password', [ForgotPasswordController::class, 'showResetForm'])
    ->name('password.reset')
    ->middleware('guest');
 
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword'])
    ->name('password.update')
    ->middleware('guest');
    

// Auth Routes
Route::get('/login', [LoginController::class, 'index'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');


// Dashboard Routes (middleware protected)
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/announcements', [DashboardController::class, 'storeAnnouncement']);
    Route::delete('/dashboard/announcements/{announcement}', [DashboardController::class, 'deleteAnnouncement']);   


    Route::get('/hr/dashboard', fn() => inertia('HR/Dashboard'))->name('hr.dashboard');
    Route::get('/management/dashboard', fn() => inertia('Management/Dashboard'))->name('management.dashboard');
    Route::get('/employee/dashboard', fn() => inertia('Employee/Dashboard'))->name('employee.dashboard');

    // User & Roles
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::patch('/users/{user}/toggle', [UserController::class, 'toggleStatus'])->name('users.toggle');

    // Requirement Analysis
    Route::get('/requirement-analysis', [RequirementAnalysisController::class, 'index'])->name('requirement.index');
    Route::post('/requirement-analysis', [RequirementAnalysisController::class, 'store'])->name('requirement.store');
    Route::get('/requirement-analysis/{analysis}', [RequirementAnalysisController::class, 'show'])->name('requirement.show');
    Route::delete('/requirement-analysis/{analysis}', [RequirementAnalysisController::class, 'destroy'])->name('requirement.destroy');
    Route::post('/requirement-analysis/{analysis}/reanalyze', [RequirementAnalysisController::class, 'reanalyze'])->name('requirement.reanalyze');

    // Proposal Generator
    Route::get('/proposals',  [ProposalController::class, 'index'])->name('proposals.index');
    Route::post('/proposals', [ProposalController::class, 'store'])->name('proposals.store');
    Route::get('/proposals/{proposal}', [ProposalController::class, 'show'])->name('proposal.show');
    Route::get('/proposals/{proposal}/preview/{template?}', [ProposalController::class, 'preview'])->name('proposal.preview');
    Route::get('/proposals/{proposal}/pdf/{template?}', [ProposalController::class, 'downloadPDF'])->name('proposal.pdf');
    Route::patch('/proposals/{proposal}/status',    [ProposalController::class, 'updateStatus'])->name('proposal.status');
    Route::post('/proposals/{proposal}/regenerate', [ProposalController::class, 'regenerate'])->name('proposal.regenerate');
    Route::delete('/proposals/{proposal}',          [ProposalController::class, 'destroy'])->name('proposal.destroy');


    // Document Translation
    Route::get('/document-translation', [DocumentTranslationController::class, 'index'])->name('document-translation');
    Route::post('/folders', [DocumentTranslationController::class, 'storeFolder'])->name('folders.store');
    Route::put('/folders/{folder}', [DocumentTranslationController::class, 'updateFolder'])->name('folders.update');
    Route::delete('/folders/{folder}', [DocumentTranslationController::class, 'destroyFolder'])->name('folders.destroy');
    Route::get('/folders/{folder}/contents', [DocumentTranslationController::class, 'folderContents'])->name('folders.contents');
    Route::post('/documents/upload', [DocumentTranslationController::class, 'upload'])->name('documents.upload');
    Route::get('/documents/{document}/download/{language?}', [DocumentTranslationController::class, 'download'])->name('documents.download');
    Route::delete('/documents/{document}', [DocumentTranslationController::class, 'destroyDocument'])->name('documents.destroy');
        

    // Feature 4 — Smart Mail
    Route::prefix('smart-mail')->middleware(['auth'])->group(function () {
        Route::get('/',                          [SmartMailController::class, 'index'])->name('smart-mail');
        Route::post('/setup',                    [SmartMailController::class, 'saveMailSetting'])->name('smart-mail.setup');
        Route::post('/test-connection',          [SmartMailController::class, 'testConnection'])->name('smart-mail.test');
        Route::post('/send',                     [SmartMailController::class, 'send'])->name('smart-mail.send');
        Route::post('/sync',                     [SmartMailController::class, 'sync'])->name('smart-mail.sync');
        Route::patch('/{mail}/read',             [SmartMailController::class, 'markRead'])->name('smart-mail.read');
        Route::patch('/{mail}/star',             [SmartMailController::class, 'toggleStar'])->name('smart-mail.star');
        Route::delete('/{mail}',                 [SmartMailController::class, 'destroy'])->name('smart-mail.destroy');
        Route::post('/{mail}/translate',         [SmartMailController::class, 'translate'])->name('smart-mail.translate');
        Route::post('/ai/generate',              [SmartMailController::class, 'aiGenerate'])->name('smart-mail.ai.generate');
        Route::post('/ai/translate-preview',     [SmartMailController::class, 'aiTranslatePreview'])->name('smart-mail.ai.translate');
        Route::post('/ai/improve',               [SmartMailController::class, 'aiImprove'])->name('smart-mail.ai.improve');
        Route::post('/templates/{template}/render', [SmartMailController::class, 'renderTemplate'])->name('smart-mail.template.render');
        Route::get('/{mail}/download-pdf',       [SmartMailController::class, 'downloadPdf'])->name('smart-mail.download');
    });

    // ── AI Chat ──
    Route::middleware(['auth'])->prefix('ai-chat')->name('chat.')->group(function () {

        // Main page
        Route::get('/', [ChatController::class, 'index'])->name('index');

        // Conversations
        Route::get('/conversations',          [ConversationController::class, 'index'])->name('conversations.index');
        Route::post('/conversations/private', [ConversationController::class, 'createPrivate'])->name('conversations.private');
        Route::post('/conversations/group',   [ConversationController::class, 'createGroup'])->name('conversations.group');
        Route::post('/conversations/{conversation}/mute',    [ConversationController::class, 'toggleMute'])->name('conversations.mute');
        Route::post('/conversations/{conversation}/archive', [ConversationController::class, 'toggleArchive'])->name('conversations.archive');
        Route::delete('/conversations/{conversation}',       [ConversationController::class, 'destroy'])->name('conversations.destroy');

        // Block / Unblock
        Route::post('/block',   [ConversationController::class, 'blockUser'])->name('block');
        Route::post('/unblock', [ConversationController::class, 'unblockUser'])->name('unblock');

        // Messages
        Route::get('/conversations/{conversation}/messages',  [MessageController::class, 'index'])->name('messages.index');
        Route::post('/conversations/{conversation}/messages', [MessageController::class, 'store'])->name('messages.store');
        Route::put('/messages/{message}',                     [MessageController::class, 'update'])->name('messages.update');
        Route::delete('/messages/{message}',                  [MessageController::class, 'destroy'])->name('messages.destroy');

        // Reactions
        Route::post('/messages/{message}/react', [MessageController::class, 'react'])->name('messages.react');

        // Read receipts
        Route::post('/conversations/{conversation}/read', [MessageController::class, 'markRead'])->name('messages.read');

        // Typing indicator
        Route::post('/conversations/{conversation}/typing', [MessageController::class, 'typing'])->name('messages.typing');

        // Translate
        Route::post('/messages/{message}/translate', [MessageController::class, 'translate'])->name('messages.translate');

        // Media gallery
        Route::get('/conversations/{conversation}/media', [MessageController::class, 'media'])->name('messages.media');

        Route::post('/conversations/{conversation}/members', [ConversationController::class, 'addMember']);
        Route::delete('/conversations/{conversation}/members/{userId}', [ConversationController::class, 'removeMember']);
        Route::post('/conversations/{conversation}/group', [ConversationController::class, 'updateGroup']);
    });


    // Attendance
    Route::get('/payroll/attendance', [AttendanceRecordController::class, 'index']);
    Route::post('/payroll/attendance', [AttendanceRecordController::class, 'store']);
    Route::delete('/payroll/attendance/{attendanceRecord}', [AttendanceRecordController::class, 'destroy']);

    // Check in / out
    Route::get('/payroll/check-in-out-requests', [AttendanceRequestController::class, 'index']);
    Route::post('/payroll/check-in-out-requests', [AttendanceRequestController::class, 'store']);
    Route::patch('/payroll/check-in-out-requests/{id}/approve', [AttendanceRequestController::class, 'approve']);
    Route::patch('/payroll/check-in-out-requests/{id}/reject', [AttendanceRequestController::class, 'reject']);
    Route::delete('/payroll/check-in-out-requests/{attendanceRequest}', [AttendanceRequestController::class, 'destroy']);

    // Leave Management
    Route::get('/payroll/leaves', [LeaveRequestController::class, 'index']);
    Route::post('/payroll/leaves', [LeaveRequestController::class, 'store']);
    Route::patch('/payroll/leaves/{id}/approve', [LeaveRequestController::class, 'approve']);
    Route::patch('/payroll/leaves/{id}/reject',  [LeaveRequestController::class, 'reject']);
    Route::delete('/payroll/leaves/{id}', [LeaveRequestController::class, 'destroy']);


    // Overtime Requests
    Route::get('/payroll/overtimes', [OvertimeRequestController::class, 'index'])->name('payroll.overtimes.index');
    Route::post('/payroll/overtimes', [OvertimeRequestController::class, 'store'])->name('payroll.overtimes.store');
    Route::patch('/payroll/overtimes/{id}/approve', [OvertimeRequestController::class, 'approve'])->name('payroll.overtimes.approve');
    Route::patch('/payroll/overtimes/{id}/reject',  [OvertimeRequestController::class, 'reject'])->name('payroll.overtimes.reject');
    Route::delete('/payroll/overtimes/{id}',         [OvertimeRequestController::class, 'destroy'])->name('payroll.overtimes.destroy');


    // Expense Requests
    Route::get('/payroll/expenses',                          [ExpenseRequestController::class, 'index'])->name('payroll.expenses.index');
    Route::post('/payroll/expenses',                         [ExpenseRequestController::class, 'store'])->name('payroll.expenses.store');
    Route::patch('/payroll/expenses/{id}/approve',           [ExpenseRequestController::class, 'approve'])->name('payroll.expenses.approve');
    Route::patch('/payroll/expenses/{id}/reject',            [ExpenseRequestController::class, 'reject'])->name('payroll.expenses.reject');
    Route::delete('/payroll/expenses/{id}',                  [ExpenseRequestController::class, 'destroy'])->name('payroll.expenses.destroy');
    Route::get('/payroll/expenses/{id}/attachments/{index}', [ExpenseRequestController::class, 'downloadAttachment'])->name('payroll.expenses.attachment');

    // HR Policy
    Route::prefix('payroll/hr-policy')->name('hr-policy.')->group(function () {

        // Index
        Route::get('/', [HRPolicySetupController::class, 'index'])
            ->name('index');

        // Leave Policy
        Route::post('/leave-policy', [HRPolicySetupController::class, 'storeLeavePolicy'])
            ->name('leave-policy.store');
        Route::put('/leave-policy/{leavePolicy}', [HRPolicySetupController::class, 'updateLeavePolicy'])
            ->name('leave-policy.update');
        Route::delete('/leave-policy/{leavePolicy}', [HRPolicySetupController::class, 'destroyLeavePolicy'])
            ->name('leave-policy.destroy');

        // Overtime Policy
        Route::post('/overtime-policy', [HRPolicySetupController::class, 'storeOvertimePolicy'])
            ->name('overtime-policy.store');
        Route::put('/overtime-policy/{overtimePolicy}', [HRPolicySetupController::class, 'updateOvertimePolicy'])
            ->name('overtime-policy.update');
        Route::delete('/overtime-policy/{overtimePolicy}', [HRPolicySetupController::class, 'destroyOvertimePolicy'])
            ->name('overtime-policy.destroy');

        // Currency
        Route::post('/currency', [HRPolicySetupController::class, 'storeCurrency'])
            ->name('currency.store');
        Route::put('/currency/{currency}', [HRPolicySetupController::class, 'updateCurrency'])
            ->name('currency.update');
        Route::delete('/currency/{currency}', [HRPolicySetupController::class, 'destroyCurrency'])
            ->name('currency.destroy');

        // Deductions
        Route::post('/deduction', [HRPolicySetupController::class, 'storeDeduction'])
            ->name('deduction.store');
        Route::put('/deduction/{deduction}', [HRPolicySetupController::class, 'updateDeduction'])
            ->name('deduction.update');
        Route::delete('/deduction/{deduction}', [HRPolicySetupController::class, 'destroyDeduction'])
            ->name('deduction.destroy');

        // Allowances
        Route::post('/allowance', [HRPolicySetupController::class, 'storeAllowance'])
            ->name('allowance.store');
        Route::put('/allowance/{allowance}', [HRPolicySetupController::class, 'updateAllowance'])
            ->name('allowance.update');
        Route::delete('/allowance/{allowance}', [HRPolicySetupController::class, 'destroyAllowance'])
            ->name('allowance.destroy');

        // Salary Rule
        Route::post('/salary-rule', [HRPolicySetupController::class, 'saveSalaryRule'])
            ->name('salary-rule.save');
        Route::put('/salary-rule', [HRPolicySetupController::class, 'saveSalaryRule'])
            ->name('salary-rule.update');

        // Payroll Banks
        Route::post('/bank', [HRPolicySetupController::class, 'storeBank'])
            ->name('bank.store');
        Route::put('/bank/{bank}', [HRPolicySetupController::class, 'updateBank'])
            ->name('bank.update');
        Route::delete('/bank/{bank}', [HRPolicySetupController::class, 'destroyBank'])
            ->name('bank.destroy');

        // Public Holidays
        Route::post('/public-holiday', [HRPolicySetupController::class, 'storePublicHoliday'])
            ->name('public-holiday.store');
        Route::put('/public-holiday/{publicHoliday}', [HRPolicySetupController::class, 'updatePublicHoliday'])
            ->name('public-holiday.update');
        Route::delete('/public-holiday/{publicHoliday}', [HRPolicySetupController::class, 'destroyPublicHoliday'])
            ->name('public-holiday.destroy');
        
        // Bonus Types
        Route::post('/bonus-type', [HRPolicySetupController::class, 'storeBonusType'])
            ->name('bonus-type.store');
        Route::put('/bonus-type/{bonusType}', [HRPolicySetupController::class, 'updateBonusType'])
            ->name('bonus-type.update');
        Route::delete('/bonus-type/{bonusType}', [HRPolicySetupController::class, 'destroyBonusType'])
            ->name('bonus-type.destroy');

        // Bonus Schedules
        Route::post('/bonus-schedule', [HRPolicySetupController::class, 'storeBonusSchedule'])
            ->name('bonus-schedule.store');
        Route::put('/bonus-schedule/{bonusSchedule}', [HRPolicySetupController::class, 'updateBonusSchedule'])
            ->name('bonus-schedule.update');
        Route::delete('/bonus-schedule/{bonusSchedule}', [HRPolicySetupController::class, 'destroyBonusSchedule'])
            ->name('bonus-schedule.destroy');
    });

        // Payslip
    Route::get('/payroll/payslip', [PayslipController::class, 'index'])
        ->name('payroll.payslip.index');
    Route::get('/payroll/payslip/records', [PayslipController::class, 'records'])
        ->name('payroll.payslip.records');
    Route::get('/payroll/payslip/bulk/pdf', [PayslipController::class, 'bulkPdf'])
        ->name('payroll.payslip.bulk-pdf');
    Route::get('/payroll/payslip/bulk/excel', [PayslipController::class, 'bulkExcel'])
        ->name('payroll.payslip.bulk-excel');
    Route::get('/payroll/payslip/{payrollRecord}/pdf', [PayslipController::class, 'downloadPdf'])
        ->name('payroll.payslip.pdf');
    Route::get('/payroll/payslip/{payrollRecord}/excel', [PayslipController::class, 'downloadExcel'])
        ->name('payroll.payslip.excel');
    Route::get('/payroll/records/{payrollRecord}/show', [PayrollRecordController::class, 'show'])
        ->name('payroll.records.show');

    // ── Notifications ─────────────────────────────────────────
    Route::get   ('/notifications',          [NotificationController::class, 'index'])      ->name('notifications.index');
    Route::patch ('/notifications/{notification}/read', [NotificationController::class, 'markRead'])   ->name('notifications.read');
    Route::patch ('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
                    
});




// Management & Admin only
Route::middleware(['auth', 'role:admin,management'])->prefix('admin')->name('admin.')->group(function () {

    // Projects CRUD
    Route::resource('projects', ProjectController::class);

    // Assignments
    Route::prefix('assignments')->name('assignments.')->group(function () {
        Route::get('/', [ProjectAssignmentController::class, 'index'])->name('index');
        Route::post('/', [ProjectAssignmentController::class, 'store'])->name('store');
        Route::put('/{projectAssignment}', [ProjectAssignmentController::class, 'update'])->name('update');
        Route::delete('/{projectAssignment}', [ProjectAssignmentController::class, 'destroy'])->name('destroy');

        // Availability dashboard
        Route::get('/availability', [ProjectAssignmentController::class, 'availability'])->name('availability');
    });

});

// Employee — ကိုယ့် assignments သာကြည့်နိုင်
Route::middleware(['auth', 'role:employee'])->group(function () {
    Route::get('/my-assignments', [ProjectAssignmentController::class, 'myAssignments'])->name('my.assignments');
});


Route::middleware(['auth', 'role:hr'])->group(function () {
    Route::get('/payroll/employee-salary', [EmployeePayrollProfileController::class, 'page'])
        ->name('payroll.employee-salary');
    Route::post('/payroll/employee-profiles', [EmployeePayrollProfileController::class, 'store'])
        ->name('payroll.employee-profiles.store');
    Route::put('/payroll/employee-profiles/{employeePayrollProfile}', [EmployeePayrollProfileController::class, 'update'])
        ->name('payroll.employee-profiles.update');
    Route::delete('/payroll/employee-profiles/{employeePayrollProfile}', [EmployeePayrollProfileController::class, 'destroy'])
        ->name('payroll.employee-profiles.destroy');
});


Route::middleware(['auth', 'role:hr'])->group(function () {
 
    // Payroll Records Page (Inertia)
    Route::get('/payroll/records', [PayrollRecordController::class, 'page'])
        ->name('payroll.records.index');
 
    // Calculate
    Route::post('/payroll/records/calculate-single', [PayrollRecordController::class, 'calculateSingle'])
        ->name('payroll.records.calculate-single');
    Route::get('/payroll/records/calculate-all', [PayrollRecordController::class, 'calculateAll'])
        ->name('payroll.records.calculate-all');
 
    // Preview
    Route::get('/payroll/records/preview', [PayrollRecordController::class, 'preview'])
        ->name('payroll.records.preview');
 
    // Approve
    Route::patch('/payroll/records/approve-all', [PayrollRecordController::class, 'approveAll'])
        ->name('payroll.records.approve-all');
    Route::patch('/payroll/records/{payrollRecord}/approve', [PayrollRecordController::class, 'approve'])
        ->name('payroll.records.approve');
 
    // Bonus
    Route::post('/payroll/records/{payrollRecord}/bonus', [PayrollRecordController::class, 'addBonus'])
        ->name('payroll.records.add-bonus');
    Route::delete('/payroll/records/{payrollRecord}/bonuses/{payrollBonus}', [PayrollRecordController::class, 'removeBonus'])
        ->name('payroll.records.remove-bonus');
 
    // Attendance Import
    Route::get('/payroll/attendance/template', [AttendanceImportController::class, 'downloadTemplate'])
        ->name('payroll.attendance.template');
    Route::post('/payroll/attendance/import', [AttendanceImportController::class, 'import'])
        ->name('payroll.attendance.import');
    Route::get('/payroll/attendance/period-info', [AttendanceImportController::class, 'periodInfo'])
        ->name('payroll.attendance.period-info');

    Route::patch('/payroll/records/confirm-all', [PayrollRecordController::class, 'confirmAll'])
        ->name('payroll.records.confirm-all');
    Route::patch('/payroll/records/{payrollRecord}/confirm', [PayrollRecordController::class, 'confirm'])
        ->name('payroll.records.confirm');


    Route::get('/payroll/export',         [BankExportController::class, 'index']);
    Route::get('/payroll/export/preview', [BankExportController::class, 'preview']);
    Route::get('/payroll/export/excel',   [BankExportController::class, 'exportExcel']);
    Route::get('/payroll/export/pdf',     [BankExportController::class, 'exportPdf']);
    Route::patch('/payroll/export/mark-paid/{record}',  [BankExportController::class, 'markAsPaid'])
        ->name('payroll.export.mark-paid');

    Route::patch('/payroll/export/mark-all-paid', [BankExportController::class, 'markAllPaid'])
        ->name('payroll.export.mark-all-paid');
    Route::post('/payroll/export/send-to-bank', [BankExportController::class, 'sendToBank'])
            ->name('payroll.export.send-to-bank');
});
 