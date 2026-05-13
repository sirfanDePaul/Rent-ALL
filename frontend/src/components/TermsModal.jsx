import React from 'react';

export default function TermsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h2>Terms and Conditions</h2>
          <span className="terms-modal-close" onClick={onClose} title="Close">&times;</span>
        </div>
        <div className="terms-modal-body">
          <p className="terms-effective">Effective Date: January 1, 2025</p>

          <p>Welcome to <strong>RentAll</strong>. By creating an account and using our platform, you agree to the following Terms and Conditions. Please read them carefully.</p>

          <h3>1. Eligibility</h3>
          <p>You must be at least 16 years of age to register and use RentAll. By creating an account, you confirm that you meet this requirement. Users under 18 may be subject to additional restrictions.</p>

          <h3>2. Account Responsibilities</h3>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration and to update it as necessary. You are solely responsible for all activity that occurs under your account.</p>

          <h3>3. Listings and Rentals</h3>
          <p>Owners are responsible for ensuring that items listed are accurately described, in the condition stated, and legally permitted to be rented. Renters are responsible for using rented items with care and returning them in the same condition they were received. RentAll is not a party to any rental agreement between users and is not liable for any disputes arising from transactions on the platform.</p>

          <h3>4. Prohibited Items and Uses</h3>
          <p>Users may not list or rent items that are illegal, hazardous, counterfeit, stolen, or otherwise prohibited by applicable law. RentAll reserves the right to remove any listing and suspend any account that violates this policy.</p>

          <h3>5. Payments</h3>
          <p>All rental payments are processed through the platform. RentAll may collect a service fee on transactions. Pricing, fees, and refund policies are subject to change and will be communicated within the platform.</p>

          <h3>6. User Conduct</h3>
          <p>Users agree not to harass, defraud, or harm other users. Misuse of the messaging system, submission of false reviews, or any attempt to circumvent platform policies may result in account suspension or permanent termination.</p>

          <h3>7. Reviews</h3>
          <p>Users may leave honest reviews following completed rentals. Reviews must be truthful and based on genuine experiences. RentAll reserves the right to remove reviews that violate community guidelines.</p>

          <h3>8. Intellectual Property</h3>
          <p>All content on the RentAll platform, including logos, design, and software, is the property of RentAll and protected by applicable intellectual property laws. Users retain ownership of content they submit (e.g., listing photos) but grant RentAll a non-exclusive license to display that content on the platform.</p>

          <h3>9. Limitation of Liability</h3>
          <p>RentAll is provided "as is" without warranties of any kind. To the fullest extent permitted by law, RentAll shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including damages related to rental disputes, item damage, or loss.</p>

          <h3>10. Privacy</h3>
          <p>Your use of RentAll is subject to our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the platform, you consent to our data practices as described therein.</p>

          <h3>11. Modifications</h3>
          <p>RentAll reserves the right to update these Terms and Conditions at any time. Continued use of the platform following any changes constitutes your acceptance of the revised terms.</p>

          <h3>12. Governing Law</h3>
          <p>These Terms and Conditions are governed by the laws of the State of Illinois, without regard to its conflict of law provisions.</p>

          <h3>13. Contact</h3>
          <p>If you have questions about these terms, please contact us through the Help section of the platform.</p>
        </div>
        <div className="terms-modal-footer">
          <button className="btn auth-submit" onClick={onClose}>Back to Registration</button>
        </div>
      </div>
    </div>
  );
}
