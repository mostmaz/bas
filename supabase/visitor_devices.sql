-- Create visitor_devices table
create table public.visitor_devices (
  id uuid default gen_random_uuid() primary key,
  device_name text not null unique,
  visit_count integer default 1,
  last_visit timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.visitor_devices enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.visitor_devices
  for select using (true);

create policy "Enable insert/update access for all users" on public.visitor_devices
  for all using (true);
