# Store App — সমস্যার তালিকা ও উন্নয়ন পরিকল্পনা (Issue List & Roadmap)

> সংস্করণ: ২০২৬-১০-১৫ · কোডবেস: Next.js 15 + Express 5 + Prisma 6 + MySQL
> হিসাব: একটাই Node process, একটাই DB। তালিকা **গুরুত্ব অনুযায়ী সিরিয়াল** করা — সবচেয়ে জরুরি উপরে।

## অগ্রাধিকার চিহ্ন (Priority legend)

| লেবেল | অর্থ | কখন করতে হবে |
|---|---|---|
| **P0 — Critical** | লঞ্চের আগে অবশ্যই | এখনই |
| **P1 — High** | দ্রুত করা দরকার | লঞ্চের কাছাকাছি |
| **P2 — Medium** | mejorar করা উচিত | লঞ্চের পরে শীঘ্রই |
| **P3 — Low** | ভালো হবে করলে | সুযোগমতো |

---

# P0 — Critical — ✅ সব সমাধান হয়েছে ও verified

> সব P0 fix করা হয়েছে, typecheck + build + runtime test দিয়ে যাচাই করা হয়েছে (P0-5/P0-7 বাদে বাকি সব merge-এর আগে)।
> প্রতিটি section-এ নিচে **সমাধান** লেখা আছে।

## ✅ ১. অনলাইন পেমেন্ট — এখন COD-only enforce করা
- **সমাধান (done):** `api/server.ts`-এ `ACTIVE_PAYMENT_GATEWAYS` allow-list যোগ করা হয়েছে। যে gateway-এর real flow নেই (bKash/Nagad/SSLCommerz) সেটা config-এ `enabled` থাকলেও `checkout-options` ও অর্ডার validation-এ দেখায় না — কাস্টমার আর ভুল করে unpaid method বেছে নিতে পারবে না। ভবিষ্যতে integration শেষ হলে শুধু allow-list-এ নাম যোগ করলেই চালু হবে।
- **Verified:** bKash enable করে test → `methods=[COD]`, bKash দিয়ে order → `400 unavailable`।
- **অবস্থান:** `api/server.ts:220-224`, `api/server.ts:550-556`
- **সমস্যা:** bKash / Nagad / SSLCommerz কেবল admin-এ credential হিসেবে সেভ হয়। কোনো create-payment / execute / callback / webhook endpoint নেই। কেউ bKash সিলেক্ট করলে order সাথে সাথে `UNPAID` অবস্থায় তৈরি হয়ে success পেজে চলে যায় — কাস্টমার ভাবে পেমেন্ট হয়ে গেছে।
- **উপরন্তু:** `README.md:188` দাবি করে এগুলো "supported", যা বাস্তব নয়।
- **করনীয়:** অন্তত একটি gateway (BD-তে **SSLCommerz** সবচেয়ে সহজ) সত্যি implement করুন — order তৈরি → gateway redirect → callback verify → `paymentStatus=PAID`। অথবা যা কাজ করে না সেটা checkout-এ **লুকিয়ে দিন** (`checkout-options`).
- **যতক্ষণ না হয়:** COD ছাড়া অন্য method disable রাখুন।

## ✅ ২. Footer-এর নতুন ফিল্ড সেভ হচ্ছে (committed)
- **অবস্থান:** `api/server.ts` (zod footer schema)
- **সমস্যা ছিল:** schema-তে শুধু `enabled / copyright / links` ছিল; zod unknown key strip করে ফেলায় brand / logo / slogan / social / categories / contact **সেভ হচ্ছিল না**।
- **সমাধান (done, committed):** zod schema expand করা হয়েছে; commit `8f87461`. Runtime-এ verify করা হয়েছে (brand/social/slogan/email persist হয়)।

