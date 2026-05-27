'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import type { ExtraData, IBSubject, ALevelSubject, APSubject, GaokaoSubject, IGCSESubject } from '@/types'

interface Props {
  targetLevel: string
  extraData: ExtraData
  onChange: (changes: Partial<ExtraData>) => void
}

const IB_GRADES = ['7', '6', '5', '4', '3', '2', '1']
const ALEVEL_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'U']
const TOK_EE_GRADES = ['A', 'B', 'C', 'D', 'E']
const IGCSE_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
const GAOKAO_CORE = ['语文', '数学', '英语']

export default function StageBackgroundForm({ targetLevel, extraData, onChange }: Props) {
  const isHighSchool = targetLevel === 'high_school' || targetLevel === 'foundation'
  const isBachelor = targetLevel === 'bachelor'
  const isMaster = targetLevel === 'master'
  const isPhD = targetLevel === 'phd'

  if (isHighSchool) return <HighSchoolForm extraData={extraData} onChange={onChange} />
  if (isBachelor) return <UniversityForm extraData={extraData} onChange={onChange} showResearch={false} />
  if (isMaster) return <UniversityForm extraData={extraData} onChange={onChange} showResearch={true} />
  if (isPhD) return <PhDForm extraData={extraData} onChange={onChange} />
  return null
}

