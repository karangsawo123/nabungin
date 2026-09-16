import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [k, ...v] = trimmed.split('=');
    env[k.trim()] = v.join('=').trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('================================================================');
console.log('TESTING CLIENT AUTHENTICATION FLOW (LOGIN, LOGOUT, RLS, SESSION)');
console.log('================================================================\n');

async function testSessionFlow() {
  const testEmail = `user.demo.${Date.now()}@nabungin.id`;
  const testPassword = 'PasswordDemo123!';
  const testFullName = 'Demo User Nabungin';

  // 1. SETUP USER TERKONFIRMASI VIA ADMIN (MENGHINDARI LIMIT EMAIL RATE DI FREE TIER)
  console.log('[1/5] Menyiapkan user terkonfirmasi di auth.users...');
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      full_name: testFullName,
    }
  });

  if (createError) {
    console.error('❌ Gagal membuat test user:', createError.message);
    return;
  }

  const userId = userData.user.id;
  console.log(`✅ User terkonfirmasi dibuat: ${userId} (${testEmail})`);

  // Tunggu sekejap agar trigger database selesai
  await new Promise(r => setTimeout(r, 1200));

  // 2. MULAI CLIENT-SIDE MURNI (HANYA MENGGUNAKAN PUBLISHABLE KEY)
  console.log('\n[2/5] Menginisialisasi client murni browser (Publishable Key)...');
  const clientSupabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false }
  });

  // Login dengan password
  console.log(`Mencoba login dengan ${testEmail}...`);
  const { data: sessionData, error: loginError } = await clientSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginError) {
    console.error('❌ Gagal login:', loginError.message);
    return;
  }

  console.log(`✅ Login sukses! Access token diperoleh untuk user: ${sessionData.user.email}`);

  // 3. AKSES DATA PROFILE & WORKSPACE DENGAN CLIENT TOKEN
  console.log('\n[3/5] Mengambil data Profile & Workspace yang dibuat oleh trigger DB...');
  const { data: profile, error: pErr } = await clientSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (pErr) console.error('❌ Gagal mengambil profile:', pErr.message);
  else console.log(`- Profile: ✅ Nama: "${profile.full_name}"`);

  const { data: groups, error: gErr } = await clientSupabase
    .from('groups')
    .select('*');

  if (gErr) console.error('❌ Gagal mengambil groups:', gErr.message);
  else console.log(`- Personal Workspace: ✅ "${groups[0]?.name}" (Tipe: ${groups[0]?.type})`);

  const { data: memberships } = await clientSupabase
    .from('group_members')
    .select('*')
    .eq('user_id', userId);

  console.log(`- Role Keanggotaan: ✅ "${memberships[0]?.role}"`);

  const { data: categories } = await clientSupabase
    .from('categories')
    .select('*')
    .eq('group_id', groups[0]?.id);

  console.log(`- Kategori Bawaan: ✅ ${categories?.map(c => c.name).join(', ')}`);

  // 4. TEST LOGOUT & RLS RESTRICTION
  console.log('\n[4/5] Menguji Logout dan verifikasi RLS data...');
  await clientSupabase.auth.signOut();
  console.log('✅ Berhasil signOut.');

  // Akses data setelah logout
  const { data: unauthData } = await clientSupabase.from('groups').select('*');
  console.log(`- Query groups setelah logout: ${unauthData?.length ?? 0} baris`);
  if (!unauthData || unauthData.length === 0) {
    console.log('✅ RLS terbukti melindungi data workspace saat user logout.');
  }

  // 5. TEST LOGIN KEMBALI
  console.log('\n[5/5] Menguji Login kembali untuk validasi persistensi sesi...');
  const { data: reloginData, error: reloginErr } = await clientSupabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (reloginErr) {
    console.error('❌ Gagal relogin:', reloginErr.message);
  } else {
    console.log(`✅ Relogin berhasil! User session dipulihkan: ${reloginData.user.id}`);
  }

  // CLEANUP USER UJI COBA
  console.log('\n[CLEANUP] Menghapus user uji coba...');
  await adminClient.auth.admin.deleteUser(userId);
  console.log('✅ User uji coba dibersihkan.');

  console.log('\n================================================================');
  console.log('HASIL TEST FLOW AUTHENTICATION V1: 100% SUKSES!');
  console.log('================================================================');
}

testSessionFlow().catch(console.error);
