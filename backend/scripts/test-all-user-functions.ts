import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';

const originalFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as any)?.url || '';

  // Only augment local backend requests so Turso Cloud libSQL driver headers remain 100% untouched
  if (urlStr.startsWith(BASE_URL)) {
    const headers = new Headers(
      init?.headers || ((input as any)?.headers ? (input as any).headers : undefined)
    );
    headers.set('x-internal-test', 'csx-deep-audit');
    return originalFetch(input, { ...init, headers });
  }
  return originalFetch(input, init);
}) as typeof fetch;

interface TestResult {
  step: string;
  name: string;
  passed: boolean;
  details?: any;
}

const results: TestResult[] = [];

function record(step: string, name: string, passed: boolean, details?: any) {
  results.push({ step, name, passed, details });
  const statusMark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${statusMark}] [${step}] ${name}`);
  if (!passed && details) {
    console.error('      Details:', details);
  }
}

async function runAllUserTests() {
  console.log('\n======================================================');
  console.log('🔬 CSx CORE :: DEEP USER-SIDE FUNCTION & LOGIC AUDIT');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const testEmail = `user_tester_${timestamp}@matrix.local`;
  const testPass = 'SecureMatrixUser2026!';
  let secretCode = '';
  let userToken = '';
  let userId = '';
  let testPostId = '';
  let testReleaseId = '';

  // ---------------------------------------------------------
  // 1. HEALTH & CONNECTIVITY
  // ---------------------------------------------------------
  try {
    const health = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
    record('STEP 01', 'API Health Check', health.status === 'active', health);
  } catch (err: any) {
    record('STEP 01', 'API Health Check', false, err.message);
  }

  // ---------------------------------------------------------
  // 2. REGISTRATION VALIDATIONS & CREATION
  // ---------------------------------------------------------
  // 2.1 Incomplete Payload
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }) // missing password
    });
    record('STEP 02.1', 'Reject Incomplete Registration (Missing Password)', res.status === 400);
  } catch (err: any) {
    record('STEP 02.1', 'Reject Incomplete Registration', false, err.message);
  }

  // 2.2 Short Password (< 8 chars)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'short' })
    });
    record('STEP 02.2', 'Reject Short Password (<8 chars)', res.status === 400);
  } catch (err: any) {
    record('STEP 02.2', 'Reject Short Password', false, err.message);
  }

  // 2.3 Invalid Email Format
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail', password: testPass })
    });
    record('STEP 02.3', 'Reject Invalid Email Format', res.status === 400);
  } catch (err: any) {
    record('STEP 02.3', 'Reject Invalid Email Format', false, err.message);
  }

  // 2.4 Valid Registration
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPass,
        fullName: 'Test Operator Alpha',
        age: '27',
        phone: '+1 555-4821'
      })
    });
    const data = await res.json();
    secretCode = data.data?.secretCode || '';
    record('STEP 02.4', 'Successful User Registration (Returns 10-char Secret Code)', res.status === 201 && Boolean(secretCode), data);
  } catch (err: any) {
    record('STEP 02.4', 'Successful User Registration', false, err.message);
  }

  // 2.5 Duplicate Email Collision (Case-Insensitive)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail.toUpperCase(),
        password: testPass
      })
    });
    record('STEP 02.5', 'Case-Insensitive Duplicate Email Collision (409 Conflict)', res.status === 409);
  } catch (err: any) {
    record('STEP 02.5', 'Duplicate Email Collision', false, err.message);
  }

  // ---------------------------------------------------------
  // 3. UNVERIFIED LOGIN RESTRICTION & EMAIL VERIFICATION
  // ---------------------------------------------------------
  // 3.1 Unverified User Login Attempt with Secret Code (Should be 403 Forbidden)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode })
    });
    record('STEP 03.1', 'Block Unverified User Login (403 Forbidden)', res.status === 403);
  } catch (err: any) {
    record('STEP 03.1', 'Block Unverified User Login', false, err.message);
  }

  // 3.2 Verify Email with Valid Token
  // Generate a valid verification token directly for this test user
  const jwtSecret = process.env.JWT_SECRET || 'super_secure_matrix_key_2026';
  
  // We can look up the user by email to get their user ID
  let verifyToken = '';
  try {
    // Generate valid verify token
    const { PrismaClient } = require('@prisma/client');
    const prisma = require('../src/config/prisma').default;
    const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
    if (dbUser) {
      userId = dbUser.id;
      verifyToken = jwt.sign({ id: dbUser.id, purpose: 'verify' }, jwtSecret, { expiresIn: '1h' });
    }

    const res = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });
    record('STEP 03.2', 'Verify Email Token (200 OK)', res.status === 200);
  } catch (err: any) {
    record('STEP 03.2', 'Verify Email Token', false, err.message);
  }

  // 3.3 Verify Token Purpose Isolation (A verify token cannot act as session auth)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${verifyToken}` }
    });
    record('STEP 03.3', 'Reject Verification Token as Session Auth (401 Unauthorized)', res.status === 401);
  } catch (err: any) {
    record('STEP 03.3', 'Reject Verification Token as Session Auth', false, err.message);
  }

  // ---------------------------------------------------------
  // 4. VERIFIED LOGIN FLOW (SECRET CODE)
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode })
    });
    const data = await res.json();
    userToken = data.token || '';
    record('STEP 04.1', 'Login with 10-char Secret Code (Returns Session JWT)', res.status === 200 && Boolean(userToken), data);
  } catch (err: any) {
    record('STEP 04.1', 'Login with Secret Code', false, err.message);
  }

  // 4.2 Non-Existent Cipher Code
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode: 'INVALID999' })
    });
    record('STEP 04.2', 'Reject Invalid Cipher Code (401 Unauthorized)', res.status === 401);
  } catch (err: any) {
    record('STEP 04.2', 'Reject Invalid Cipher Code', false, err.message);
  }

  // 4.3 Suspended User Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode: 'FF992200AA' }) // Known suspended account
    });
    record('STEP 04.3', 'Sever Suspended User Node (403 Forbidden)', res.status === 403);
  } catch (err: any) {
    record('STEP 04.3', 'Sever Suspended User Node', false, err.message);
  }

  // ---------------------------------------------------------
  // 5. USER PROFILE & IDENTITY (/api/auth/me)
  // ---------------------------------------------------------
  // 5.1 Authenticated /me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    const hasFields = data.data?.email === testEmail && Array.isArray(data.data?.savedPosts);
    record('STEP 05.1', 'Fetch User Identity (/api/auth/me)', res.status === 200 && hasFields, data);
  } catch (err: any) {
    record('STEP 05.1', 'Fetch User Identity', false, err.message);
  }

  // 5.2 Unauthenticated /me (Should be 401)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    record('STEP 05.2', 'Block Unauthenticated /me Access (401)', res.status === 401);
  } catch (err: any) {
    record('STEP 05.2', 'Block Unauthenticated /me', false, err.message);
  }

  // ---------------------------------------------------------
  // 6. UPDATE PROFILE & SECURITY PARAMETERS
  // ---------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: 'Test Operator Alpha Renamed',
        age: '28',
        phone: '+1 555-9999'
      })
    });
    const data = await res.json();
    const isUpdated = data.data?.fullName === 'Test Operator Alpha Renamed' && data.data?.phone === '+1 555-9999';
    record('STEP 06.1', 'Update Profile Details (/api/auth/update)', res.status === 200 && isUpdated, data);
  } catch (err: any) {
    record('STEP 06.1', 'Update Profile Details', false, err.message);
  }

  // 6.2 Update Password Validation (< 8 chars rejected)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: 'short' })
    });
    record('STEP 06.2', 'Reject Short Password in Update (<8 chars)', res.status === 400);
  } catch (err: any) {
    record('STEP 06.2', 'Reject Short Password in Update', false, err.message);
  }

  // ---------------------------------------------------------
  // 7. AVATAR UPLOAD (LOCAL STORAGE PIPELINE)
  // ---------------------------------------------------------
  try {
    // Create a valid 1x1 test PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = new FormData();
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('profilePic', blob, 'avatar.png');

    const res = await fetch(`${BASE_URL}/api/auth/upload-pic`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData
    });
    const data = await res.json();
    const hasPic = Boolean(data.data?.profilePic);
    record('STEP 07.1', 'Upload Profile Picture (Local Storage Engine)', res.status === 200 && hasPic, data);

    // Verify avatar URL is accessible
    if (hasPic && data.data.profilePic.startsWith('http')) {
      const picRes = await fetch(data.data.profilePic);
      record('STEP 07.2', 'Verify Uploaded Avatar Image Serves via Static Express (200 OK)', picRes.status === 200);
    }
  } catch (err: any) {
    record('STEP 07.1', 'Upload Profile Picture', false, err.message);
  }

  // ---------------------------------------------------------
  // 8. PUBLIC CONTENT BROWSING (POSTS & RELEASES)
  // ---------------------------------------------------------
  // 8.1 Research Posts List
  let draftPostId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/posts`);
    const data = await res.json();
    const publishedPost = data.data?.find((p: any) => p.published);
    const draftPost = data.data?.find((p: any) => !p.published);
    testPostId = publishedPost?.id || '';
    draftPostId = draftPost?.id || '';
    record('STEP 08.1', 'Browse Research Matrix Posts (GET /api/posts)', res.status === 200 && Array.isArray(data.data) && data.data.length > 0);
  } catch (err: any) {
    record('STEP 08.1', 'Browse Research Posts', false, err.message);
  }

  // 8.2 Single Research Post View (Published Post)
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${testPostId}`);
    const data = await res.json();
    record('STEP 08.2', `Fetch Single Research Post View (/api/posts/${testPostId})`, res.status === 200 && Boolean(data.data?.title));
  } catch (err: any) {
    record('STEP 08.2', 'Fetch Single Research Post', false, err.message);
  }

  // 8.2b Draft Isolation (Drafts return 404 to non-admins)
  if (draftPostId) {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${draftPostId}`);
      record('STEP 08.2b', 'Verify Draft Post Privacy Isolation (Non-admins receive 404)', res.status === 404);
    } catch (err: any) {
      record('STEP 08.2b', 'Verify Draft Post Privacy Isolation', false, err.message);
    }
  }

  // 8.3 Project Releases List
  let draftReleaseId = '';
  try {
    const res = await fetch(`${BASE_URL}/api/releases`);
    const data = await res.json();
    const publishedRelease = data.data?.find((r: any) => r.published);
    const draftRelease = data.data?.find((r: any) => !r.published);
    testReleaseId = publishedRelease?.id || '';
    draftReleaseId = draftRelease?.id || '';
    record('STEP 08.3', 'Browse Project Releases (GET /api/releases)', res.status === 200 && Array.isArray(data.data) && data.data.length > 0);
  } catch (err: any) {
    record('STEP 08.3', 'Browse Project Releases', false, err.message);
  }

  // 8.4 Single Project Release View (Published Release)
  try {
    const res = await fetch(`${BASE_URL}/api/releases/${testReleaseId}`);
    const data = await res.json();
    record('STEP 08.4', `Fetch Single Project Release (/api/releases/${testReleaseId})`, res.status === 200 && Boolean(data.data?.projectName));
  } catch (err: any) {
    record('STEP 08.4', 'Fetch Single Project Release', false, err.message);
  }

  // 8.4b Draft Release Isolation (Drafts return 404 to non-admins)
  if (draftReleaseId) {
    try {
      const res = await fetch(`${BASE_URL}/api/releases/${draftReleaseId}`);
      record('STEP 08.4b', 'Verify Draft Release Privacy Isolation (Non-admins receive 404)', res.status === 404);
    } catch (err: any) {
      record('STEP 08.4b', 'Verify Draft Release Privacy Isolation', false, err.message);
    }
  }

  // ---------------------------------------------------------
  // 9. INTERACTIVE USER BOOKMARKS & VAULT SAVING
  // ---------------------------------------------------------
  // 9.1 Bookmark Research Post (Save)
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${testPostId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    record('STEP 09.1', 'Bookmark Research Post (POST /api/posts/:id/save)', res.status === 200 && data.saved === true, data);
  } catch (err: any) {
    record('STEP 09.1', 'Bookmark Research Post', false, err.message);
  }

  // 9.2 Verify Post Appears in /me Profile
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    const isSavedInProfile = data.data?.savedPosts?.some((p: any) => p.id === testPostId);
    record('STEP 09.2', 'Verify Bookmarked Post Reflects in User Profile /me', isSavedInProfile);
  } catch (err: any) {
    record('STEP 09.2', 'Verify Bookmarked Post in Profile', false, err.message);
  }

  // 9.3 Toggle Post Bookmark (Unsave)
  try {
    const res = await fetch(`${BASE_URL}/api/posts/${testPostId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    record('STEP 09.3', 'Unbookmark Research Post (Toggle Off)', res.status === 200 && data.saved === false);
  } catch (err: any) {
    record('STEP 09.3', 'Unbookmark Research Post', false, err.message);
  }

  // 9.4 Save Project to Vault
  try {
    const res = await fetch(`${BASE_URL}/api/releases/${testReleaseId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    record('STEP 09.4', 'Save Project Release to Vault (POST /api/releases/:id/save)', res.status === 200 && data.saved === true, data);
  } catch (err: any) {
    record('STEP 09.4', 'Save Project Release to Vault', false, err.message);
  }

  // 9.5 Verify Project Appears in /me Vault
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    const isSavedInVault = data.data?.savedReleases?.some((r: any) => r.id === testReleaseId);
    record('STEP 09.5', 'Verify Project Reflects in User Vault (/me savedReleases)', isSavedInVault);
  } catch (err: any) {
    record('STEP 09.5', 'Verify Project in User Vault', false, err.message);
  }

  // 9.6 Toggle Project Vault Save (Remove from Vault)
  try {
    const res = await fetch(`${BASE_URL}/api/releases/${testReleaseId}/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    record('STEP 09.6', 'Remove Project from Vault (Toggle Off)', res.status === 200 && data.saved === false);
  } catch (err: any) {
    record('STEP 09.6', 'Remove Project from Vault', false, err.message);
  }

  // ---------------------------------------------------------
  // 10. SYSTEM MEDIA & FAQs
  // ---------------------------------------------------------
  // 10.1 Showcases
  try {
    const res = await fetch(`${BASE_URL}/api/showcase`);
    const data = await res.json();
    record('STEP 10.1', 'Fetch 3D Video Showcases (GET /api/showcase)', res.status === 200 && Array.isArray(data.data) && data.data.length > 0);
  } catch (err: any) {
    record('STEP 10.1', 'Fetch 3D Video Showcases', false, err.message);
  }

  // 10.2 FAQs
  try {
    const res = await fetch(`${BASE_URL}/api/faqs`);
    const data = await res.json();
    record('STEP 10.2', 'Fetch System Queries & FAQs (GET /api/faqs)', res.status === 200 && Array.isArray(data.data) && data.data.length > 0);
  } catch (err: any) {
    record('STEP 10.2', 'Fetch FAQs', false, err.message);
  }

  // ---------------------------------------------------------
  // 11. FEEDBACK SUBMISSION FLOW
  // ---------------------------------------------------------
  // 11.1 Authenticated Feedback Submission
  try {
    const res = await fetch(`${BASE_URL}/api/feedback/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rating: 5,
        category: 'UI/UX Geometry',
        priority: 'Normal',
        recommend: true,
        tags: 'Automated, TestSuite',
        message: 'Auditing user feedback submission from automated testing protocol.'
      })
    });
    record('STEP 11.1', 'Submit User Feedback (/api/feedback/submit)', res.status === 201);
  } catch (err: any) {
    record('STEP 11.1', 'Submit User Feedback', false, err.message);
  }

  // 11.2 Guest Feedback Submission (Unauthenticated)
  try {
    const res = await fetch(`${BASE_URL}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 4,
        category: 'General',
        priority: 'Normal',
        recommend: true,
        tags: 'Guest',
        message: 'Anonymous feedback submission check.'
      })
    });
    record('STEP 11.2', 'Submit Anonymous Guest Feedback (201 Created)', res.status === 201);
  } catch (err: any) {
    record('STEP 11.2', 'Submit Anonymous Guest Feedback', false, err.message);
  }

  // 11.3 Invalid Rating Validation (e.g. rating > 5)
  try {
    const res = await fetch(`${BASE_URL}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: 10,
        category: 'General',
        priority: 'Normal',
        recommend: true,
        message: 'Invalid rating test'
      })
    });
    record('STEP 11.3', 'Reject Invalid Rating (> 5) with 400 Bad Request', res.status === 400);
  } catch (err: any) {
    record('STEP 11.3', 'Reject Invalid Rating', false, err.message);
  }

  // ---------------------------------------------------------
  // 12. CLEANUP EPHEMERAL TEST TELEMETRY
  // ---------------------------------------------------------
  try {
    const prisma = require('../src/config/prisma').default;
    await prisma.feedback.deleteMany({
      where: {
        message: {
          in: [
            'Auditing user feedback submission from automated testing protocol.',
            'Anonymous feedback submission check.',
          ],
        },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'user_tester_' } },
    });
    record('STEP 12.1', 'Clean Up Ephemeral Test Data from Cloud DB', true);
  } catch (err: any) {
    record('STEP 12.1', 'Clean Up Ephemeral Test Data', false, err.message);
  }

  // ---------------------------------------------------------
  // AUDIT SUMMARY & SCORECARD
  // ---------------------------------------------------------
  console.log('\n======================================================');
  console.log('📊 USER-SIDE AUDIT SUMMARY SCORECARD');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL USER TESTS EVALUATED : ${total}`);
  console.log(`PASSED                     : ${passed} ✅`);
  console.log(`FAILED                     : ${failed} ❌`);
  console.log(`SUCCESS RATE               : ${((passed / total) * 100).toFixed(1)}%`);
  console.log('======================================================\n');

  if (failed > 0) {
    console.error('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => console.error(` - [${r.step}] ${r.name}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL USER-SIDE LOGIC AND FUNCTIONS ARE WORKING FLAWLESSLY!');
    process.exit(0);
  }
}

runAllUserTests().catch((e) => {
  console.error('FATAL TEST ERROR:', e);
  process.exit(1);
});
