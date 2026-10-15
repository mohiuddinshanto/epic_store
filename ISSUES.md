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

# P0 — Critical (লঞ্চের আগে অবশ্যই)

## ১. অনলাইন পেমেন্ট আদৌ কাজ করে না (শুধু COD চলে)
- **অবস্থান:** `api/server.ts:220-224`, `api/server.ts:550-556`
- **সমস্যা:** bKash / Nagad / SSLCommerz কেবল admin-এ credential হিসেবে সেভ হয়। কোনো create-payment / execute / callback / webhook endpoint নেই। কেউ bKash সিলেক্ট করলে order সাথে সাথে `UNPAID` অবস্থায় তৈরি হয়ে success পেজে চলে যায় — কাস্টমার ভাবে পেমেন্ট হয়ে গেছে।
- **উপরন্তু:** `README.md:188` দাবি করে এগুলো "supported", যা বাস্তব নয়।
- **করনীয়:** অন্তত একটি gateway (BD-তে **SSLCommerz** সবচেয়ে সহজ) সত্যি implement করুন — order তৈরি → gateway redirect → callback verify → `paymentStatus=PAID`। অথবা যা কাজ করে না সেটা checkout-এ **লুকিয়ে দিন** (`checkout-options`).
- **যতক্ষণ না হয়:** COD ছাড়া অন্য method disable রাখুন।

## ২. Footer-এর নতুন ফিল্ড সেভ হচ্ছিল না (fix করা হয়েছে, commit বাকি)
- **অবস্থান:** `api/server.ts:1586` (zod footer schema)
- **সমস্যা:** schema-তে শুধু `enabled / copyright / links` ছিল; zod unknown key strip করে ফেলায় brand / logo / slogan / social / categories / contact **সেভ হচ্ছিল না**।
- **স্ট্যাটাস:** source-এ fix করা হয়েছে এবং runtime-এ verify করা হয়েছে (brand/social/slogan/email persist হয়)। **এখনো commit/push হয়নি।**
- **করনীয়:** commit + push + লাইভে redeploy।

## ৩. কোনো Rate Limiting নেই
- **অবস্থান:** `api/server.ts:407` (sign-up), `:419` (sign-in), `:194` (newsletter), `:515` (orders)
- **সমস্যা:** `sign-in`/`sign-up`-এ brute-force / credential stuffing সম্ভব; newsletter ও order spam করা যায়। শুধু optional IP cooldown আছে যা `enableIpLimit` **default `false`** (`prisma/schema.prisma:136`)।
- **করনীয়:** auth ও order-এ per-IP / per-route throttle (যেমন `express-rate-limit`), এবং fail-count-এ lockout।

