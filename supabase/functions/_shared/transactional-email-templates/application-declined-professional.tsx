/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface ApplicationDeclinedProps {
  recipientName?: string
  adminNotes?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headlineNamed: (name: string) => string
  headline: string
  tagline: string
  ledeWithNotes: (notes: string) => string
  lede: string
  step1: string
  step2: string
  step3: string
  step4: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Update on your Goldsainte application',
    title: 'Update on your Goldsainte application',
    headlineNamed: (n) => `Thank you, ${n}.`,
    headline: 'Thank you for applying.',
    tagline: "A curated marketplace of the world's most trusted travel specialists, creators, and brands.",
    ledeWithNotes: (n) => `After careful review, we're unable to approve your application at this time. A note from our team: "${n}"`,
    lede: "After careful review, we're unable to approve your application at this time. We deeply appreciate your interest in joining the Goldsainte network.",
    step1: 'Our reviewers consider experience, references, and alignment with our standards of trust and taste.',
    step2: "You're welcome to reapply in the future as your portfolio and credentials evolve.",
    step3: 'If you have questions or would like additional context, reach our team at support@goldsainte.ai.',
    step4: 'Until then, we wish you continued success in your work.',
    cta: 'Contact our team',
  },
  fr: {
    subject: 'Nouvelles de votre candidature Goldsainte',
    title: 'Nouvelles de votre candidature Goldsainte',
    headlineNamed: (n) => `Merci, ${n}.`,
    headline: 'Merci pour votre candidature.',
    tagline: 'Une place de marché soignée réunissant les spécialistes du voyage, créateurs et marques les plus fiables au monde.',
    ledeWithNotes: (n) => `Après un examen attentif, nous ne pouvons pas approuver votre candidature pour le moment. Un mot de notre équipe : \u00AB ${n} \u00BB`,
    lede: 'Après un examen attentif, nous ne pouvons pas approuver votre candidature pour le moment. Nous vous remercions sincèrement de votre intérêt pour le réseau Goldsainte.',
    step1: 'Nos examinateurs considèrent l\u2019expérience, les références et l\u2019adéquation avec nos exigences de confiance et de goût.',
    step2: 'Vous pourrez repostuler à l\u2019avenir, à mesure que votre portfolio et vos références évoluent.',
    step3: 'Pour toute question ou précision, écrivez à notre équipe : support@goldsainte.ai.',
    step4: 'D\u2019ici là, nous vous souhaitons beaucoup de succès dans votre travail.',
    cta: 'Contacter notre équipe',
  },
  es: {
    subject: 'Novedades sobre tu solicitud de Goldsainte',
    title: 'Novedades sobre tu solicitud de Goldsainte',
    headlineNamed: (n) => `Gracias, ${n}.`,
    headline: 'Gracias por tu solicitud.',
    tagline: 'Un marketplace curado con los especialistas en viajes, creadores y marcas más fiables del mundo.',
    ledeWithNotes: (n) => `Tras una revisión cuidadosa, no podemos aprobar tu solicitud en este momento. Una nota de nuestro equipo: \u201C${n}\u201D`,
    lede: 'Tras una revisión cuidadosa, no podemos aprobar tu solicitud en este momento. Agradecemos sinceramente tu interés en unirte a la red Goldsainte.',
    step1: 'Nuestros revisores valoran experiencia, referencias y afinidad con nuestros estándares de confianza y gusto.',
    step2: 'Puedes volver a postularte en el futuro a medida que tu portafolio y credenciales evolucionen.',
    step3: 'Si tienes preguntas o quieres más contexto, escribe a support@goldsainte.ai.',
    step4: 'Mientras tanto, te deseamos mucho éxito en tu trabajo.',
    cta: 'Contactar con el equipo',
  },
  de: {
    subject: 'Neuigkeiten zu Ihrer Goldsainte-Bewerbung',
    title: 'Neuigkeiten zu Ihrer Goldsainte-Bewerbung',
    headlineNamed: (n) => `Danke, ${n}.`,
    headline: 'Danke für Ihre Bewerbung.',
    tagline: 'Ein kuratierter Marktplatz der vertrauenswürdigsten Reisespezialisten, Creator und Marken der Welt.',
    ledeWithNotes: (n) => `Nach sorgfältiger Prüfung können wir Ihre Bewerbung derzeit nicht genehmigen. Eine Notiz unseres Teams: \u201E${n}\u201C`,
    lede: 'Nach sorgfältiger Prüfung können wir Ihre Bewerbung derzeit nicht genehmigen. Wir danken Ihnen aufrichtig für Ihr Interesse am Goldsainte-Netzwerk.',
    step1: 'Unsere Prüfer berücksichtigen Erfahrung, Referenzen und die Passung zu unseren Standards von Vertrauen und Geschmack.',
    step2: 'Sie können sich künftig gerne erneut bewerben, wenn Portfolio und Referenzen wachsen.',
    step3: 'Bei Fragen oder für mehr Kontext erreichen Sie unser Team unter support@goldsainte.ai.',
    step4: 'Bis dahin wünschen wir Ihnen weiterhin viel Erfolg bei Ihrer Arbeit.',
    cta: 'Team kontaktieren',
  },
  it: {
    subject: 'Aggiornamento sulla tua candidatura Goldsainte',
    title: 'Aggiornamento sulla tua candidatura Goldsainte',
    headlineNamed: (n) => `Grazie, ${n}.`,
    headline: 'Grazie per la candidatura.',
    tagline: 'Un marketplace curato con gli specialisti di viaggio, i creator e i brand più affidabili al mondo.',
    ledeWithNotes: (n) => `Dopo un attento esame, non possiamo approvare la tua candidatura in questo momento. Una nota dal nostro team: \u201C${n}\u201D`,
    lede: 'Dopo un attento esame, non possiamo approvare la tua candidatura in questo momento. Apprezziamo profondamente il tuo interesse per la rete Goldsainte.',
    step1: 'I nostri revisori valutano esperienza, referenze e allineamento con i nostri standard di fiducia e gusto.',
    step2: 'Potrai ricandidarti in futuro, man mano che portfolio e credenziali crescono.',
    step3: 'Per domande o maggiore contesto, scrivi a support@goldsainte.ai.',
    step4: 'Nel frattempo, ti auguriamo continui successi nel tuo lavoro.',
    cta: 'Contatta il team',
  },
  pt: {
    subject: 'Atualização sobre sua candidatura Goldsainte',
    title: 'Atualização sobre sua candidatura Goldsainte',
    headlineNamed: (n) => `Obrigado, ${n}.`,
    headline: 'Obrigado por se candidatar.',
    tagline: 'Um marketplace curado com os especialistas em viagens, criadores e marcas mais confiáveis do mundo.',
    ledeWithNotes: (n) => `Após análise cuidadosa, não podemos aprovar sua candidatura neste momento. Uma nota da nossa equipe: \u201C${n}\u201D`,
    lede: 'Após análise cuidadosa, não podemos aprovar sua candidatura neste momento. Agradecemos profundamente seu interesse em fazer parte da rede Goldsainte.',
    step1: 'Nossos avaliadores consideram experiência, referências e alinhamento com nossos padrões de confiança e bom gosto.',
    step2: 'Você pode se candidatar novamente no futuro, à medida que portfólio e credenciais evoluírem.',
    step3: 'Dúvidas ou mais contexto? Escreva para support@goldsainte.ai.',
    step4: 'Até lá, desejamos contínuo sucesso no seu trabalho.',
    cta: 'Falar com a equipe',
  },
  ar: {
    subject: 'تحديث بشأن طلبك في Goldsainte',
    title: 'تحديث بشأن طلبك في Goldsainte',
    headlineNamed: (n) => `شكراً لك يا ${n}.`,
    headline: 'شكراً لتقديمك.',
    tagline: 'سوق منتقى يضم أوثق مختصي السفر وصنّاع المحتوى والعلامات في العالم.',
    ledeWithNotes: (n) => `بعد مراجعة متأنية، لا يمكننا اعتماد طلبك حالياً. ملاحظة من فريقنا: \u201C${n}\u201D`,
    lede: 'بعد مراجعة متأنية، لا يمكننا اعتماد طلبك حالياً. نقدر بصدق اهتمامك بالانضمام إلى شبكة Goldsainte.',
    step1: 'يراعي مراجعونا الخبرة والمراجع والتوافق مع معايير الثقة والذوق لدينا.',
    step2: 'يسعدنا أن تتقدم مجدداً مستقبلاً مع تطور أعمالك ومراجعك.',
    step3: 'للأسئلة أو مزيد من التوضيح راسل فريقنا: support@goldsainte.ai.',
    step4: 'حتى ذلك الحين، نتمنى لك دوام النجاح في عملك.',
    cta: 'تواصل مع فريقنا',
  },
  ja: {
    subject: 'Goldsainte 申請に関するお知らせ',
    title: 'Goldsainte 申請に関するお知らせ',
    headlineNamed: (n) => `ありがとうございます、${n} さん。`,
    headline: 'ご応募ありがとうございました。',
    tagline: '世界で最も信頼される旅のスペシャリスト、クリエイター、ブランドを集めた厳選マーケットプレイス。',
    ledeWithNotes: (n) => `慎重に検討した結果、今回は申請を承認できませんでした。チームからのメモ：\u201C${n}\u201D`,
    lede: '慎重に検討した結果、今回は申請を承認できませんでした。Goldsainte ネットワークへのご関心に心より感謝します。',
    step1: '審査では経験・推薦・私たちの信頼と審美眼の基準との適合を考慮します。',
    step2: 'ポートフォリオや実績の充実に伴い、将来の再応募を歓迎します。',
    step3: 'ご質問や補足が必要な場合は support@goldsainte.ai へ。',
    step4: 'それまでの間、ますますのご活躍をお祈りしています。',
    cta: 'チームに連絡',
  },
  ko: {
    subject: 'Goldsainte 신청 관련 안내',
    title: 'Goldsainte 신청 관련 안내',
    headlineNamed: (n) => `감사합니다, ${n}님.`,
    headline: '지원해 주셔서 감사합니다.',
    tagline: '세계에서 가장 신뢰받는 여행 전문가, 크리에이터, 브랜드를 모은 큐레이션 마켓플레이스.',
    ledeWithNotes: (n) => `신중한 검토 끝에 이번에는 신청을 승인할 수 없게 되었습니다. 팀의 메모: \u201C${n}\u201D`,
    lede: '신중한 검토 끝에 이번에는 신청을 승인할 수 없게 되었습니다. Goldsainte 네트워크에 보여주신 관심에 깊이 감사드립니다.',
    step1: '심사에서는 경험, 추천, 그리고 신뢰와 안목이라는 우리 기준과의 부합을 봅니다.',
    step2: '포트폴리오와 경력이 쌓이면 언제든 다시 지원하실 수 있습니다.',
    step3: '질문이 있거나 더 자세한 설명이 필요하면 support@goldsainte.ai 로 연락하세요.',
    step4: '그때까지 하시는 일에 계속 성공이 함께하길 바랍니다.',
    cta: '팀에 문의',
  },
  zh: {
    subject: '关于你的 Goldsainte 申请的最新进展',
    title: '关于你的 Goldsainte 申请的最新进展',
    headlineNamed: (n) => `谢谢你，${n}。`,
    headline: '感谢你的申请。',
    tagline: '汇聚全球最值得信赖的旅行专家、创作者与品牌的精选市场。',
    ledeWithNotes: (n) => `经过仔细审核，我们目前无法批准你的申请。来自团队的备注：\u201C${n}\u201D`,
    lede: '经过仔细审核，我们目前无法批准你的申请。由衷感谢你对加入 Goldsainte 网络的兴趣。',
    step1: '审核会考量经验、推荐信，以及与我们信任与品味标准的契合度。',
    step2: '随着作品与资历的积累，欢迎将来再次申请。',
    step3: '如有疑问或需要更多说明，请联系 support@goldsainte.ai。',
    step4: '在此之前，祝你的事业蒸蒸日上。',
    cta: '联系团队',
  },
}

export const ApplicationDeclinedProfessionalEmail = ({
  recipientName,
  adminNotes,
  lang,
}: ApplicationDeclinedProps) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={recipientName ? s.headlineNamed(recipientName) : s.headline}
      tagline={s.tagline}
      lede={adminNotes ? s.ledeWithNotes(adminNotes) : s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4]}
      cta={{ label: s.cta, url: `mailto:support@goldsainte.ai` }}
    />
  )
}

export const template = {
  component: ApplicationDeclinedProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Application declined — Specialist',
  previewData: {
    recipientName: 'Jimmy',
    adminNotes: 'We would welcome a future application once you have additional verifiable references.',
  },
} satisfies TemplateEntry
