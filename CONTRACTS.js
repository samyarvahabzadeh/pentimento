// CONTRACTS.ts — semantic contract for Pentimento Text Core
// Agent may reorganize files, but must preserve these ownership boundaries.
export {};
// Ownership rules:
// - LLMTransport never mutates RunState.
// - Director parser never mutates RunState.
// - ProposalValidator never invents actions/facts.
// - GameEngine alone applies accepted canonical actions.
// - Memory compiler consumes validated turn results.
// - Exactly one NarrativeSource is rendered.
