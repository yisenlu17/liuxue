import { DISCLAIMER_ZH, DISCLAIMER_EN } from './validator'
import type { StudentProfile, Organization, Language, ExtraData } from '@/types'

function formatExtraData(ed: ExtraData | undefined, targetLevel: string): string {
  if (!ed || Object.keys(ed).length === 0) return ''
  const lines: string[] = []
  const isHS = targetLevel === 'high_school' || targetLevel === 'foundation'

  if (isHS) {
    const boardLabel: Record<string, string> = { IB: 'IB', 'A-Level': 'A-Level', AP: 'AP', gaokao: '中国高考', IGCSE: 'IGCSE', other: '其他' }
    if (ed.exam_board) lines.push(`考试制度：${boardLabel[ed.exam_board] || ed.exam_board}`)

    if (ed.exam_board === 'IB' && ed.ib_subjects?.length) {
      lines.push('IB科目成绩：')
      ed.ib_subjects.forEach(s => {
        const sc = s.score ? `实际${s.score}分` : s.predicted ? `预测${s.predicted}分` : '未填'
        lines.push(`  ${s.name} (${s.level}): ${sc}/7`)
      })
      if (ed.ib_tok) lines.push(`TOK成绩：${ed.ib_tok}`)
      if (ed.ib_ee) lines.push(`EE成绩：${ed.ib_ee}`)
      if (ed.ib_predicted_total) lines.push(`IB预测总分：${ed.ib_predicted_total}/45`)
    }
    if (ed.exam_board === 'A-Level') {
      if (ed.alevel_overall_predicted) lines.push(`A-Level综合预测：${ed.alevel_overall_predicted}`)
      if (ed.alevel_overall_actual) lines.push(`A-Level综合实际：${ed.alevel_overall_actual}`)
      if (ed.alevel_subjects?.length) {
        lines.push('A-Level各科：')
        ed.alevel_subjects.forEach(s => {
          const g = s.grade ? `实际${s.grade}` : s.predicted ? `预测${s.predicted}` : '未填'
          lines.push(`  ${s.name}: ${g}`)
        })
      }
      if (ed.alevel_ucas_points) lines.push(`UCAS预测积分：${ed.alevel_ucas_points}`)
    }
    if (ed.exam_board === 'AP') {
      if (ed.ap_total_count !== undefined) lines.push(`AP修读：共${ed.ap_total_count}门，其中${ed.ap_five_count ?? 0}门5分`)
      if (ed.ap_subjects?.length) {
        lines.push('AP各科：')
        ed.ap_subjects.forEach(s => lines.push(`  ${s.name}: ${s.score ? s.score + '分' : '未填'}/5`))
      }
    }
    if (ed.exam_board === 'gaokao') {
      if (ed.gaokao_province) lines.push(`高考省份：${ed.gaokao_province}`)
      if (ed.gaokao_total) lines.push(`高考总分：${ed.gaokao_total}/${ed.gaokao_full_mark || 750}`)
      if (ed.gaokao_subjects?.length) {
        const scored = ed.gaokao_subjects.filter(s => s.score !== undefined)
        if (scored.length) lines.push('各科：' + scored.map(s => `${s.name}${s.score}`).join('，'))
      }
    }
    if (ed.exam_board === 'IGCSE') {
      if (ed.igcse_top_count !== undefined) lines.push(`IGCSE A*/A科目数：${ed.igcse_top_count}科`)
      if (ed.igcse_subjects?.length) {
        lines.push('IGCSE各科：')
        ed.igcse_subjects.forEach(s => lines.push(`  ${s.name}: ${s.grade || '未填'}`))
      }
    }
    if (ed.sat_total) lines.push(`SAT：${ed.sat_total}/1600 (EBRW ${ed.sat_ebrw || '-'}, Math ${ed.sat_math || '-'})`)
    if (ed.act_composite) lines.push(`ACT综合分：${ed.act_composite}/36`)
    if (ed.competitions) lines.push(`竞赛/奖项：${ed.competitions}`)
  }

  if (ed.gre_verbal || ed.gre_quant) lines.push(`GRE：Verbal ${ed.gre_verbal || '-'}，Quant ${ed.gre_quant || '-'}，AWA ${ed.gre_awa || '-'}`)
  if (ed.gmat_total) lines.push(`GMAT：${ed.gmat_total}`)
  if (ed.relevant_courses) lines.push(`核心课程：${ed.relevant_courses}`)
  if (ed.internship_details) lines.push(`实习详情：${ed.internship_details}`)
  if (ed.publications) lines.push(`论文/发表：${ed.publications}`)
  if (ed.skills) lines.push(`专业技能：${ed.skills}`)
  if (ed.research_interests) lines.push(`研究兴趣：${ed.research_interests}`)
  if (ed.supervisor_contact) lines.push(`已联系导师：${ed.supervisor_contact}`)

  return lines.join('\n')
}