/* ─── High School / Foundation ─── */
function HighSchoolForm({ extraData, onChange }: { extraData: ExtraData; onChange: (c: Partial<ExtraData>) => void }) {
  const board = extraData.exam_board

  // IB helpers
  function addIB() { onChange({ ib_subjects: [...(extraData.ib_subjects || []), { name: '', level: 'HL' }] }) }
  function updateIB(i: number, ch: Partial<IBSubject>) {
    const s = [...(extraData.ib_subjects || [])]; s[i] = { ...s[i], ...ch }; onChange({ ib_subjects: s })
  }
  function removeIB(i: number) { onChange({ ib_subjects: (extraData.ib_subjects || []).filter((_, j) => j !== i) }) }

  // A-Level helpers
  function addAL() { onChange({ alevel_subjects: [...(extraData.alevel_subjects || []), { name: '' }] }) }
  function updateAL(i: number, ch: Partial<ALevelSubject>) {
    const s = [...(extraData.alevel_subjects || [])]; s[i] = { ...s[i], ...ch }; onChange({ alevel_subjects: s })
  }
  function removeAL(i: number) { onChange({ alevel_subjects: (extraData.alevel_subjects || []).filter((_, j) => j !== i) }) }

  // AP helpers
  function addAP() { onChange({ ap_subjects: [...(extraData.ap_subjects || []), { name: '' }] }) }
  function updateAP(i: number, ch: Partial<APSubject>) {
    const s = [...(extraData.ap_subjects || [])]; s[i] = { ...s[i], ...ch }; onChange({ ap_subjects: s })
  }
  function removeAP(i: number) { onChange({ ap_subjects: (extraData.ap_subjects || []).filter((_, j) => j !== i) }) }

  // IGCSE helpers
  function addIGCSE() { onChange({ igcse_subjects: [...(extraData.igcse_subjects || []), { name: '' }] }) }
  function updateIGCSE(i: number, ch: Partial<IGCSESubject>) {
    const s = [...(extraData.igcse_subjects || [])]; s[i] = { ...s[i], ...ch }; onChange({ igcse_subjects: s })
  }
  function removeIGCSE(i: number) { onChange({ igcse_subjects: (extraData.igcse_subjects || []).filter((_, j) => j !== i) }) }

  // Gaokao helpers — maintain 6 fixed slots (3 core + 3 elective)
  function getGaokaoSlots(): GaokaoSubject[] {
    const all = extraData.gaokao_subjects || []
    const cores = GAOKAO_CORE.map(name => all.find(s => s.name === name) || { name })
    const elecs = all.filter(s => !GAOKAO_CORE.includes(s.name))
    return [...cores, elecs[0] || { name: '' }, elecs[1] || { name: '' }, elecs[2] || { name: '' }]
  }
  function updateGaokaoSlot(slotIdx: number, key: 'name' | 'score', val: string | number | undefined) {
    const slots = getGaokaoSlots()
    slots[slotIdx] = { ...slots[slotIdx], [key]: val }
    onChange({ gaokao_subjects: slots.filter(s => s.name?.trim() || s.score !== undefined) })
  }
  const gaokaoSlots = getGaokaoSlots()

  return (
    <div className="space-y-5">
      {/* Exam board */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">当前考试制度 *</Label>
        <Select value={board || ''} onValueChange={v => v && onChange({ exam_board: v as ExtraData['exam_board'] })}>
          <SelectTrigger className="w-56 h-8 text-xs"><SelectValue placeholder="选择考试制度..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="IB">IB（国际文凭）</SelectItem>
            <SelectItem value="A-Level">A-Level（英国高中）</SelectItem>
            <SelectItem value="AP">AP（美国大学先修）</SelectItem>
            <SelectItem value="gaokao">中国高考</SelectItem>
            <SelectItem value="IGCSE">IGCSE / GCSE</SelectItem>
            <SelectItem value="other">其他 / 混合</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* IB */}
      {board === 'IB' && (
        <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-medium text-blue-900">IB 科目成绩</Label>
              <Button variant="outline" size="sm" onClick={addIB} className="gap-1 h-7 text-xs border-blue-200">
                <Plus className="w-3 h-3" />添加科目
              </Button>
            </div>
            {(extraData.ib_subjects || []).length > 0 && (
              <div className="grid grid-cols-[1fr_64px_88px_88px_24px] gap-2 text-xs text-gray-400 px-1 mb-1">
                <span>科目名称</span><span>HL/SL</span><span>预测分(1-7)</span><span>实际分(1-7)</span><span />
              </div>
            )}
            <div className="space-y-1.5">
              {(extraData.ib_subjects || []).map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_64px_88px_88px_24px] gap-2 items-center">
                  <Input value={s.name} placeholder="如：Math Analysis & Approaches" onChange={e => updateIB(i, { name: e.target.value })} className="h-8 text-xs" />
                  <Select value={s.level} onValueChange={v => updateIB(i, { level: v as 'HL' | 'SL' })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="HL">HL</SelectItem><SelectItem value="SL">SL</SelectItem></SelectContent>
                  </Select>
                  <Select value={String(s.predicted ?? '')} onValueChange={v => updateIB(i, { predicted: v ? +v : undefined })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      {IB_GRADES.map(g => <SelectItem key={g} value={g}>{g} 分</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={String(s.score ?? '')} onValueChange={v => updateIB(i, { score: v ? +v : undefined })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      {IB_GRADES.map(g => <SelectItem key={g} value={g}>{g} 分</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => removeIB(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(extraData.ib_subjects || []).length === 0 && (
                <p className="text-xs text-gray-400 italic">通常 3 HL + 3 SL 共 6 科，点击右上角添加</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-blue-800">TOK 成绩</Label>
              <Select value={extraData.ib_tok || ''} onValueChange={v => onChange({ ib_tok: v || undefined })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {TOK_EE_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-blue-800">Extended Essay 成绩</Label>
              <Select value={extraData.ib_ee || ''} onValueChange={v => onChange({ ib_ee: v || undefined })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="选择..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {TOK_EE_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-blue-800">预测总分（满分 45）</Label>
              <Input type="number" min={0} max={45} value={extraData.ib_predicted_total ?? ''} onChange={e => onChange({ ib_predicted_total: +e.target.value || undefined })} placeholder="38" className="h-8 text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* A-Level */}
      {board === 'A-Level' && (
        <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-purple-900">A-Level / AS-Level 科目成绩</Label>
            <Button variant="outline" size="sm" onClick={addAL} className="gap-1 h-7 text-xs border-purple-200">
              <Plus className="w-3 h-3" />添加科目
            </Button>
          </div>
          {(extraData.alevel_subjects || []).length > 0 && (
            <div className="grid grid-cols-[1fr_88px_88px_24px] gap-2 text-xs text-gray-400 px-1">
              <span>科目名称</span><span>预测成绩</span><span>实际成绩</span><span />
            </div>
          )}
          <div className="space-y-1.5">
            {(extraData.alevel_subjects || []).map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_88px_88px_24px] gap-2 items-center">
                <Input value={s.name} placeholder="如：Mathematics, Further Maths" onChange={e => updateAL(i, { name: e.target.value })} className="h-8 text-xs" />
                <Select value={s.predicted || ''} onValueChange={v => updateAL(i, { predicted: v || undefined })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="预测" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {ALEVEL_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={s.grade || ''} onValueChange={v => updateAL(i, { grade: v || undefined })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="实际" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {ALEVEL_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => removeAL(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(extraData.alevel_subjects || []).length === 0 && (
              <p className="text-xs text-gray-400 italic">通常 3 科 A-Level，点击右上角添加</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-purple-800">UCAS 预测积分（选填）</Label>
            <Input type="number" value={extraData.alevel_ucas_points ?? ''} onChange={e => onChange({ alevel_ucas_points: +e.target.value || undefined })} placeholder="如：128" className="h-8 text-xs w-32" />
          </div>
        </div>
      )}

      {/* AP */}
      {board === 'AP' && (
        <div className="space-y-3 p-4 bg-green-50/50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-green-900">AP 科目成绩</Label>
            <Button variant="outline" size="sm" onClick={addAP} className="gap-1 h-7 text-xs border-green-200">
              <Plus className="w-3 h-3" />添加科目
            </Button>
          </div>
          {(extraData.ap_subjects || []).length > 0 && (
            <div className="grid grid-cols-[1fr_88px_24px] gap-2 text-xs text-gray-400 px-1">
              <span>科目名称</span><span>分数（1-5）</span><span />
            </div>
          )}
          <div className="space-y-1.5">
            {(extraData.ap_subjects || []).map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_88px_24px] gap-2 items-center">
                <Input value={s.name} placeholder="如：Calculus BC, Statistics" onChange={e => updateAP(i, { name: e.target.value })} className="h-8 text-xs" />
                <Select value={String(s.score ?? '')} onValueChange={v => updateAP(i, { score: v ? +v : undefined })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {['5', '4', '3', '2', '1'].map(g => <SelectItem key={g} value={g}>{g} 分</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => removeAP(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(extraData.ap_subjects || []).length === 0 && (
              <p className="text-xs text-gray-400 italic">已修 AP 课程的科目和分数</p>
            )}
          </div>
        </div>
      )}

      {/* 高考 */}
      {board === 'gaokao' && (
        <div className="space-y-4 p-4 bg-red-50/50 rounded-lg border border-red-100">
          <Label className="text-xs font-medium text-red-900 block">高考成绩</Label>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-red-800">省份</Label>
              <Input value={extraData.gaokao_province || ''} onChange={e => onChange({ gaokao_province: e.target.value || undefined })} placeholder="如：山东省" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-red-800">总分</Label>
              <Input type="number" value={extraData.gaokao_total ?? ''} onChange={e => onChange({ gaokao_total: +e.target.value || undefined })} placeholder="650" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-red-800">满分</Label>
              <Select value={String(extraData.gaokao_full_mark || 750)} onValueChange={v => v && onChange({ gaokao_full_mark: +v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="750">750（全国大多数省份）</SelectItem>
                  <SelectItem value="660">660（上海）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-red-800 mb-2 block">各科成绩</Label>
            <div className="space-y-2">
              {gaokaoSlots.map((s, i) => {
                const isCore = i < 3
                const label = isCore ? s.name : `选科 ${i - 2}`
                const placeholder = isCore ? '如：130' : '科目名称（物理/化学等）'
                return (
                  <div key={i} className={`grid gap-2 items-center ${isCore ? 'grid-cols-[80px_100px]' : 'grid-cols-[1fr_100px]'}`}>
                    {isCore ? (
                      <Label className="text-xs text-gray-500">{label}</Label>
                    ) : (
                      <Input value={s.name} placeholder={placeholder} onChange={e => updateGaokaoSlot(i, 'name', e.target.value || undefined)} className="h-8 text-xs" />
                    )}
                    <Input type="number" value={s.score ?? ''} placeholder={isCore ? placeholder : '分数'} onChange={e => updateGaokaoSlot(i, 'score', +e.target.value || undefined)} className="h-8 text-xs" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* IGCSE */}
      {board === 'IGCSE' && (
        <div className="space-y-3 p-4 bg-yellow-50/50 rounded-lg border border-yellow-100">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-yellow-900">IGCSE / GCSE 科目成绩</Label>
            <Button variant="outline" size="sm" onClick={addIGCSE} className="gap-1 h-7 text-xs border-yellow-200">
              <Plus className="w-3 h-3" />添加科目
            </Button>
          </div>
          {(extraData.igcse_subjects || []).length > 0 && (
            <div className="grid grid-cols-[1fr_88px_24px] gap-2 text-xs text-gray-400 px-1">
              <span>科目名称</span><span>成绩</span><span />
            </div>
          )}
          <div className="space-y-1.5">
            {(extraData.igcse_subjects || []).map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_88px_24px] gap-2 items-center">
                <Input value={s.name} placeholder="如：Mathematics, Physics" onChange={e => updateIGCSE(i, { name: e.target.value })} className="h-8 text-xs" />
                <Select value={s.grade || ''} onValueChange={v => updateIGCSE(i, { grade: v || undefined })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {IGCSE_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button onClick={() => removeIGCSE(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {(extraData.igcse_subjects || []).length === 0 && (
              <p className="text-xs text-gray-400 italic">通常 8-10 科，重点填写数学、理科、英语</p>
            )}
          </div>
        </div>
      )}

      {/* SAT / ACT (for all high school boards) */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-gray-600">标准化考试（SAT / ACT，选填）</Label>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">SAT 总分（满分 1600）</Label>
            <Input type="number" min={400} max={1600} value={extraData.sat_total ?? ''} onChange={e => onChange({ sat_total: +e.target.value || undefined })} placeholder="1450" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">EBRW（满分 800）</Label>
            <Input type="number" value={extraData.sat_ebrw ?? ''} onChange={e => onChange({ sat_ebrw: +e.target.value || undefined })} placeholder="720" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">Math（满分 800）</Label>
            <Input type="number" value={extraData.sat_math ?? ''} onChange={e => onChange({ sat_math: +e.target.value || undefined })} placeholder="730" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-500">ACT 综合分（满分 36）</Label>
            <Input type="number" min={1} max={36} value={extraData.act_composite ?? ''} onChange={e => onChange({ act_composite: +e.target.value || undefined })} placeholder="32" className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Competitions */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">竞赛 / 奖项 / 荣誉</Label>
        <Textarea value={extraData.competitions || ''} onChange={e => onChange({ competitions: e.target.value || undefined })} placeholder="如：AMC 10 一等奖，全国中学生物理竞赛省级一等奖，模联最佳代表，领导力奖学金..." rows={2} className="resize-none text-xs" />
      </div>
    </div>
  )
}

/* ─── Bachelor / Master ─── */
function UniversityForm({ extraData, onChange, showResearch }: {
  extraData: ExtraData
  onChange: (c: Partial<ExtraData>) => void
  showResearch: boolean
}) {
  return (
    <div className="space-y-4">
      {/* GRE / GMAT — only for master */}
      {showResearch && (
        <div className="space-y-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
          <Label className="text-xs font-medium text-indigo-900">GRE / GMAT（选填）</Label>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-indigo-700">GRE Verbal</Label>
              <Input type="number" min={130} max={170} value={extraData.gre_verbal ?? ''} onChange={e => onChange({ gre_verbal: +e.target.value || undefined })} placeholder="155" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-indigo-700">GRE Quant</Label>
              <Input type="number" min={130} max={170} value={extraData.gre_quant ?? ''} onChange={e => onChange({ gre_quant: +e.target.value || undefined })} placeholder="165" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-indigo-700">GRE AWA</Label>
              <Input type="number" step={0.5} min={0} max={6} value={extraData.gre_awa ?? ''} onChange={e => onChange({ gre_awa: parseFloat(e.target.value) || undefined })} placeholder="4.0" className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-indigo-700">GMAT 总分（805 满分）</Label>
              <Input type="number" value={extraData.gmat_total ?? ''} onChange={e => onChange({ gmat_total: +e.target.value || undefined })} placeholder="700" className="h-8 text-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Relevant courses */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">核心课程及成绩</Label>
        <Textarea value={extraData.relevant_courses || ''} onChange={e => onChange({ relevant_courses: e.target.value || undefined })} placeholder="如：数据结构 A+，机器学习 A，计量经济学 A，公司金融 A-..." rows={2} className="resize-none text-xs" />
        <p className="text-xs text-gray-400">填写与申请目标专业相关的课程，尤其是成绩较好的</p>
      </div>

      {/* Internship details */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">实习 / 工作经历详情</Label>
        <Textarea value={extraData.internship_details || ''} onChange={e => onChange({ internship_details: e.target.value || undefined })} placeholder="公司名称、行业、职位、时长、主要职责和成果（每段分行写）..." rows={3} className="resize-none text-xs" />
      </div>

      {/* Research & publications */}
      {showResearch && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">论文 / 发表 / 科研项目</Label>
          <Textarea value={extraData.publications || ''} onChange={e => onChange({ publications: e.target.value || undefined })} placeholder="期刊/会议名称、发表年份、作者顺序（第一/共同作者）、SCI/EI/SSCI 收录情况..." rows={2} className="resize-none text-xs" />
        </div>
      )}

      {/* Skills */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">专业技能 / 工具</Label>
        <Textarea value={extraData.skills || ''} onChange={e => onChange({ skills: e.target.value || undefined })} placeholder="如：Python（熟练）、R、MATLAB、SQL、Bloomberg、Stata、AutoCAD..." rows={2} className="resize-none text-xs" />
      </div>

      {/* Research interests (master only) */}
      {showResearch && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">研究兴趣 / 方向</Label>
          <Textarea value={extraData.research_interests || ''} onChange={e => onChange({ research_interests: e.target.value || undefined })} placeholder="如：机器学习、量化金融、城市规划、行为经济学..." rows={2} className="resize-none text-xs" />
        </div>
      )}
    </div>
  )
}

/* ─── PhD ─── */
function PhDForm({ extraData, onChange }: { extraData: ExtraData; onChange: (c: Partial<ExtraData>) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
        <Label className="text-xs font-medium text-indigo-900">GRE / GMAT（部分项目要求）</Label>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-indigo-700">GRE Verbal</Label>
            <Input type="number" min={130} max={170} value={extraData.gre_verbal ?? ''} onChange={e => onChange({ gre_verbal: +e.target.value || undefined })} placeholder="155" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-indigo-700">GRE Quant</Label>
            <Input type="number" min={130} max={170} value={extraData.gre_quant ?? ''} onChange={e => onChange({ gre_quant: +e.target.value || undefined })} placeholder="165" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-indigo-700">GRE AWA</Label>
            <Input type="number" step={0.5} min={0} max={6} value={extraData.gre_awa ?? ''} onChange={e => onChange({ gre_awa: parseFloat(e.target.value) || undefined })} placeholder="4.0" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-indigo-700">GMAT 总分</Label>
            <Input type="number" value={extraData.gmat_total ?? ''} onChange={e => onChange({ gmat_total: +e.target.value || undefined })} placeholder="700" className="h-8 text-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">研究兴趣 / 拟研究方向</Label>
        <Textarea value={extraData.research_interests || ''} onChange={e => onChange({ research_interests: e.target.value || undefined })} placeholder="核心研究方向、拟解决的问题、感兴趣的导师方向..." rows={3} className="resize-none text-xs" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">论文 / 发表成果</Label>
        <Textarea value={extraData.publications || ''} onChange={e => onChange({ publications: e.target.value || undefined })} placeholder="期刊名称、年份、作者顺序、影响因子或会议级别（如 NeurIPS, ACL, Nature...）" rows={3} className="resize-none text-xs" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">已联系导师情况</Label>
        <Textarea value={extraData.supervisor_contact || ''} onChange={e => onChange({ supervisor_contact: e.target.value || undefined })} placeholder="已发送套磁邮件的导师名单、回复情况、面试安排..." rows={2} className="resize-none text-xs" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">专业技能 / 工具</Label>
        <Textarea value={extraData.skills || ''} onChange={e => onChange({ skills: e.target.value || undefined })} placeholder="编程语言、实验工具、数据库..." rows={2} className="resize-none text-xs" />
      </div>
    </div>
  )
}
