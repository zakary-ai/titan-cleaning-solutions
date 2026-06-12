
DO $$
DECLARE
  v_admin_id uuid;
  v_super_id uuid;
  v_client_id uuid;
  v_password text := 'Titan!2026';
  v_hashed text;
BEGIN
  v_hashed := crypt(v_password, gen_salt('bf'));

  -- Admin
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'testadmin@titansolutionsco.com';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'testadmin@titansolutionsco.com', v_hashed, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','Test Admin','invited_role','admin','password_set',false),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'testadmin@titansolutionsco.com', 'email_verified', true),
      'email', v_admin_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = v_hashed, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
      WHERE id = v_admin_id;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, organization_name)
    VALUES (v_admin_id, 'testadmin@titansolutionsco.com', 'Test Admin', NULL)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

  -- Supervisor
  SELECT id INTO v_super_id FROM auth.users WHERE email = 'testsupervisor@titansolutionsco.com';
  IF v_super_id IS NULL THEN
    v_super_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_super_id, 'authenticated', 'authenticated',
      'testsupervisor@titansolutionsco.com', v_hashed, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','Test Supervisor','invited_role','supervisor','password_set',false),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_super_id,
      jsonb_build_object('sub', v_super_id::text, 'email', 'testsupervisor@titansolutionsco.com', 'email_verified', true),
      'email', v_super_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = v_hashed, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
      WHERE id = v_super_id;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, organization_name)
    VALUES (v_super_id, 'testsupervisor@titansolutionsco.com', 'Test Supervisor', NULL)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_super_id, 'supervisor')
    ON CONFLICT (user_id, role) DO NOTHING;

  -- Client
  SELECT id INTO v_client_id FROM auth.users WHERE email = 'testclient@titansolutionsco.com';
  IF v_client_id IS NULL THEN
    v_client_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_client_id, 'authenticated', 'authenticated',
      'testclient@titansolutionsco.com', v_hashed, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name','Test Client','invited_role','client','password_set',false),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_client_id,
      jsonb_build_object('sub', v_client_id::text, 'email', 'testclient@titansolutionsco.com', 'email_verified', true),
      'email', v_client_id::text, now(), now(), now());
  ELSE
    UPDATE auth.users SET encrypted_password = v_hashed, email_confirmed_at = COALESCE(email_confirmed_at, now()), updated_at = now()
      WHERE id = v_client_id;
  END IF;
  INSERT INTO public.profiles (id, email, full_name, organization_name)
    VALUES (v_client_id, 'testclient@titansolutionsco.com', 'Test Client', NULL)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_client_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;
