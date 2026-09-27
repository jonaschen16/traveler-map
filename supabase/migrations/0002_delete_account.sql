-- Traveler Map: let signed-in users delete their own account.
-- Deleting the auth user cascades to profiles, spots and spot_contents.
-- Run once in Supabase Dashboard -> SQL Editor.

create function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
