import React from 'react';

const EMAIL = 'm.d.mpsd@gmail.com';
const PHONE = '+91 88875 16714';
const WHATSAPP = 'https://wa.me/918887516714';

const content = {
  about: {
    title: 'About PHOTO AI Studio',
    intro: 'Your creative universe for simple and accessible photo editing.',
  },
  contact: {
    title: 'Contact Us',
    intro: 'We are here to help with questions, feedback and support.',
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains how PHOTO AI Studio handles information when you use our website.',
  },
  terms: {
    title: 'Terms & Conditions',
    intro: 'Please read these terms before using PHOTO AI Studio.',
  },
};

export default function LegalPages({ page }) {
  const current = content[page];

  if (!current) return null;

  return (
    <main className="legal-page">
      <div className="legal-hero">
        <span className="legal-eyebrow">PHOTO AI STUDIO</span>
        <h1>{current.title}</h1>
        <p>{current.intro}</p>
      </div>

      {page === 'about' && (
        <section className="legal-card">
          <h2>Who We Are</h2>
          <p>
            PHOTO AI Studio is an online creative platform designed to make
            everyday photo editing easier. Our goal is to provide simple tools
            that help users create, edit, enhance and prepare images.
          </p>

          <h2>Our Tools</h2>
          <p>
            Our platform includes photo enhancement, background removal,
            image resizing, image compression, photo editing and poster
            creation tools. Tool availability and features may change as
            the website improves.
          </p>

          <h2>Our Mission</h2>
          <p>
            We aim to make creative image tools easy to understand and
            accessible through a simple website experience on desktop
            and mobile devices.
          </p>

          <h2>Our Commitment</h2>
          <p>
            We continuously work to improve usability, reliability,
            transparency and the quality of our services.
          </p>
        </section>
      )}

      {page === 'contact' && (
        <section className="legal-card">
          <h2>Get in Touch</h2>
          <p>
            For support, suggestions, bug reports or business enquiries,
            contact us using the details below.
          </p>

          <div className="legal-contact-item">
            <span>Email Support</span>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>

          <div className="legal-contact-item">
            <span>Phone / WhatsApp</span>
            <a href={WHATSAPP} target="_blank" rel="noreferrer">
              {PHONE}
            </a>
          </div>

          <p>
            When contacting us, please explain your issue clearly.
            Do not send passwords, bank details or other sensitive
            information.
          </p>
        </section>
      )}

      {page === 'privacy' && (
        <section className="legal-card">
          <p><strong>Last updated:</strong> 1 November 2026</p>

          <h2>1. Information We Collect</h2>
          <p>
            We may receive information you voluntarily provide when
            contacting us, such as your email address, phone number
            and message.
          </p>

          <h2>2. Images and Files</h2>
          <p>
            Images selected by you may be processed by the specific
            tools you use. The way an image is processed depends on
            the tool and its technical implementation. Do not upload
            confidential or highly sensitive images.
          </p>

          <h2>3. How We Use Information</h2>
          <p>
            Information may be used to respond to enquiries, provide
            support, maintain website functionality, prevent misuse
            and improve our services.
          </p>

          <h2>4. Cookies and Browser Storage</h2>
          <p>
            Our website may use browser storage or essential
            technologies to remember preferences and support
            website features. Third-party analytics or advertising
            services, if enabled, may use their own cookies and
            technologies.
          </p>

          <h2>5. Third-Party Services</h2>
          <p>
            Some features may rely on third-party services. Those
            providers may process information under their own
            privacy policies and terms.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We take reasonable steps to protect information.
            However, no website or internet transmission can
            be guaranteed to be completely secure.
          </p>

          <h2>7. Your Choices</h2>
          <p>
            You can stop using the website, clear browser storage,
            and contact us regarding information you submitted
            directly.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our website is not intended to knowingly collect
            personal information from children. Please contact
            us if you believe a child has submitted personal
            information.
          </p>

          <h2>9. Policy Updates</h2>
          <p>
            We may update this policy when our services or
            practices change. Updates will be published on
            this page.
          </p>

          <h2>10. Contact</h2>
          <p>
            For privacy questions, email
            {' '}<a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </section>
      )}

      {page === 'terms' && (
        <section className="legal-card">
          <p><strong>Last updated:</strong> 1 November 2026</p>

          <h2>1. Acceptance</h2>
          <p>
            By accessing or using PHOTO AI Studio, you agree
            to these Terms & Conditions. If you do not agree,
            please do not use the website.
          </p>

          <h2>2. Use of the Website</h2>
          <p>
            You agree to use the website lawfully and not to
            interfere with its operation, security or availability.
          </p>

          <h2>3. Your Content</h2>
          <p>
            You are responsible for the images, text and other
            material you upload or create. You must have the
            necessary rights and permissions to use that content.
          </p>

          <h2>4. Prohibited Activities</h2>
          <p>
            Do not use the website to violate laws, infringe
            intellectual property rights, distribute harmful
            material, or attempt unauthorized access to systems.
          </p>

          <h2>5. Intellectual Property</h2>
          <p>
            Website branding, design, text and original materials
            are protected by applicable intellectual property
            laws. You may not copy or commercially redistribute
            them without permission.
          </p>

          <h2>6. Availability and Changes</h2>
          <p>
            We may modify, suspend or discontinue features.
            We do not guarantee uninterrupted availability
            or that every tool will always work without errors.
          </p>

          <h2>7. Disclaimer</h2>
          <p>
            The website is provided on an as-available basis.
            You are responsible for checking the results of
            edited or generated images before using them.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the extent permitted by applicable law, PHOTO AI
            Studio is not responsible for indirect or consequential
            losses arising from use of the website. Nothing here
            limits rights or liabilities that cannot legally
            be excluded.
          </p>

          <h2>9. Changes to These Terms</h2>
          <p>
            We may revise these terms as the website develops.
            Updated terms will be published on this page.
          </p>

          <h2>10. Contact</h2>
          <p>
            Questions about these terms can be sent to
            {' '}<a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </section>
      )}
    </main>
  );
}