export function buildExtractBackgroundPrompt(rawText: string): { system: string; user: string } {
  return {
    system: `你是一个专业的留学顾问助手。你的任务是从学生发送的自然语言文本中，精准提取结构化的背景信息。

请以 JSON 格式返回，字段如下：
{
  "current_school": "当前学校（字符串或null）",
  "current_major": "当前专业（字符串或null）",
  "gpa": "GPA数值（数字或null）",
  "gpa_scale": "满分制（数字，默认4.0）",
  "language_type": "考试类型：ielts/toefl/duolingo/other/null",
  "language_score": "成绩（数字或null）",
  "target_country": ["目标国家数组"],
  "target_level": "申请阶段：bachelor/master/phd/foundation/high_school/language_school",
  "target_major": "目标专业（字符串或null）",
  "budget_max": "预算上限人民币（数字或null）",
  "work_experience": "工作实习经历描述（字符串或null）",
  "research_experience": "科研经历（字符串或null）",
  "extracurriculars": "课外活动（字符串或null）",
  "intake_year": "入学年份（数字或null）",
  "preferences": {
    "ranking": "是否看重排名（布尔值）",
    "employment": "是否看重就业（布尔值）",
    "immigration": "是否考虑移民（布尔值）"
  },
  "missing_info": ["缺失的重要信息列表，用于追问"]
}

只返回 JSON，不要有任何其他文字。`,
    user: `请从以下学生咨询内容中提取信息：\n\n${rawText}`,
  }
}

export function buildStudyPlanPrompt(
  profile: Partial<StudentProfile>,
  lead: { student_name: string; target_country: string[]; target_level?: string; target_major?: string; budget_min?: number; budget_max?: number },
  org: Partial<Organization>,
  language: Language
): { system: string; user: string } {
  const isZh = language === 'zh'
  const disclaimer = isZh ? DISCLAIMER_ZH : DISCLAIMER_EN

  return {
    system: isZh
      ? `你是一位专业的留学顾问，服务于小型留学中介机构。你需要根据学生背景，生成一份专业、透明、可信的留学初步申请方案。

重要规则：
1. 绝对不得承诺录取、签证、就业或奖学金结果
2. 每个推荐院校必须说明推荐理由和风险点
3. 语气专业但易于理解
4. 必须包含风险提示
5. 必须在结尾包含免责声明

请以严格的 JSON 格式返回，结构如下：
{
  "background_summary": "学生背景摘要（2-3句话）",
  "application_positioning": "申请定位分析",
  "recommended_countries": ["推荐国家"],
  "recommended_majors": ["推荐专业方向"],
  "recommendations": [
    {
      "school_name": "学校名称",
      "country": "国家",
      "program_name": "项目名称",
      "tier": "reach/match/safe",
      "rationale": "推荐理由（2-3条）",
      "risks": "风险点",
      "fit_score": 8,
      "is_primary": true
    }
  ],
  "strengths": ["申请优势1", "申请优势2"],
  "weaknesses": ["申请短板1"],
  "risk_summary": "整体风险分析",
  "improvement_suggestions": ["提升建议1", "提升建议2"],
  "budget_note": "预算说明",
  "timeline_overview": "申请时间线建议",
  "next_steps": ["下一步行动1", "下一步行动2"],
  "disclaimer": "${disclaimer}"
}

推荐至少6-8所学校，冲刺2-3所、匹配3-4所、保底2所。只返回JSON。`
      : `You are a professional study abroad consultant. Generate a comprehensive, transparent, and trustworthy preliminary study plan based on the student's background.

Rules:
1. Never guarantee admission, visa, employment, or scholarship outcomes
2. Provide clear rationale and risk points for each recommended school
3. Professional yet accessible tone
4. Must include risk alerts
5. Must end with disclaimer

Return strict JSON format:
{
  "background_summary": "Brief student background (2-3 sentences)",
  "application_positioning": "Application positioning analysis",
  "recommended_countries": ["Country1"],
  "recommended_majors": ["Major direction"],
  "recommendations": [
    {
      "school_name": "University Name",
      "country": "Country",
      "program_name": "Program Name",
      "tier": "reach/match/safe",
      "rationale": "Why recommended",
      "risks": "Risk points",
      "fit_score": 8,
      "is_primary": true
    }
  ],
  "strengths": ["Strength1"],
  "weaknesses": ["Weakness1"],
  "risk_summary": "Overall risk analysis",
  "improvement_suggestions": ["Tip1"],
  "budget_note": "Budget notes",
  "timeline_overview": "Timeline suggestion",
  "next_steps": ["Action1", "Action2"],
  "disclaimer": "${disclaimer}"
}

Recommend 6-8 schools (2-3 reach, 3-4 match, 2 safe). Return JSON only.`,
    user: isZh
      ? `学生信息：
姓名：${lead.student_name}
当前学校：${profile.current_school || '未知'}
当前专业：${profile.current_major || '（高中/预科学生不适用）'}
GPA/均分：${profile.gpa ? `${profile.gpa} / ${profile.gpa_scale || 4.0}` : '（见详细成绩）'}
语言成绩：${profile.language_type?.toUpperCase() || '未知'} ${profile.language_score || '未知'}
工作/实习经历：${profile.work_experience || '无'}
科研经历：${profile.research_experience || '无'}
课外活动：${profile.extracurriculars || '无'}
目标国家：${lead.target_country?.join('、') || '未定'}
目标阶段：${lead.target_level || '硕士'}
目标专业：${lead.target_major || '未定'}
预算：${lead.budget_min ? `${lead.budget_min/10000}万` : '不限'} - ${lead.budget_max ? `${lead.budget_max/10000}万人民币` : '不限'}

${formatExtraData(profile.extra_data as ExtraData | undefined, lead.target_level || '') ? '详细学术背景：\n' + formatExtraData(profile.extra_data as ExtraData | undefined, lead.target_level || '') : ''}

请根据上述具体成绩数据，生成有针对性的专业留学申请方案（JSON格式）。院校选择必须结合学生的具体分数与目标项目录取要求，给出有说服力的推荐理由。`
      : `Student Info:
Name: ${lead.student_name}
Current School: ${profile.current_school || 'Unknown'}
Current Major: ${profile.current_major || 'N/A'}
GPA: ${profile.gpa ? `${profile.gpa} / ${profile.gpa_scale || 4.0}` : '(see detailed scores)'}
Language: ${profile.language_type?.toUpperCase() || 'Unknown'} ${profile.language_score || 'Unknown'}
Work Experience: ${profile.work_experience || 'None'}
Research: ${profile.research_experience || 'None'}
Extracurriculars: ${profile.extracurriculars || 'None'}
Target Countries: ${lead.target_country?.join(', ') || 'TBD'}
Program Level: ${lead.target_level || 'Master'}
Target Major: ${lead.target_major || 'TBD'}
Budget: ${lead.budget_max ? `up to RMB ${(lead.budget_max/10000).toFixed(0)}万` : 'Flexible'}

${formatExtraData(profile.extra_data as ExtraData | undefined, lead.target_level || '') ? 'Detailed Academic Background:\n' + formatExtraData(profile.extra_data as ExtraData | undefined, lead.target_level || '') : ''}

Generate a specific study plan based on the student's exact scores. School recommendations must reference actual admission requirements and be justified by the student's specific grades.`,
  }
}