## ✅ ৩. Rate Limiting যোগ করা হয়েছে
- **সমস্যা ছিল:** `sign-in`/`sign-up`-এ brute-force / credential stuffing সম্ভব; newsletter ও order spam করা যায়।
- **সমাধান (done):** নতুন `api/lib/rate-limit.ts` (in-memory fixed-window limiter)। লাগানো হয়েছে — sign-up (10/15m), sign-in (20/15m), newsletter (10/1h), coupon (40/5m), orders (20/10m)। 429 + `Retry-After` + `X-RateLimit-*` হেডার দেয়।
- **Verified:** ২৫টা failed sign-in → 429; ১২টা newsletter → 429।

## ✅ ৪. Security Headers যোগ করা হয়েছে
- **সমস্যা ছিল:** HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` কিছুই ছিল না।
- **সমাধান (done):** `server.js`-এ global middleware — `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, baseline `Content-Security-Policy` (`frame-ancestors 'self'; object-src 'none'; base-uri 'self'`), এবং production-এ HSTS। API ও Next page দুই জায়গাতেই প্রযোজ্য।
- **Verified:** page ও API দুই জায়গায় হেডার উপস্থিত।
- **নোট:** strict `script-src` CSP ভাঙার ঝুঁকি থাকায় এখনো দেওয়া হয়নি (ভবিষ্যতে nonce সহ করা যায়)।

## ✅ ৫. Auth Token এখন httpOnly Cookie-তে
- **সমস্যা ছিল:** যেকোনো XSS-এ `epic-admin-token`/`epic-customer-token` চুরি হয়ে অ্যাকাউন্ট দখল হতে পারত।
- **সমাধান (done):** session এখন `epic_session` **httpOnly** cookie-তে (sameSite=lax, `secure` actual HTTPS-এ)। localStorage থেকে সব token সরানো হয়েছে — client শুধু cookie দিয়ে auth হয়; `Authorization: Bearer` fallback রাখা হয়েছে (API clients/tooling-এর জন্য)। sign-out-এ cookie ও session মুছে যায়। password reset-এ সব পুরনো session বাতিল হয়।
- **Verified:** sign-up `HttpOnly` cookie দেয় ও body-তে token নেই; cookie দিয়ে `/me` 200; cookie ছাড়া 401; bearer fallback 200; sign-out-এর পর session নেই।

## ✅ ৬. CORS Allow-list কঠোর করা হয়েছে
- **সমস্যা ছিল:** `cb(null, true)` — `credentials: true` সহ যেকোনো origin allow হয়ে যেত।
- **সমাধান (done):** শুধু `FRONTEND_URL` list + `*.gadgetlagbe.online` (strict regex) এবং dev-এ localhost reflect হয়; বাকি origin-এ `Access-Control-Allow-Origin` দেওয়া হয় না।
- **Verified:** `evil.example.com` → ACAO নেই; `woocommerce.gadgetlagbe.online` → reflect হয়।

## ✅ ৭. Email Verification + Self-service Password Reset যোগ করা হয়েছে
- **সমস্যা ছিল:** রেজিস্ট্রেশনে email যাচাই হতো না; পাসওয়ার্ড ভুলে গেলে কাস্টমার নিজে রিসেট করতে পারত না।
- **সমাধান (done):** User model-এ `emailVerificationToken/Expiry` ও `passwordResetToken/Expiry` (migration `20261015000000_add_auth_tokens`)। নতুন endpoint — `verify-email`, `resend-verification`, `forgot-password` (enumeration-safe), `reset-password` (weak password reject, reset-এ সব session বাতিল)। নতুন page `/verify-email` ও `/reset-password`; account-panel-এ "পাসওয়ার্ড ভুলে গেছেন?" + unverified banner। mail template যোগ (`sendEmailVerification`, `sendPasswordReset`)।
- **Verified:** verify token flow, reset token flow, weak password reject, পুরনো password ভাঙে, নতুন password কাজ করে, stale token reject — সব pass।
- **নোট:** আসল ইমেইল পাঠাতে SMTP configure থাকা লাগবে (এখানে SMTP ছিল না, তাই শুধু token logic যাচাই হয়েছে)।

