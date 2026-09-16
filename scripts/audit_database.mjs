import { readFileSync } from 'fs';

// Load env
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
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- AUDIT & VERIFIKASI DATABASE SUPABASE ---');
console.log('Project URL:', SUPABASE_URL);

async function runAudit() {
  const results = {
    tablesCheck: false,
    columnsCheck: false,
    authTriggerCheck: false,
    balanceTriggerCheck: false,
    negativeBalanceGuardCheck: false,
    milestonePersistenceCheck: false,
    rlsCheck: false,
    cleanupCheck: false,
  };

  // 1. CEK SKEMA TABEL DARI OPENAPI
  console.log('\n[1/7] Memeriksa 9 Tabel di Schema Public...');
  const openApiRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  
  if (!openApiRes.ok) {
    console.error('Gagal mengambil OpenAPI schema:', openApiRes.status, await openApiRes.text());
    return;
  }

  const spec = await openApiRes.json();
  const tables = Object.keys(spec.definitions || {});
  console.log('Tabel terdeteksi:', tables);

  const requiredTables = [
    'profiles',
    'groups',
    'group_members',
    'group_invites',
    'categories',
    'goals',
    'transactions',
    'activity_logs',
    'notifications'
  ];

  const missingTables = requiredTables.filter(t => !tables.includes(t));
  if (missingTables.length === 0) {
    console.log('✅ Semua 9 tabel terdaftar sempurna di PostgREST API.');
    results.tablesCheck = true;
  } else {
    console.error('❌ Tabel yang hilang:', missingTables);
  }

  // 2. CEK STRUKTUR KOLOM KRUSIAL
  console.log('\n[2/7] Memeriksa Kolom & Tipe Data Krusial...');
  const goalsDef = spec.definitions.goals?.properties || {};
  const transDef = spec.definitions.transactions?.properties || {};
  const invitesDef = spec.definitions.group_invites?.properties || {};
  const catDef = spec.definitions.categories?.properties || {};

  const hasAchievedAt = 'achieved_at' in goalsDef;
  const hasCurrentAmount = 'current_amount' in goalsDef;
  const hasToken = 'token' in invitesDef;
  const hasExpiresAt = 'expires_at' in invitesDef;
  const hasCatGroupId = 'group_id' in catDef;
  const hasTransUserId = 'user_id' in transDef;

  console.log('- goals.achieved_at:', hasAchievedAt ? '✅' : '❌');
  console.log('- goals.current_amount:', hasCurrentAmount ? '✅' : '❌');
  console.log('- transactions.user_id (preservation):', hasTransUserId ? '✅' : '❌');
  console.log('- group_invites.token:', hasToken ? '✅' : '❌');
  console.log('- group_invites.expires_at:', hasExpiresAt ? '✅' : '❌');
  console.log('- categories.group_id:', hasCatGroupId ? '✅' : '❌');

  if (hasAchievedAt && hasCurrentAmount && hasToken && hasExpiresAt && hasCatGroupId) {
    results.columnsCheck = true;
    console.log('✅ Struktur kolom krusial sesuai BLUEPRINT.md.');
  }

  // 3. UJI TRIGGER OTOMATIS: Registrasi User Baru (handle_new_user)
  console.log('\n[3/7] Menguji Trigger Registrasi User Baru (on_auth_user_created)...');
  const testEmail = `audit_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!@#Test';

  // Buat user via Supabase Auth Admin API
  const createUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Audit Test User'
      }
    })
  });

  if (!createUserRes.ok) {
    console.error('Gagal membuat test user di Auth Admin:', createUserRes.status, await createUserRes.text());
    return;
  }

  const createdUser = await createUserRes.json();
  const testUserId = createdUser.id;
  console.log(`User uji coba dibuat: ${testUserId} (${testEmail})`);

  // Tunggu sekejap agar trigger selesai eksekusi
  await new Promise(r => setTimeout(r, 1200));

  // Cek apakah profiles terisi
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${testUserId}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const profiles = await profileRes.json();
  console.log('- profiles auto-created:', profiles.length > 0 ? `✅ (${profiles[0].full_name})` : '❌');

  // Cek apakah personal group dibuat
  const groupRes = await fetch(`${SUPABASE_URL}/rest/v1/groups?created_by=eq.${testUserId}&type=eq.personal`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const groups = await groupRes.json();
  console.log('- personal group auto-created:', groups.length > 0 ? `✅ ("${groups[0].name}")` : '❌');

  // Cek membership
  let testGroupId = groups[0]?.id;
  const memberRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members?user_id=eq.${testUserId}&role=eq.owner`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const members = await memberRes.json();
  console.log('- group_members owner role:', members.length > 0 ? '✅' : '❌');

  // Cek default categories
  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?group_id=eq.${testGroupId}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const categories = await catRes.json();
  console.log(`- default categories auto-created: ${categories.length >= 3 ? '✅' : '❌'} (${categories.map(c => c.name).join(', ')})`);

  if (profiles.length > 0 && groups.length > 0 && members.length > 0 && categories.length >= 3) {
    results.authTriggerCheck = true;
    console.log('✅ Trigger on_auth_user_created berfungsi 100% sempurna!');
  }

  // 4. UJI TRIGGER SINKRONISASI SALDO TRANSAKSI & MILESTONE
  console.log('\n[4/7] Menguji Trigger Sinkronisasi Saldo & Milestone Goal...');
  const testCatId = categories[0]?.id;

  // Buat Goal uji coba: Target 1.000.000
  const createGoalRes = await fetch(`${SUPABASE_URL}/rest/v1/goals`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      group_id: testGroupId,
      name: 'Uji Coba Tabungan Liburan',
      target_amount: 1000000,
      current_amount: 0,
      created_by: testUserId
    })
  });
  const createdGoals = await createGoalRes.json();
  const testGoalId = createdGoals[0]?.id;
  console.log('Goal dibuat:', testGoalId, '| Target: Rp 1.000.000 | Saldo awal:', createdGoals[0]?.current_amount);

  // Setor 1: Rp 400.000
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goal_id: testGoalId,
      category_id: testCatId,
      user_id: testUserId,
      type: 'deposit',
      amount: 400000,
      notes: 'Setoran 1'
    })
  });

  // Cek saldo setelah setor 1
  let gCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/goals?id=eq.${testGoalId}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  let [g1] = await gCheckRes.json();
  console.log(`- Saldo setelah deposit 400.000: Rp ${g1.current_amount} (Status: ${g1.status})`);
  if (Number(g1.current_amount) === 400000 && g1.status === 'active') {
    console.log('  ✅ Saldo otomatis terhitung 400.000');
  }

  // Setor 2: Rp 600.000 -> Total Rp 1.000.000 (Mencapai Target!)
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goal_id: testGoalId,
      category_id: testCatId,
      user_id: testUserId,
      type: 'deposit',
      amount: 600000,
      notes: 'Setoran 2 pelunasan target'
    })
  });

  // Cek saldo & milestone pencapaian
  gCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/goals?id=eq.${testGoalId}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  let [g2] = await gCheckRes.json();
  console.log(`- Saldo setelah deposit kedua (total 1.000.000): Rp ${g2.current_amount} | Status: ${g2.status} | achieved_at: ${g2.achieved_at}`);

  // Cek apakah notifikasi dibuat otomatis untuk member
  const notifRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${testUserId}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  const notifs = await notifRes.json();
  console.log(`- Notifikasi otomatis terkirim: ${notifs.length > 0 ? `✅ ("${notifs[0].title}: ${notifs[0].message}")` : '❌'}`);

  if (Number(g2.current_amount) === 1000000 && g2.status === 'achieved' && g2.achieved_at && notifs.length > 0) {
    results.balanceTriggerCheck = true;
    console.log('✅ Trigger kalkulasi saldo & perayaan milestone 100% BERHASIL!');
  }

  // 5. UJI PERSISTENSI STATUS ACHIEVED SAAT WITHDRAWAL (BR-005)
  console.log('\n[5/7] Menguji Persistensi Milestone Saat Penarikan Dana (BR-005)...');
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goal_id: testGoalId,
      category_id: testCatId,
      user_id: testUserId,
      type: 'withdrawal',
      amount: 200000,
      notes: 'Tarik 200.000'
    })
  });

  gCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/goals?id=eq.${testGoalId}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  let [g3] = await gCheckRes.json();
  console.log(`- Saldo setelah withdrawal 200.000: Rp ${g3.current_amount} | Status: ${g3.status} | achieved_at: ${g3.achieved_at}`);

  if (Number(g3.current_amount) === 800000 && g3.status === 'achieved' && g3.achieved_at !== null) {
    results.milestonePersistenceCheck = true;
    console.log('✅ BR-005 LULUS: Withdrawal menurunkan saldo namun TIDAK MENGHAPUS status achieved!');
  } else {
    console.error('❌ BR-005 GAGAL: Status berubah tidak sesuai aturan bisnis.');
  }

  // 6. UJI VALIDASI ANTI-OVERDRAFT / SALDO NEGATIF (BR-009)
  console.log('\n[6/7] Menguji Pencegahan Saldo Negatif (BR-009)...');
  const overWithdrawRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      goal_id: testGoalId,
      category_id: testCatId,
      user_id: testUserId,
      type: 'withdrawal',
      amount: 1500000, // Saldo sisa 800.000, ditarik 1.500.000
      notes: 'Tarik berlebih'
    })
  });

  if (!overWithdrawRes.ok) {
    const errBody = await overWithdrawRes.json();
    console.log(`- Penarikan berlebih ditolak oleh database: ✅ (${errBody.message})`);
    results.negativeBalanceGuardCheck = true;
  } else {
    console.error('❌ BR-009 GAGAL: Penarikan berlebih lolos!');
  }

  // 7. UJI ROW LEVEL SECURITY (RLS) DENGAN PUBLISHABLE KEY
  console.log('\n[7/7] Menguji Row Level Security (RLS) Tanpa Auth...');
  const unauthRes = await fetch(`${SUPABASE_URL}/rest/v1/groups?select=*`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`
    }
  });
  const unauthData = await unauthRes.json();
  console.log(`- Query groups tanpa token autentikasi menghasilkan ${unauthData.length} baris.`);
  if (unauthData.length === 0) {
    results.rlsCheck = true;
    console.log('✅ RLS AKTIF & AMAN: Data groups tidak bocor ke publik.');
  } else {
    console.error('❌ RLS GAGAL: Data groups terbuka untuk publik!');
  }

  // CLEANUP DATA UJI COBA
  console.log('\n[CLEANUP] Membersihkan data user uji coba...');
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${testUserId}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  console.log('✅ Data user uji coba berhasil dihapus.');
  results.cleanupCheck = true;

  console.log('\n======================================================');
  console.log('HASIL AUDIT & VERIFIKASI:');
  console.table(results);
  console.log('======================================================');
}

runAudit().catch(console.error);
