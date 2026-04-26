<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrAlert extends Model
{
    protected $fillable = [
        'country_id', 'user_id', 'type', 'trigger_count',
        'letter_draft', 'status', 'actioned_by', 'actioned_at',
        'alert_month', 'alert_year',
    ];

    protected $casts = [
        'actioned_at' => 'datetime',
    ];

    public function user()    { return $this->belongsTo(User::class); }
    public function country() { return $this->belongsTo(Country::class); }
    public function actionedBy() { return $this->belongsTo(User::class, 'actioned_by'); }

    public function isPending()   { return $this->status === 'pending'; }
    public function isSent()      { return $this->status === 'sent'; }
    public function isDismissed() { return $this->status === 'dismissed'; }
    public function actionedByUser()
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }
}