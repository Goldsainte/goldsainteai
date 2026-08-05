/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  bookingId?: string
  specialistName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (specialist: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Share your Goldsainte experience',
    title: 'Share your Goldsainte experience',
    headline: 'How was your journey?',
    tagline: 'Your private review helps maintain the quality of our marketplace.',
    lede: (sp) => `Welcome home. We hope your trip with ${sp} was everything you imagined. Your honest review — visible only to admins and the specialist — helps us preserve the integrity of the Goldsainte network.`,
    step1: "Rate your overall experience and the specialist's craft.",
    step2: 'Share what was extraordinary — and what could improve.',
    step3: 'Reviews are private by default; you may opt to publish.',
    step4: 'Specialists may respond once.',
    step5: 'Your feedback shapes the future of our marketplace.',
    cta: 'Leave a review',
  },
  fr: {
    subject: 'Partagez votre expérience Goldsainte',
    title: 'Partagez votre expérience Goldsainte',
    headline: 'Comment s\u2019est passé votre voyage ?',
    tagline: 'Votre avis privé aide à maintenir la qualité de notre place de marché.',
    lede: (sp) => `Bon retour. Nous espérons que votre voyage avec ${sp} était à la hauteur de vos rêves. Votre avis sincère — visible uniquement des admins et du spécialiste — nous aide à préserver l'intégrité du réseau Goldsainte.`,
    step1: 'Notez votre expérience globale et le savoir-faire du spécialiste.',
    step2: 'Racontez ce qui était extraordinaire — et ce qui pourrait s\u2019améliorer.',
    step3: 'Les avis sont privés par défaut ; vous pouvez choisir de les publier.',
    step4: 'Les spécialistes peuvent répondre une fois.',
    step5: 'Vos retours façonnent l\u2019avenir de notre place de marché.',
    cta: 'Laisser un avis',
  },
  es: {
    subject: 'Comparte tu experiencia Goldsainte',
    title: 'Comparte tu experiencia Goldsainte',
    headline: '¿Cómo fue tu viaje?',
    tagline: 'Tu reseña privada ayuda a mantener la calidad de nuestro marketplace.',
    lede: (sp) => `Bienvenido a casa. Esperamos que tu viaje con ${sp} haya sido todo lo que imaginaste. Tu reseña honesta — visible solo para administradores y el especialista — nos ayuda a preservar la integridad de la red Goldsainte.`,
    step1: 'Valora tu experiencia general y el oficio del especialista.',
    step2: 'Cuenta qué fue extraordinario — y qué podría mejorar.',
    step3: 'Las reseñas son privadas por defecto; puedes optar por publicarlas.',
    step4: 'Los especialistas pueden responder una vez.',
    step5: 'Tus comentarios dan forma al futuro de nuestro marketplace.',
    cta: 'Dejar una reseña',
  },
  de: {
    subject: 'Teilen Sie Ihre Goldsainte-Erfahrung',
    title: 'Teilen Sie Ihre Goldsainte-Erfahrung',
    headline: 'Wie war Ihre Reise?',
    tagline: 'Ihre private Bewertung hilft, die Qualität unseres Marktplatzes zu sichern.',
    lede: (sp) => `Willkommen zurück. Wir hoffen, Ihre Reise mit ${sp} war alles, was Sie sich erträumt haben. Ihre ehrliche Bewertung — nur für Admins und den Spezialisten sichtbar — hilft uns, die Integrität des Goldsainte-Netzwerks zu bewahren.`,
    step1: 'Bewerten Sie Ihr Gesamterlebnis und das Handwerk des Spezialisten.',
    step2: 'Teilen Sie, was außergewöhnlich war — und was besser werden könnte.',
    step3: 'Bewertungen sind standardmäßig privat; Sie können sie veröffentlichen.',
    step4: 'Spezialisten dürfen einmal antworten.',
    step5: 'Ihr Feedback prägt die Zukunft unseres Marktplatzes.',
    cta: 'Bewertung abgeben',
  },
  it: {
    subject: 'Racconta la tua esperienza Goldsainte',
    title: 'Racconta la tua esperienza Goldsainte',
    headline: 'Com\u2019è andato il viaggio?',
    tagline: 'La tua recensione privata aiuta a mantenere la qualità del nostro marketplace.',
    lede: (sp) => `Bentornato a casa. Speriamo che il viaggio con ${sp} sia stato tutto ciò che immaginavi. La tua recensione sincera — visibile solo ad admin e specialista — ci aiuta a preservare l'integrità della rete Goldsainte.`,
    step1: 'Valuta l\u2019esperienza complessiva e il mestiere dello specialista.',
    step2: 'Racconta cosa è stato straordinario — e cosa si può migliorare.',
    step3: 'Le recensioni sono private di default; puoi scegliere di pubblicarle.',
    step4: 'Gli specialisti possono rispondere una volta.',
    step5: 'Il tuo feedback plasma il futuro del nostro marketplace.',
    cta: 'Lascia una recensione',
  },
  pt: {
    subject: 'Compartilhe sua experiência Goldsainte',
    title: 'Compartilhe sua experiência Goldsainte',
    headline: 'Como foi sua jornada?',
    tagline: 'Sua avaliação privada ajuda a manter a qualidade do nosso marketplace.',
    lede: (sp) => `Bem-vindo de volta. Esperamos que sua viagem com ${sp} tenha sido tudo o que você imaginou. Sua avaliação honesta — visível apenas para admins e o especialista — nos ajuda a preservar a integridade da rede Goldsainte.`,
    step1: 'Avalie a experiência geral e o ofício do especialista.',
    step2: 'Conte o que foi extraordinário — e o que pode melhorar.',
    step3: 'As avaliações são privadas por padrão; você pode optar por publicar.',
    step4: 'Especialistas podem responder uma vez.',
    step5: 'Seu feedback molda o futuro do nosso marketplace.',
    cta: 'Deixar avaliação',
  },
  ar: {
    subject: 'شارك تجربتك مع Goldsainte',
    title: 'شارك تجربتك مع Goldsainte',
    headline: 'كيف كانت رحلتك؟',
    tagline: 'تقييمك الخاص يساعد في الحفاظ على جودة سوقنا.',
    lede: (sp) => `أهلاً بعودتك. نأمل أن تكون رحلتك مع ${sp} كما تخيلتها تماماً. تقييمك الصادق — المرئي للمشرفين والمختص فقط — يساعدنا على صون نزاهة شبكة Goldsainte.`,
    step1: 'قيّم تجربتك العامة وحرفية المختص.',
    step2: 'شارك ما كان استثنائياً — وما يمكن تحسينه.',
    step3: 'التقييمات خاصة افتراضياً؛ ويمكنك اختيار نشرها.',
    step4: 'يمكن للمختصين الرد مرة واحدة.',
    step5: 'ملاحظاتك تشكل مستقبل سوقنا.',
    cta: 'اترك تقييماً',
  },
  ja: {
    subject: 'Goldsainte での体験をお聞かせください',
    title: 'Goldsainte での体験をお聞かせください',
    headline: '旅はいかがでしたか？',
    tagline: 'プライベートなレビューが、マーケットプレイスの品質維持に役立ちます。',
    lede: (sp) => `おかえりなさい。${sp} との旅が思い描いたとおりのものであったことを願っています。率直なレビュー — 管理者とスペシャリストだけに表示されます — は、Goldsainte ネットワークの品位を守る助けになります。`,
    step1: '全体の体験とスペシャリストの技を評価しましょう。',
    step2: '素晴らしかった点と改善できる点を共有しましょう。',
    step3: 'レビューは既定で非公開。公開を選ぶこともできます。',
    step4: 'スペシャリストは一度だけ返信できます。',
    step5: 'あなたの声がマーケットプレイスの未来をつくります。',
    cta: 'レビューを書く',
  },
  ko: {
    subject: 'Goldsainte 경험을 들려주세요',
    title: 'Goldsainte 경험을 들려주세요',
    headline: '여정은 어떠셨나요?',
    tagline: '비공개 후기가 마켓플레이스의 품질 유지에 도움이 됩니다.',
    lede: (sp) => `잘 돌아오셨습니다. ${sp}님과의 여행이 상상 그대로였기를 바랍니다. 관리자와 전문가에게만 보이는 솔직한 후기는 Goldsainte 네트워크의 신뢰를 지키는 데 도움이 됩니다.`,
    step1: '전체 경험과 전문가의 솜씨를 평가해 주세요.',
    step2: '특별했던 점과 개선할 점을 알려주세요.',
    step3: '후기는 기본적으로 비공개이며, 공개를 선택할 수 있습니다.',
    step4: '전문가는 한 번 답글을 달 수 있습니다.',
    step5: '당신의 의견이 마켓플레이스의 미래를 만듭니다.',
    cta: '후기 남기기',
  },
  zh: {
    subject: '分享你的 Goldsainte 体验',
    title: '分享你的 Goldsainte 体验',
    headline: '这次旅程如何？',
    tagline: '你的私密评价有助于维护市场品质。',
    lede: (sp) => `欢迎回家。希望你与 ${sp} 的旅程如你所想。你的真实评价 — 仅管理员与该专家可见 — 帮助我们守护 Goldsainte 网络的品质。`,
    step1: '为整体体验与专家的手艺打分。',
    step2: '分享哪些非凡出色 — 哪些还可改进。',
    step3: '评价默认私密；你也可以选择公开。',
    step4: '专家可回复一次。',
    step5: '你的反馈塑造市场的未来。',
    cta: '写评价',
  },
}

export const ReviewRequestEmail = ({ bookingId, specialistName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(specialistName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/bookings/${bookingId ?? ''}` }}
    />
  )
}

export const template = {
  component: ReviewRequestEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Post-Trip Review Request',
  previewData: { specialistName: 'Maison Atelier', bookingId: 'b-789' },
} satisfies TemplateEntry
