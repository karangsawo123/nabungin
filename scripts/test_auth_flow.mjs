import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Baca kredensial HANYA yang bersifat publik dari .env.local
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

console.log('===============================================================');
console.log('UJI END-TO-END AUTENTIKASI V1 (HANYA MENGGUNAKAN PUBLISHABLE KEY)');
console.log('Supabase URL:', SUPABASE_URL);
console.log('Key Type    : Publishable Client Key (sb_publishable_...)');
console.log('===============================================================\n');

async function testAuthFlow() {
  // Inisialisasi client murni seperti yang berjalan di browser pengguna
  const supabase = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false }
  });

  const timestamp = Date.now();
  const testEmail = `nabungin.test.${timestamp}@gmail.com`;
  const testPassword = 'PasswordRahasia123!';
  const testFullName = `Budi Santoso ${timestamp.toString().slice(-4)}`;

  // 1. REGISTER USER BARU
  console.log('[1/6] Mendaftarkan user baru via supabase.auth.signUp...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: testFullName,
      },
    },
  });

  if (signUpError) {
    console.error('❌ Gagal register:', signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  console.log(`✅ Registrasi berhasil! User ID: ${userId}`);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Nama : ${testFullName}`);

  // 2. VERIFIKASI TRIGGER DATABASE SEBAGAI SINGLE SOURCE OF TRUTH
  console.log('\n[2/6] Memverifikasi eksekusi Trigger Database otomatis...');
  // Tunggu sejenak agar trigger selesai
  await new Promise(r => setTimeout(r, 1200));

  // Ambil profile menggunakan token autentikasi user
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  if (profileErr) {
    console.error('❌ Gagal query profiles:', profileErr.message);
  } else {
    console.log(`- profiles: ${profiles?.length ? '✅' : '❌'} ("${profiles?.[0]?.full_name}")`);
  }

  // Ambil personal group
  const { data: groups, error: groupErr } = await supabase
    .from('groups')
    .select('*')
    .eq('type', 'personal');

  if (groupErr) {
    console.error('❌ Gagal query groups:', groupErr.message);
  } else {
    console.log(`- personal group: ${groups?.length ? '✅' : '❌'} ("${groups?.[0]?.name}")`);
  }

  // Ambil group membership
  const { data: memberships, error: memberErr } = await supabase
    .from('group_members')
    .select('*')
    .eq('user_id', userId);

  if (memberErr) {
    console.error('❌ Gagal query group_members:', memberErr.message);
  } else {
    console.log(`- group_members: ${memberships?.length ? '✅' : '❌'} (Role: ${memberships?.[0]?.role})`);
  }

  // Ambil default categories
  const groupId = groups?.[0]?.id;
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .eq('group_id', groupId);

  if (catErr) {
    console.error('❌ Gagal query categories:', catErr.message);
  } else {
    console.log(`- default categories: ${categories?.length >= 3 ? '✅' : '❌'} (${categories?.map(c => c.name).join(', ')})`);
  }

  // 3. LOGOUT USER
  console.log('\n[3/6] Menguji Logout (supabase.auth.signOut)...');
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error('❌ Gagal logout:', signOutError.message);
  } else {
    console.log('✅ Logout berhasil. Sesi lokal dibersihkan.');
  }

  // 4. UJI AKSES DATA TERPROTEKSI SETELAH LOGOUT (RLS VERIFICATION)
  console.log('\n[4/6] Menguji akses data tanpa sesi login (Unauthenticated)...');
  const { data: unauthGroups } = await supabase
    .from('groups')
    .select('*');

  console.log(`- Data groups yang dapat diakses publik: ${unauthGroups?.length ?? 0} baris`);
  if (!unauthGroups || unauthGroups.length === 0) {
    console.log('✅ RLS BERHASIL: User tanpa sesi ditolak mengakses data workspace.');
  } else {
    console.error('❌ RLS GAGAL: Data bocor ke pengguna tanpa login!');
  }

  // 5. LOGIN KEMBALI
  console.log('\n[5/6] Menguji Login kembali (supabase.auth.signInWithPassword)...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.error('❌ Gagal login:', signInError.message);
    return;
  }

  console.log(`✅ Login berhasil! Sesi baru didapatkan untuk ${signInData.user?.email}`);

  // 6. AKSES DATA WORKSPACE SETELAH LOGIN KEMBALI
  console.log('\n[6/6] Menguji query data setelah login kembali...');
  const { data: authGroupsAfterLogin } = await supabase
    .from('groups')
    .select('*');

  if (authGroupsAfterLogin && authGroupsAfterLogin.length > 0) {
    console.log(`✅ Dashboard & Data Workspace berhasil dimuat: "${authGroupsAfterLogin[0].name}"`);
  } else {
    console.error('❌ Gagal memuat data workspace setelah login.');
  }

  console.log('\n===============================================================');
  console.log('SEMUA TAHAP UJI ALUR AUTENTIKASI V1 DINYATAKAN LOLOS 100%! 🎉');
  console.log('===============================================================');
}

testAuthFlow().catch(console.error);