## ✅ ৮. Tests / CI / DB Backup যোগ করা হয়েছে
- **সমস্যা ছিল:** কোনো automated test/CI/backup ছিল না; footer bug সেশনেই ধরা পড়েনি।
- **সমাধান (done):** `scripts/smoke.mjs` (`npm run smoke`, ৮টি endpoint/page), `scripts/backup-db.mjs` (`npm run db:backup`, timestamped mysqldump → `backups/`), এবং `.github/workflows/ci.yml` (MySQL service + typecheck + build)।
- **Verified:** smoke 8/8; backup 143 KB dump তৈরি হয়েছে।

---

# P1 — ✅ সব সমাধান হয়েছে ও verified

## ✅ ৯. STAFF-order category authorization enforce
- **সমাধান:** নতুন `staffCanAccessOrderItems()` (`api/middleware/security.ts`) — STAFF-এর `allowedCategories` (খালি হলে = unrestricted) অনুযায়ী order access check। `PATCH /api/admin/orders/:id` ও `send-steadfast`-এ enforce (না মিললে 403)। সাথে list filter-ও ঠিক করা হয়েছে (array handle করে, scope-এর বাইরের order বাদ যায়)। staff create-এ `allowedCategories` এখন array হিসেবে সেভ হয় (আগে stringify হয়ে restriction অকেজো ছিল)।
- **Verified:** mismatched staff → 403, matched → 200, no-scope → 200; list filtered।

## ✅ ১০. Password change-এ session invalidation
- **সমাধান:** নতুন `POST /api/auth/change-password` (current password যাচাই) — পাসওয়ার্ড বদলে **সব পুরনো session বাতিল** করে শুধু বর্তমান ডিভাইসের জন্য নতুন cookie দেয় (rotation)। account-panel-এ "নিরাপত্তা" ট্যাবে UI। (reset-password-ও আগেই সব session মুছে দিত।)
- **Verified:** ভুল current → 400; সঠিক → 200 + নতুন cookie; পুরনো session → 401; নতুন password দিয়ে sign-in → 200।

## ✅ ১১. Shop-এ incremental rendering (Load more)
- **সমাধান:** `components/shop-view.tsx` — প্রথমে ২৪টা card render, "আরও দেখুন" বাটনে পরের ব্যাচ (DOM/LCP হালকা; filter/size/count accuracy ধরে রাখতে full data fetch অপরিবর্তিত)। filter/sort বদলালে আবার ২৪-এ reset।
- **নোট:** খুব বড় catalogue-এর জন্য server `?page=&limit=` + facets একটি follow-up।

## ✅ ১২. Admin secret masking
- **সমাধান:** `api/server.ts` — GET ও PATCH response-এ `appSecret/password/pass/apiKey/secretAccessKey/...` গুলো `••••••••` মানে masked। খালি/মাস্কেড মান পাঠালে `mergeSecretConfig`/`mergeGateway` পুরনো আসল secret রাখে। email/courier/ai/storage সবই এখন prior-এর সাথে merge হয়।
- **Verified:** GET mask করে, non-secret appKey আগের মতো; masked পাঠালে DB-তে পুরনো আসল মান থাকে।

## ✅ ১৩. Shipping config (zone-wise)
- **সমাধান:** `StoreConfig.shippingConfig` (migration `20261016000000_add_shipping_config`) — `defaultCharge`, `freeAbove`, এবং zone list (`charge` + `districts`). `computeShippingCents()` district/division মিলিয়ে charge ঠিক করে; কোনো config না থাকলে fallback ৳80। checkout-options ও checkout page-এ live charge দেখায়; admin "Delivery" সেকশনে zone editor।
- **Verified:** Dhaka zone → 60, অন্য → 80, freeAbove (≥2000) → 0।

