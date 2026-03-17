<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',      'display_name' => 'Administrator'],
            ['name' => 'hr',         'display_name' => 'HR Manager'],
            ['name' => 'management', 'display_name' => 'Management'],
            ['name' => 'employee',   'display_name' => 'Employee'],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::create($role);
        }
    }
}