export function buildParentVersionPrompt(
  studentPlanJson: string,
  language: Language
): { system: string; user: string } {
  const isZh = language === 'zh'
  const disclaimer = isZh ? DISCLAIMER_ZH : DISCLAIMER_EN

  return {
    system: isZh
      ? `你是一位专业的留学顾问，需要将一份专业的留学申请方案改写成给家长看的版本。

家长版特点：
1. 语言通俗易懂，避免太多专业术语
2. 重点强调：预算拆解、时间规划、主要风险、就业前景
3. 解释为什么推荐这些学校（不是因为佣金，而是因为适合孩子）
4. 让家长感受到顾问的专业性和负责任态度
5. 包含"接下来家长需要配合什么"
6. 必须包含免责声明
7. 不承诺录取或就业结果

以 JSON 格式返回：
{
  "opening": "开场白，介绍孩子的整体情况",
  "country_comparison": "推荐国家/地区对比说明",
  "why_these_schools": "为什么推荐这些学校的通俗解释",
  "budget_breakdown": "预算大致拆解（学费+生活费+服务费估算）",
  "timeline": "时间规划（什么时候需要做什么）",
  "risks": "主要风险和应对建议",
  "success_tips": "如何提升成功率",
  "parent_action_items": "接下来家长需要配合的事项",
  "closing": "结语",
  "disclaimer": "${disclaimer}"
}

只返回JSON。`
      : `You are a professional study abroad consultant rewriting a technical study plan into a parent-friendly version.

Parent version characteristics:
1. Plain language, avoid jargon
2. Focus on: budget breakdown, timeline, main risks, employment prospects
3. Explain why these schools are recommended (not for commission, but because they fit the student)
4. Show professionalism and responsibility
5. Include "what parents need to do next"
6. Must include disclaimer
7. No guarantees of admission or employment

Return JSON:
{
  "opening": "Introduction summarizing the student's situation",
  "country_comparison": "Country/region comparison",
  "why_these_schools": "Plain explanation for school recommendations",
  "budget_breakdown": "Budget estimate (tuition + living + service fees)",
  "timeline": "Timeline (when to do what)",
  "risks": "Main risks and mitigation",
  "success_tips": "How to improve success chances",
  "parent_action_items": "What parents need to do next",
  "closing": "Closing remarks",
  "disclaimer": "${disclaimer}"
}

Return JSON only.`,
    user: isZh
      ? `请根据以下学生版方案，生成家长版解释方案：\n\n${studentPlanJson}`
      : `Please generate a parent-friendly version based on the following student plan:\n\n${studentPlanJson}`,
  }
}

