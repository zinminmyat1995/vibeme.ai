<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\ExpenseRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ExpenseRequestController extends Controller
{
    // ─────────────────────────────────────────────────────────
    //  INDEX
    // ─────────────────────────────────────────────────────────
    public function index(Request $request)
    {
        $user       = Auth::user();
        $roleName   = $user->role?->name;
        $canViewAll = in_array($roleName, ['hr', 'admin']);

        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year',  now()->year);

        // ── Main list query ──────────────────────────────────
        $query = ExpenseRequest::with([
            'user:id,name,avatar_url,position,department',
            'approver:id,name,avatar_url,role_id',
            'approver.role:id,name',
            'approvedBy:id,name',
        ])->latest();

        if ($canViewAll) {
            $query->whereHas('user', fn($q) => $q->where('country_id', $user->country_id));
        } else {
            $query->where('user_id', $user->id);
        }

        $query->whereMonth('expense_date', $month)
              ->whereYear('expense_date',  $year);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // ── Pending approvals count (for tab badge) ──────────
        $pendingCount = ExpenseRequest::where('approver_id', $user->id)
            ->where('status', 'pending')
            ->count();

        // ── Approver list — role-based ───────────────────────
        // Employee / Management → HR only
        // HR                   → Admin only
        // Admin                → no approver needed (auto-approve)
        $approvers = collect();

        if (!in_array($roleName, ['admin'])) {
            $approverRoles = match($roleName) {
                'hr'    => ['admin'],
                default => ['hr'],          // employee, management → HR only
            };

            $approvers = User::whereHas('role', fn($q) =>
                    $q->whereIn('name', $approverRoles)
                )
                ->where('country_id', $user->country_id)
                ->where('is_active', true)
                ->with('role:id,name')
                ->select('id', 'name', 'avatar_url', 'role_id')
                ->get();
        }

        // ── Stats — month/year filtered (except Unreimbursed) ─
        $statsBase = ExpenseRequest::whereHas('user', fn($q) =>
            $q->where('country_id', $user->country_id)
        );
        if (!$canViewAll) {
            $statsBase->where('user_id', $user->id);
        }

        // Month-filtered clone
        $sf = (clone $statsBase)
            ->whereMonth('expense_date', $month)
            ->whereYear('expense_date',  $year);

        // Unreimbursed = ALL TIME (no month filter)
        $unreimbursed = (clone $statsBase)
            ->where('status', 'approved')
            ->whereNull('reimbursed_at')
            ->sum('amount');

        $stats = [
            'total'        => (clone $sf)->count(),
            'pending'      => (clone $sf)->where('status', 'pending')->count(),
            'approved'     => (clone $sf)->where('status', 'approved')->count(),
            'rejected'     => (clone $sf)->where('status', 'rejected')->count(),
            'total_amount' => $unreimbursed,   // all-time outstanding
        ];

        return Inertia::render('Payroll/ExpenseRequest/Index', [
            'requests'      => $query->paginate(20),
            'approvers'     => $approvers->values(),
            'stats'         => $stats,
            'pendingCount'  => $pendingCount,
            'canViewAll'    => $canViewAll,
            'filters'       => $request->only(['status', 'month', 'year']),
            'selectedMonth' => $month,
            'selectedYear'  => $year,
            'categories'    => ExpenseRequest::CATEGORIES,
            'userRole'      => $roleName,
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  STORE
    // ─────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $user     = Auth::user();
        $roleName = $user->role?->name;
        $isAdmin  = $roleName === 'admin';

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'description'   => 'nullable|string|max:1000',
            'amount'        => 'required|numeric|min:0.01|max:999999',
            'category'      => 'required|in:' . implode(',', array_keys(ExpenseRequest::CATEGORIES)),
            'expense_date'  => 'required|date|before_or_equal:today',
            'approver_id'   => $isAdmin ? 'nullable' : 'required|exists:users,id',
            'attachments'   => 'nullable|array|max:5',
            'attachments.*' => 'file|max:10240|mimes:jpg,jpeg,png,gif,webp,pdf,doc,docx,xls,xlsx',
        ], [
            'expense_date.before_or_equal' => 'Expense date cannot be in the future.',
            'amount.min'                   => 'Amount must be greater than 0.',
            'approver_id.required'         => 'Please select an approver.',
            'attachments.*.mimes'          => 'Only images, PDF, Word, and Excel files allowed.',
            'attachments.*.max'            => 'Each file must be under 10MB.',
        ]);

        // ── Validate approver role matches allowed roles ──────
        if (!$isAdmin && !empty($validated['approver_id'])) {
            $allowedRoles = match($roleName) {
                'hr'    => ['admin'],
                default => ['hr'],
            };
            $approverOk = User::where('id', $validated['approver_id'])
                ->whereHas('role', fn($q) => $q->whereIn('name', $allowedRoles))
                ->where('country_id', $user->country_id)
                ->exists();

            if (!$approverOk) {
                return response()->json([
                    'errors' => ['approver_id' => 'Invalid approver selected.']
                ], 422);
            }
        }

        // ── Currency from salary rule ─────────────────────────
        $salaryRule = \App\Models\SalaryRule::with('currency')
            ->where('country_id', $user->country_id)
            ->first();
        $currency = $salaryRule?->currency?->currency_code ?? 'USD';

        // ── Handle file uploads ───────────────────────────────
        $attachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('expenses/' . now()->format('Y/m'), 'public');
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $this->formatFileSize($file->getSize()),
                    'type' => $file->getMimeType(),
                    'url'  => Storage::url($path),
                ];
            }
        }

        // ── Admin → auto approve; others → pending ────────────
        $status     = $isAdmin ? 'approved' : 'pending';
        $approvedBy = $isAdmin ? $user->id  : null;
        $approvedAt = $isAdmin ? now()       : null;

        $expense = ExpenseRequest::create([
            'user_id'      => $user->id,
            'approver_id'  => $isAdmin ? null : ($validated['approver_id'] ?? null),
            'title'        => $validated['title'],
            'description'  => $validated['description'] ?? null,
            'amount'       => $validated['amount'],
            'currency'     => $currency,
            'category'     => $validated['category'],
            'expense_date' => $validated['expense_date'],
            'attachments'  => $attachments ?: null,
            'status'       => $status,
            'approved_by'  => $approvedBy,
            'approved_at'  => $approvedAt,
        ]);

        // ── Notify approver ───────────────────────────────────
        if (!$isAdmin && !empty($validated['approver_id'])) {
            Notification::send(
                userId: $validated['approver_id'],
                type:   'expense_request',
                title:  'New Expense Request',
                body:   "{$user->name} submitted an expense request \"{$expense->title}\" for {$currency} {$expense->amount}.",
                url:    '/payroll/expenses',
                data:   [
                    'requester_id'   => $user->id,
                    'requester_name' => $user->name,
                    'expense_id'     => $expense->id,
                    'amount'         => $expense->amount,
                    'currency'       => $currency,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => $isAdmin
                ? 'Expense submitted and auto-approved.'
                : 'Expense request submitted successfully.',
        ]);
    }

    // ─────────────────────────────────────────────────────────
    //  APPROVE
    // ─────────────────────────────────────────────────────────
    public function approve(Request $request, int $id)
    {
        $expense = ExpenseRequest::with('user')->find($id);

        if (!$expense) {
            return back()->with('error', 'Request no longer exists.');
        }
        if ($expense->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        $user     = Auth::user();
        $roleName = $user->role?->name;

        $canApprove = in_array($roleName, ['hr', 'admin'])
            || $expense->approver_id === $user->id;

        if (!$canApprove) abort(403, 'Unauthorized.');

        $validated = $request->validate([
            'hr_note' => 'nullable|string|max:500',
        ]);

        $expense->update([
            'status'      => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'hr_note'     => $validated['hr_note'] ?? null,
        ]);

        Notification::send(
            userId: $expense->user_id,
            type:   'expense_approved',
            title:  'Expense Request Approved',
            body:   "Your expense request \"{$expense->title}\" ({$expense->currency} {$expense->amount}) has been approved.",
            url:    '/payroll/expenses',
            data:   ['expense_id' => $expense->id]
        );

        return back()->with('success', 'Expense request approved.');
    }

    // ─────────────────────────────────────────────────────────
    //  REJECT
    // ─────────────────────────────────────────────────────────
    public function reject(Request $request, int $id)
    {
        $expense = ExpenseRequest::with('user')->find($id);

        if (!$expense) {
            return back()->with('error', 'Request no longer exists.');
        }
        if ($expense->status !== 'pending') {
            return back()->with('error', 'This request is already processed.');
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ], [
            'rejection_reason.required' => 'Please provide a reason for rejection.',
        ]);

        $expense->update([
            'status'           => 'rejected',
            'approved_by'      => Auth::id(),
            'approved_at'      => now(),
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        Notification::send(
            userId: $expense->user_id,
            type:   'expense_rejected',
            title:  'Expense Request Rejected',
            body:   "Your expense request \"{$expense->title}\" has been rejected. Reason: {$validated['rejection_reason']}",
            url:    '/payroll/expenses',
            data:   ['expense_id' => $expense->id]
        );

        return back()->with('success', 'Expense request rejected.');
    }

    // ─────────────────────────────────────────────────────────
    //  DESTROY
    // ─────────────────────────────────────────────────────────
    public function destroy(int $id)
    {
        $expense = ExpenseRequest::find($id);

        if (!$expense) {
            return back()->with('error', 'Request no longer exists.');
        }
        if ((int) $expense->user_id !== (int) Auth::id()) {
            abort(403);
        }
        if ($expense->status !== 'pending') {
            return back()->with('error', 'Only pending requests can be deleted.');
        }

        if ($expense->attachments) {
            foreach ($expense->attachments as $file) {
                if (Storage::disk('public')->exists($file['path'])) {
                    Storage::disk('public')->delete($file['path']);
                }
            }
        }

        $expense->delete();
        return back()->with('success', 'Expense request deleted.');
    }

    // ─────────────────────────────────────────────────────────
    //  DOWNLOAD ATTACHMENT
    // ─────────────────────────────────────────────────────────
    public function downloadAttachment(int $id, int $index)
    {
        $expense = ExpenseRequest::findOrFail($id);
        $user    = Auth::user();

        $canView = $expense->user_id === $user->id
            || in_array($user->role?->name, ['hr', 'admin']);

        if (!$canView) abort(403);

        $attachments = $expense->attachments ?? [];
        if (!isset($attachments[$index])) abort(404, 'Attachment not found.');

        $file = $attachments[$index];
        $path = Storage::disk('public')->path($file['path']);

        if (!file_exists($path)) abort(404, 'File not found.');

        return response()->download($path, $file['name']);
    }

    // ─────────────────────────────────────────────────────────
    //  HELPERS
    // ─────────────────────────────────────────────────────────
    private function formatFileSize(int $bytes): string
    {
        if ($bytes < 1024)    return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }
}