// Simplified shape of a Framer -> Next.js export (absolute styles, token vars, GF fonts).
import Nav from "../components/Nav";

const tokens = {
  "--token-7f3a-primary": "rgb(255, 92, 53)",
  "--token-21bc": "rgb(18, 18, 20)",
};

export default function Page() {
  return (
    <div style={{ backgroundColor: "rgb(250, 248, 245)", fontFamily: '"Manrope", sans-serif', ...tokens }}>
      <Nav />
      <section className="framer-hero">
        <p style={{ color: "rgb(255, 92, 53)" }}>Trusted by 2,000+ clinics</p>
        <h1 style={{ fontFamily: '"GF;Fraunces-600"' }}>Modern care, booked in seconds</h1>
        <p>Patients book, reschedule and pay online — your front desk finally gets a break.</p>
        <a href="/book" style={{ backgroundColor: "var(--token-7f3a-primary, rgb(255, 92, 53))", color: "rgb(255,255,255)" }}>Book a demo</a>
        <a href="#how">See how it works</a>
        <img src="/hero.png" alt="Clinic dashboard" />
      </section>
      <section>
        <h2>Why clinics switch</h2>
        <p>Everything your practice needs in one place.</p>
        <h3>Online booking</h3>
        <p>Let patients book 24/7 from any device.</p>
        <h3>Automated reminders</h3>
        <p>Cut no-shows with SMS and email reminders.</p>
        <h3>Payments</h3>
        <p>Take deposits and payments at booking.</p>
      </section>
      <section>
        <h2>By the numbers</h2>
        <p>40%</p><p>Fewer no-shows</p>
        <p>2,000+</p><p>Clinics</p>
        <p>4.9/5</p><p>Average rating</p>
      </section>
      <section>
        <h2>What our customers say</h2>
        <p>“We halved our phone calls in the first month. Patients love it.”</p>
        <p>Dr. Amara Okafor</p>
        <p>Owner, Northside Physio</p>
        <p>“Set up in an afternoon and the reminders paid for themselves.”</p>
        <p>Liam Chen</p>
        <p>Practice Manager, Bright Dental</p>
      </section>
      <section>
        <h2>Pricing</h2>
        <h3>Solo</h3>
        <p>$29/mo</p>
        <h3>Clinic</h3>
        <p>$79/mo</p>
        <h3>Group</h3>
        <p>Custom</p>
      </section>
      <section>
        <h2>FAQ</h2>
        <h3>Can I import my patients?</h3>
        <p>Yes, import from a CSV or your current system in minutes.</p>
        <h3>Is it secure?</h3>
        <p>Data is encrypted and hosted in your region.</p>
      </section>
      <section style={{ backgroundColor: "rgb(18, 18, 20)", color: "rgb(250,248,245)" }}>
        <h2>Ready to modernize your clinic?</h2>
        <a href="/book">Start free trial</a>
      </section>
      <footer>
        <p>Carely — booking software for modern clinics.</p>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </footer>
    </div>
  );
}
