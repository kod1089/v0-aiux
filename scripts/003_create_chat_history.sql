-- 003_create_chat_history.sql
-- Chat sessions and messages for AI history persistence

-- Chat sessions table
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New Chat',
  chat_type text not null default 'prompt-engine' check (chat_type in ('prompt-engine', 'automation', 'general')),
  model text default 'anthropic/claude-sonnet-4-20250514',
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index if not exists idx_chat_sessions_created_at on public.chat_sessions(created_at desc);
create index if not exists idx_chat_messages_session_id on public.chat_messages(session_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);

-- Enable RLS
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Chat sessions policies
create policy "chat_sessions_select_own" on public.chat_sessions 
  for select using (auth.uid() = user_id);

create policy "chat_sessions_insert_own" on public.chat_sessions 
  for insert with check (auth.uid() = user_id);

create policy "chat_sessions_update_own" on public.chat_sessions 
  for update using (auth.uid() = user_id);

create policy "chat_sessions_delete_own" on public.chat_sessions 
  for delete using (auth.uid() = user_id);

-- Chat messages policies (via session ownership)
create policy "chat_messages_select_own" on public.chat_messages 
  for select using (
    exists (
      select 1 from public.chat_sessions 
      where id = chat_messages.session_id 
      and user_id = auth.uid()
    )
  );

create policy "chat_messages_insert_own" on public.chat_messages 
  for insert with check (
    exists (
      select 1 from public.chat_sessions 
      where id = chat_messages.session_id 
      and user_id = auth.uid()
    )
  );

create policy "chat_messages_delete_own" on public.chat_messages 
  for delete using (
    exists (
      select 1 from public.chat_sessions 
      where id = chat_messages.session_id 
      and user_id = auth.uid()
    )
  );

-- Updated_at trigger for sessions
create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row
  execute function public.handle_updated_at();
