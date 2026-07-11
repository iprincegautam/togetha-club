'use client'

import Link from 'next/link'
import Image from 'next/image'
import FAQAccordion from '@/components/batches/FAQAccordion'
import SectionLabel from '@/components/ui/SectionLabel'
import { ROUTES } from '@/constants/routes'
import { useScrollReveal } from '@/hooks/useScrollReveal'

/* ─── Fill these before publish ──────────────────────────────────────────
   Everything here must be TRUE. Leave the qualitative fallbacks in place
   until you have real photos / numbers to swap in. */

type Lead = {
  name: string
  role: string
  quote: string
  batches: string // e.g. "8" — kept as string so "several" etc. also works
  photo?: string // path under /public, e.g. "/leads/priya.jpg"
}

// TODO: add photos under /public (e.g. "/leads/anchal.jpg") when available.
const TRIP_LEADS: Lead[] = [
  {
    name: 'Anchal Gupta',
    role: 'Trip Lead',
    quote:
      'My rule is simple: everyone in my batch gets home feeling safer than they arrived.',
    batches: 'several',
  },
  {
    name: 'Prince Gautam',
    role: 'Founder & Trip Lead',
    quote:
      "If anything feels off, you come to me — any hour, no question too small.",
    batches: 'several',
  },
]

// Share of applications that don't make it into a batch. Keep truthful.
const DECLINE_RATE_PERCENT: number | null = 80

// Founder name + optional signature image path under /public.
const FOUNDER_NAME = 'Prince Gautam'
const FOUNDER_SIGNATURE: string | null = null

