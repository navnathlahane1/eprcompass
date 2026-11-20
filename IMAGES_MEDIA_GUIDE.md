# Step 5: Maritime Promoter – Images & Media Guide

Replace healthcare/clinical imagery with maritime-themed images. Paths below are under **`frontend/public/imgs/`** unless noted.

---

## Hero & home (updated in code)

- **HeroSlider** (home carousel) and **HomeLearnMore** now use **maritime-themed Pexels URLs** (ships, port, ocean). You can keep them or swap to your own by editing:
  - `components/HeroSlider.jsx` → `slides[].bg`
  - `components/home/HomeLearnMore.jsx` → `img src`

---

## Replace these files (drop new image, same filename)

| File | Used in | Suggested replacement |
|------|--------|------------------------|
| **blog1.jpg** – **blog5.jpg** | Blog listing (`app/blog/page.jsx`) | Maritime industry, vessels, port, logistics, compliance |
| **Our_Company_Image.png** | About, Doctor platform, Ecovijay platform (company tab) | Maritime office / team / vessels |
| **Our_Culture_Image.png** | About, Doctor platform, Ecovijay (culture tab) | Team, workplace, maritime culture |
| **Our_Impact_Image.png** | About, Ecovijay (impact tab) | Impact: ports, ships, growth |
| **tabbed-image.jpg** | (If used in tabbed sections) | Maritime scene |

---

## Who is it for – hero & testimonial images

Data in **`data/whoIsItForContent.js`** references these. **Either** add new files with these names **or** reuse one maritime image for all (e.g. copy one as `shipping-hero.jpg` and set all hero images to it).

| Path in code | Section | Suggested content |
|--------------|---------|-------------------|
| `/imgs/maritime-students-hero.jpg` | Maritime Students | Cadets, training, maritime academy |
| `/imgs/maritime-testimonial-1.jpg`, `maritime-testimonial-2.jpg` | Maritime Students testimonials | Headshots or generic maritime |
| `/imgs/maritime-professionals-hero.jpg` | Maritime Professionals | Professionals, vessels, office |
| `/imgs/maritime-testimonial-3.jpg`, `maritime-testimonial-4.jpg` | Maritime Professionals testimonials | Headshots or generic |
| `/imgs/clinics-hero.jpg` | Shipping Companies | Ships, fleet, shipping company |
| `/imgs/testimonial-5.jpg` – `testimonial-6.jpg` | Shipping Companies testimonials | Headshots or generic |
| `/imgs/hospitals-hero.jpg` | Ports & Terminals | Port, terminal, cranes |
| `/imgs/testimonial-7.jpg` – `testimonial-8.jpg` | Ports & Terminals testimonials | Headshots or generic |
| `/imgs/labs-hero.jpg` | Maritime Offices | Office, maritime operations |
| `/imgs/testimonial-9.jpg` – `testimonial-10.jpg` | Maritime Offices testimonials | Headshots or generic |

**If you don’t add the maritime-* files:** copy an existing hero (e.g. `clinics-hero.jpg`) to `maritime-students-hero.jpg` and `maritime-professionals-hero.jpg` so those sections don’t 404.

---

## Team photos

| File | Used in | Note |
|------|--------|------|
| **team-member-1.jpg** | Team page – EPR Compass team | Add real or placeholder |
| **team-member-2.jpg** | Team page – Dr. Amit Vatkar | Add real or placeholder |
| **team-member-3.jpg** | Team page – Mr. Vijay Sawal | Add real or placeholder |

---

## Regulatory / compliance pages

| File | Used in | Suggested replacement |
|------|--------|------------------------|
| **factory-license-bg.jpg** | All regulatory service heroes (`data/regulatoryContent.js`) | One maritime/compliance background (e.g. port, documents, vessel) and keep same filename, or add `maritime-compliance-bg.jpg` and we can point code to it |

---

## Other

| File | Used in | Note |
|------|--------|------|
| **mumbai.jpg** | Contact/offices (`components/contact/ContactOffice.jsx`) | Office/location image; add if missing |
| **tcfd-brain.jpg** | Reporting content (`data/reportingContent.js`) | Replace with maritime/sustainability image if needed |
| **doctor-logo-1.jpg** | Not referenced in code | Safe to remove or replace with Maritime Promoter asset |

---

## Optional: local hero images

If you prefer **local** hero images instead of Pexels:

1. Add e.g. `home-hero-maritime-1.jpg`, `home-hero-maritime-2.jpg` under `public/imgs/`.
2. In **HeroSlider.jsx**, set `slides[].bg` to `"/imgs/home-hero-maritime-1.jpg"` etc.
3. In **HomeLearnMore.jsx**, set `img src` to `"/imgs/home-learn-maritime.jpg"` (or similar).

---

**Step 5 (code):** Hero and HomeLearnMore copy and image URLs are updated to maritime. Replace the files above with your own assets to complete the visual rebrand.
