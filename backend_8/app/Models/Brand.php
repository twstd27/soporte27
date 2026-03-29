<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends Model {
    use SoftDeletes;
    protected $fillable = ['name'];
    public function tickets(): HasMany { return $this->hasMany(SupportTicket::class, 'brand_id'); }
}