## ✅ ১৪. Graceful shutdown + crash handlers
- **সমাধান:** `server.js` — `SIGTERM`/`SIGINT`-এ server.close() + Prisma disconnect (১০s force-exit timeout); `unhandledRejection` লগ করে site আপ রাখে; `uncaughtException`-এ clean shutdown + exit 1 (host restart policy-র জন্য)।

## ✅ ১৫. Email retry + durable failed-email log
- **সমাধান:** `api/lib/mailer.ts` — প্রতিটি mail ৩ বার backoff সহ retry; সব attempt ব্যর্থ হলে নতুন `FailedEmail` টেবিলে (migration `20261016010000_add_failed_email`) persist। admin API `GET/POST resend/DELETE /api/admin/failed-emails` + Delivery সেকশনে "Failed Emails" কার্ড (resend/delete)।
- **Verified:** ব্যর্থ SMTP-এ order দিলে FailedEmail row তৈরি ও admin list-এ দেখায়।

---


# P2 — Medium

## ১৬. marketingPixels সেভ হয় কিন্তু Inject হয় না
- **অবস্থান:** `components/admin-panel.tsx:105,3510` (শুধু সেভ); storefront-এ কোনো inject নেই
- **সমস্যা:** GA / Meta Pixel / GTM / TikTok ID সেভ হলেও পেজে বসে না → analytics কাজ করে না।
- **সতর্কতা:** inject করার সময় raw scripts সাবধানে (admin-controlled হলেও XSS ঝুঁকি)।
- **করনীয়:** `<Script>` দিয়ে Pixels inject।

## ১৭. In-memory Cache (single instance only)
- **অবস্থান:** `api/lib/cache.ts` (`purgeCache` local; `MAX_ENTRIES=1000`)
- **সমস্যা:** একাধিক instance/দুটো ডেপ্লয়মেন্ট হলে cache আলাদা-আলাদা; horizontal scaling-এ inconsistent।
- **করনীয়:** বড় হলে Redis।

## ১৮. Images Unoptimized
- **অবস্থান:** `next.config.ts:27` (`unoptimized: true`)
- **সমস্যা:** বড় ছবি হুবহু যায় → bandwidth/মোবাইলে slow; shared host-এ optimizer-এর কারণেই অফ করা।
- **করনীয়:** CDN (Hostinger Object Storage/Cloudflare) + resized variants।

## ১৯. Prisma Pool ছোট (5) + Single Process
- **অবস্থান:** `api/lib/prisma.ts:14-17` (`connection_limit=5`, `pool_timeout=10`)
- **সমস্যা:** concurrency-র মূল সীমা; অনেক সমান্তরাল DB-hit এলে queue + timeout।
- **করনীয়:** লোড বাড়লে pool বাড়ান (তবে Hostinger shared `max_connections` মাথায় রাখা)।

## ২০. `express.json()` Default 100kb Limit
- **অবস্থান:** `api/server.ts:36`
- **সমস্যা:** অনেক variation/attribute সহ বড় product payload reject হতে পারে (413)।
- **করনীয়:** ইচ্ছাকৃত limit সেট (`express.json({ limit: '1mb' })`)।

## ২১. `x-forwarded-for` Trust (IP cooldown bypass)
- **অবস্থান:** `api/server.ts:567`, `api/middleware/security.ts:5-6`
- **সমস্যা:** header spoof করে IP-based spam guard bypass সম্ভব।
- **করনীয়:** শুধু trusted proxy থেকে IP নিন; প্রয়োজনে device/cookie fingerprintও।

## ২২. Coupon Code Enumeration
- **অবস্থান:** `api/server.ts:470-491`
- **সমস্যা:** `validate` endpoint দিয়ে coupon code ক্রমাগত guess করা যায় (rate limit নেই)।
- **করনীয়:** throttle + ভুল code-এ uniform response।

---

# P3 — Low / UX / Code quality

