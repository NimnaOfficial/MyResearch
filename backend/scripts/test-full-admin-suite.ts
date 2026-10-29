import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function runSuite() {
  console.log('====================================================');
  console.log('STARTING FULL SYSTEM & ADMIN CONTROLS AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // 1. HEALTH CHECK
  // ----------------------------------------------------
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData: any = await healthRes.json();
    assert(
      healthRes.ok && (healthData.status === 'active' || healthData.status === 'OK'),
      'Backend Health & DB Connection Alive'
    );
  } catch (e: any) {
    assert(false, 'Backend Health & DB Connection Alive', e.message);
    return;
  }

  // ----------------------------------------------------
  // 2. SECURITY & BYPASS PREVENTION CHECKS
  // ----------------------------------------------------
  console.log('\n--- 2. SECURITY & BYPASS TESTS ---');

  // Test 2A: Public secret-code login for regular user (134AF102C5)
  let userToken = '';
  try {
    const userLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode: '134AF102C5' })
    });
    const userLoginData: any = await userLoginRes.json();
    assert(userLoginRes.ok && userLoginData.token, 'Path B (Secret Code) allows legitimate user login');
    userToken = userLoginData.token;
  } catch (e: any) {
    assert(false, 'Path B allows legitimate user login', e.message);
  }

  // Test 2B: Regular user trying to access admin endpoint -> must get 403
  try {
    const forbiddenRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(forbiddenRes.status === 403, 'Regular User Token Rejected from Admin Routes (403 Forbidden)');
  } catch (e: any) {
    assert(false, 'Regular User Token Rejected from Admin Routes', e.message);
  }

  // ----------------------------------------------------
  // 3. ADMIN AUTHENTICATION (PATH A)
  // ----------------------------------------------------
  console.log('\n--- 3. ADMIN AUTHENTICATION ---');
  let adminToken = '';
  try {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nimnakgls980@gmail.com',
        password: 'Admin@Nima2026!'
      })
    });
    const adminLoginData: any = await adminLoginRes.json();
    const role = adminLoginData.user?.role || adminLoginData.data?.user?.role;
    assert(
      adminLoginRes.ok && role === 'admin' && !!adminLoginData.token,
      'Admin Master Login (nimnakgls980@gmail.com) Authenticated with Level 5 Clearance'
    );
    adminToken = adminLoginData.token;
  } catch (e: any) {
    assert(false, 'Admin Master Login Authenticated', e.message);
    return;
  }

  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  // ----------------------------------------------------
  // 4. ADMIN USER / OPERATOR MANAGEMENT
  // ----------------------------------------------------
  console.log('\n--- 4. OPERATOR ROSTER MANAGEMENT ---');

  // Test 4A: Get all users with count of bookmarks
  let testOperatorId = '';
  try {
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, { headers: adminHeaders });
    const usersData: any = await usersRes.json();
    assert(usersRes.ok && Array.isArray(usersData.data), `GET /api/admin/users returned ${usersData.data?.length} nodes`);
    assert(
      usersData.data[0]?._count !== undefined,
      'User items include bookmark & feedback counts (_count metadata)'
    );
  } catch (e: any) {
    assert(false, 'GET /api/admin/users with counts', e.message);
  }

  // Test 4B: Create new operator
  const testEmail = `operator_${Date.now()}@testnima.io`;
  let generatedSecretCode = '';
  try {
    const createRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        fullName: 'Test Operator Autonomous',
        username: `test_ops_${Date.now().toString().slice(-4)}`,
        email: testEmail,
        password: 'SecurePassword123!',
        role: 'user',
        phone: '+94 77 123 4567',
        age: 26,
        isVerified: true
      })
    });
    const createData: any = await createRes.json();
    assert(createRes.ok && createData.data?.id, 'Admin Created New Operator via POST /api/admin/users');
    testOperatorId = createData.data?.id;
    generatedSecretCode = createData.secretCode || createData.data?.secretCode;
    assert(generatedSecretCode?.length === 10, `New Operator received 10-char Secret Cipher: ${generatedSecretCode}`);
  } catch (e: any) {
    assert(false, 'Admin Created New Operator', e.message);
  }

  // Test 4C: Regenerate Secret Code for operator
  try {
    const regenRes = await fetch(`${BASE_URL}/api/admin/users/${testOperatorId}/regenerate-code`, {
      method: 'PUT',
      headers: adminHeaders
    });
    const regenData: any = await regenRes.json();
    const newCode = regenData.secretCode || regenData.data?.secretCode;
    assert(
      regenRes.ok && newCode?.length === 10 && newCode !== generatedSecretCode,
      `Admin Regenerated Secret Code: ${newCode}`
    );
  } catch (e: any) {
    assert(false, 'Admin Regenerated Secret Code', e.message);
  }

  // Test 4D: Inspect User Vault
  try {
    const vaultRes = await fetch(`${BASE_URL}/api/admin/users/${testOperatorId}/vault`, {
      headers: adminHeaders
    });
    const vaultData: any = await vaultRes.json();
    assert(
      vaultRes.ok && Array.isArray(vaultData.data?.savedPosts) && Array.isArray(vaultData.data?.savedReleases),
      'Admin Inspected Operator Vault (Saved Posts & Releases)'
    );
  } catch (e: any) {
    assert(false, 'Admin Inspected Operator Vault', e.message);
  }

  // Test 4E: Toggle User Status (Suspend & Restore)
  try {
    const suspendRes = await fetch(`${BASE_URL}/api/admin/users/${testOperatorId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'SUSPENDED' })
    });
    const suspendData: any = await suspendRes.json();
    assert(suspendRes.ok && suspendData.data?.status === 'SUSPENDED', 'Admin Suspended Operator Access');

    const restoreRes = await fetch(`${BASE_URL}/api/admin/users/${testOperatorId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    const restoreData: any = await restoreRes.json();
    assert(restoreRes.ok && restoreData.data?.status === 'ACTIVE', 'Admin Restored Operator Access');
  } catch (e: any) {
    assert(false, 'Toggle User Status', e.message);
  }

  // Test 4F: Delete operator
  try {
    const deleteRes = await fetch(`${BASE_URL}/api/admin/users/${testOperatorId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(deleteRes.ok, 'Admin Terminated Operator via DELETE /api/admin/users/:id');
  } catch (e: any) {
    assert(false, 'Admin Terminated Operator', e.message);
  }

  // ----------------------------------------------------
  // 5. CATEGORY TAXONOMY MANAGEMENT
  // ----------------------------------------------------
  console.log('\n--- 5. CATEGORY TAXONOMY ENGINE ---');
  let testCatId = '';

  // Test 5A: Create Category
  try {
    const createCatRes = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: `Quantum Systems ${Date.now().toString().slice(-4)}`,
        slug: `quantum-${Date.now()}`,
        description: 'Advanced Quantum Computing and Lattice Cryptography',
        color: '#06b6d4'
      })
    });
    const createCatData: any = await createCatRes.json();
    assert(createCatRes.ok && createCatData.data?.id, 'Admin Created Category Taxonomy');
    testCatId = createCatData.data?.id;
  } catch (e: any) {
    assert(false, 'Admin Created Category Taxonomy', e.message);
  }

  // Test 5B: List Categories
  try {
    const listCatRes = await fetch(`${BASE_URL}/api/categories`);
    const listCatData: any = await listCatRes.json();
    assert(listCatRes.ok && Array.isArray(listCatData.data), `GET /api/categories returned ${listCatData.data?.length} categories`);
  } catch (e: any) {
    assert(false, 'List Categories', e.message);
  }

  // Test 5C: Create Post with Category Assignment
  let testPostId = '';
  try {
    const createPostRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: `Quantum Cryptography Analysis ${Date.now()}`,
        type: 'Research',
        content: 'Exploration of post-quantum fault-tolerant lattice signatures.',
        categoryId: testCatId,
        published: true
      })
    });
    const createPostData: any = await createPostRes.json();
    assert(createPostRes.ok && createPostData.data?.id, 'Admin Created Research Post assigned to Category');
    testPostId = createPostData.data?.id;
    assert(createPostData.data?.categoryId === testCatId, 'Post correctly persisted categoryId linkage');
  } catch (e: any) {
    assert(false, 'Create Post with Category', e.message);
  }

  // Clean up post & category
  if (testPostId) {
    await fetch(`${BASE_URL}/api/posts/${testPostId}`, { method: 'DELETE', headers: adminHeaders });
  }
  if (testCatId) {
    const delCatRes = await fetch(`${BASE_URL}/api/categories/${testCatId}`, { method: 'DELETE', headers: adminHeaders });
    assert(delCatRes.ok, 'Admin Deleted Category Taxonomy');
  }

  // ----------------------------------------------------
  // 6. SYSTEM CONTROLS & AUDIT LOGS
  // ----------------------------------------------------
  console.log('\n--- 6. SYSTEM OVERRIDE & AUDIT LOGS ---');

  // Test 6A: System Override
  try {
    const overrideRes = await fetch(`${BASE_URL}/api/admin/system/override`, {
      method: 'POST',
      headers: adminHeaders
    });
    const overrideData: any = await overrideRes.json();
    assert(overrideRes.ok, `POST /api/admin/system/override executed: "${overrideData.message}"`);
  } catch (e: any) {
    assert(false, 'System Override Execution', e.message);
  }

  // Test 6B: Filter Logs
  try {
    const logsRes = await fetch(`${BASE_URL}/api/admin/logs?limit=5`, { headers: adminHeaders });
    const logsData: any = await logsRes.json();
    assert(logsRes.ok && Array.isArray(logsData.data), `GET /api/admin/logs returned ${logsData.data?.length} log entries`);
    const hasOverrideLog = logsData.data.some((l: any) => l.action.includes('SYSTEM_OVERRIDE') || l.action.includes('SYSTEM'));
    assert(hasOverrideLog, 'System Override Action was recorded in ActivityLog stream');
  } catch (e: any) {
    assert(false, 'Filter Logs & Verify Override', e.message);
  }

  // ----------------------------------------------------
  // 7. FEEDBACK MANAGEMENT
  // ----------------------------------------------------
  console.log('\n--- 7. FEEDBACK INBOX MANAGEMENT ---');
  let testFeedbackId = '';
  try {
    // User submits feedback
    const fbSubmitRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category: 'SECURITY',
        priority: 'URGENT',
        message: 'Test automated feedback transmission for audit verification.',
        rating: 5
      })
    });
    const fbSubmitData: any = await fbSubmitRes.json();
    assert(fbSubmitRes.ok && fbSubmitData.data?.id, 'User Submitted Feedback to Secure Inbox');
    testFeedbackId = fbSubmitData.data?.id;

    // Admin deletes feedback
    const delFbRes = await fetch(`${BASE_URL}/api/feedback/${testFeedbackId}`, {
      method: 'DELETE',
      headers: adminHeaders
    });
    assert(delFbRes.ok, 'Admin Deleted Feedback via DELETE /api/feedback/:id');
  } catch (e: any) {
    assert(false, 'Feedback Inbox Management', e.message);
  }

  // ----------------------------------------------------
  // SUMMARY SCORECARD
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(console.error);
