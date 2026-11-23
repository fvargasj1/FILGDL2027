-- Sage LAB 2026 - Cartas sobre la mesa
-- Ejecutar una vez en Supabase: SQL Editor > New query > pegar > Run.

create table if not exists public.sesion (
  id          text primary key,
  estado      jsonb not null default '{}'::jsonb,
  version     integer not null default 0,
  actualizado timestamptz not null default now()
);

-- Fila de la sesión del evento. La app la llena con la lista de asistentes al abrirse por primera vez.
insert into public.sesion (id) values ('lab-2026') on conflict (id) do nothing;

-- Seguridad: los celulares usan la clave pública (anon). Solo pueden leer y actualizar esta fila.
alter table public.sesion enable row level security;

drop policy if exists "leer sesion lab" on public.sesion;
create policy "leer sesion lab" on public.sesion for select to anon using (id = 'lab-2026');

drop policy if exists "actualizar sesion lab" on public.sesion;
create policy "actualizar sesion lab" on public.sesion for update to anon using (id = 'lab-2026') with check (id = 'lab-2026');

-- Tiempo real: avisar a todos los celulares cuando la fila cambia.
alter table public.sesion replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.sesion;
exception when duplicate_object then null; end $$;

-- Para empezar de cero después de las pruebas (o usar "Reiniciar toda la sesión" en el panel):
-- update public.sesion set estado = '{}'::jsonb, version = version + 1 where id = 'lab-2026';
