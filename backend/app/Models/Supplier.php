<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model {
    use SoftDeletes;
    protected $fillable = ['name', 'contact_name', 'phone', 'email'];
    public function spareParts(): HasMany { return $this->hasMany(SparePart::class, 'supplier_id'); }
}
