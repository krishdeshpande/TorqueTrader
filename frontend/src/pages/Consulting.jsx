import { useState } from 'react';
import { Icons } from '../components/Icons';
import ConsultingBookingModal from '../components/ConsultingBookingModal';
import './Consulting.css';

const CONSULTING_TIERS = [
  {
    id: 'strategy_call',
    title: '1-on-1 Strategy & Selection Call',
    price: 2999,
    tag: 'MOST POPULAR',
    duration: '45-Minute Intensive Video / Phone Call',
    desc: 'Deep-dive consultation to finalize your vehicle choice, eliminate marketing hype, and equip you with dealer discount negotiation tactics.',
    features: [
      'Personalized review of your budget, city driving conditions, and usage',
      'Direct comparison of your top 2-3 shortlisted contenders',
      'Real-world maintenance, fuel efficiency, and common failure point breakdown',
      'Dealer proforma invoice audit (eliminating useless showroom add-on charges)',
      'Actionable consultation summary sent via WhatsApp'
    ]
  },
  {
    id: 'chat_advisory',
    title: '14-Day Private Concierge Chat Access',
    price: 4999,
    tag: 'CONTINUOUS ADVISORY',
    duration: '2 Weeks Direct WhatsApp Access',
    desc: 'Your private automotive consultant on retainer during your active buying window. Send test-drive reactions, quotation sheets, and questions anytime.',
    features: [
      'Unlimited direct 1-on-1 chat access for 14 days',
      'Real-time feedback on test-drive impressions and dealer interactions',
      'Dealer quotation & discount sheet vetting before signing',
      'Used car/bike advertisement link vetting (up to 4 listing links)',
      'Pre-delivery inspection (PDI) checklist tailored to your exact model'
    ]
  },
  {
    id: 'dossier_audit',
    title: 'Used Vehicle Ad & Inspection Dossier Audit',
    price: 6999,
    tag: 'PRE-PURCHASE DUE DILIGENCE',
    duration: 'Full Background Audit per Vehicle',
    desc: 'Comprehensive technical and legal background check on any pre-owned car or superbike listing to prevent costly hidden mechanical surprises.',
    features: [
      'Detailed audit of dealer/OLX/Spinny listing photos and description',
      'Authorized workshop service invoice and history verification',
      'Odometer tampering, flood damage, and structural repaint red-flag scan',
      'VAHAN title check: RTO registration, hypothecation status, and insurance validity',
      'Exact fair-market valuation & hard negotiation target price'
    ]
  },
  {
    id: 'concierge',
    title: 'End-to-End Vehicle Acquisition Concierge',
    price: 24999,
    tag: 'WHITE-GLOVE CONCIERGE',
    duration: 'Full Sourcing to Delivery Oversight',
    desc: 'Complete turn-key acquisition service for serious buyers, collectors, and enthusiasts seeking rare specifications or maximum value.',
    features: [
      'Dedicated sourcing across private collector networks and verified dealer channels',
      'Physical pre-purchase inspection coordination and mechanical audit',
      'Direct price negotiation executed on your behalf (typically saving 2x-5x our fee)',
      'RTO title transfer, Form 29/30 compliance, and NOC oversight',
      'Doorstep delivery coordination anywhere in India'
    ]
  }
];

const FAQS = [
  {
    q: "Why pay for automotive consulting when YouTube reviews are free?",
    a: "Automotive media and YouTube channels rely on manufacturer press cars, advertising budgets, and launch invites. They rarely experience long-term ownership, unscientific Indian speed-breaker impacts, or ₹2,00,000 gearbox breakdowns out of warranty. Our consulting is 100% independent, zero-kickback, and focused solely on protecting your hard-earned capital."
  },
  {
    q: "Do you handle both cars and motorcycles?",
    a: "Yes. Our advisory covers the entire spectrum: from ₹4L daily beaters (Polo, Swift, City) and family SUVs (Creta, Thar, XUV700, Scorpio-N, Innova) to luxury performance sedans (Virtus GT, Octavia vRS, BMW M340i, 330i, Porsche 718/911) and superbikes (Street Triple, ZX-10R, Panigale, S1000RR)."
  },
  {
    q: "How does the consultation session take place?",
    a: "Strategy calls take place over Google Meet or direct WhatsApp Phone call at your chosen time slot. Chat advisory is conducted via a private WhatsApp thread directly with our lead consultant."
  },
  {
    q: "Can you help negotiate dealer discounts on new cars?",
    a: "Absolutely. We audit dealer quotation sheets to strip out overpriced insurance markups, mandatory accessory packages, handling charges, and extended warranties, equipping you with exact counter-offer scripts."
  }
];