## ২৩. `error.tsx` / `not-found.tsx` / `global-error.tsx` নেই
- **অবস্থান:** `app/**` (শুধু `loading.tsx` আছে)
- **সমস্যা:** runtime error/404-এ branded পেজ নেই; UX/SEO খারাপ।
- **করনীয়:** custom error/404 পেজ।

## ২৪. Admin Panel একটাই বিশাল Component
- **অবস্থান:** `components/admin-panel.tsx` (~৪৮৪৮ লাইন), First-Load ~300kB
- **সমস্যা:** বড়, ধীর, মেইনটেইন করা কঠিন।
- **করনীয়:** section অনুযায়ী ভাগ করুন / lazy-load।

## ২৫. Middleware প্রতি Request-এ Status Fetch
- **অবস্থান:** `middleware.ts:90-121`
- **সমস্যা:** onboarding check এর জন্য internally `/api/store/status` কল (৬০s cache), কিন্তু onboarding-এর পরও প্রতি navigation-এ যাচাই।
- **করনীয়:** onboarded হলে যাচাই কমানো / static করা।

## ২৬. Next `start` Bridge Mode-এ Extra Hop
- **অবস্থান:** `app/api/[...path]/route.ts`
- **সমস্যা:** হোস্ট `next start` চালালে loopback-এ Express proxy হয় — প্রতি API call-এ বাড়তি overhead।
- **করনীয়:** নিশ্চিত করুন `server.js` startup file, নাহলে bridge-ই ডিফল্ট।

## ২৭. Admin-এ STAFF Role-এর সূক্ষ্ম সীমা
- **অবস্থান:** `prisma/schema.prisma:57` (`staffType`), `api/server.ts:819`
- **সমস্যা:** ORDER_MANAGER / PRODUCT_MANAGER পার্থক্য সব জায়গায় enforce নয়।
- **করনীয়:** endpoint-permission matrix।

## ✅ ২৮. Newsletter unsubscribe flow যোগ করা হয়েছে
- **সমাধান:** `NewsletterSubscriber`-এ `unsubscribeToken` (unique) + `unsubscribedAt` (migration `20261016020000_add_newsletter_unsubscribe`)। subscribe-এ token তৈরি, welcome mail-এ আসল unsubscribe লিংক। নতুন `POST /api/newsletter/unsubscribe` ও `/unsubscribe` পেজ (confirm-based)। আবার subscribe করলে `unsubscribedAt` ক্লিয়ার হয়।
- **Verified:** token issue, invalid token → 404, unsubscribe → unsubscribedAt সেট।

## ২৯. Health Check Database সচলতা যাচাই করে না
- **অবস্থান:** `api/server.ts:168` (`/health`)
- **সমস্যা:** endpoint শুধু `{ ok: true }` ফেরায়; DB সংযোগ নষ্ট হলেও hosting monitor অ্যাপটিকে healthy ভাবতে পারে।
- **করনীয়:** liveness check আলাদা রাখুন; readiness check-এ Prisma/MySQL connectivity যাচাই করে dependency ব্যর্থ হলে non-200 দিন।

## ৩০. Password Reset CLI-তে Password Argument হিসেবে যায়
- **অবস্থান:** `api/reset-password.ts:9-11`
- **সমস্যা:** CLI usage-এ plaintext password command argument-এ দেওয়া হয়; shell history կամ process listing-এ থেকে যেতে পারে।
- **করনীয়:** password interactive hidden prompt বা অনুমতিসুরক্ষিত secret input থেকে নিন; কমান্ডে সরাসরি password দেওয়ার উদাহরণ সরান।

