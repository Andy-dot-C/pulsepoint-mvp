alter table public.poll_submissions
add column if not exists end_at timestamptz;
