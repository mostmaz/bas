-- Create search_terms table
create table public.search_terms (
  id uuid default gen_random_uuid() primary key,
  term text not null unique,
  count integer default 1,
  last_searched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.search_terms enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.search_terms
  for select using (true);

create policy "Enable insert/update access for all users" on public.search_terms
  for all using (true);
