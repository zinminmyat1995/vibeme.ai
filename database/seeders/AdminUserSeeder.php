<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = \App\Models\Role::where('name', 'admin')->first();

        \App\Models\User::create([
            'name'     => 'Admin',
            'email'    => 'admin@vibeme.ai',
            'password' => bcrypt('123456'),
            'role_id'  => $adminRole->id,
        ]);
    }
}
