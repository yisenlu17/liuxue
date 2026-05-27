export type AIProvider = 'claude' | 'openai'
export type Language = 'zh' | 'en'
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'team'

export type UserRole = 'owner' | 'admin' | 'consultant' | 'assistant' | 'viewer'

export type LeadStatus =
  | 'new'
  | 'background_collected'
  | 'plan_generated'
  | 'plan_sent'
  | 'awaiting_reply'
  | 'high_intent'
  | 'signed'
  | 'materials_in_progress'
  | 'application_in_progress'
  | 'offer_received'
  | 'lost'

export type LeadPriority = 'high' | 'medium' | 'low'

export type LeadSource =
  | 'xiaohongshu'
  | 'wechat'
  | 'whatsapp'
  | 'website'
  | 'referral'
  | 'offline'
  | 'instagram'
  | 'facebook'
  | 'other'

export type PlanType = 'student' | 'parent' | 'consultant' | 'bilingual'
export type PlanTier = 'reach' | 'match' | 'safe'

export type MaterialStatus =
  | 'pending'
  | 'reminded'
  | 'in_progress'
  | 'received'
  | 'needs_revision'
  | 'done'

export type FollowUpChannel = 'wechat' | 'whatsapp' | 'email' | 'xiaohongshu' | 'phone'
export type FollowUpTone = 'professional' | 'warm' | 'sales' | 'parent_friendly' | 'concise'

export type FollowUpType =
  | 'initial'
  | 'collect_background'
  | 'send_plan'
  | 'post_plan_1d'
  | 'post_plan_3d'
  | 'post_plan_7d'
  | 'parent_communication'
  | 'urge_materials'
  | 'push_sign'
  | 'price_objection'
  | 'competitor_objection'
  | 'hesitation'
  | 'urgency_reminder'

export interface Organization {
  id: string
  name: string
  logo_url?: string
  country?: string
  city?: string
  default_language: Language
  contact_email?: string
  whatsapp?: string
  wechat?: string
  service_countries: string[]
  service_levels: string[]
  subscription_plan: SubscriptionPlan
  ai_provider: AIProvider
  created_at: string
}

export interface UserProfile {
  id: string
  organization_id: string
  name: string
  role: UserRole
  created_at: string
}

export interface Lead {
  id: string
  organization_id: string
  assigned_user_id?: string
  student_name: string
  contact?: string
  source?: LeadSource
  status: LeadStatus
  priority: LeadPriority
  target_country: string[]
  target_level?: string
  target_major?: string
  budget_min?: number
  budget_max?: number
  intake_year?: number
  last_followed_up_at?: string
  created_at: string
}

export interface IBSubject { name: string; level: 'HL' | 'SL'; score?: number; predicted?: number }
export interface ALevelSubject { name: string; grade?: string; predicted?: string }
export interface APSubject { name: string; score?: number }
export interface GaokaoSubject { name: string; score?: number }
export interface IGCSESubject { name: string; grade?: string }

export interface ExtraData {
  // High school / Foundation
  exam_board?: 'IB' | 'A-Level' | 'AP' | 'gaokao' | 'IGCSE' | 'other'
  ib_subjects?: IBSubject[]
  ib_tok?: string
  ib_ee?: string
  ib_predicted_total?: number
  alevel_subjects?: ALevelSubject[]
  alevel_ucas_points?: number
  ap_subjects?: APSubject[]
  gaokao_province?: string
  gaokao_total?: number
  gaokao_full_mark?: number
  gaokao_subjects?: GaokaoSubject[]
  igcse_subjects?: IGCSESubject[]
  alevel_overall_predicted?: string
  alevel_overall_actual?: string
  ap_total_count?: number
  ap_five_count?: number
  igcse_top_count?: number
  sat_total?: number
  sat_ebrw?: number
  sat_math?: number
  act_composite?: number
  competitions?: string
  // Bachelor / Master / PhD
  gre_verbal?: number
  gre_quant?: number
  gre_awa?: number
  gmat_total?: number
  relevant_courses?: string
  internship_details?: string
  publications?: string
  skills?: string
  research_interests?: string
  supervisor_contact?: string
}

