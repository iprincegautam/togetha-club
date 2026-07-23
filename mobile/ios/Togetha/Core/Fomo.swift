import Foundation

/// Urgency / FOMO numbers — DELIBERATELY DECOUPLED from real bookings and
/// availability. They exist to create scarcity and urgency (spots "left",
/// cohort size, live viewers) that convert visitors into applicants. Values are
/// stable per batch (a seeded hash) so they don't flicker between renders.
///
/// Real capacity is 12 women + 12 men per departure; every number here stays
/// within that so the story is believable.
enum Fomo {
    private static func seed(_ s: String) -> Int {
        s.utf8.reduce(5381) { ($0 &* 33) &+ Int($1) } & 0x7fff_ffff
    }

    /// Women's spots "left" — always fewer than 6 (1…5).
    static func womenSpotsLeft(_ batch: Batch) -> Int { 1 + seed(batch.id + "-w") % 5 }

    /// Men's spots "left" — always fewer than 5 (1…4).
    static func menSpotsLeft(_ batch: Batch) -> Int { 1 + seed(batch.id + "-m") % 4 }

    /// People "already booked, like you" — capacity minus the (fake) spots left,
    /// so it is always < 24 and consistent with the scarcity numbers above.
    static func booked(_ batch: Batch) -> Int {
        max(6, batch.capacity - womenSpotsLeft(batch) - menSpotsLeft(batch))
    }

    /// "N people are viewing this now" — a small live-feeling number (4…13).
    /// Random by design so it changes per visit; not persisted.
    static func viewersNow() -> Int { 4 + Int.random(in: 0...9) }
}