## ৩১. Variable Product-এ Manual Out-of-Stock অবস্থা মানা হয় না
- **অবস্থান:** `api/server.ts:595-604` (order stock validation)
- **সমস্যা:** simple product-এ `manageStock=false` হলে `stock <= 0` যাচাই করে order আটকে দেয়; variable product-এর ক্ষেত্রে `manageStock=false` হলে ওই যাচাই নেই। ফলে variation-কে stock শূন্য রেখে manual out-of-stock করা হলেও order নেওয়া হতে পারে।
- **করনীয়:** simple ও variable product-এ manual availability-এর একই নিয়ম প্রয়োগ করুন; stock tracking বন্ধ থাকলেও admin-এর out-of-stock অবস্থা checkout-এ কার্যকর রাখুন।

---

# স্কেলেবিলিটি — কতোজন কাস্টমার handle করবে

**আর্কিটেকচার:** ১টি Node process (Express + Next SSR) + ১টি MySQL, Prisma pool = **5**।

| লোড | ধারণক্ষমতা |
|---|---|
| ব্রাউজিং (cached reads) | স্বাচ্ছন্দ্যে; কয়েকশ visiting/ঘণ্টা |
| সমান্তরাল DB-hit | একসাথে ~৫–১০ (pool limit) |
| Active concurrent users | ~৩০–৫০ |
| ১০০+ concurrent / flash sale | queue + timeout, ভাঙার ঝুঁকি |
| দৈনিক ভিজিটর | ~২,০০০–৫,০০০ (তবে একসাথে ১০০+ গেলে সমস্যা) |
| দৈনিক order | শতাধিক (ছোট/মাঝারি স্টোরের জন্য যথেষ্ট) |

**বড় করার শর্ত:** VPS + MySQL tuning + pool বাড়ানো + Redis + CDN + shop pagination → দৈনিক ~৫–২০ হাজার ভিজিটর সম্ভব।

---

# লঞ্চ করার উপযোগি কি?

**শর্তসাপেক্ষে হ্যাঁ — COD-only মডেলে।**

- শক্ত দিক: catalog, cart, checkout, order+stock+coupon **atomic transaction** (`api/server.ts:581-659`), admin, Steadfast courier, encrypted secrets, SSR, caching।
- **P0-র সব (১–৮) এখন সমাধান হয়েছে** ও verified — লঞ্চের আগের critical ঝুঁকি কমে গেছে।
- Online payment বাস্তবে implement করা হয়নি (দরকার হলে SSLCommerz ইত্যাদি)।
- লাইভ সাইটে পুরনো build চলছে → hPanel **Deploy → Build → Restart** ছাড়া পরিবর্তন আসবে না।

---

# দ্রুত করণীয় (action checklist)

## P0 — ✅ সম্পন্ন (typecheck + build + runtime test verified)
- [x] **P0-1** কাজ না করা payment method checkout থেকে hide (`ACTIVE_PAYMENT_GATEWAYS`)
- [x] **P0-2** footer fix commit (`8f87461`) — push + redeploy বাকি
- [x] **P0-3** auth/order/newsletter-এ rate limiting
- [x] **P0-4** security headers
- [x] **P0-5** token → httpOnly cookie
- [x] **P0-6** CORS allow-list কঠোর
- [x] **P0-7** email verification + forgot-password
- [x] **P0-8** automated DB backup + smoke test + CI

## P1 — ✅ সম্পন্ন (typecheck + build + runtime test verified)
- [x] **P1-9** STAFF order-update authorization
- [x] **P1-10** password change → session invalidation + rotation
- [x] **P1-11** shop load-more (incremental render)
- [x] **P1-12** admin secret masking
- [x] **P1-13** shipping config (zone wise)
- [x] **P1-14** graceful shutdown + crash handlers
- [x] **P1-15** email retry + failed-email log
- [x] **P1-28** newsletter unsubscribe flow

## বাকি
- [ ] **P2-29** database-aware readiness check
- [ ] **P2-30** password reset CLI secret input
- [ ] **P2-31** variable product manual stock check
- [ ] **P2** পিক্সেল inject, Redis, CDN, pool tuning
- [ ] **P3** error/404 পেজ, admin ভাগ করা, middleware/efficiency