export function buildFollowUpPrompt(
  studentName: string,
  channel: string,
  messageType: string,
  tone: string,
  language: Language,
  planSummary?: string
): { system: string; user: string } {
  const isZh = language === 'zh'

  const toneMap: Record<string, string> = {
    professional: isZh ? '专业正式' : 'professional and formal',
    warm: isZh ? '温和亲切' : 'warm and friendly',
    sales: isZh ? '积极推动，制造紧迫感' : 'proactive with urgency',
    parent_friendly: isZh ? '适合家长阅读，通俗温和' : 'parent-friendly, gentle',
    concise: isZh ? '简洁直接' : 'concise and direct',
  }

  const typeMap: Record<string, string> = {
    initial: isZh ? '初次回复新咨询' : 'initial reply to new inquiry',
    post_plan_1d: isZh ? '发送方案后1天跟进' : '1-day follow-up after sending plan',
    post_plan_3d: isZh ? '发送方案后3天跟进' : '3-day follow-up after sending plan',
    post_plan_7d: isZh ? '发送方案后7天跟进' : '7-day follow-up after sending plan',
    parent_communication: isZh ? '家长沟通' : 'parent communication',
    urge_materials: isZh ? '催材料' : 'urging materials submission',
    push_sign: isZh ? '推进签约' : 'pushing for contract signing',
    price_objection: isZh ? '处理价格异议' : 'handling price objection',
    hesitation: isZh ? '处理学生犹豫' : 'handling student hesitation',
  }

  return {
    system: isZh
      ? `你是一位经验丰富的留学顾问，负责撰写跟进话术。

规则：
1. 不承诺录取/签证/就业结果
2. 不贬低竞争对手
3. 语气自然，像真人顾问写的，不像模板
4. 适合直接在${channel}上发送
5. 不超过300字
6. 只返回话术正文，不要加解释`
      : `You are an experienced study abroad consultant writing follow-up messages.

Rules:
1. No guarantees of admission/visa/employment
2. Do not disparage competitors
3. Natural tone, like a real advisor wrote it
4. Suitable for direct use on ${channel}
5. Under 300 words
6. Return only the message body, no explanations`,
    user: isZh
      ? `请为以下场景生成跟进话术：
学生姓名：${studentName}
场景：${typeMap[messageType] || messageType}
发送渠道：${channel}
语气要求：${toneMap[tone] || tone}
${planSummary ? `方案摘要：${planSummary}` : ''}

直接给出话术正文：`
      : `Generate a follow-up message for:
Student Name: ${studentName}
Scenario: ${typeMap[messageType] || messageType}
Channel: ${channel}
Tone: ${toneMap[tone] || tone}
${planSummary ? `Plan Summary: ${planSummary}` : ''}

Write the message directly:`,
  }
}

export function buildMaterialsChecklistPrompt(
  targetCountry: string[],
  targetLevel: string,
  targetMajor: string,
  language: Language
): { system: string; user: string } {
  const isZh = language === 'zh'
  return {
    system: isZh
      ? `你是一位专业的留学顾问，需要根据申请目标生成材料清单。

以 JSON 数组格式返回，每项包含：
[
  {
    "material_name": "材料名称",
    "notes": "说明或注意事项（可选）",
    "required": true/false
  }
]

只返回JSON数组。`
      : `You are a study abroad consultant. Generate a materials checklist based on the application target.

Return JSON array:
[
  {
    "material_name": "Material Name",
    "notes": "Notes or requirements (optional)",
    "required": true/false
  }
]

Return JSON array only.`,
    user: isZh
      ? `申请目标：${targetCountry.join('、')} ${targetLevel} ${targetMajor || ''}
请生成完整材料清单。`
      : `Application target: ${targetCountry.join(', ')} ${targetLevel} ${targetMajor || ''}
Generate a complete materials checklist.`,
  }
}
