import React, { useState } from 'react';

const SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    faqs: [
      { q: 'What is RentAll?', a: 'RentAll is a peer-to-peer rental marketplace where anyone can rent out items they own or borrow items from people nearby. From cameras and kayaks to tools and tents — if you own it, you can list it.' },
      { q: 'Do I need an account to browse listings?', a: 'You can browse active listings without an account. However, you\'ll need a registered account to rent an item, create listings, or send messages.' },
      { q: 'How do I create an account?', a: 'Click the "Account" tab in the navigation bar. Fill in your name, email, and contact details to get started. Your profile will be visible to other users when you list or rent items.' },
      { q: 'Is RentAll free to use?', a: 'Browsing and listing items is free. RentAll takes a small service fee on completed transactions to cover platform maintenance and payment processing.' },
    ],
  },
  {
    id: 'renting',
    title: 'Renting an Item',
    icon: '📦',
    faqs: [
      { q: 'How do I rent an item?', a: 'Browse the listings on the Browse tab, find an item you need, and click "Rent." You\'ll be taken to a checkout page where you select your rental dates, review the total cost, and confirm your booking.' },
      { q: 'How is the rental price calculated?', a: 'Each listing shows a daily rate set by the owner. Your total is simply the number of days × daily rate. You\'ll see the full cost before confirming.' },
      { q: 'Can I cancel a rental?', a: 'Yes. Navigate to your Account page, find the rental under "Your rentals," and select Cancel. Cancellation policies vary by listing owner — check the item description before booking.' },
      { q: 'What if an item is damaged during my rental?', a: 'You are responsible for returning items in the same condition you received them. If damage occurs, contact the owner directly via Messages to arrange a resolution. RentAll recommends documenting item condition with photos at pickup.' },
      { q: 'How do I contact the item owner?', a: 'Once you\'ve found an item you\'re interested in, you can message the owner directly through the Messages tab. Use their listed email or start a new conversation from your inbox.' },
    ],
  },
  {
    id: 'listing',
    title: 'Listing Your Items',
    icon: '🏷️',
    faqs: [
      { q: 'How do I list an item?', a: 'Go to the "My Listings" tab and fill out the form with your item\'s title, daily price, location, a photo, and an optional description. Submit it as a draft, review it, then click "Publish" to make it live.' },
      { q: 'What makes a good listing?', a: 'Clear, honest photos taken in good lighting make the biggest difference. Write a description that covers condition, any accessories included, pickup/delivery details, and any restrictions (e.g., no use in rain).' },
      { q: 'Can I edit or remove my listing?', a: 'Yes. Pending (unpublished) listings can be edited at any time from My Listings. Active listings can be removed — they\'ll be taken offline immediately.' },
      { q: 'How do I set a fair price?', a: 'A common guideline is 5–10% of the item\'s retail value per day. Check similar listings on RentAll for reference. Pricing too high leaves your item sitting; pricing too low undervalues your asset.' },
      { q: 'What items are not allowed on RentAll?', a: 'Prohibited items include weapons, hazardous materials, prescription medications, stolen goods, and anything illegal in your jurisdiction. Listing such items will result in removal and possible account suspension.' },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Fees',
    icon: '💳',
    faqs: [
      { q: 'How do payments work?', a: 'RentAll processes payments securely at the time of booking confirmation. Funds are held until the rental period begins, then released to the owner.' },
      { q: 'What payment methods are accepted?', a: 'Major credit and debit cards (Visa, Mastercard, American Express) and digital wallets (Apple Pay, Google Pay) are accepted.' },
      { q: 'When do owners get paid?', a: 'Payment is released to the owner 24 hours after the rental start date, once the renter has confirmed pickup. In case of a dispute, release may be delayed pending review.' },
      { q: 'Are there any hidden fees?', a: 'No hidden fees. The total shown on checkout is what you pay. RentAll\'s service fee is included in the displayed price breakdown.' },
    ],
  },
  {
    id: 'safety',
    title: 'Safety & Trust',
    icon: '🛡️',
    faqs: [
      { q: 'How does RentAll verify users?', a: 'Users confirm their email address at signup. For high-value items, owners can require ID verification before accepting a booking. We recommend reviewing a user\'s rental history and ratings before transacting.' },
      { q: 'What should I do before handing over an item?', a: 'Meet in a safe, public location when possible. Take timestamped photos of the item\'s condition before handoff. Confirm the renter\'s identity matches their profile. Keep all communication within RentAll\'s message system.' },
      { q: 'How do I report a problem or suspicious user?', a: 'Use the "Report" button on any listing or user profile, or contact support at support@rentall.app. We review all reports within 24 hours.' },
      { q: 'Is my personal information safe?', a: 'RentAll does not share your personal contact details publicly. Your email is only shared with the other party after a booking is confirmed. All data is encrypted in transit and at rest.' },
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: '👤',
    faqs: [
      { q: 'How do I update my profile?', a: 'Go to the Account tab to view your profile. Click "Edit Profile" to update your name, location, profile photo, or contact information.' },
      { q: 'How do I see my rental history?', a: 'Your Account page shows all past and active rentals under "Your rentals," and all your listings under "Your listings."' },
      { q: 'Can I have multiple accounts?', a: 'No. Each person may have one account. Creating duplicate accounts to circumvent restrictions is a violation of our terms and may result in a permanent ban.' },
      { q: 'How do I delete my account?', a: 'Contact support at support@rentall.app to request account deletion. Active rentals must be resolved before deletion can be processed.' },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'faq-item' + (open ? ' faq-item--open' : '')}>
      <button className="faq-q" onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        <span className="faq-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

export default function Help() {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);

  const q = query.trim().toLowerCase();
  const filtered = SECTIONS.map(s => ({
    ...s,
    faqs: q ? s.faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)) : s.faqs,
  })).filter(s => s.faqs.length > 0);

  return (
    <div className="help-page">
      <div className="help-hero">
        <h2>How can we help?</h2>
        <p className="muted">Search our help center or browse topics below.</p>
        <input
          className="help-search"
          placeholder="Search help articles…"
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveSection(null); }}
        />
      </div>

      {!q && (
        <div className="help-topics">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={'help-topic-card' + (activeSection === s.id ? ' help-topic-card--active' : '')}
              onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
            >
              <span className="help-topic-icon">{s.icon}</span>
              <span className="help-topic-title">{s.title}</span>
            </button>
          ))}
        </div>
      )}

      <div className="help-faqs">
        {(q ? filtered : filtered.filter(s => !activeSection || s.id === activeSection)).map(s => (
          <div key={s.id} className="help-section">
            <h3 className="help-section-title">{s.icon} {s.title}</h3>
            {s.faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="help-no-results">
            <p>No results for "<strong>{query}</strong>".</p>
            <p className="muted">Try different keywords, or <a href="mailto:support@rentall.app" className="help-link">contact support</a>.</p>
          </div>
        )}
      </div>

      <div className="help-contact">
        <h3>Still need help?</h3>
        <p className="muted">Our support team is available Monday–Friday, 9am–6pm CT.</p>
        <div className="help-contact-options">
          <a href="mailto:support@rentall.app" className="help-contact-btn">✉ Email support</a>
          <a href="tel:+18005550199" className="help-contact-btn help-contact-btn--secondary">📞 1-800-555-0199</a>
        </div>
      </div>
    </div>
  );
}
