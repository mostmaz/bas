-- Add views column to products table
alter table public.products 
add column if not exists views integer default 0;
