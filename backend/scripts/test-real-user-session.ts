import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BACKEND_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';
const USER_CODE = '134AF102C5';

// Intercept local fetch to append diagnostic test header
const originalFetch = globalThis.fetch;
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as any)?.url || '';

  if (urlStr.startsWith(BACKEND_URL)) {
    const headers = new Headers(
      init?.headers || ((input as any)?.headers ? (input as any).headers : undefined)
    );
    headers.set('x-internal-test', 'csx-deep-audit');
    return originalFetch(input, { ...init, headers });
  }
  return originalFetch(input, init);
}) as typeof fetch;

interface StepResult {
  num: string;
  activity: string;
  success: boolean;
  notes?: any;
}

const steps: StepResult[] = [];

function logStep(num: string, activity: string, success: boolean, notes?: any) {
  steps.push({ num, activity, success, notes });
  const icon = success ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] [${num}] ${activity}`);
  if (!success && notes) {
    console.error('       Error Details:', notes);
  }
}

async function auditRealUserSession() {
  console.log('\n===============================================================');
  console.log(`🚀 AUDITING REAL USER SESSION: CODE "${USER_CODE}"`);
  console.log('===============================================================\n');

  let token = '';
  let originalProfile: any = null;
  let testPostId = '';
  let testReleaseId = '';

  // -------------------------------------------------------------
  // 1. AUTHENTICATE WITH USER CODE (LOGIN)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode: USER_CODE }),
    });
    const data = await res.json();
    token = data.token || '';
    logStep(
      'ACT-01',
      `Login via 10-char Secret Code (${USER_CODE})`,
      res.status === 200 && Boolean(token),
      { status: res.status, id: data.data?.id, role: data.data?.user?.role }
    );
  } catch (err: any) {
    logStep('ACT-01', `Login via Secret Code (${USER_CODE})`, false, err.message);
  }

  if (!token) {
    console.error('FATAL: Could not establish session token. Aborting user session audit.');
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // -------------------------------------------------------------
  // 2. FETCH PERSONAL IDENTITY & VAULT (/me)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, { headers: authHeaders });
    const json = await res.json();
    const data = json.data;
    originalProfile = {
      fullName: data?.fullName,
      age: data?.age,
      phone: data?.phone,
      profilePic: data?.profilePic,
    };
    const valid =
      res.status === 200 &&
      data?.username === USER_CODE &&
      data?.email === 'lochsand16@gmail.com' &&
      Array.isArray(data?.savedPosts) &&
      Array.isArray(data?.savedReleases);

    logStep(
      'ACT-02',
      'Fetch Real User Identity & Vault Profile (/api/auth/me)',
      valid,
      { email: data?.email, fullName: data?.fullName, role: data?.role, verified: data?.isVerified }
    );
  } catch (err: any) {
    logStep('ACT-02', 'Fetch User Identity & Vault Profile', false, err.message);
  }

  // -------------------------------------------------------------
  // 3. UPDATE USER PROFILE DETAILS (/update)
  // -------------------------------------------------------------
  try {
    const updatePayload = {
      fullName: 'Lochana Sandanimne (Verified Operator)',
      age: '31',
      phone: '+94 77 613 5827',
    };
    const res = await fetch(`${BACKEND_URL}/api/auth/update`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload),
    });
    const json = await res.json();
    const updated = json.data?.fullName === updatePayload.fullName && json.data?.phone === updatePayload.phone;
    logStep('ACT-03', 'Update Personal Profile Information (Name, Age, Phone)', res.status === 200 && updated, json);
  } catch (err: any) {
    logStep('ACT-03', 'Update Personal Profile Information', false, err.message);
  }

  // -------------------------------------------------------------
  // 4. VERIFY UPDATED PROFILE PERSISTENCE IN /me
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, { headers: authHeaders });
    const json = await res.json();
    const matches = json.data?.fullName === 'Lochana Sandanimne (Verified Operator)';
    logStep('ACT-04', 'Verify Profile Updates Persist in Matrix Vault (/me)', matches);
  } catch (err: any) {
    logStep('ACT-04', 'Verify Profile Updates Persist', false, err.message);
  }

  // -------------------------------------------------------------
  // 5. UPLOAD AVATAR & VERIFY IMAGE SERVING
  // -------------------------------------------------------------
  let uploadedAvatarUrl = '';
  try {
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = new FormData();
    const blob = new Blob([samplePng], { type: 'image/png' });
    formData.append('profilePic', blob, 'operator_avatar.png');

    const res = await fetch(`${BACKEND_URL}/api/auth/upload-pic`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await res.json();
    uploadedAvatarUrl = json.data?.profilePic || '';
    const hasUrl = Boolean(uploadedAvatarUrl);
    logStep('ACT-05', 'Upload User Avatar (Local Disk Storage Pipeline)', res.status === 200 && hasUrl, { url: uploadedAvatarUrl });

    // 5b. Verify avatar serves over HTTP
    if (hasUrl) {
      const picRes = await fetch(uploadedAvatarUrl);
      const isOk = picRes.status === 200 && (picRes.headers.get('content-type')?.includes('image') || false);
      logStep('ACT-05b', 'Fetch & Verify Statically Served Avatar Over HTTP (200 OK)', isOk, { status: picRes.status, contentType: picRes.headers.get('content-type') });
    }
  } catch (err: any) {
    logStep('ACT-05', 'Upload User Avatar', false, err.message);
  }

  // -------------------------------------------------------------
  // 6. BROWSE RESEARCH MATRIX (GET /api/posts)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts`, { headers: authHeaders });
    const json = await res.json();
    const publishedPost = json.data?.find((p: any) => p.published);
    testPostId = publishedPost?.id || '';
    const hasPosts = res.status === 200 && Array.isArray(json.data) && json.data.length > 0;
    logStep('ACT-06', 'Browse Research Matrix Posts (/api/posts)', hasPosts && Boolean(testPostId), { total: json.results, selectedPost: testPostId });
  } catch (err: any) {
    logStep('ACT-06', 'Browse Research Matrix Posts', false, err.message);
  }

  // -------------------------------------------------------------
  // 7. READ INDIVIDUAL RESEARCH ARTICLE (GET /api/posts/:id)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts/${testPostId}`, { headers: authHeaders });
    const json = await res.json();
    const valid = res.status === 200 && json.data?.id === testPostId && Boolean(json.data?.content);
    logStep('ACT-07', `Read Individual Research Article (${json.data?.title?.slice(0, 35)}...)`, valid);
  } catch (err: any) {
    logStep('ACT-07', 'Read Individual Research Article', false, err.message);
  }

  // -------------------------------------------------------------
  // 8. RESEARCH DOCUMENT PDF GENERATION (GET /api/posts/:id/pdf)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts/${testPostId}/pdf`, { headers: authHeaders });
    const isPdf = res.status === 200 && res.headers.get('content-type')?.includes('application/pdf');
    logStep('ACT-08', 'Generate & Stream Research Paper PDF (Puppeteer Engine)', Boolean(isPdf), { status: res.status, contentType: res.headers.get('content-type') });
  } catch (err: any) {
    logStep('ACT-08', 'Generate Research Paper PDF', false, err.message);
  }

  // -------------------------------------------------------------
  // 9. BOOKMARK RESEARCH PAPER TO VAULT (POST /api/posts/:id/save)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/posts/${testPostId}/save`, {
      method: 'POST',
      headers: authHeaders,
    });
    const json = await res.json();
    const isSaved = res.status === 200 && json.saved === true;
    logStep('ACT-09', 'Bookmark Research Article to Personal Vault', isSaved, json);

    // Verify reflection in /me
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, { headers: authHeaders });
    const meJson = await meRes.json();
    const inProfile = meJson.data?.savedPosts?.some((p: any) => p.id === testPostId);
    logStep('ACT-09b', 'Verify Bookmarked Post Reflects in User Vault Profile', Boolean(inProfile));

    // Toggle off (unsave)
    const unsaveRes = await fetch(`${BACKEND_URL}/api/posts/${testPostId}/save`, {
      method: 'POST',
      headers: authHeaders,
    });
    const unsaveJson = await unsaveRes.json();
    logStep('ACT-09c', 'Unbookmark Research Article from Personal Vault (Toggle Off)', unsaveRes.status === 200 && unsaveJson.saved === false);
  } catch (err: any) {
    logStep('ACT-09', 'Bookmark Research Article', false, err.message);
  }

  // -------------------------------------------------------------
  // 10. BROWSE PROJECT RELEASES (GET /api/releases)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/releases`, { headers: authHeaders });
    const json = await res.json();
    const publishedRelease = json.data?.find((r: any) => r.published);
    testReleaseId = publishedRelease?.id || '';
    const hasReleases = res.status === 200 && Array.isArray(json.data) && json.data.length > 0;
    logStep('ACT-10', 'Browse Engineering Project Releases (/api/releases)', hasReleases && Boolean(testReleaseId), { total: json.results, selectedRelease: testReleaseId });
  } catch (err: any) {
    logStep('ACT-10', 'Browse Project Releases', false, err.message);
  }

  // -------------------------------------------------------------
  // 11. READ INDIVIDUAL PROJECT RELEASE (GET /api/releases/:id)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/releases/${testReleaseId}`, { headers: authHeaders });
    const json = await res.json();
    const valid = res.status === 200 && json.data?.id === testReleaseId && Boolean(json.data?.projectName);
    logStep('ACT-11', `Read Single Project Release Details (${json.data?.projectName})`, valid);
  } catch (err: any) {
    logStep('ACT-11', 'Read Single Project Release Details', false, err.message);
  }

  // -------------------------------------------------------------
  // 12. SAVE PROJECT RELEASE TO VAULT (POST /api/releases/:id/save)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/releases/${testReleaseId}/save`, {
      method: 'POST',
      headers: authHeaders,
    });
    const json = await res.json();
    const isSaved = res.status === 200 && json.saved === true;
    logStep('ACT-12', 'Save Project Release to User Vault (/api/releases/:id/save)', isSaved, json);

    // Verify reflection in /me
    const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, { headers: authHeaders });
    const meJson = await meRes.json();
    const inVault = meJson.data?.savedReleases?.some((r: any) => r.id === testReleaseId);
    logStep('ACT-12b', 'Verify Saved Project Release Reflects in User Vault Profile', Boolean(inVault));

    // Toggle off (unsave)
    const unsaveRes = await fetch(`${BACKEND_URL}/api/releases/${testReleaseId}/save`, {
      method: 'POST',
      headers: authHeaders,
    });
    const unsaveJson = await unsaveRes.json();
    logStep('ACT-12c', 'Remove Project Release from Vault (Toggle Off)', unsaveRes.status === 200 && unsaveJson.saved === false);
  } catch (err: any) {
    logStep('ACT-12', 'Save Project Release to Vault', false, err.message);
  }

  // -------------------------------------------------------------
  // 13. EXPLORE 3D SHOWCASES (GET /api/showcase)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/showcase`, { headers: authHeaders });
    const json = await res.json();
    const valid = res.status === 200 && Array.isArray(json.data) && json.data.length > 0;
    logStep('ACT-13', 'Browse 3D Video Showcases (/api/showcase)', valid, { count: json.data?.length });
  } catch (err: any) {
    logStep('ACT-13', 'Browse 3D Showcases', false, err.message);
  }

  // -------------------------------------------------------------
  // 14. EXPLORE SYSTEM FAQs (GET /api/faqs)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BACKEND_URL}/api/faqs`, { headers: authHeaders });
    const json = await res.json();
    const valid = res.status === 200 && Array.isArray(json.data) && json.data.length > 0;
    logStep('ACT-14', 'Browse Frequently Asked Questions & Answers (/api/faqs)', valid, { count: json.data?.length });
  } catch (err: any) {
    logStep('ACT-14', 'Browse FAQs', false, err.message);
  }

  // -------------------------------------------------------------
  // 15. SUBMIT USER FEEDBACK AS 134AF102C5
  // -------------------------------------------------------------
  let submittedFeedbackId = '';
  try {
    const feedbackPayload = {
      rating: 5,
      category: 'UI/UX Geometry',
      priority: 'High',
      recommend: true,
      tags: 'RealUserTest, LochanaOperator',
      message: 'Comprehensive real user session validation for operator 134AF102C5.',
    };
    const res = await fetch(`${BACKEND_URL}/api/feedback/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(feedbackPayload),
    });
    const json = await res.json();
    submittedFeedbackId = json.data?.id || '';
    const success = res.status === 201 && json.data?.userId === 'fef4d149-ecbe-4d11-8021-cfbca24da164';
    logStep('ACT-15', 'Submit User Telemetry Feedback (Linked to User ID)', success, { feedbackId: submittedFeedbackId, userId: json.data?.userId });
  } catch (err: any) {
    logStep('ACT-15', 'Submit User Feedback', false, err.message);
  }

  // -------------------------------------------------------------
  // 16. FRONTEND PAGES AVAILABILITY (HTTP localhost:3000)
  // -------------------------------------------------------------
  const frontendRoutes = [
    { name: 'Landing Homepage', path: '/' },
    { name: 'Explore Hub', path: '/explore' },
    { name: 'Projects Catalog', path: '/projects' },
    { name: 'Research Archive', path: '/research' },
    { name: 'Authentication Gate', path: '/auth' },
    { name: 'User Dashboard (Vault)', path: '/dashboard' },
    { name: 'User Profile Settings', path: '/settings' },
    { name: 'Feedback Submission Portal', path: '/feedback' },
    { name: 'Contact Gateway', path: '/contact' },
  ];

  for (let i = 0; i < frontendRoutes.length; i++) {
    const route = frontendRoutes[i];
    try {
      const res = await fetch(`${FRONTEND_URL}${route.path}`);
      const ok = res.status === 200;
      logStep(`ACT-16.${i + 1}`, `Frontend Page Accessibility: ${route.name} (${route.path})`, ok, { status: res.status });
    } catch (err: any) {
      logStep(`ACT-16.${i + 1}`, `Frontend Page Accessibility: ${route.name} (${route.path})`, false, err.message);
    }
  }

  // -------------------------------------------------------------
  // 17. RESTORE USER'S ORIGINAL PROFILE & CLEANUP
  // -------------------------------------------------------------
  try {
    const prisma = require('../src/config/prisma').default;
    // Restore profile fields
    if (originalProfile) {
      await prisma.user.update({
        where: { username: USER_CODE },
        data: {
          fullName: originalProfile.fullName,
          age: originalProfile.age,
          phone: originalProfile.phone,
          profilePic: originalProfile.profilePic,
        },
      });
      logStep('ACT-17a', 'Restore Original User Profile State in Database', true);
    }

    // Clean up temporary feedback
    if (submittedFeedbackId) {
      await prisma.feedback.delete({ where: { id: submittedFeedbackId } });
      logStep('ACT-17b', 'Clean Up Temporary Audit Feedback Record', true);
    }
  } catch (err: any) {
    logStep('ACT-17', 'Restore User State & Cleanup', false, err.message);
  }

  // -------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 REAL USER ACTIVITY AUDIT SCORECARD');
  console.log('===============================================================');
  const total = steps.length;
  const passed = steps.filter((s) => s.success).length;
  const failed = total - passed;
  console.log(`TOTAL USER ACTIVITIES EVALUATED : ${total}`);
  console.log(`PASSED                          : ${passed} ✅`);
  console.log(`FAILED                          : ${failed} ❌`);
  console.log(`SUCCESS RATE                    : ${((passed / total) * 100).toFixed(1)}%`);
  console.log('===============================================================\n');

  if (failed > 0) {
    console.error('Failed Activities:');
    steps.filter((s) => !s.success).forEach((s) => console.error(` - [${s.num}] ${s.activity}`));
    process.exit(1);
  } else {
    console.log(`🎉 ALL ACTIVITIES FOR REAL USER ${USER_CODE} ARE PERFORMING FLAWLESSLY!`);
    process.exit(0);
  }
}

auditRealUserSession().catch((e) => {
  console.error('FATAL AUDIT ERROR:', e);
  process.exit(1);
});
