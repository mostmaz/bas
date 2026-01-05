-- Create reviews table
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id text not null,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.reviews enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.reviews
  for select using (true);

create policy "Enable insert access for all users" on public.reviews
  for insert with check (true);
