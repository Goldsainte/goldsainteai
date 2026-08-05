/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from './_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  lang?: EmailLang
}

interface S { title: string; headline: string; tagline: string; lede: string; cta: string; steps: string[] }

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { title: "You've been invited \u2014 Goldsainte", headline: "You've been invited.", tagline: "An invitation to join Goldsainte \u2014 a curated marketplace for discerning travelers and the world's most trusted specialists.", lede: 'Accept your invitation below to activate your account and begin curating your journey.', cta: 'Accept invitation', steps: ['Accept your invitation to activate your account and secure your profile.', "You'll be signed in automatically and taken to your dashboard.", 'Complete your profile \u2014 it is what other people on Goldsainte see.', 'Everything runs on-platform: messages, agreements and payments alike, per our Terms.'] },
  fr: { title: 'Vous êtes invité \u2014 Goldsainte', headline: 'Vous êtes invité.', tagline: 'Une invitation à rejoindre Goldsainte \u2014 une place de marché choisie pour voyageurs exigeants et les spécialistes les plus fiables au monde.', lede: 'Acceptez votre invitation ci-dessous pour activer votre compte et commencer à composer votre voyage.', cta: "Accepter l'invitation", steps: ['Acceptez votre invitation pour activer votre compte et sécuriser votre profil.', 'Vous serez connecté automatiquement et dirigé vers votre tableau de bord.', 'Complétez votre profil \u2014 c\'est ce que les autres voient sur Goldsainte.', 'Tout se passe sur la plateforme : messages, accords et paiements, conformément à nos Conditions.'] },
  es: { title: 'Te han invitado \u2014 Goldsainte', headline: 'Te han invitado.', tagline: 'Una invitación a unirte a Goldsainte \u2014 un marketplace selecto para viajeros exigentes y los especialistas más fiables del mundo.', lede: 'Acepta tu invitación abajo para activar tu cuenta y empezar a diseñar tu viaje.', cta: 'Aceptar invitación', steps: ['Acepta tu invitación para activar tu cuenta y proteger tu perfil.', 'Entrarás automáticamente y llegarás a tu panel.', 'Completa tu perfil \u2014 es lo que los demás ven en Goldsainte.', 'Todo ocurre en la plataforma: mensajes, acuerdos y pagos, según nuestros Términos.'] },
  de: { title: 'Sie sind eingeladen \u2014 Goldsainte', headline: 'Sie sind eingeladen.', tagline: 'Eine Einladung zu Goldsainte \u2014 einem kuratierten Marktplatz für anspruchsvolle Reisende und die vertrauenswürdigsten Spezialisten der Welt.', lede: 'Nehmen Sie Ihre Einladung unten an, um Ihr Konto zu aktivieren und Ihre Reise zu gestalten.', cta: 'Einladung annehmen', steps: ['Nehmen Sie Ihre Einladung an, um Ihr Konto zu aktivieren und Ihr Profil zu sichern.', 'Sie werden automatisch angemeldet und zu Ihrem Dashboard geführt.', 'Vervollständigen Sie Ihr Profil \u2014 es ist, was andere auf Goldsainte sehen.', 'Alles läuft auf der Plattform: Nachrichten, Vereinbarungen und Zahlungen, gemäß unseren Bedingungen.'] },
  it: { title: 'Sei stato invitato \u2014 Goldsainte', headline: 'Sei stato invitato.', tagline: 'Un invito a unirti a Goldsainte \u2014 un marketplace curato per viaggiatori esigenti e gli specialisti più affidabili al mondo.', lede: 'Accetta il tuo invito qui sotto per attivare il tuo account e iniziare a comporre il tuo viaggio.', cta: 'Accetta invito', steps: ['Accetta il tuo invito per attivare il tuo account e proteggere il tuo profilo.', 'Accederai automaticamente e arriverai alla tua dashboard.', 'Completa il tuo profilo \u2014 è ciò che gli altri vedono su Goldsainte.', 'Tutto avviene sulla piattaforma: messaggi, accordi e pagamenti, secondo i nostri Termini.'] },
  pt: { title: 'Você foi convidado \u2014 Goldsainte', headline: 'Você foi convidado.', tagline: 'Um convite para entrar na Goldsainte \u2014 um marketplace selecionado para viajantes exigentes e os especialistas mais confiáveis do mundo.', lede: 'Aceite seu convite abaixo para ativar sua conta e começar a desenhar sua viagem.', cta: 'Aceitar convite', steps: ['Aceite seu convite para ativar sua conta e proteger seu perfil.', 'Você entrará automaticamente e será levado ao seu painel.', 'Complete seu perfil \u2014 é o que os outros veem na Goldsainte.', 'Tudo acontece na plataforma: mensagens, acordos e pagamentos, conforme nossos Termos.'] },
  ar: { title: 'تمت دعوتك \u2014 Goldsainte', headline: 'تمت دعوتك.', tagline: 'دعوة للانضمام إلى Goldsainte \u2014 سوق منتقى للمسافرين المميزين وأكثر المختصين موثوقية في العالم.', lede: 'اقبل دعوتك أدناه لتفعيل حسابك والبدء في تنسيق رحلتك.', cta: 'اقبل الدعوة', steps: ['اقبل دعوتك لتفعيل حسابك وتأمين ملفك.', 'ستسجل الدخول تلقائياً وتنتقل إلى لوحتك.', 'أكمل ملفك \u2014 فهو ما يراه الآخرون على Goldsainte.', 'كل شيء يجري عبر المنصة: الرسائل والاتفاقات والمدفوعات، وفق شروطنا.'] },
  ja: { title: '招待が届いています \u2014 Goldsainte', headline: '招待が届いています。', tagline: 'Goldsainte への招待 \u2014 目の肥えた旅行者と世界で最も信頼されるスペシャリストのための厳選マーケットプレイス。', lede: '下の招待を承諾してアカウントを有効化し、旅の編集を始めましょう。', cta: '招待を承諾', steps: ['招待を承諾してアカウントを有効化し、プロフィールを保護しましょう。', '自動的にサインインし、ダッシュボードへ移動します。', 'プロフィールを完成させましょう \u2014 Goldsainte で他の人が見るのはそれです。', 'メッセージ、合意、支払い、すべてがプラットフォーム上で行われます。利用規約に基づきます。'] },
  ko: { title: '초대장이 도착했습니다 \u2014 Goldsainte', headline: '초대장이 도착했습니다.', tagline: 'Goldsainte 초대 \u2014 안목 있는 여행자와 세계에서 가장 신뢰받는 전문가를 위한 큐레이션 마켓플레이스.', lede: '아래에서 초대를 수락해 계정을 활성화하고 여행 큐레이션을 시작하세요.', cta: '초대 수락', steps: ['초대를 수락해 계정을 활성화하고 프로필을 보호하세요.', '자동으로 로그인되어 대시보드로 이동합니다.', '프로필을 완성하세요 \u2014 Goldsainte에서 다른 사람들이 보는 모습입니다.', '메시지, 합의, 결제 모두 플랫폼에서 이루어집니다. 이용약관을 따릅니다.'] },
  zh: { title: '你收到一份邀请 \u2014 Goldsainte', headline: '你收到一份邀请。', tagline: '加入 Goldsainte 的邀请 \u2014 为品味独到的旅行者与全球最值得信赖的专家打造的精选市场。', lede: '在下方接受邀请以激活账户，开始策划你的旅程。', cta: '接受邀请', steps: ['接受邀请以激活账户并保护你的资料。', '你将自动登录并进入面板。', '完善你的资料 \u2014 这是其他人在 Goldsainte 上看到的你。', '一切都在平台上进行：消息、协议与付款，皆遵循我们的条款。'] },
}

export const InviteEmail = ({ confirmationUrl, lang }: InviteEmailProps) => {
  const s = pickLang(STRINGS, lang ?? 'en')
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede}
      cta={{ label: s.cta, url: confirmationUrl }}
      steps={s.steps}
    />
  )
}

export default InviteEmail
