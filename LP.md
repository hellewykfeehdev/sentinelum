# Sentinelum Landing Page Brief

Build a premium, dark, interactive B2B SaaS landing page for **Sentinelum**.

Sentinelum is a human oversight proof layer for AI decisions. It creates cryptographic certificates proving that a human reviewed, approved, modified, rejected or escalated an AI-generated decision.

The landing page must feel like high-end enterprise infrastructure: Stripe + Vercel + Cloudflare + Palantir + subtle Black Mirror energy. Avoid generic AI visuals, robots, glowing brains, stock people or startup clichés.

---

## 1. Important Asset Provided by Founder

The founder is providing a looping video of a futuristic digital certificate.

Place the video here:

```txt
/public/videos/hero-certificate-loop.webm
```

Also support fallback path if needed:

```txt
/public/videos/hero-certificate-loop.mp4
```

Use this video in the hero section as the main visual.

Requirements:

- Autoplay
- Loop
- Muted
- Plays inline
- No visible video controls
- Rounded premium container
- Glass border
- Soft cyan/blue glow
- Lazy load if possible
- Respect reduced motion preferences
- Add a clean fallback card if video is missing

Example implementation idea:

```tsx
<video
  autoPlay
  loop
  muted
  playsInline
  className="rounded-3xl border border-white/10 shadow-2xl"
>
  <source src="/videos/hero-certificate-loop.webm" type="video/webm" />
  <source src="/videos/hero-certificate-loop.mp4" type="video/mp4" />
</video>
```

---

## 2. Brand Direction

Brand name:

```txt
Sentinelum
```

Positioning:

```txt
The human control layer for AI decisions.
```

Main promise:

```txt
When AI acts, Sentinelum proves who stayed in control.
```

Style keywords:

```txt
enterprise
cryptographic
forensic
secure
futuristic
regulatory
premium
minimal
technical
```

Do not make it look like a typical AI wrapper.

---

## 3. Visual System

Colors:

```txt
Background: #05070D
Card: #0B1020
Card border: rgba(255,255,255,0.12)
Primary cyan: #22D3EE
Primary blue: #2563EB
Soft purple accent: #A78BFA
Main text: #F8FAFC
Secondary text: #94A3B8
Muted text: #64748B
Danger/risk accent: #F97316
Success accent: #10B981
```

Typography:

```txt
Headlines: Sora or Space Grotesk
Body: Inter
Code: JetBrains Mono
```

UI style:

- Dark mode first.
- Technical grid background.
- Glass cards.
- Thin borders.
- Subtle gradients.
- Premium glow, not too much neon.
- Smooth scroll animations.
- Responsive for mobile, tablet and desktop.

---

## 4. Page Structure

Build these sections:

```txt
1. Header
2. Hero
3. Trust/Problem strip
4. Product flow
5. Interactive certificate simulation
6. API-first section
7. Dashboard preview
8. Use cases
9. Pricing CTA
10. FAQ
11. Final CTA
12. Footer
```

---

## 5. Header

Header should be sticky or semi-sticky with glass effect.

Items:

```txt
Logo: Sentinelum
Nav: Product, API, Use Cases, Pricing, FAQ
CTA: Start protecting AI decisions
Secondary: Sign in
```

Logo idea:

- Wordmark: Sentinelum
- Optional mark: shield/eye/check/audit trail style
- Keep it simple and scalable

---

## 6. Hero Section

Left side:

Headline:

```txt
AI is making decisions. Sentinelum proves who stayed in control.
```

Subheadline:

```txt
Generate cryptographic evidence of human oversight for every critical AI decision — with timestamps, reviewer identity, immutable hashes, signed PDFs and audit-ready API logs.
```

CTA buttons:

```txt
Start protecting AI decisions
View API example
```

Micro proof badges:

```txt
Cryptographic hashes
Human reviewer identity
Signed certificates
Audit-ready logs
```

Right side:

Use the founder-provided looping certificate video:

```txt
/public/videos/hero-certificate-loop.webm
```

Overlay small floating UI cards:

```txt
Human oversight recorded
Payload hash generated
Certificate issued
Verification URL ready
```

Add subtle animated data lines around the video if performance allows.

---

## 7. Problem Strip

Create a sharp section after hero.

Headline:

```txt
Your AI may explain what it recommended. But can you prove who reviewed it?
```

Three cards:

```txt
1. AI decisions are hard to defend after the fact.
2. Human review is often undocumented or scattered across tools.
3. Regulators, insurers and enterprise buyers increasingly expect evidence.
```

Tone: serious, not fearmongering.

---

## 8. Product Flow Section

Show this flow visually:

```txt
AI Output Generated
↓
Human Review Captured
↓
Cryptographic Stamp Created
↓
Certificate Issued
```

Each step should be a card with icon, short explanation and animated connection line.

Copy:

```txt
Sentinelum turns every reviewed AI output into a signed oversight certificate.
```

---

## 9. Interactive Certificate Simulation

Create a simulated certificate generator.

UI fields shown as pre-filled sample data:

