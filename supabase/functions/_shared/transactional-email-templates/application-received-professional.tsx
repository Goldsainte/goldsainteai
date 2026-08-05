/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface ApplicationReceivedProps {
  agentName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headlineNamed: (name: string) => string
  headline: string
  tagline: string
  lede: string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

// Steps CORRECTED Jul 26. Two things were false: applicants were told they'd
// receive "credentials" (they keep the login they created — no password is
// ever issued), and the order was inverted (identity verification happens
// during the application, BEFORE review, not after approval).
const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your Goldsainte advisor application has been received',
    title: 'Your Goldsainte advisor application has been received',
    headlineNamed: (n) => `Thank you, ${n}.`,
    headline: 'Your application has been received.',
    tagline: "A curated marketplace of the world's most trusted travel specialists, creators, and brands.",
    lede: "We've received your application to join the Goldsainte advisor network. Our team will review it within 24\u201348 hours and email you the moment your account is approved.",
    step1: 'You complete Stripe Identity verification as the final step of the application \u2014 it takes 2\u20133 minutes.',
    step2: 'Our team then reviews your credentials, insurance and licence \u2014 typically within one to two business days.',
    step3: 'We email you the moment a decision is made. On approval your dashboard unlocks with the login you already created \u2014 we never send passwords.',
    step4: 'Connect Stripe from your dashboard so bookings pay out to your own account.',
    step5: 'All communication and payment must remain on-platform per our Terms.',
    cta: 'Check application status',
  },
  fr: {
    subject: 'Votre candidature de conseiller Goldsainte a bien été reçue',
    title: 'Votre candidature de conseiller Goldsainte a bien été reçue',
    headlineNamed: (n) => `Merci, ${n}.`,
    headline: 'Votre candidature a bien été reçue.',
    tagline: 'Une place de marché soignée réunissant les spécialistes du voyage, créateurs et marques les plus fiables au monde.',
    lede: "Nous avons bien reçu votre candidature pour rejoindre le réseau de conseillers Goldsainte. Notre équipe l'examinera sous 24 à 48 heures et vous écrira dès l'approbation de votre compte.",
    step1: "Vous terminez la vérification Stripe Identity en dernière étape de la candidature \u2014 cela prend 2 à 3 minutes.",
    step2: 'Notre équipe examine ensuite vos qualifications, assurance et licence \u2014 en général sous un à deux jours ouvrés.',
    step3: "Nous vous écrivons dès qu'une décision est prise. En cas d'approbation, votre tableau de bord se débloque avec l'identifiant que vous avez déjà créé \u2014 nous n'envoyons jamais de mots de passe.",
    step4: 'Connectez Stripe depuis votre tableau de bord pour que les réservations soient versées sur votre propre compte.',
    step5: 'Toute communication et tout paiement doivent rester sur la plateforme, conformément à nos Conditions.',
    cta: 'Vérifier le statut de la candidature',
  },
  es: {
    subject: 'Hemos recibido tu solicitud de asesor de Goldsainte',
    title: 'Hemos recibido tu solicitud de asesor de Goldsainte',
    headlineNamed: (n) => `Gracias, ${n}.`,
    headline: 'Hemos recibido tu solicitud.',
    tagline: 'Un marketplace curado con los especialistas en viajes, creadores y marcas más fiables del mundo.',
    lede: 'Hemos recibido tu solicitud para unirte a la red de asesores de Goldsainte. Nuestro equipo la revisará en 24\u201348 horas y te escribirá en cuanto tu cuenta sea aprobada.',
    step1: 'Completas la verificación de Stripe Identity como último paso de la solicitud \u2014 toma 2\u20133 minutos.',
    step2: 'Después, nuestro equipo revisa tus credenciales, seguro y licencia \u2014 normalmente en uno o dos días laborables.',
    step3: 'Te escribimos en cuanto haya una decisión. Al aprobarse, tu panel se desbloquea con el acceso que ya creaste \u2014 nunca enviamos contraseñas.',
    step4: 'Conecta Stripe desde tu panel para que las reservas se paguen en tu propia cuenta.',
    step5: 'Toda comunicación y pago deben permanecer en la plataforma según nuestros Términos.',
    cta: 'Ver estado de la solicitud',
  },
  de: {
    subject: 'Ihre Goldsainte-Berater-Bewerbung ist eingegangen',
    title: 'Ihre Goldsainte-Berater-Bewerbung ist eingegangen',
    headlineNamed: (n) => `Danke, ${n}.`,
    headline: 'Ihre Bewerbung ist eingegangen.',
    tagline: 'Ein kuratierter Marktplatz der vertrauenswürdigsten Reisespezialisten, Creator und Marken der Welt.',
    lede: 'Wir haben Ihre Bewerbung für das Goldsainte-Berater-Netzwerk erhalten. Unser Team prüft sie innerhalb von 24\u201348 Stunden und schreibt Ihnen, sobald Ihr Konto genehmigt ist.',
    step1: 'Als letzten Schritt der Bewerbung schließen Sie die Stripe-Identity-Prüfung ab \u2014 das dauert 2\u20133 Minuten.',
    step2: 'Anschließend prüft unser Team Qualifikationen, Versicherung und Lizenz \u2014 in der Regel innerhalb von ein bis zwei Werktagen.',
    step3: 'Wir schreiben Ihnen, sobald entschieden ist. Bei Genehmigung wird Ihr Dashboard mit dem bereits erstellten Login freigeschaltet \u2014 wir versenden nie Passwörter.',
    step4: 'Verbinden Sie Stripe über Ihr Dashboard, damit Buchungen auf Ihr eigenes Konto ausgezahlt werden.',
    step5: 'Sämtliche Kommunikation und Zahlungen müssen gemäß unseren Bedingungen auf der Plattform bleiben.',
    cta: 'Bewerbungsstatus prüfen',
  },
  it: {
    subject: 'Abbiamo ricevuto la tua candidatura da consulente Goldsainte',
    title: 'Abbiamo ricevuto la tua candidatura da consulente Goldsainte',
    headlineNamed: (n) => `Grazie, ${n}.`,
    headline: 'Abbiamo ricevuto la tua candidatura.',
    tagline: 'Un marketplace curato con gli specialisti di viaggio, i creator e i brand più affidabili al mondo.',
    lede: 'Abbiamo ricevuto la tua candidatura per la rete di consulenti Goldsainte. Il nostro team la esaminerà entro 24\u201348 ore e ti scriverà appena il tuo account sarà approvato.',
    step1: 'Completi la verifica Stripe Identity come ultimo passo della candidatura \u2014 richiede 2\u20133 minuti.',
    step2: 'Il nostro team esamina poi credenziali, assicurazione e licenza \u2014 di norma entro uno o due giorni lavorativi.',
    step3: 'Ti scriviamo appena c\u2019è una decisione. In caso di approvazione la dashboard si sblocca con l\u2019accesso che hai già creato \u2014 non inviamo mai password.',
    step4: 'Collega Stripe dalla dashboard perché le prenotazioni vengano pagate sul tuo conto.',
    step5: 'Tutta la comunicazione e i pagamenti devono restare sulla piattaforma, come da Termini.',
    cta: 'Controlla stato candidatura',
  },
  pt: {
    subject: 'Recebemos sua candidatura de consultor Goldsainte',
    title: 'Recebemos sua candidatura de consultor Goldsainte',
    headlineNamed: (n) => `Obrigado, ${n}.`,
    headline: 'Sua candidatura foi recebida.',
    tagline: 'Um marketplace curado com os especialistas em viagens, criadores e marcas mais confiáveis do mundo.',
    lede: 'Recebemos sua candidatura para a rede de consultores Goldsainte. Nossa equipe fará a análise em 24\u201348 horas e escreverá assim que sua conta for aprovada.',
    step1: 'Você conclui a verificação Stripe Identity como último passo da candidatura \u2014 leva 2\u20133 minutos.',
    step2: 'Depois, nossa equipe analisa credenciais, seguro e licença \u2014 normalmente em um a dois dias úteis.',
    step3: 'Escrevemos assim que houver decisão. Na aprovação, seu painel é liberado com o login que você já criou \u2014 nunca enviamos senhas.',
    step4: 'Conecte o Stripe pelo painel para que as reservas sejam pagas na sua própria conta.',
    step5: 'Toda comunicação e pagamento devem permanecer na plataforma, conforme nossos Termos.',
    cta: 'Ver status da candidatura',
  },
  ar: {
    subject: 'استلمنا طلبك للانضمام كمستشار Goldsainte',
    title: 'استلمنا طلبك للانضمام كمستشار Goldsainte',
    headlineNamed: (n) => `شكراً لك يا ${n}.`,
    headline: 'استلمنا طلبك.',
    tagline: 'سوق منتقى يضم أوثق مختصي السفر وصنّاع المحتوى والعلامات في العالم.',
    lede: 'استلمنا طلبك للانضمام إلى شبكة مستشاري Goldsainte. سيراجعه فريقنا خلال 24\u201348 ساعة وسنراسلك فور اعتماد حسابك.',
    step1: 'تكمل التحقق عبر Stripe Identity كخطوة أخيرة في الطلب \u2014 يستغرق دقيقتين إلى ثلاث.',
    step2: 'ثم يراجع فريقنا مؤهلاتك وتأمينك وترخيصك \u2014 عادة خلال يوم إلى يومي عمل.',
    step3: 'نراسلك فور اتخاذ القرار. عند الاعتماد تُفتح لوحتك بحساب الدخول الذي أنشأته \u2014 لا نرسل كلمات مرور أبداً.',
    step4: 'اربط Stripe من لوحتك لتُدفع الحجوزات إلى حسابك الخاص.',
    step5: 'يجب أن يبقى كل التواصل والدفع على المنصة وفق شروطنا.',
    cta: 'تحقق من حالة الطلب',
  },
  ja: {
    subject: 'Goldsainte アドバイザー申請を受け付けました',
    title: 'Goldsainte アドバイザー申請を受け付けました',
    headlineNamed: (n) => `ありがとうございます、${n} さん。`,
    headline: '申請を受け付けました。',
    tagline: '世界で最も信頼される旅のスペシャリスト、クリエイター、ブランドを集めた厳選マーケットプレイス。',
    lede: 'Goldsainte アドバイザーネットワークへの申請を受け付けました。チームが24〜48時間以内に審査し、アカウント承認の瞬間にメールでお知らせします。',
    step1: '申請の最終ステップとして Stripe Identity の本人確認を完了します \u2014 2〜3分で終わります。',
    step2: 'その後チームが資格・保険・ライセンスを審査します \u2014 通常1〜2営業日です。',
    step3: '決定次第すぐにメールします。承認されると、作成済みのログインでダッシュボードが解放されます \u2014 パスワードを送ることは決してありません。',
    step4: 'ダッシュボードから Stripe を接続し、予約があなた自身の口座に入金されるようにしましょう。',
    step5: '規約に従い、連絡と支払いはすべてプラットフォーム上で行ってください。',
    cta: '申請状況を確認',
  },
  ko: {
    subject: 'Goldsainte 어드바이저 신청이 접수되었습니다',
    title: 'Goldsainte 어드바이저 신청이 접수되었습니다',
    headlineNamed: (n) => `감사합니다, ${n}님.`,
    headline: '신청이 접수되었습니다.',
    tagline: '세계에서 가장 신뢰받는 여행 전문가, 크리에이터, 브랜드를 모은 큐레이션 마켓플레이스.',
    lede: 'Goldsainte 어드바이저 네트워크 가입 신청이 접수되었습니다. 팀이 24~48시간 안에 검토하고 계정이 승인되는 즉시 이메일로 알려드립니다.',
    step1: '신청의 마지막 단계로 Stripe Identity 인증을 완료합니다 \u2014 2~3분이면 됩니다.',
    step2: '이후 팀이 자격, 보험, 라이선스를 검토합니다 \u2014 보통 영업일 기준 1~2일입니다.',
    step3: '결정 즉시 이메일을 드립니다. 승인되면 이미 만든 로그인으로 대시보드가 열립니다 \u2014 비밀번호는 절대 보내지 않습니다.',
    step4: '대시보드에서 Stripe를 연결해 예약 대금이 본인 계좌로 정산되게 하세요.',
    step5: '약관에 따라 모든 소통과 결제는 플랫폼 안에서 이루어져야 합니다.',
    cta: '신청 상태 확인',
  },
  zh: {
    subject: '已收到你的 Goldsainte 顾问申请',
    title: '已收到你的 Goldsainte 顾问申请',
    headlineNamed: (n) => `谢谢你，${n}。`,
    headline: '你的申请已收到。',
    tagline: '汇聚全球最值得信赖的旅行专家、创作者与品牌的精选市场。',
    lede: '我们已收到你加入 Goldsainte 顾问网络的申请。团队将在 24\u201348 小时内审核，账户获批后第一时间邮件通知你。',
    step1: '你在申请的最后一步完成 Stripe Identity 身份验证 \u2014 只需 2\u20133 分钟。',
    step2: '随后团队审核你的资质、保险与执照 \u2014 通常一到两个工作日。',
    step3: '一有结果我们立即邮件通知。获批后，用你已创建的登录信息即可解锁工作台 \u2014 我们绝不发送密码。',
    step4: '在工作台连接 Stripe，让预订款项直接进入你自己的账户。',
    step5: '按照条款，所有沟通与支付必须留在平台内。',
    cta: '查看申请状态',
  },
}

export const ApplicationReceivedProfessionalEmail = ({ agentName, lang }: ApplicationReceivedProps) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={agentName ? s.headlineNamed(agentName) : s.headline}
      tagline={s.tagline}
      lede={s.lede}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/application/status` }}
    />
  )
}

export const template = {
  component: ApplicationReceivedProfessionalEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Application received — Specialist',
  previewData: { agentName: 'Jimmy' },
} satisfies TemplateEntry
