# Maritime Promoter – Complete Rebrand Plan (Step by Step)

Do one step at a time. When Step 1 is done and you’re happy, say "next" and we’ll do Step 2.

---

## Step 1: Brand name, identity & metadata
**Goal:** The site uses “Maritime Promoter” everywhere (no “Doctor Promoter” or “doctorpromoter”).  
**Includes:**
- All visible brand name: Doctor Promoter → Maritime Promoter
- Emails: doctorpromoter@... → maritimepromoter@...
- Metadata in `layout.js`: title, description, keywords, Open Graph, Twitter
- Logo alt text: “Maritime Promoter Logo”
- Session/storage keys: doctorpromoter_* → maritimepromoter_*
- API base URLs and backend CORS for maritime domains
- README updated to Maritime Promoter

**Does not include:** Logos/images, theme colors, content rewrite, or new imagery.

---

## Step 2: Logos & favicons ✅ (code done – replace image files)
**Goal:** Replace all logo and icon files with Maritime Promoter branding.  
**Done in code:**
- ✅ `site.webmanifest`: name, short_name, description set to Maritime Promoter
- ✅ Navbar & Footer use `/imgs/android-chrome-512x512.png` with alt "Maritime Promoter Logo"
- ✅ All favicon/icon links in layout point to correct paths

**You do:** Replace the image files in `frontend/public/imgs/` (see **LOGO_FAVICON_GUIDE.md** for paths and sizes). Optional: delete or replace `doctor-logo-1.jpg`.

---

## Step 3: Maritime theme (colors & fonts) ✅
**Goal:** Visual theme that feels “maritime” (teals, navy, ocean).  
**Done:**
- ✅ Tailwind: primary teal (#139A93), navy (#0A1628), ocean blue accents (#0E4C92, #1A6BB8)
- ✅ Gradients: teal + navy (unchanged, already maritime)
- ✅ globals.css: CSS variables `--maritime-primary`, `--maritime-navy`, `--maritime-ocean` for non-Tailwind use
- ✅ Fonts: existing Poppins, DM Serif, Exo 2, Sora, Space Grotesk kept (work well for maritime/professional)

---

## Step 4: Content & copy (maritime language) ✅
**Goal:** All text speaks to maritime industry, not healthcare.  
**Done:**
- ✅ whoIsItForContent: clinics → Shipping Companies, hospitals → Ports & Terminals, labs → Maritime Offices (copy only; route keys unchanged)
- ✅ serviceContent: compliances, content, marketing — maritime wording (ISM/ISO, client, vessel, etc.)
- ✅ Home, Services, About, Contact, Team, Who is it for, Trainings, Training calendar, Doctor platform, Blog: healthcare/patient/clinic/NABH/NABL replaced with maritime equivalents
- ✅ Navbar: dropdown labels (Maritime Content, New Company Setup, Vessel & Port Buy & Sell, Client Communication, etc.) and regulatory descriptions updated

---

## Step 5: Images & media (code done)
**Goal:** Replace healthcare imagery with maritime imagery.  
**Includes:**
- Hero images (home-hero-1, home-hero-2, home-hero-3)
- Section images (home-learn, blog, about, who-is-it-for)
- Any other photos/illustrations that are clearly “doctor/clinic”  
**Done in code:** HeroSlider + HomeLearnMore use maritime copy and Pexels maritime images. See **IMAGES_MEDIA_GUIDE.md** for all image paths and what to replace. You provide final image files.

---

## Step 6: Final sweep & links
**Goal:** No leftover doctor/healthcare references; correct external links.  
**Includes:**
- Search for any remaining “doctor”, “clinic”, “hospital”, “patient”, “medical”
- Calendly, Razorpay, social links point to Maritime Promoter
- Backend env/docs if they mention Doctor Promoter

---

**Current status:** Step 1 is done. When you’re ready, say "next" for Step 2.
