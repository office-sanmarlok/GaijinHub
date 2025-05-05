# Supabaseデータベーススキーマ

## avatars テーブル
- `id`: uuid PRIMARY KEY
- `user_id`: uuid (references auth.users.id)
- `avatar_path`: text
- `created_at`: timestamp with time zone

## favorites テーブル
- `id`: uuid PRIMARY KEY
- `user_id`: uuid (references auth.users.id)
- `listing_id`: uuid (references listings.id)
- `created_at`: timestamp with time zone

## images テーブル
- `id`: uuid PRIMARY KEY
- `listing_id`: uuid (references listings.id)
- `path`: text
- `order`: integer
- `created_at`: timestamp with time zone

## listings テーブル
- `id`: uuid PRIMARY KEY
- `user_id`: uuid (references auth.users.id)
- `category`: text
- `title`: text
- `body`: text
- `price`: numeric
- `city`: text
- `has_location`: boolean
- `is_city_only`: boolean
- `municipality_id`: uuid (references to tokyo_municipalities.id はないが想定されている)
- `station_id`: uuid (references to tokyo_station_groups.id はないが想定されている)
- `tag`: text[] (配列)
- `lat`: float8
- `lng`: float8
- `point`: geometry (point)
- `created_at`: timestamp with time zone
- `map_image_url`: text

## tokyo_lines テーブル
- `line_code`: varchar PRIMARY KEY
- `operator_ja`: varchar
- `operator_en`: varchar
- `line_ja`: varchar
- `line_en`: varchar
- `created_at`: timestamp with time zone

## tokyo_station_line_relations テーブル
- `id`: uuid PRIMARY KEY
- `station_group_id`: varchar (references tokyo_station_groups.id)
- `line_code`: varchar (references tokyo_lines.line_code)
- `created_at`: timestamp with time zone

## tokyo_station_groups テーブル
- `id`: varchar PRIMARY KEY
- `name_kanji`: varchar
- `name_kana`: varchar
- `name_romaji`: varchar
- `municipality_id`: varchar (references tokyo_municipalities.id)
- `lat`: float8
- `lon`: float8
- `created_at`: timestamp with time zone

## tokyo_municipalities テーブル
- `id`: varchar PRIMARY KEY
- `prefecture`: varchar
- `name`: varchar
- `hurigana`: varchar
- `created_at`: timestamp with time zone