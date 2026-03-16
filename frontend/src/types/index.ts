export interface Project {
  id: string
  name: string
  pico_data: PicoData | null
  created_at: string
  user_id: string
}

export interface PicoData {
  P: string
  I: string
  C: string
  O: string
  S: string
  E: string
}

export interface ScreeningResult {
  id: string
  project_id: string
  level: number
  title: string
  abstract: string
  decision: string
  ai_decision: string
  reason: string
  confidence: number
  p_check: boolean
  i_check: boolean
  c_check: boolean
  o_check: boolean
  s_check: boolean
  e_check: boolean
  p_reas: string
  i_reas: string
  c_reas: string
  o_reas: string
  s_reas: string
  e_reas: string
  source: string
  override_history: OverrideEntry[]
  created_at: string
}

export interface OverrideEntry {
  from: string
  to: string
  by: string
  at: string
  note?: string
}

export interface ScreeningResponse {
  decision: string
  confidence: number
  reason: string
  p_check: boolean
  i_check: boolean
  c_check: boolean
  o_check: boolean
  s_check: boolean
  e_check: boolean
  p_reas: string
  i_reas: string
  c_reas: string
  o_reas: string
  s_reas: string
  e_reas: string
}

export interface Citation {
  Title: string
  AuthorYear: string
  Context: string
  IsRelevant: boolean
  Confidence: number
  Reason: string
}

export interface BatchResult {
  processed: number
  failed: number
  results: (ScreeningResponse & { title: string; abstract?: string })[]
  errors: { title: string; error: string }[]
}
