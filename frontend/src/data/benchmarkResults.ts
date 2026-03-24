// All benchmark results in one place. Update here when new benchmarks are run.

export interface ModelResult {
  model: string
  developer?: string
  oss?: boolean
  // Framework 1: Forced Binary
  fb_recall: string
  fb_spec: string
  fb_prec: string
  fb_f1: string
  fb_errors: number
  // Framework 2: Partial Eval (decided only)
  f2_recall?: string
  f2_spec?: string
  f2_prec?: string
  f2_f1?: string
  f2_coverage?: string
  // Framework 3: Deference-Aware
  da_sens: string
  da_spec: string
  da_prec?: string
  da_f1: string
  da_errors: number
  da_deferred: string
  da_coverage: string
  // Selection
  tier2?: boolean
  green?: boolean
}

export interface ConsensusResult {
  pair: string
  da_sens: string
  da_spec: string
  da_f1: string
  errors: number
  deferred: string
  coverage: string
}

export interface DualRunResult {
  model: string
  // Single-run (from Tier 2)
  s1_sens: string
  s1_errors: number
  s1_def: string
  // Dual-run
  s2_sens: string
  s2_errors: number
  s2_def: string
  hard_miss: number
  coverage: string
  green?: boolean
}

// ============================================================
// TIER 1: Smoke Test (10 studies)
// ============================================================

export const tier1Results: ModelResult[] = [
  { model: 'Claude Sonnet 4.6', developer: 'Anthropic', oss: false, fb_recall: '60%', fb_spec: '100%', fb_prec: '100%', fb_f1: '75%', fb_errors: 0, da_sens: '100%', da_spec: '100%', da_f1: '100%', da_errors: 0, da_deferred: '40%', da_coverage: '60%', tier2: true, green: true },
  { model: 'DeepSeek v3', developer: 'DeepSeek', oss: true, fb_recall: '80%', fb_spec: '80%', fb_prec: '80%', fb_f1: '80%', fb_errors: 2, da_sens: '80%', da_spec: '80%', da_f1: '80%', da_errors: 2, da_deferred: '0%', da_coverage: '100%', tier2: true },
  { model: 'Kimi k2', developer: 'Moonshot AI', oss: true, fb_recall: '60%', fb_spec: '80%', fb_prec: '75%', fb_f1: '67%', fb_errors: 2, da_sens: '80%', da_spec: '80%', da_f1: '77%', da_errors: 2, da_deferred: '10%', da_coverage: '90%', tier2: true },
  { model: 'Llama 3.3 70B', developer: 'Meta', oss: true, fb_recall: '80%', fb_spec: '60%', fb_prec: '67%', fb_f1: '73%', fb_errors: 3, da_sens: '80%', da_spec: '60%', da_f1: '73%', da_errors: 3, da_deferred: '10%', da_coverage: '90%', tier2: true },
  { model: 'Mistral 3.1 24B', developer: 'Mistral AI', oss: true, fb_recall: '60%', fb_spec: '60%', fb_prec: '60%', fb_f1: '60%', fb_errors: 3, da_sens: '80%', da_spec: '60%', da_f1: '69%', da_errors: 3, da_deferred: '10%', da_coverage: '90%', tier2: true },
  { model: 'Gemma 3 27B', developer: 'Google', oss: true, fb_recall: '80%', fb_spec: '40%', fb_prec: '57%', fb_f1: '67%', fb_errors: 4, da_sens: '80%', da_spec: '40%', da_f1: '67%', da_errors: 4, da_deferred: '0%', da_coverage: '100%', tier2: true },
  { model: 'GPT-4o', developer: 'OpenAI', oss: false, fb_recall: '60%', fb_spec: '60%', fb_prec: '60%', fb_f1: '60%', fb_errors: 4, da_sens: '60%', da_spec: '60%', da_f1: '60%', da_errors: 4, da_deferred: '0%', da_coverage: '100%', tier2: false },
  { model: 'Qwen 3 235B', developer: 'Alibaba', oss: true, fb_recall: '60%', fb_spec: '60%', fb_prec: '60%', fb_f1: '60%', fb_errors: 4, da_sens: '60%', da_spec: '60%', da_f1: '60%', da_errors: 4, da_deferred: '0%', da_coverage: '100%', tier2: false },
  { model: 'DeepSeek R1 32B', developer: 'DeepSeek', oss: true, fb_recall: '80%', fb_spec: '20%', fb_prec: '50%', fb_f1: '62%', fb_errors: 5, da_sens: '80%', da_spec: '20%', da_f1: '62%', da_errors: 5, da_deferred: '0%', da_coverage: '100%', tier2: false },
]

// ============================================================
// TIER 2: Donners et al. 2021 (258 studies)
// ============================================================

