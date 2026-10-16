import React, { useEffect } from 'react';
import { ArrowLeft, FileText, Shield, CheckCircle2, AlertCircle, Cookie } from 'lucide-react';

export type LegalSection = 'terms' | 'privacy' | 'cookies' | 'guidelines';

interface LegalPageProps {
  activeSection: LegalSection;
  onBack: () => void;
  onSelectSection: (section: LegalSection) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  activeSection,
  onBack,
  onSelectSection,
}) => {
  // Scroll to top on section change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'terms':
        return 'Terms & Conditions';
      case 'privacy':
        return 'Privacy Policy';
      case 'cookies':
        return 'Cookie Policy';
      case 'guidelines':
        return 'Content Guidelines';
    }
  };

  const getSectionDescription = () => {
    switch (activeSection) {
      case 'terms':
        return 'Official terms governing cinema seat allocations, 5-minute atomic holds, simulated payments, and admissions.';
      case 'privacy':
        return 'Our zero-telemetry commitment, local session security, and sandboxed data retention policies.';
      case 'cookies':
        return 'Disclosures regarding essential browser storage, local session tokens, and zero tracking cookies.';
      case 'guidelines':
        return 'Central Board of Film Certification (CBFC) standards, 4K Laser Atmos auditorium decorum, and patron etiquette.';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#101110] text-[#F4EFE6] transition-colors py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 flex flex-col gap-8">
        
        {/* Top Breadcrumb Navigation */}
        <div className="flex items-center justify-between border-b border-[#34332F]/60 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-bold text-[#B9B2A8] hover:text-[#F0A451] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Movies</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191A18] border border-[#34332F] text-[11px] text-[#89857D]">
            <span>Last Updated:</span>
            <span className="font-semibold text-[#F4EFE6]">October 2026</span>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="flex flex-col gap-2 max-w-3xl">
          <span className="text-[11px] font-extrabold tracking-widest text-[#F0A451] uppercase">
            Yozigo Cinema Compliance &amp; Policies
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#F4EFE6] tracking-tight">
            {getSectionTitle()}
          </h1>
          <p className="text-sm text-[#89857D] leading-relaxed">
            {getSectionDescription()}
          </p>
        </div>

        {/* Main Content Layout: Sidebar Navigation + Content Article */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Policy Navigation (Sticky Sidebar) */}
          <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
            <nav className="p-2 rounded-2xl bg-[#191A18] border border-[#34332F] flex flex-col gap-1 shadow-sm">
              <button
                onClick={() => onSelectSection('terms')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSection === 'terms'
                    ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                    : 'text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#22231F]'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="flex-1">Terms &amp; Conditions</span>
              </button>

              <button
                onClick={() => onSelectSection('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSection === 'privacy'
                    ? 'bg-[#F0A451] text-[#17120C] shadow-sm'
                    : 'text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#22231F]'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span className="flex-1">Privacy Policy</span>
              </button>

              <button
                onClick={() => onSelectSection('cookies')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSection === 'cookies'
                    ? 'bg-[#F0A451] text-[#17120C]'
                    : 'text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#22231F]'
                }`}
              >
                <Cookie className="w-4 h-4 shrink-0" />
                <span className="flex-1">Cookie Policy</span>
              </button>

              <button
                onClick={() => onSelectSection('guidelines')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activeSection === 'guidelines'
                    ? 'bg-[#F0A451] text-[#17120C]'
                    : 'text-[#B9B2A8] hover:text-[#F4EFE6] hover:bg-[#22231F]'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">Content Guidelines</span>
              </button>
            </nav>
          </aside>

          {/* Right Column: Full Dedicated Policy Articles */}
          <main className="lg:col-span-8 flex flex-col gap-6 bg-[#191A18] border border-[#34332F] rounded-3xl p-6 sm:p-10 shadow-xl">
            
            {/* 1. TERMS & CONDITIONS */}
            {activeSection === 'terms' && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#F4EFE6]">
                    Terms of Service &amp; Ticketing Agreement
                  </h2>
                  <p className="text-xs text-[#89857D] mt-1">
                    Please read these terms carefully before reserving cinema tickets on Yozigo Cinema.
                  </p>
                </div>

                <div className="space-y-6 text-xs text-[#B9B2A8] leading-relaxed">
                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#F0A451]" />
                      1. Technical Assessment &amp; Educational Scope
                    </h3>
                    <p>
                      This web application was engineered strictly as a full-stack technical assessment for demonstration and portfolio review purposes. All services, ticket issuance mechanisms, and inventory allocations operate within a sandboxed development environment.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#F0A451]" />
                      2. Simulated Payment Gateway
                    </h3>
                    <p>
                      No real monetary charges, credit card billings, or UPI transfers are conducted on this website. The checkout gateway simulates payment delays and confirmation callbacks solely to test transactional integrity and double-booking prevention.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#F0A451]" />
                      3. 5-Minute Hold Concurrency Rules
                    </h3>
                    <p>
                      In accordance with the 80-seat auditorium architectural specification, customer seats are held for exactly 300 seconds (5 minutes). If payment simulation is not completed within this timeframe, locks expire automatically and return to the available inventory pool.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#F0A451]" />
                      4. Seat Allocation Limits &amp; Conflict Handling
                    </h3>
                    <p>
                      A single customer can select between 1 and 6 seats per transaction. In the event of concurrent attempts by two users to acquire the same seat, database-level unique constraints ensure that exactly one transaction succeeds while the other is rejected with a clear conflict notice.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#F0A451]" />
                      5. Cancellation &amp; Refund Policy
                    </h3>
                    <p>
                      Per cinema regulations, booking cancellations are strictly permitted only up to 2 hours before the scheduled screening start time. Cancellations requested within the final 2 hours or for past shows are automatically rejected.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {/* 2. PRIVACY POLICY */}
            {activeSection === 'privacy' && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#F4EFE6]">
                    Privacy &amp; Data Protection Policy
                  </h2>
                  <p className="text-xs text-[#89857D] mt-1">
                    How Yozigo Cinema handles your session credentials and preserves privacy.
                  </p>
                </div>

                <div className="space-y-6 text-xs text-[#B9B2A8] leading-relaxed">
                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#6FA987]" />
                      1. Zero Telemetry &amp; Non-Tracking Commitment
                    </h3>
                    <p>
                      We do not embed third-party tracking scripts, pixel tags, or commercial advertising telemetry. Your browsing actions, movie selections, and seat interactions remain strictly confined to your local browser session and the assessment database.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#6FA987]" />
                      2. Cryptographic Password Security
                    </h3>
                    <p>
                      Evaluation credentials and customer passwords in the backend database are irreversibly encrypted using bcrypt with salted key derivation. Passwords are never logged or stored in plain text under any circumstance.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#6FA987]" />
                      3. JWT Session Authorization
                    </h3>
                    <p>
                      Authenticated sessions employ JSON Web Tokens (JWT) signed with a secure secret key. Tokens are scoped strictly to individual customer accounts, preventing cross-tenant access to reservation histories.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#6FA987]" />
                      4. Data Retention &amp; Reseeding
                    </h3>
                    <p>
                      All customer records and booking history reside in an isolated SQLite database that can be purged, reseeded, or reset at any time during technical evaluation without impacting external services.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {/* 3. COOKIE POLICY */}
            {activeSection === 'cookies' && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#F4EFE6]">
                    Cookie &amp; Local Storage Policy
                  </h2>
                  <p className="text-xs text-[#89857D] mt-1">
                    Details on how browser localStorage is utilized for functional operation.
                  </p>
                </div>

                <div className="space-y-6 text-xs text-[#B9B2A8] leading-relaxed">
                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-[#F0A451]" />
                      1. Strictly Necessary Functional Storage
                    </h3>
                    <p>
                      This application utilizes browser localStorage exclusively for essential functional purposes: persisting your active authentication JWT token and maintaining your preferred visual theme (<code className="text-[#F0A451]">cinema_theme: dark/light</code>).
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-[#F0A451]" />
                      2. Zero Marketing &amp; Behavioral Cookies
                    </h3>
                    <p>
                      We do not deploy marketing, advertising, analytics, or behavioral cookies. No third-party ad networks or profiling beacons are loaded by this application.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <Cookie className="w-4 h-4 text-[#F0A451]" />
                      3. In-Memory Session Lifecycles
                    </h3>
                    <p>
                      Active seat hold tokens (<code className="text-[#F0A451]">hold_token</code>) remain active for a maximum duration of 300 seconds and are wiped automatically from memory upon checkout completion or expiration.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {/* 4. CONTENT GUIDELINES */}
            {activeSection === 'guidelines' && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#F4EFE6]">
                    Content &amp; Theatrical Guidelines
                  </h2>
                  <p className="text-xs text-[#89857D] mt-1">
                    Cinema exhibition standards, rating compliance, and patron etiquette.
                  </p>
                </div>

                <div className="space-y-6 text-xs text-[#B9B2A8] leading-relaxed">
                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#F0A451]" />
                      1. CBFC Certification Classification
                    </h3>
                    <p>
                      Every movie exhibited on Screen 1 strictly displays its Central Board of Film Certification rating:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-[11px] text-[#89857D]">
                      <li><strong className="text-[#F4EFE6]">U (Universal)</strong>: Unrestricted public exhibition suitable for all ages.</li>
                      <li><strong className="text-[#F4EFE6]">UA (Parental Guidance)</strong>: Discretion advised for viewers below 12 years of age.</li>
                      <li><strong className="text-[#F4EFE6]">A (Adults Only)</strong>: Restricted to patrons 18 years of age and older.</li>
                    </ul>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#F0A451]" />
                      2. Screen 1 Auditorium Decorum
                    </h3>
                    <p>
                      Screen 1 is calibrated with Christie 4K Laser Projection and Dolby Atmos 360-degree acoustic staging. Patrons must maintain silence during screenings and switch mobile devices to silent mode.
                    </p>
                  </section>

                  <section className="flex flex-col gap-2 p-4 rounded-2xl bg-[#101110] border border-[#34332F]">
                    <h3 className="font-bold text-sm text-[#F4EFE6] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#F0A451]" />
                      3. Fair Use &amp; Intellectual Property
                    </h3>
                    <p>
                      Theatrical poster artwork, promotional synopses, and film titles utilized in this project are incorporated under educational fair use principles to simulate authentic commercial multiplex operations for evaluation.
                    </p>
                  </section>
                </div>
              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  );
};
