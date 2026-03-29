<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportType extends Model {
    use SoftDeletes;
    protected $fillable = ['name', 'description'];
    public function tickets(): HasMany { return $this->hasMany(SupportTicket::class, 'support_type_id'); }
}