export default function SafetySection() {
  const gate = useScrollReveal<HTMLElement>()
  const guarantee = useScrollReveal<HTMLElement>()
  const ground = useScrollReveal<HTMLElement>()
  const pressure = useScrollReveal<HTMLElement>()
  const structure = useScrollReveal<HTMLElement>()
  const data = useScrollReveal<HTMLElement>()
  const leads = useScrollReveal<HTMLElement>()
  const casefile = useScrollReveal<HTMLElement>()
  const declined = useScrollReveal<HTMLElement>()
  const note = useScrollReveal<HTMLElement>()
  const faq = useScrollReveal<HTMLElement>()
  const close = useScrollReveal<HTMLElement>()

  return (
    <>
      {/* Hero */}
      <section className="sfty-hero">
        <div className="sfty-hero-inner">
          <span className="sfty-stamp">Verified humans only</span>
          <h1 className="sfty-hero-title">
            Not everyone gets in. <span className="t">That&apos;s the point.</span>
          </h1>
          <p className="sfty-hero-sub">
            You&apos;re about to travel with people you haven&apos;t met. That only works if
            the room is safe first. So we built the whole thing backwards from that one rule —
            and we check every single person by hand before they&apos;re ever confirmed.
          </p>
          <div className="sfty-hero-btns">
            <Link href={ROUTES.match} className="btn-p">
              Take the quiz →
            </Link>
            <a href="#gate" className="btn-o">
              Read how we vet ↓
            </a>
          </div>
        </div>
      </section>

      {/* 1 · The gate */}
      <section ref={gate} className="sec sfty-sec reveal" id="gate">
        <div className="sec-inner">
          <SectionLabel>The gate</SectionLabel>
          <h2 className="sec-title">
            &ldquo;Verified&rdquo; usually means a bot glanced at a selfie. Here, a{' '}
            <span className="t">real person</span> opens your file.
          </h2>
          <p className="sfty-lead-in">
            Before anyone joins a batch, we cross-check — by hand:
          </p>
          <ul className="sfty-checks">
            <li className="sfty-check">
              <span className="sfty-check-tick">✓</span>
              <div>
                <b>Government ID</b>
                <span>Confirmed, real, and current.</span>
              </div>
            </li>
            <li className="sfty-check">
              <span className="sfty-check-tick">✓</span>
              <div>
                <b>LinkedIn &amp; work</b>
                <span>The job and the history line up.</span>
              </div>
            </li>
            <li className="sfty-check">
              <span className="sfty-check-tick">✓</span>
              <div>
                <b>Socials</b>
                <span>The person online is the person on the ID.</span>
              </div>
            </li>
          </ul>
          <p className="sfty-check-note">
            One human reads all of it together and confirms it&apos;s the same person. If the
            story doesn&apos;t line up, they don&apos;t get in — no matter how full the batch
            is, no matter the revenue. The room has to be safe first. Everything else is
            second.
          </p>
        </div>
      </section>

      {/* 2 · Guarantee */}
      <section ref={guarantee} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <div className="sfty-guarantee">
            <span className="sfty-stamp">Safe by design ♡</span>
            <h2>Can&apos;t verify you? Full refund.</h2>
            <p>
              We&apos;d rather lose a booking than put a question mark in the room. If we
              can&apos;t confirm you&apos;re exactly who you say you are, you don&apos;t join —
              and you get every rupee back. No arguing, no exceptions.
            </p>
          </div>
        </div>
      </section>

      {/* 3 · On the ground */}
      <section ref={ground} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>On the ground</SectionLabel>
          <h2 className="sec-title">
            Verified is where safety <span className="t">starts</span> — not where it ends.
          </h2>
          <div className="sfty-ground">
            <div className="sfty-ground-item">
              <b>12 women + 12 men</b>
              <span>A balanced room, every batch.</span>
            </div>
            <div className="sfty-ground-item">
              <b>Single-gender rooms</b>
              <span>Always. Never a question you have to ask.</span>
            </div>
            <div className="sfty-ground-item">
              <b>Female trip leads</b>
              <span>Someone who gets it, with you the whole way.</span>
            </div>
            <div className="sfty-ground-item">
              <b>Captains 24/7</b>
              <span>On the ground, reachable, all trip long.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 · No pressure */}
      <section ref={pressure} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>No pressure, ever</SectionLabel>
          <h2 className="sec-title">
            No one is here to <span className="t">force a match.</span>
          </h2>
          <p className="sec-sub">
            This isn&apos;t a show and there&apos;s no reveal. If there&apos;s a spark,
            it&apos;ll be real and it&apos;ll be yours. If there isn&apos;t, you still go home
            with 23 people you actually know — still texting, still in your phone months later.
            That&apos;s the worst case. It&apos;s a good one.
          </p>
        </div>
      </section>

      {/* 5 · Structure is safety */}
      <section ref={structure} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>Structure is safety</SectionLabel>
          <h2 className="sec-title">
            Everything&apos;s planned — so you never coordinate{' '}
            <span className="t">alone with a stranger.</span>
          </h2>
          <p className="sec-sub">
            Travel, stays, most meals, the full itinerary, ice-breakers, bonfire nights — all
            handled by us. You never have to negotiate where, when, or how with someone you
            just met. You show up as yourself; the rest is already taken care of.
          </p>
        </div>
      </section>

      {/* 6 · Your data */}
      <section ref={data} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>Your data</SectionLabel>
          <h2 className="sec-title">
            We check your story to keep the room safe. <span className="t">Then we stop.</span>
          </h2>
          <p className="sec-sub">
            Your ID and documents are used for one thing: confirming you&apos;re a real,
            verified person before you join a batch. That&apos;s it. We don&apos;t sell it, we
            don&apos;t post it, and it never becomes part of a public profile.
          </p>
        </div>
      </section>

      {/* 7 · The women who'll be there */}
      <section ref={leads} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>Who&apos;s with you</SectionLabel>
          <h2 className="sec-title">
            You won&apos;t be handed to a stranger. <span className="t">You&apos;ll be led by her.</span>
          </h2>
          <p className="sfty-lead-in">
            Every batch travels with a female trip lead — on the ground, reachable, the whole
            way. Not a chaperone. The person you go to if anything feels off, at any hour.
          </p>
          <div className="sfty-leads">
            {TRIP_LEADS.map((lead, i) => (
              <div key={i} className="sfty-lead-card">
                {lead.photo ? (
                  <Image
                    className="sfty-lead-photo"
                    src={lead.photo}
                    alt={lead.name}
                    width={92}
                    height={92}
                  />
                ) : (
                  <div className="sfty-lead-monogram" aria-hidden>
                    {lead.name.trim().charAt(0).toUpperCase() || '✦'}
                  </div>
                )}
                <div className="sfty-lead-name">{lead.name}</div>
                <div className="sfty-lead-role">{lead.role}</div>
                <p className="sfty-lead-quote">&ldquo;{lead.quote}&rdquo;</p>
                <div className="sfty-lead-meta">
                  ✦ Led {lead.batches} batches · with you 24/7
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · Case file */}
      <section ref={casefile} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>What a hand-check looks like</SectionLabel>
          <h2 className="sec-title">
            &ldquo;Verified&rdquo; is a word. <span className="t">This is the receipt.</span>
          </h2>
          <p className="sfty-lead-in">
            We don&apos;t ask you to trust the word &ldquo;verified.&rdquo; Here&apos;s the exact
            check every applicant clears before they&apos;re confirmed — cross-referenced by a
            real person until it all lines up.
          </p>
          <div className="sfty-casefile">
            <div className="sfty-cf-head">
              <span>
                APPLICANT FILE · #<span className="stamp">REDACTED</span>
              </span>
              <span className="sfty-cf-eyebrow">✦ Reviewed by hand</span>
            </div>
            <ul className="sfty-cf-rows">
              <li className="sfty-cf-row">
                <span className="sfty-cf-field">Government ID</span>
                <span className="sfty-cf-bar" aria-hidden />
                <span className="sfty-cf-ok">✓ real &amp; current</span>
              </li>
              <li className="sfty-cf-row">
                <span className="sfty-cf-field">LinkedIn &amp; work</span>
                <span className="sfty-cf-bar" aria-hidden />
                <span className="sfty-cf-ok">✓ history lines up</span>
              </li>
              <li className="sfty-cf-row">
                <span className="sfty-cf-field">Instagram / socials</span>
                <span className="sfty-cf-bar" aria-hidden />
                <span className="sfty-cf-ok">✓ same person</span>
              </li>
              <li className="sfty-cf-row sfty-cf-row--cross">
                <span className="sfty-cf-field">Cross-check</span>
                <span className="sfty-cf-cross">ID ↔ LinkedIn ↔ socials</span>
              </li>
              <li className="sfty-cf-row sfty-cf-row--verdict">
                <span className="sfty-cf-field">Verdict</span>
                <span className="sfty-cf-ok sfty-cf-verdict">SAME HUMAN — CONFIRMED</span>
              </li>
            </ul>
            <div className="sfty-cf-stamp">Verified · by hand</div>
          </div>
          <p className="sfty-casefile-note">
            Real files, redacted for privacy. We never publish anyone&apos;s documents.
          </p>
        </div>
      </section>

      {/* 9 · The gate is real */}
      <section ref={declined} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <div className="sfty-declined">
            <span className="sfty-stamp is-red">Declined</span>
            {DECLINE_RATE_PERCENT != null ? (
              <>
                <div className="sfty-declined-num">{DECLINE_RATE_PERCENT}%</div>
                <div className="sfty-declined-label">of applications don&apos;t make it in</div>
              </>
            ) : (
              <h2 className="sec-title" style={{ marginTop: '18px' }}>
                We say no. <span className="t">Often.</span>
              </h2>
            )}
            <p>
              A safe room isn&apos;t the one that lets everyone in — it&apos;s the one that
              turns people away. If we can&apos;t confirm someone is exactly who they say they
              are, they don&apos;t travel with you. We&apos;d rather lose the booking.
            </p>
          </div>
        </div>
      </section>

      {/* 10 · Founder note */}
      <section ref={note} className="sec sfty-sec reveal">
        <div className="sec-inner">
          <SectionLabel>A note from the person who built this</SectionLabel>
          <h2 className="sec-title">
            I check the hard ones <span className="t">myself.</span>
          </h2>
          <div className="sfty-note">
            <div className="sfty-note-body">
              <p>
                Most apps say &ldquo;verified&rdquo; and mean a bot glanced at a selfie. I
                didn&apos;t want that on my conscience — not for the women who trust us enough to
                show up.
              </p>
              <p>
                So the checks are done by real people, and the ones that don&apos;t sit right, I
                look at myself. If the story doesn&apos;t line up, they don&apos;t get in — no
                matter how full the batch is, no matter the revenue.
              </p>
              <p>The women in that room trusted us first. Everything we do starts there.</p>
            </div>
            <div className="sfty-note-sign">
              {FOUNDER_SIGNATURE ? (
                <Image src={FOUNDER_SIGNATURE} alt={FOUNDER_NAME} width={120} height={46} />
              ) : null}
              <div>
                <b>— {FOUNDER_NAME}</b>
                <br />
                <span>✦ Founder, Togetha</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11 · FAQ */}
      <section ref={faq} className="sec home-faq-sec sfty-sec reveal" id="safety-faq">
        <div className="sec-inner">
          <SectionLabel>Quick answers</SectionLabel>
          <h2 className="sec-title">
            The things people <span className="t">actually</span> want to know.
          </h2>
          <div className="home-faq-panel">
            <FAQAccordion items={[...SAFETY_FAQ_ITEMS]} />
          </div>
        </div>
      </section>

      {/* Close */}
      <section ref={close} className="sfty-close reveal">
        <span className="sfty-stamp">Welcome to the club</span>
        <h2>The women in that room trusted us first. So do the checks.</h2>
        <Link href={ROUTES.match} className="btn-p">
          Take the 2-minute quiz → get verified → get in
        </Link>
      </section>
    </>
  )
}

const SAFETY_FAQ_ITEMS = [
  {
    question: 'Who actually does the checking?',
    answer:
      'A real person on our team — not an algorithm, not a bot. Every applicant, by hand.',
  },
  {
    question: "What if I don't get in?",
    answer:
      "We'll tell you, and we'll refund you in full. The gate is real — that's what makes the room safe.",
  },
  {
    question: 'Do men and women room together?',
    answer: 'Never. Single-gender rooms, every trip, no exceptions.',
  },
  {
    question: "What if I don't click with anyone?",
    answer:
      'Then you go home with 23 new friends. Zero pressure to pair up — that was never the deal.',
  },
  {
    question: 'Is my ID safe with you?',
    answer:
      'Used only to verify you, never shared or made public, and never part of a profile.',
  },
  {
    question: "Who's with us on the trip?",
    answer: 'A female trip lead and captains, on the ground and reachable 24/7.',
  },
] as const
