<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = \App\Models\Role::where('name', 'admin')->first();

        \App\Models\User::updateOrCreate(
            ['email' => 'admin@vibeme.ai'],          // ← ဒါနဲ့ ရှာမယ်
            [
                'name'     => 'Admin',
                'password' => bcrypt('123456'),
                'role_id'  => $adminRole->id,
            ]
        );
    }
}