export default function Consulting() {
  const [selectedTier, setSelectedTier] = useState(null);

  return (
    <div className="consulting-root">
      {/* ── Top Hero ──────────────────────────────────────────────────────── */}
      <section className="consulting-hero">
        <div className="container">
          <div className="consulting-hero-inner">
            <span className="badge badge-red" style={{ marginBottom: 12 }}>
              1-ON-1 PERSONALIZED AUTOMOTIVE CONSULTING
            </span>
            <h1 className="consulting-main-title">
              Independent Advice for Serious Vehicle Buyers.
            </h1>
            <p className="consulting-hero-desc">
              Buying a vehicle in India involves navigating biased showroom salesmen, fragile transmissions, opaque used car histories, and dealer markups. We represent you—the buyer—with zero conflicts of interest.
            </p>

            <div className="hero-stats-banner">
              <div className="hero-stat-col">
                <span className="h-stat-num">100%</span>
                <span className="h-stat-lbl">Independent & Unbiased</span>
              </div>
              <div className="hero-stat-col">
                <span className="h-stat-num">₹1.5L+</span>
                <span className="h-stat-lbl">Average Client Savings</span>
              </div>
              <div className="hero-stat-col">
                <span className="h-stat-num">₹3L - ₹2Cr+</span>
                <span className="h-stat-lbl">Full Vehicle Spectrum</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Consulting Packages Grid ──────────────────────────────────────── */}
      <section className="consulting-packages-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">ADVISORY PACKAGES</span>
              <h2 className="section-heading">Select Your Consulting Tier</h2>
              <p className="section-subtext">Clear, upfront pricing with guaranteed buyer-first focus.</p>
            </div>
          </div>

          <div className="packages-grid-layout">
            {CONSULTING_TIERS.map((tier) => (
              <div key={tier.id} className="tier-card-box">
                <div className="tier-top-tag">{tier.tag}</div>
                <h3 className="tier-title">{tier.title}</h3>
                <div className="tier-price-row">
                  <span className="tier-price-val">Rs {tier.price.toLocaleString('en-IN')}</span>
                  <span className="tier-duration-val">/ {tier.duration}</span>
                </div>
                <p className="tier-desc">{tier.desc}</p>

                <div className="tier-features-list">
                  {tier.features.map((feat, i) => (
                    <div key={i} className="tier-feat-row">
                      <span className="feat-check">{Icons.check}</span>
                      <span className="feat-text">{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-primary tier-cta-btn"
                  onClick={() => setSelectedTier(tier)}
                >
                  Book {tier.title.split(' ')[0]} Session
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Consulting Pays for Itself ───────────────────────────────── */}
      <section className="roi-value-section">
        <div className="container">
          <div className="roi-card-banner">
            <div className="roi-content">
              <span className="badge badge-gray" style={{ marginBottom: 8 }}>VALUE PROPOSITION</span>
              <h2 className="roi-title">Why Consulting Pays for Itself on Day One</h2>
              <p className="roi-desc">
                When purchasing a ₹10 Lakh to ₹50 Lakh+ vehicle, a single avoided DSG mechatronics replacement (₹1.8 Lakhs), an uncovered accident history, or an audited dealer insurance quote immediately saves 5x to 20x the cost of our consultation fee.
              </p>
            </div>
            <div className="roi-numbers-grid">
              <div className="roi-item">
                <span className="roi-k">Dealer Insurance Savings</span>
                <span className="roi-v">₹25,000 - ₹65,000</span>
              </div>
              <div className="roi-item">
                <span className="roi-k">Avoided Transmission Repair</span>
                <span className="roi-v">₹1,20,000 - ₹2,50,000</span>
              </div>
              <div className="roi-item">
                <span className="roi-k">Used Car Negotiation Target</span>
                <span className="roi-v">₹40,000 - ₹1,80,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ───────────────────────────────────────────────────── */}
      <section className="consulting-faq-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">COMMON QUESTIONS</span>
              <h2 className="section-heading">Frequently Asked Questions</h2>
            </div>
          </div>

          <div className="faq-cards-grid">
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-card">
                <h4 className="faq-q">{faq.q}</h4>
                <p className="faq-a">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedTier && (
        <ConsultingBookingModal
          tier={selectedTier}
          onClose={() => setSelectedTier(null)}
        />
      )}
    </div>
  );
}
