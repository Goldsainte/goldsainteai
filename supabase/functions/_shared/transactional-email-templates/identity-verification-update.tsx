/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  statusDetail?: string
  verificationStatus?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (status: string, detail: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Identity verification update',
    title: 'Identity verification update',
    headline: 'Identity verification update.',
    tagline: 'Your Stripe Identity verification status has changed.',
    lede: (v, d) => `Stripe Identity has updated your verification status to: ${v}. ${d}`,
    step1: 'View your verification status in your dashboard.',
    step2: 'If approved, all features are now unlocked.',
    step3: 'If additional information is required, follow the link provided.',
    step4: 'Re-verification is rare but may be requested for security.',
    step5: 'Contact our concierge team if you have questions.',
    cta: 'Open dashboard',
  },
  fr: {
    subject: 'Mise à jour de la vérification d\u2019identité',
    title: 'Mise à jour de la vérification d\u2019identité',
    headline: 'Mise à jour de la vérification d\u2019identité.',
    tagline: 'Le statut de votre vérification Stripe Identity a changé.',
    lede: (v, d) => `Stripe Identity a mis à jour votre statut de vérification : ${v}. ${d}`,
    step1: 'Consultez votre statut de vérification dans votre tableau de bord.',
    step2: 'Si vous êtes approuvé, toutes les fonctionnalités sont désormais débloquées.',
    step3: 'Si des informations supplémentaires sont requises, suivez le lien fourni.',
    step4: 'Une re-vérification est rare mais peut être demandée par sécurité.',
    step5: 'Contactez notre équipe de conciergerie pour toute question.',
    cta: 'Ouvrir le tableau de bord',
  },
  es: {
    subject: 'Actualización de la verificación de identidad',
    title: 'Actualización de la verificación de identidad',
    headline: 'Actualización de la verificación de identidad.',
    tagline: 'El estado de tu verificación de Stripe Identity ha cambiado.',
    lede: (v, d) => `Stripe Identity ha actualizado tu estado de verificación a: ${v}. ${d}`,
    step1: 'Consulta tu estado de verificación en tu panel.',
    step2: 'Si estás aprobado, todas las funciones quedan desbloqueadas.',
    step3: 'Si se requiere información adicional, sigue el enlace proporcionado.',
    step4: 'La re-verificación es rara, pero puede solicitarse por seguridad.',
    step5: 'Contacta con nuestro equipo de conserjería si tienes preguntas.',
    cta: 'Abrir panel',
  },
  de: {
    subject: 'Update zur Identitätsprüfung',
    title: 'Update zur Identitätsprüfung',
    headline: 'Update zur Identitätsprüfung.',
    tagline: 'Ihr Stripe-Identity-Verifizierungsstatus hat sich geändert.',
    lede: (v, d) => `Stripe Identity hat Ihren Verifizierungsstatus aktualisiert auf: ${v}. ${d}`,
    step1: 'Sehen Sie Ihren Verifizierungsstatus in Ihrem Dashboard.',
    step2: 'Bei Genehmigung sind jetzt alle Funktionen freigeschaltet.',
    step3: 'Werden weitere Informationen benötigt, folgen Sie dem bereitgestellten Link.',
    step4: 'Eine erneute Prüfung ist selten, kann aber aus Sicherheitsgründen angefragt werden.',
    step5: 'Bei Fragen kontaktieren Sie unser Concierge-Team.',
    cta: 'Dashboard öffnen',
  },
  it: {
    subject: 'Aggiornamento verifica identità',
    title: 'Aggiornamento verifica identità',
    headline: 'Aggiornamento verifica identità.',
    tagline: 'Lo stato della tua verifica Stripe Identity è cambiato.',
    lede: (v, d) => `Stripe Identity ha aggiornato il tuo stato di verifica a: ${v}. ${d}`,
    step1: 'Vedi lo stato della verifica nella tua dashboard.',
    step2: 'Se approvato, tutte le funzionalità sono ora sbloccate.',
    step3: 'Se servono informazioni aggiuntive, segui il link fornito.',
    step4: 'La ri-verifica è rara ma può essere richiesta per sicurezza.',
    step5: 'Contatta il nostro team concierge per qualsiasi domanda.',
    cta: 'Apri dashboard',
  },
  pt: {
    subject: 'Atualização da verificação de identidade',
    title: 'Atualização da verificação de identidade',
    headline: 'Atualização da verificação de identidade.',
    tagline: 'O status da sua verificação Stripe Identity mudou.',
    lede: (v, d) => `O Stripe Identity atualizou seu status de verificação para: ${v}. ${d}`,
    step1: 'Veja seu status de verificação no seu painel.',
    step2: 'Se aprovado, todos os recursos estão desbloqueados.',
    step3: 'Se informações adicionais forem necessárias, siga o link fornecido.',
    step4: 'A reverificação é rara, mas pode ser solicitada por segurança.',
    step5: 'Fale com nossa equipe de concierge em caso de dúvidas.',
    cta: 'Abrir painel',
  },
  ar: {
    subject: 'تحديث التحقق من الهوية',
    title: 'تحديث التحقق من الهوية',
    headline: 'تحديث التحقق من الهوية.',
    tagline: 'تغيرت حالة التحقق لديك في Stripe Identity.',
    lede: (v, d) => `حدّث Stripe Identity حالة التحقق لديك إلى: ${v}. ${d}`,
    step1: 'اعرض حالة التحقق في لوحتك.',
    step2: 'إذا تمت الموافقة، فكل الميزات مفتوحة الآن.',
    step3: 'إذا لزمت معلومات إضافية، اتبع الرابط المرفق.',
    step4: 'إعادة التحقق نادرة لكنها قد تُطلب لأسباب أمنية.',
    step5: 'تواصل مع فريق الكونسيرج لدينا إن كانت لديك أسئلة.',
    cta: 'افتح اللوحة',
  },
  ja: {
    subject: '本人確認ステータスの更新',
    title: '本人確認ステータスの更新',
    headline: '本人確認ステータスの更新。',
    tagline: 'Stripe Identity の確認ステータスが変わりました。',
    lede: (v, d) => `Stripe Identity があなたの確認ステータスを更新しました：${v}。${d}`,
    step1: 'ダッシュボードで確認ステータスを見ましょう。',
    step2: '承認された場合、すべての機能が解放されています。',
    step3: '追加情報が必要な場合は、案内のリンクに従ってください。',
    step4: '再確認は稀ですが、セキュリティのため求められることがあります。',
    step5: 'ご不明点はコンシェルジュチームへ。',
    cta: 'ダッシュボードを開く',
  },
  ko: {
    subject: '신원 인증 업데이트',
    title: '신원 인증 업데이트',
    headline: '신원 인증 업데이트.',
    tagline: 'Stripe Identity 인증 상태가 변경되었습니다.',
    lede: (v, d) => `Stripe Identity가 인증 상태를 다음으로 업데이트했습니다: ${v}. ${d}`,
    step1: '대시보드에서 인증 상태를 확인하세요.',
    step2: '승인되었다면 모든 기능이 열립니다.',
    step3: '추가 정보가 필요하면 제공된 링크를 따라가세요.',
    step4: '재인증은 드물지만 보안을 위해 요청될 수 있습니다.',
    step5: '질문이 있으면 컨시어지 팀에 연락하세요.',
    cta: '대시보드 열기',
  },
  zh: {
    subject: '身份验证更新',
    title: '身份验证更新',
    headline: '身份验证更新。',
    tagline: '你的 Stripe Identity 验证状态已变更。',
    lede: (v, d) => `Stripe Identity 已将你的验证状态更新为：${v}。${d}`,
    step1: '在面板中查看你的验证状态。',
    step2: '如已通过，所有功能现已解锁。',
    step3: '如需补充信息，请按提供的链接操作。',
    step4: '重新验证很少见，但出于安全考虑可能会被要求。',
    step5: '如有疑问，请联系我们的礼宾团队。',
    cta: '打开面板',
  },
}

export const IdentityVerificationUpdateEmail = ({ statusDetail, verificationStatus, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(verificationStatus ?? '', statusDetail ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/application/status` }}
    />
  )
}

export const template = {
  component: IdentityVerificationUpdateEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Identity Verification Update',
  previewData: { verificationStatus: 'Verified', statusDetail: 'All marketplace features are now unlocked.' },
} satisfies TemplateEntry
