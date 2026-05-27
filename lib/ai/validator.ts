const BANNED_PHRASES_ZH = [
  '保证录取', '确保录取', '100%录取', '一定能录', '肯定录取',
  '保证签证', '签证保证', '一定拿到签证',
  '保证就业', '保证找到工作', '就业保证',
  '保证奖学金',
  '录取率100', '百分之百录取',
]

const BANNED_PHRASES_EN = [
  'guaranteed admission', 'guarantee admission', '100% acceptance',
  'guaranteed visa', 'visa guarantee',
  'guaranteed employment', 'job guarantee',
  'guaranteed scholarship',
  '100% acceptance rate',
]

const ALL_BANNED = [...BANNED_PHRASES_ZH, ...BANNED_PHRASES_EN]

export interface ValidationResult {
  passed: boolean
  violations: string[]
}

export function validatePlanContent(content: string): ValidationResult {
  const violations: string[] = []
  const lowerContent = content.toLowerCase()

  for (const phrase of ALL_BANNED) {
    if (lowerContent.includes(phrase.toLowerCase())) {
      violations.push(phrase)
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}

export const DISCLAIMER_ZH = `本方案仅基于当前提供信息生成，用于初步咨询和规划参考，不构成录取、签证、奖学金或就业保证。最终申请要求、截止日期、学费和政策以学校及官方机构发布信息为准。顾问应在发送前审核所有内容。`

export const DISCLAIMER_EN = `This plan is generated based on information provided and is for preliminary consultation and planning reference only. It does not constitute a guarantee of admission, visa, scholarship, or employment. Final application requirements, deadlines, tuition, and policies are subject to official announcements by universities and relevant authorities. Advisors should review all content before sending.`
