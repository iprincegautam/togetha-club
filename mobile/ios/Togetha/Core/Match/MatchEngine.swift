import Foundation

/// Local port of the Togetha match engine: quiz answers → 12-dimension
/// compatibility vector → cosine similarity against the batch's ideal vector.
enum MatchEngine {

    // MARK: - Ideal vectors per trail

    static let himalayanIdeal: [MatchDimension: Double] = [
        .socialEnergy: 0.6, .directness: 0.6, .depth: 0.85, .spontaneity: 0.7,
        .emotionalAvailability: 0.8, .warmth: 0.8, .humor: 0.6, .adventure: 0.9,
        .introspection: 0.75, .loyalty: 0.6, .curiosity: 0.8, .authenticity: 0.85
    ]

    static let udaipurIdeal: [MatchDimension: Double] = [
        .socialEnergy: 0.7, .directness: 0.6, .depth: 0.8, .spontaneity: 0.55,
        .emotionalAvailability: 0.85, .warmth: 0.9, .humor: 0.7, .adventure: 0.55,
        .introspection: 0.6, .loyalty: 0.75, .curiosity: 0.7, .authenticity: 0.85
    ]

    // MARK: - Vector building

    /// Builds the user's compatibility vector from raw quiz answers.
    static func vector(from answers: [String: String]) -> [MatchDimension: Double] {
        var sums: [MatchDimension: Double] = [:]
        var counts: [MatchDimension: Double] = [:]

        for question in QuizData.questions {
            guard let answer = answers[question.id] else { continue }
            switch question.kind {
            case .choice, .destination:
                if let option = question.options.first(where: { $0.text == answer }) {
                    for (dim, value) in option.weights {
                        sums[dim, default: 0] += value
                        counts[dim, default: 0] += 1
                    }
                }
            case .range:
                let value = (Double(answer) ?? 5) / 10.0
                sums[.emotionalAvailability, default: 0] += value
                counts[.emotionalAvailability, default: 0] += 1
            case .text:
                // Effort in the free-text answers reads as curiosity + authenticity.
                let length = answer.trimmingCharacters(in: .whitespacesAndNewlines).count
                let value: Double
                switch length {
                case ..<5: value = 0.35
                case 80...: value = 0.95
                default: value = 0.35 + 0.6 * (Double(length - 5) / 75.0)
                }
                for dim in [MatchDimension.curiosity, .authenticity] {
                    sums[dim, default: 0] += value
                    counts[dim, default: 0] += 1
                }
            case .numeric, .departure:
                continue
            }
        }

        var vector: [MatchDimension: Double] = [:]
        for dim in MatchDimension.allCases {
            let count = counts[dim] ?? 0
            vector[dim] = count > 0 ? min(1, (sums[dim] ?? 0) / count) : 0.5
        }
        return vector
    }

    static func cosineSimilarity(_ a: [MatchDimension: Double], _ b: [MatchDimension: Double]) -> Double {
        var dot = 0.0, magA = 0.0, magB = 0.0
        for dim in MatchDimension.allCases {
            let x = a[dim] ?? 0, y = b[dim] ?? 0
            dot += x * y
            magA += x * x
            magB += y * y
        }
        guard magA > 0, magB > 0 else { return 0 }
        return dot / (magA.squareRoot() * magB.squareRoot())
    }

    // MARK: - Archetype

    static func archetype(for vector: [MatchDimension: Double]) -> Archetype {
        let pairs: [(Archetype, [MatchDimension])] = [
            (.bonfireRomantic, [.warmth, .depth]),
            (.chaosCatalyst, [.socialEnergy, .spontaneity]),
            (.thoughtfulPlanner, [.loyalty, .directness]),
            (.freeSpirit, [.adventure, .curiosity]),
            (.quietIntensity, [.introspection, .emotionalAvailability]),
            (.goldenRetriever, [.humor, .authenticity])
        ]
        return pairs.max { lhs, rhs in
            score(of: lhs.1, in: vector) < score(of: rhs.1, in: vector)
        }?.0 ?? .goldenRetriever
    }

    private static func score(of dims: [MatchDimension], in vector: [MatchDimension: Double]) -> Double {
        dims.reduce(0) { $0 + (vector[$1] ?? 0) } / Double(dims.count)
    }

    // MARK: - Full evaluation

    static func evaluate(answers: [String: String], batches: [Batch]) -> MatchResult {
        let userVector = vector(from: answers)
        let age = Int(answers["age"] ?? "") ?? 0
        let destination = answers["destination"] ?? "Himalayan"
        let isHimalayan = destination == "Himalayan"
        let ideal = isHimalayan ? himalayanIdeal : udaipurIdeal

        // Correct edition by age: GenZ 18–25, Millennial 26–36.
        let wantsGenZ = age <= 25
        let batch = batches.first {
            !$0.isWaitlistOnly
                && $0.region.localizedCaseInsensitiveContains(isHimalayan ? "Himachal" : "Rajasthan")
                && ($0.edition == (wantsGenZ ? .genZ : .millennial))
        } ?? batches.first { !$0.isWaitlistOnly }

        let similarity = cosineSimilarity(userVector, ideal)
        let authenticity = userVector[.authenticity] ?? 0.5
        var score = Int((similarity * 88 + authenticity * 9).rounded())
        score = min(97, max(68, score))

        let ageOutOfBand: Bool
        if let batch, age < batch.ageMin || age > batch.ageMax {
            ageOutOfBand = true
            score = min(score, 62)
        } else {
            ageOutOfBand = age < 18 || age > 36
            if ageOutOfBand { score = min(score, 62) }
        }

        let tier: PlacementTier = score >= 85 ? .high : (score >= 76 ? .medium : .growing)
        let batchName = batch?.name ?? "a Togetha batch"

        return MatchResult(
            score: score,
            archetype: archetype(for: userVector),
            recommendedBatchId: batch?.id ?? "",
            recommendedBatchName: batchName,
            placementTier: tier,
            narrative: "Strong fit for \(batchName). Our AI likes this pairing.",
            ageOutOfBand: ageOutOfBand
        )
    }
}
