<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyQuestion extends Model
{
    protected $fillable = [
        'survey_id', 'order', 'question', 'type',
        'options', 'is_required',
        'depends_on_question_id', 'depends_on_answer',
    ];

    protected $casts = [
        'options'      => 'array',
        'is_required'  => 'boolean',
    ];

    // ── Relations ──────────────────────────
    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    public function dependsOn()
    {
        return $this->belongsTo(SurveyQuestion::class, 'depends_on_question_id');
    }

    public function dependents()
    {
        return $this->hasMany(SurveyQuestion::class, 'depends_on_question_id');
    }

    // ── Helpers ────────────────────────────
    public function hasCondition(): bool
    {
        return !is_null($this->depends_on_question_id);
    }

    public function isChoiceType(): bool
    {
        return in_array($this->type, ['single_choice', 'multi_choice', 'yes_no']);
    }

    public function getDefaultOptions(): array
    {
        return match($this->type) {
            'yes_no' => ['Yes', 'No'],
            'rating' => ['1', '2', '3', '4', '5'],
            default  => $this->options ?? [],
        };
    }
}