## ৪. Security Headers / CSP নেই
- **অবস্থান:** `server.js:36-43`, `api/server.ts` (helmet নেই)
- **সমস্যা:** HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` কিছুই নেই → clickjacking / MIME sniffing ঝুঁকি।
- **করনীয়:** `helmet()` যোগ করুন + প্রযোজ্য CSP।

## ৫. Auth Token `localStorage`-এ (XSS-এ চুরি 가능)
- **অবস্থান:** `components/admin-panel.tsx:248` (`epic-admin-token`), `epic-customer-token` (সব view)
- **সমস্যা:** যেকোনো XSS হলে admin/customer token চুরি হয়ে অ্যাকাউন্ট দখল হতে পারে। পাশাপাশি admin HTML/rich-text render হয় বিধায় surface আছে।
- **করনীয়:** **httpOnly cookie**-তে সেশনে নিন, অথবা সচেতনভাবে ঝুঁকি মেনে নিয়ে CSP দিয়ে XSS কঠিন করুন।

## ৬. CORS কার্যত সব origin allow
- **অবস্থান:** `api/server.ts:25-35` (`cb(null, true)`)
- **সমস্যা:** `credentials: true` সহ যেকোনো origin কে allow করা হচ্ছে — allow-list কার্যকর নয়।
- **করনীয়:** কেবল `FRONTEND_URL` list reflect করুন, বাকিসমূহ reject।

## ৭. Email Verification নেই + Self-service Password Reset নেই
- **অবস্থান:** `prisma/schema.prisma:52` (`emailVerified` unused), `api/reset-password.ts` (শুধু CLI)
- **সমস্যা:** রেজিস্ট্রেশনে email যাচাই হয় না; পাসওয়ার্ড ভুলে গেলে কাস্টমার নিজে রিসেট করতে পারে না, admin CLI চালাতে হয়।
- **করনীয়:** verify-email ও forgot-password flow (token + ইমেইল)।

## ৮. No automated tests / CI / DB backup
- **অবস্থান:** `.github` নেই; কোনো `*.test.*` নেই; backup স্ক্রিপ্ট নেই
- **সমস্যা:** কোনো রিগ্রেশন ধরা পড়ে না (এই সেশনেই footer bug ধরেনি), আর ডেটাবেস করাপ্ট হলে (XAMPP incident) রিকভারি উপায় নেই।
- **করনীয়:** স্মোক টেস্ট + GitHub Actions, এবং scheduled MySQL dump (অন্তত দৈনিক)।

---

# P1 — High

## ৯. STAFF যেকোনো Order-এর Status/Payment বদলাতে পারে
- **অবস্থান:** `api/server.ts:823` (PATCH), `api/server.ts:819` (`restrictStaffOrderView` শুধু GET list filter করে)
- **সমস্যা:** `allowedCategories` ignore করে স্টাফ অন্য ক্যাটাগরির order-এর status এমনকি `paymentStatus=PAID` সেট করতে পারে।
- **করনীয়:** PATCH-এও category authorization enforce করুন।

## ১০. Password Reset / Session Invalidation
- **সমস্যা:** password বদলালে পুরনো session invalid হয় না; session ৩০ দিন ফিক্সড, rotate হয় না (`api/server.ts:415,426`)।
- **করনীয়:** password change-এ সব session মুছুন; সন্দেহ হলে session revoke UI।

## ১১. Shop পেজে Pagination ব্যবহার হয় না (catalog বড় হলে সমস্যা)
- **অবস্থান:** `components/shop-view.tsx:519` — `fetch('/api/products')` (পূর্ণ লিস্ট)
- **সমস্যা:** সার্ভার pagination সাপোর্ট করে (`api/server.ts:310-367`) কিন্তু frontend তা ব্যবহার করে না; প্রতিটি product-এ সব variation+attribute লোড হয় → catalog বাড়লে slow/heavy।
- **করনীয়:** infinite-scroll / "Load more" সহ `?page=&limit=` ব্যবহার।

## ১২. Admin-এ Decrypted Secret ব্রাউজারে যায়
- **অবস্থান:** `api/server.ts:1747` (PATCH response), `:1771` (GET)
- **সমস্যা:** appSecret / SMTP pass / API key প্লেইন JSON হিসেবে ক্লায়েন্টে আসে (ADMIN-only হলেও)।
- **করনীয়:** GET-এ secret mask করুন (যেমন `••••last4`); খালি পাঠালে পুরনো মান রাখুন (merge আগে থেকেই আছে)।

## ১৩. Shipping Hardcoded ৳80, admin-controlled নয়
- **অবস্থান:** `api/server.ts:618` (`subtotalCents > 0 ? 8000 : 0`), checkoutও ৮০ দেখায়
- **সমস্যা:** admin থেকে বদলানো যায় না; ঢাকা/ঢাকার বাইরে ভিন্ন rate দেওয়া যায় না (BD-তে দরকার)।
- **করনীয়:** shipping config (zone wise) admin settings-এ।

## ১৪. Graceful Shutdown / Crash Handler নেই
- **অবস্থান:** `server.js` (শুধু `main().catch`)
- **সমস্যা:** `SIGTERM`-এ পরিষ্কার shutdown নেই; `unhandledRejection`/`uncaughtException` handle নেই → একটা bug-এ পুরো site down।
- **করনীয়:** handler যোগ + restart policy (host level)।

## ১৫. Email fire-and-forget (হারিয়ে যেতে পারে)
- **অবস্থান:** `api/server.ts:672-696` (order email `.catch` করে ignore)
- **সমস্যা:** process crash/restart হলে order confirmation/owner notification হারাতে পারে; কোনো retry নেই।
- **করনীয়:** queue + retry (P2) বা অন্তত failed mail log/table।

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

## ২৮. Newsletter-এ Unsubscribe ব্যবস্থা নেই
- **অবস্থান:** `api/lib/mailer.ts:195`, `api/server.ts:194`, `prisma/schema.prisma:79`
- **সমস্যা:** স্বাগত ইমেইলে “one-click unsubscribe anytime” বলা আছে, কিন্তু unsubscribe endpoint/token flow বা subscriber-এর active/unsubscribed status নেই। প্রতিশ্রুত সুবিধাটি কাজ করে না।
- **করনীয়:** প্রতিটি subscriber-এর জন্য নিরাপদ unsubscribe token ও endpoint যোগ করুন; unsubscribe হওয়া email-এ আর marketing email পাঠাবেন না। পুনরায় subscribe করার নিয়মও নির্ধারণ করুন।

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
- **P0-র ১, ৩, ৪, ৫, ৮** না করলে ঝুঁকি।
- Online payment দরকার হলে সেটা এখনো বানানো হয়নি।
- লাইভ সাইটে পুরনো build চলছে → hPanel **Deploy → Build → Restart** ছাড়া পরিবর্তন আসবে না।

---

# দ্রুত করণীয় (action checklist)

- [ ] **P0-1** কাজ না করা payment method checkout থেকে hide (বা SSLCommerz implement)
- [ ] **P0-2** footer fix commit + push + redeploy
- [ ] **P0-3** auth/order/newsletter-এ rate limiting
- [ ] **P0-4** security headers (helmet)
- [ ] **P0-5** token → httpOnly cookie (বা CSP দিয়ে XSS crop)
- [ ] **P0-6** CORS allow-list কঠোর করুন
- [ ] **P0-7** email verification + forgot-password
- [ ] **P0-8** automated DB backup + smoke test/CI
- [ ] **P1-9** STAFF order-update authorization
- [ ] **P1-11** shop pagination
- [ ] **P1-12** admin secret masking
- [ ] **P1-13** shipping config (zone wise)
- [ ] **P1-14** graceful shutdown + crash handlers
- [ ] **P1-28** newsletter unsubscribe flow
- [ ] **P2-29** database-aware readiness check
- [ ] **P2-30** password reset CLI secret input
- [ ] **P2-31** variable product manual stock check
- [ ] **P2** পিক্সেল inject, Redis, CDN, pool tuning
- [ ] **P3** error/404 পেজ, admin ভাগ করা, middleware/efficiency
