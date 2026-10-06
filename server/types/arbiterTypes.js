/**
 * Arbiter type contracts — Day 1.
 * Mirrors: Arbiter Architecture & Build Plan v1.0 (Sections 3, 4.2, 6)
 *          + Follow-up Q&A Addendum v1.0 (Section 3)
 */

/**
 * @typedef {Object} ArbiterInput
 * @property {"investor"|"startup"} role
 * @property {string} companyName
 * @property {string} sector
 * @property {"pre-seed"|"seed"|"series-a"|"series-b-plus"} stage
 * @property {string} [geography]
 * @property {string} [checkSizeRange]
 * @property {number} [fundingAsk]
 * @property {"usd"|"eur"|"gbp"|"inr"} [fundingAskCurrency]
 * @property {string} pitchDeckOrSummary
 * @property {string} [tractionMetrics]
 * @property {string} [knownRedFlags]
 * @property {string} [selfAssessedWeaknesses]
 * @property {string} [investorThesisNotes]
 * @property {number} [runwayMonths]
 * @property {"angel"|"vc"|"corporate"|"growth"} [targetInvestorType]
 */

/**
 * @typedef {Object} DebateTurn
 * @property {"analyst"|"advocate"|"skeptic"|"arbiter"} agent
 * @property {number} round
 * @property {string} content
 * @property {string} createdAt
 */

/**
 * @typedef {Object} MarketBrief
 * @property {string} sectorTrend
 * @property {string[]} comparableRaises
 * @property {string[]} notableNews
 * @property {string} generatedAt
 */

/**
 * @typedef {Object} ArbiterState
 * @property {ArbiterInput} input
 * @property {MarketBrief|null} marketContext
 * @property {DebateTurn[]} transcript
 * @property {number} round
 * @property {number} maxRounds
 * @property {Verdict|null} verdict
 * @property {"running"|"complete"|"failed"} status
 * @property {string} runId
 * @property {string} [errorMessage]
 */

/**
 * @typedef {Object} Verdict
 * @property {number} score
 * @property {"low"|"medium"|"high"} confidence
 * @property {string} summary
 * @property {string[]} targetSectors
 * @property {string[]} unresolvedRisks
 * @property {string[]} recommendedAdjustments
 * @property {string[]} whatWouldChangeTheVerdict
 */

/**
 * @typedef {Object} FollowUpTurn
 * @property {string} question
 * @property {string} answer
 * @property {string} askedAt
 * @property {string} askedBy
 */

/**
 * @typedef {Object} ArbiterRun
 * @property {string} runId
 * @property {string} userId
 * @property {ArbiterInput} input
 * @property {MarketBrief|null} marketContext
 * @property {DebateTurn[]} transcript
 * @property {Verdict|null} verdict
 * @property {"running"|"complete"|"failed"} status
 * @property {FollowUpTurn[]} followUps
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export default {};