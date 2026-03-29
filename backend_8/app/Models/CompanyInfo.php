<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyInfo extends Model
{
    protected $table = 'company_info';

    protected $fillable = [
        'name', 'tax_id', 'address', 'phone', 'email',
        'website', 'logo_path', 'description',
    ];
}