export interface StudentProfile {
  id: string
  lead_id: string
  current_school?: string
  current_major?: string
  gpa?: number
  gpa_scale: number
  language_type?: 'ielts' | 'toefl' | 'duolingo' | 'other'
  language_score?: number
  work_experience?: string
  research_experience?: string
  extracurriculars?: string
  target_preferences?: {
    ranking?: boolean
    employment?: boolean
    immigration?: boolean
    budget_sensitive?: boolean
  }
  parent_concerns?: string[]
  raw_input?: string
  extra_data?: ExtraData
  updated_at: string
}

export interface SchoolRecommendation {
  school_name: string
  country: string
  program_name: string
  tier: PlanTier
  rationale: string
  risks: string
  fit_score: number
  is_primary: boolean
}

export interface StudyPlanContent {
  background_summary: string
  application_positioning: string
  recommended_countries: string[]
  recommended_majors: string[]
  recommendations: SchoolRecommendation[]
  strengths: string[]
  weaknesses: string[]
  risk_summary: string
  improvement_suggestions: string[]
  budget_note: string
  timeline_overview: string
  next_steps: string[]
  disclaimer: string
  parent_section?: {
    country_comparison: string
    why_these_schools: string
    budget_breakdown: string
    timeline: string
    risks: string
    success_tips: string
    parent_action_items: string
  }
}

export interface StudyPlan {
  id: string
  lead_id: string
  created_by: string
  version: number
  plan_type: PlanType
  language: Language
  content_json: StudyPlanContent
  risk_flags: string[]
  quality_score?: number
  is_approved: boolean
  created_at: string
}

export interface Material {
  id: string
  lead_id: string
  material_name: string
  status: MaterialStatus
  due_date?: string
  notes?: string
}

export interface FollowUp {
  id: string
  lead_id: string
  channel: FollowUpChannel
  message_type: FollowUpType
  message_content: string
  tone: FollowUpTone
  language: Language
  created_at: string
}

export interface UsageRecord {
  id: string
  organization_id: string
  user_id: string
  action_type: string
  tokens_used?: number
  model?: string
  cost_estimate?: number
  created_at: string
}

export interface DashboardStats {
  new_leads_this_month: number
  plans_generated: number
  high_intent_count: number
  signed_count: number
  pending_followup: number
  missing_materials: number
  upcoming_deadlines: number
  ai_usage_this_month: number
}

export const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 3,
  starter: 50,
  pro: 300,
  team: 1000,
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, { zh: string; en: string; color: string }> = {
  new: { zh: '新咨询', en: 'New', color: 'bg-blue-100 text-blue-800' },
  background_collected: { zh: '已收集背景', en: 'Background Collected', color: 'bg-purple-100 text-purple-800' },
  plan_generated: { zh: '已生成方案', en: 'Plan Generated', color: 'bg-yellow-100 text-yellow-800' },
  plan_sent: { zh: '已发送方案', en: 'Plan Sent', color: 'bg-orange-100 text-orange-800' },
  awaiting_reply: { zh: '等待回复', en: 'Awaiting Reply', color: 'bg-gray-100 text-gray-800' },
  high_intent: { zh: '高意向', en: 'High Intent', color: 'bg-green-100 text-green-800' },
  signed: { zh: '已签约', en: 'Signed', color: 'bg-emerald-100 text-emerald-800' },
  materials_in_progress: { zh: '材料准备中', en: 'Materials In Progress', color: 'bg-teal-100 text-teal-800' },
  application_in_progress: { zh: '申请进行中', en: 'Application In Progress', color: 'bg-cyan-100 text-cyan-800' },
  offer_received: { zh: '已拿Offer', en: 'Offer Received', color: 'bg-lime-100 text-lime-800' },
  lost: { zh: '已流失', en: 'Lost', color: 'bg-red-100 text-red-800' },
}

export const SOURCE_LABELS: Record<LeadSource, { zh: string; en: string }> = {
  xiaohongshu: { zh: '小红书', en: 'Xiaohongshu' },
  wechat: { zh: '微信', en: 'WeChat' },
  whatsapp: { zh: 'WhatsApp', en: 'WhatsApp' },
  website: { zh: '官网', en: 'Website' },
  referral: { zh: '朋友介绍', en: 'Referral' },
  offline: { zh: '线下活动', en: 'Offline' },
  instagram: { zh: 'Instagram', en: 'Instagram' },
  facebook: { zh: 'Facebook', en: 'Facebook' },
  other: { zh: '其他', en: 'Other' },
}
