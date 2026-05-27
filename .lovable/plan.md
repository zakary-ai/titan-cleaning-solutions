## Fix: logins hang on the loading spinner

### Root cause
After sign-in, `useAuth` queries `user_roles` and `profiles`. Both tables' RLS policies call `public.has_role(...)` (and related helpers). Those functions were created without `GRANT EXECUTE`, so PostgREST returns `42501 permission denied for function has_role` for every request — visible in the current network log. With the queries failing, `loading` never resolves to a usable role and `_authenticated/route.tsx` keeps showing the spinner.

### Change
One migration granting EXECUTE on the three SECURITY DEFINER helpers to `authenticated` (and `anon` where policies may run pre-auth):

```sql
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_assigned_to_property(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_can_see_property(uuid, uuid) TO authenticated;
```

No code changes. No RLS policy changes. No other files touched.

### Verification
After the migration, retry sign-in with `admin@titan.test` — the `user_roles` and `profiles` requests should return 200 and the app should route to `/admin`.