export const tier2Results: ModelResult[] = [
  { model: 'Claude Sonnet 4.6', fb_recall: '73.3%', fb_spec: '95.9%', fb_prec: '52.4%', fb_f1: '61.1%', fb_errors: 13, f2_recall: '100%', f2_spec: '98.4%', f2_prec: '75.0%', f2_f1: '85.7%', f2_coverage: '76.7%', da_sens: '100%', da_spec: '98.8%', da_prec: '75.0%', da_f1: '85.7%', da_errors: 3, da_deferred: '23.3%', da_coverage: '76.7%', green: true },
  { model: 'Llama 3.3 70B', fb_recall: '93.3%', fb_spec: '74.7%', fb_prec: '19.2%', fb_f1: '31.8%', fb_errors: 62, f2_recall: '93.3%', f2_spec: '73.3%', f2_prec: '19.4%', f2_f1: '32.2%', f2_coverage: '93.5%', da_sens: '93.3%', da_spec: '75.1%', da_prec: '19.4%', da_f1: '32.2%', da_errors: 59, da_deferred: '6.5%', da_coverage: '93.5%' },
  { model: 'Mistral 3.1 24B', fb_recall: '86.7%', fb_spec: '83.5%', fb_prec: '24.5%', fb_f1: '38.2%', fb_errors: 42, f2_recall: '92.9%', f2_spec: '83.1%', f2_prec: '24.5%', f2_f1: '38.8%', f2_coverage: '97.3%', da_sens: '93.3%', da_spec: '83.5%', da_prec: '24.5%', da_f1: '38.9%', da_errors: 41, da_deferred: '2.7%', da_coverage: '97.3%' },
  { model: 'DeepSeek v3', fb_recall: '73.3%', fb_spec: '89.7%', fb_prec: '30.6%', fb_f1: '43.1%', fb_errors: 29, f2_recall: '73.3%', f2_spec: '89.5%', f2_prec: '30.6%', f2_f1: '43.1%', f2_coverage: '99.6%', da_sens: '73.3%', da_spec: '89.7%', da_prec: '30.6%', da_f1: '43.1%', da_errors: 29, da_deferred: '0.4%', da_coverage: '99.6%' },
  { model: 'Kimi k2', fb_recall: '73.3%', fb_spec: '86.8%', fb_prec: '25.6%', fb_f1: '37.9%', fb_errors: 36, f2_recall: '78.6%', f2_spec: '86.6%', f2_prec: '25.6%', f2_f1: '38.6%', f2_coverage: '98.1%', da_sens: '80.0%', da_spec: '86.8%', da_prec: '25.6%', da_f1: '38.8%', da_errors: 35, da_deferred: '1.9%', da_coverage: '98.1%' },
  { model: 'Gemma 3 27B', fb_recall: '93.3%', fb_spec: '71.2%', fb_prec: '16.7%', fb_f1: '28.3%', fb_errors: 71, f2_recall: '93.3%', f2_spec: '71.0%', f2_prec: '16.7%', f2_f1: '28.3%', f2_coverage: '99.2%', da_sens: '93.3%', da_spec: '71.2%', da_prec: '16.7%', da_f1: '28.3%', da_errors: 71, da_deferred: '0.8%', da_coverage: '99.2%' },
]

// ============================================================
// TIER 3a: Same-Model Dual-Run Consensus
// ============================================================

export const tier3aResults: DualRunResult[] = [
  { model: 'Claude Sonnet 4.6', s1_sens: '100%', s1_errors: 3, s1_def: '23.3%', s2_sens: '100%', s2_errors: 3, s2_def: '25.2%', hard_miss: 0, coverage: '74.8%', green: true },
  { model: 'Mistral 3.1 24B', s1_sens: '93.3%', s1_errors: 41, s1_def: '2.7%', s2_sens: '93.3%', s2_errors: 39, s2_def: '6.6%', hard_miss: 1, coverage: '93.4%' },
  { model: 'Kimi k2', s1_sens: '80.0%', s1_errors: 35, s1_def: '1.9%', s2_sens: '80.0%', s2_errors: 28, s2_def: '6.6%', hard_miss: 3, coverage: '93.4%' },
  { model: 'DeepSeek v3', s1_sens: '73.3%', s1_errors: 29, s1_def: '0.4%', s2_sens: '73.3%', s2_errors: 29, s2_def: '0.4%', hard_miss: 4, coverage: '99.6%' },
]

// ============================================================
// TIER 3b: Mixed-Model Consensus
// ============================================================

export const tier3bResults: ConsensusResult[] = [
  { pair: 'Llama 70B + DeepSeek v3', da_sens: '100%', da_spec: '92.7%', da_f1: '54.0%', errors: 17, deferred: '28.2%', coverage: '71.8%' },
  { pair: 'Llama 70B + Kimi k2', da_sens: '100%', da_spec: '90.1%', da_f1: '46.5%', errors: 23, deferred: '25.9%', coverage: '74.1%' },
  { pair: 'Gemma 27B + DeepSeek v3', da_sens: '93.3%', da_spec: '90.5%', da_f1: '48.0%', errors: 24, deferred: '21.3%', coverage: '78.7%' },
  { pair: 'Gemma 27B + Kimi k2', da_sens: '93.3%', da_spec: '89.3%', da_f1: '45.1%', errors: 27, deferred: '22.2%', coverage: '77.8%' },
]

export const claudeReference: ConsensusResult = {
  pair: 'Claude single (ref)',
  da_sens: '100%', da_spec: '98.8%', da_f1: '85.7%',
  errors: 3, deferred: '23.3%', coverage: '76.7%',
}
