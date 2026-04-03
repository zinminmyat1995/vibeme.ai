<?php

namespace Database\Seeders;

use App\Models\BrycenOffice;
use Illuminate\Database\Seeder;

class BrycenOfficeSeeder extends Seeder
{
    public function run(): void
    {
        $offices = [
            [
                'country_key'    => 'myanmar',
                'country_name'   => 'Myanmar',
                'company_name'   => 'Brycen Myanmar',
                'city'           => 'Yangon',
                'address'        => 'No. 47, Strand Road, Kyauktada Township, Yangon, Myanmar',
                'email'          => 'support@brycenmyanmar.com.mm',
                'phone'          => '(+95) 09254045384, 09459943645',
                'website_url'    => 'https://brycenmyanmar.com.mm',
                'map_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3818.9!2d96.1511!3d16.7967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDQ3JzQ4LjIiTiA5NsKwMDknMDMuNiJF!5e0!3m2!1sen!2smm!4v1000000000000',
                'image_path'     => 'images/brycen/myanmar.jpg',
                'about'          => 'Brycen Myanmar is a leading IT solutions provider based in Yangon, delivering innovative software development, consulting, and system integration services. As part of the Brycen Group, we bridge Japanese quality with local expertise to empower businesses across Myanmar with cutting-edge technology.',
                'founded'        => '2015',
                'specialization' => 'Software Development, IT Consulting, System Integration',
                'is_active'      => true,
            ],
            [
                'country_key'    => 'cambodia',
                'country_name'   => 'Cambodia',
                'company_name'   => 'Brycen Cambodia',
                'city'           => 'Phnom Penh',
                'address'        => 'Vattanac Capital Tower, Floor 18, No. 66, Monivong Blvd, Phnom Penh, Cambodia',
                'email'          => 'info@brycen-cambodia.com',
                'phone'          => '+855 23 123 456',
                'website_url'    => 'https://brycen-cambodia.com',
                'map_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.9!2d104.9282!3d11.5564!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDMzJzIzLjAiTiAxMDTCsDU1JzQxLjUiRQ!5e0!3m2!1sen!2skh!4v1000000000001',
                'image_path'     => 'images/brycen/cambodia.jpg',
                'about'          => 'Brycen Cambodia operates from the heart of Phnom Penh, providing world-class IT services and digital transformation solutions. We specialize in enterprise software development, cloud infrastructure, and IT consulting, helping Cambodian businesses scale through technology.',
                'founded'        => '2017',
                'specialization' => 'Enterprise Software, Cloud Solutions, Digital Transformation',
                'is_active'      => true,
            ],
            [
                'country_key'    => 'japan',
                'country_name'   => 'Japan',
                'company_name'   => 'Brycen Japan',
                'city'           => 'Tokyo',
                'address'        => '〒160-0023 東京都新宿区西新宿1-26-2 新宿野村ビル32F',
                'email'          => 'info@brycen.co.jp',
                'phone'          => '+81 3-5909-3939',
                'website_url'    => 'https://www.brycen.co.jp',
                'map_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.9!2d139.6917!3d35.6895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDQxJzIyLjIiTiAxMznCsDQxJzMwLjEiRQ!5e0!3m2!1sen!2sjp!4v1000000000002',
                'image_path'     => 'images/brycen/japan.jpg',
                'about'          => 'Brycen Japan is the headquarters of the Brycen Group, headquartered in Shinjuku, Tokyo. With decades of experience in IT engineering and consulting, Brycen Japan leads innovation across the Asia-Pacific region. We develop high-quality systems for enterprise clients and drive digital transformation initiatives globally.',
                'founded'        => '1995',
                'specialization' => 'IT Engineering, System Development, Global Consulting',
                'is_active'      => true,
            ],
            [
                'country_key'    => 'vietnam',
                'country_name'   => 'Vietnam',
                'company_name'   => 'Brycen Vietnam',
                'city'           => 'Ho Chi Minh City',
                'address'        => 'Saigon Trade Center, 37 Ton Duc Thang, Ben Nghe Ward, District 1, Ho Chi Minh City, Vietnam',
                'email'          => 'info@brycen-vietnam.com',
                'phone'          => '+84 28 3822 1234',
                'website_url'    => 'https://brycen-vietnam.com',
                'map_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.9!2d106.7044!3d10.7769!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzM3LjAiTiAxMDbCsDQyJzE1LjkiRQ!5e0!3m2!1sen!2svn!4v1000000000003',
                'image_path'     => 'images/brycen/vietnam.jpg',
                'about'          => 'Brycen Vietnam is a dynamic IT company based in Ho Chi Minh City, delivering offshore development services, mobile applications, and enterprise solutions. Combining Japanese precision with Vietnamese engineering talent, we deliver exceptional quality to clients across Asia and beyond.',
                'founded'        => '2016',
                'specialization' => 'Offshore Development, Mobile Apps, Enterprise Solutions',
                'is_active'      => true,
            ],
            [
                'country_key'    => 'korea',
                'country_name'   => 'South Korea',
                'company_name'   => 'Brycen Korea',
                'city'           => 'Seoul',
                'address'        => 'Gangnam-daero 396, Gangnam-gu, Seoul, South Korea',
                'email'          => 'info@brycen-korea.com',
                'phone'          => '+82 2-1234-5678',
                'website_url'    => 'https://brycen-korea.com',
                'map_embed_url'  => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3165.9!2d127.0276!3d37.4979!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDI5JzUyLjQiTiAxMjfCsDAxJzM5LjQiRQ!5e0!3m2!1sen!2skr!4v1000000000004',
                'image_path'     => 'images/brycen/korea.jpg',
                'about'          => 'Brycen Korea is strategically located in the heart of Seoul\'s tech hub, Gangnam. We provide cutting-edge IT solutions, AI integration, and software engineering services. As part of the global Brycen network, we leverage Korea\'s world-class tech ecosystem to deliver next-generation digital solutions.',
                'founded'        => '2018',
                'specialization' => 'AI Integration, Software Engineering, Digital Innovation',
                'is_active'      => true,
            ],
        ];

        foreach ($offices as $office) {
            BrycenOffice::updateOrCreate(
                ['country_key' => $office['country_key']],
                $office
            );
        }
    }
}