```txt
AI System: Credit Copilot
Model: gpt-5.5
AI Output: Approve customer claim with medium risk.
Reviewer: Sarah Mitchell, Risk Analyst
Decision: Modified before approval
Risk Flags: financial_decision, customer_impact
```

Button:

```txt
Generate sample certificate
```

On click:

- Animate loading.
- Show hash appearing.
- Show status: `Certificate issued`.
- Show mock certificate ID: `SEN-2026-000001`.

This can be frontend-only for the LP.

---

## 10. API-First Section

Headline:

```txt
Add human oversight proof in one API call.
```

Show polished code block:

```ts
await sentinelum.certificates.create({
  ai_system_name: "Credit Copilot",
  model_name: "gpt-5.5",
  ai_output,
  human_reviewer: {
    name: "Sarah Mitchell",
    email: "sarah@company.com",
    role: "Risk Analyst"
  },
  decision: "approved",
  risk_flags: ["financial_decision"]
});
```

Next to the code block, show output:

```json
{
  "status": "issued",
  "certificate_number": "SEN-2026-000001",
  "certificate_hash": "9f41c2a8...",
  "verification_url": "https://sentinelum.cloud/verify/cert_xxx"
}
```

---

## 11. Dashboard Preview Section

Create a realistic dashboard mock inside the LP.

Metrics:

```txt
Total Certificates: 18,420
Human Approvals: 12,901
Modified Decisions: 3,204
Rejected AI Outputs: 742
Avg Review Time: 2m 14s
Risk Flags: 1,582
```

Show charts/cards for:

```txt
Certificates over time
Approvals vs rejections
Usage meter
Risk flags by category
Recent certificates
```

Can be built as static UI. No backend needed for LP mock.

---

## 12. Use Cases Section

Create cards for:

```txt
Fintech
Insurance
Legal AI
Healthcare
HR & Recruiting
Customer Support AI
AI Automation Agencies
```

Each card should explain:

1. What AI decision happens.
2. What risk exists.
3. How Sentinelum creates proof.

Example:

```txt
Fintech
AI recommends credit limits, fraud actions or account reviews. Sentinelum records the reviewer, decision context and cryptographic proof before action.
```

---

## 13. Pricing CTA Section

Initial launch pricing:

```txt
Sentinelum Annual
One annual plan
All core features unlocked
Included certificate quota
Usage-based billing after quota
```

Do not overcomplicate pricing with many plans at launch.

CTA:

```txt
Start protecting AI decisions
```

Secondary note:

```txt
Built for teams shipping AI into regulated, sensitive or high-risk workflows.
```

---

## 14. FAQ

Include questions:

```txt
Is Sentinelum an AI model?
No. Sentinelum is an oversight proof layer for AI systems.

Do we need to replace our existing AI stack?
No. Sentinelum works through API calls and can be added to existing workflows.

Do you store our AI outputs?
By default, Sentinelum can store hashes and certificate metadata. Teams should avoid sending sensitive raw data unless required.

Is this legal advice?
No. Sentinelum provides technical evidence and audit trails, not legal advice.

Can certificates be verified publicly?
Yes. Each certificate can have a verification URL.
```

---

## 15. Final CTA

Headline:

```txt
Start with one AI workflow. Prove every critical decision after that.
```

Subcopy:

```txt
Create signed, timestamped evidence of human oversight before AI decisions become business risk.
```

CTA:

```txt
Start protecting AI decisions
```

---

## 16. Footer

Include:

```txt
Sentinelum
Product
API Docs
Pricing
Security
Contact
Terms
Privacy
```

Footer microcopy:

```txt
Sentinelum creates cryptographic evidence of human oversight for critical AI decisions.
```

---

## 17. Asset Checklist

Use these paths:

```txt
/public/brand/logo.svg
/public/brand/logo-mark.svg
/public/videos/hero-certificate-loop.webm
/public/videos/hero-certificate-loop.mp4
/public/images/certificate-preview.png
/public/images/dashboard-preview.png
/public/images/api-code-preview.png
/public/og/og-image.png
```

If an asset is missing, create an elegant code/UI placeholder instead of breaking the page.

---

## 18. Performance Requirements

- Page must be fast.
- Optimize video loading.
- Use responsive sizes.
- Avoid heavy 3D if the provided video is enough.
- Respect prefers-reduced-motion.
- Keep animations smooth and subtle.
- Use semantic HTML.
- Add metadata and Open Graph tags.

---

## 19. SEO Metadata

Title:

```txt
Sentinelum — Human Oversight Proof for AI Decisions
```

Description:

```txt
Generate cryptographic evidence of human oversight for critical AI decisions with timestamps, reviewer identity, immutable hashes, signed PDFs and audit-ready API logs.
```

OG title:

```txt
Sentinelum proves who stayed in control when AI makes decisions.
```

---

## 20. Quality Bar

The LP must look like a serious enterprise product, not a generic AI landing page.

Before finishing:

- Check mobile responsiveness.
- Check CTA links.
- Check video fallback.
- Check dark-mode contrast.
- Check that all sections are polished.
- Check that the page feels premium and trustworthy.
