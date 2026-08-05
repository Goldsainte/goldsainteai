/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { AuthEmailLayout } from '../email-templates/_layout.tsx'
import { pickLang, type EmailLang } from '../email-i18n.ts'
import type { TemplateEntry } from './registry.ts'

interface Props {
  tripId?: string
  tripName?: string
  lang?: EmailLang
}

interface S {
  subject: string
  title: string
  headline: string
  tagline: string
  lede: (trip: string) => string
  step1: string
  step2: string
  step3: string
  step4: string
  step5: string
  cta: string
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    subject: 'Your trip is live on the marketplace',
    title: 'Your trip is live on the marketplace',
    headline: 'Your trip is now live.',
    tagline: 'Discerning travelers can now discover your storyboard.',
    lede: (t) => `Your packaged trip ${t} has passed moderation and is now visible on the Goldsainte marketplace. Travelers may book it directly or request bespoke variations.`,
    step1: 'View your live listing exactly as travelers see it.',
    step2: 'Share the link with your audience to drive direct bookings.',
    step3: 'Inbound inquiries appear in your dashboard.',
    step4: 'Refine pricing, photos, and inclusions anytime.',
    step5: 'We promote the most exceptional listings to our curated audience.',
    cta: 'View live trip',
  },
  fr: {
    subject: 'Votre voyage est en ligne sur la place de marché',
    title: 'Votre voyage est en ligne sur la place de marché',
    headline: 'Votre voyage est maintenant en ligne.',
    tagline: 'Les voyageurs exigeants peuvent désormais découvrir votre storyboard.',
    lede: (t) => `Votre voyage clé en main ${t} a passé la modération et est désormais visible sur la place de marché Goldsainte. Les voyageurs peuvent le réserver directement ou demander des variantes sur mesure.`,
    step1: 'Voyez votre annonce en ligne exactement comme les voyageurs la voient.',
    step2: 'Partagez le lien avec votre audience pour générer des réservations directes.',
    step3: 'Les demandes entrantes apparaissent dans votre tableau de bord.',
    step4: 'Affinez prix, photos et prestations à tout moment.',
    step5: 'Nous mettons en avant les annonces les plus exceptionnelles auprès de notre audience choisie.',
    cta: 'Voir le voyage en ligne',
  },
  es: {
    subject: 'Tu viaje está publicado en el marketplace',
    title: 'Tu viaje está publicado en el marketplace',
    headline: 'Tu viaje ya está publicado.',
    tagline: 'Los viajeros exigentes ya pueden descubrir tu storyboard.',
    lede: (t) => `Tu viaje empaquetado ${t} pasó la moderación y ya es visible en el marketplace de Goldsainte. Los viajeros pueden reservarlo directamente o pedir variaciones a medida.`,
    step1: 'Mira tu anuncio publicado tal como lo ven los viajeros.',
    step2: 'Comparte el enlace con tu audiencia para generar reservas directas.',
    step3: 'Las consultas entrantes aparecen en tu panel.',
    step4: 'Ajusta precios, fotos y lo incluido cuando quieras.',
    step5: 'Promocionamos los anuncios más excepcionales ante nuestra audiencia curada.',
    cta: 'Ver viaje publicado',
  },
  de: {
    subject: 'Ihre Reise ist auf dem Marktplatz live',
    title: 'Ihre Reise ist auf dem Marktplatz live',
    headline: 'Ihre Reise ist jetzt live.',
    tagline: 'Anspruchsvolle Reisende können Ihr Storyboard jetzt entdecken.',
    lede: (t) => `Ihre fertige Reise ${t} hat die Moderation bestanden und ist jetzt auf dem Goldsainte-Marktplatz sichtbar. Reisende können sie direkt buchen oder maßgeschneiderte Varianten anfragen.`,
    step1: 'Sehen Sie Ihr Live-Angebot genau so, wie Reisende es sehen.',
    step2: 'Teilen Sie den Link mit Ihrem Publikum für Direktbuchungen.',
    step3: 'Eingehende Anfragen erscheinen in Ihrem Dashboard.',
    step4: 'Verfeinern Sie Preise, Fotos und Leistungen jederzeit.',
    step5: 'Die außergewöhnlichsten Angebote fördern wir bei unserem kuratierten Publikum.',
    cta: 'Live-Reise ansehen',
  },
  it: {
    subject: 'Il tuo viaggio è online sul marketplace',
    title: 'Il tuo viaggio è online sul marketplace',
    headline: 'Il tuo viaggio è ora online.',
    tagline: 'I viaggiatori esigenti possono ora scoprire il tuo storyboard.',
    lede: (t) => `Il tuo viaggio confezionato ${t} ha superato la moderazione ed è ora visibile sul marketplace Goldsainte. I viaggiatori possono prenotarlo direttamente o chiedere varianti su misura.`,
    step1: 'Guarda il tuo annuncio online esattamente come lo vedono i viaggiatori.',
    step2: 'Condividi il link con il tuo pubblico per generare prenotazioni dirette.',
    step3: 'Le richieste in arrivo compaiono nella tua dashboard.',
    step4: 'Perfeziona prezzi, foto e inclusioni in qualsiasi momento.',
    step5: 'Promuoviamo gli annunci più eccezionali presso il nostro pubblico selezionato.',
    cta: 'Vedi viaggio online',
  },
  pt: {
    subject: 'Sua viagem está no ar no marketplace',
    title: 'Sua viagem está no ar no marketplace',
    headline: 'Sua viagem já está no ar.',
    tagline: 'Viajantes exigentes já podem descobrir seu storyboard.',
    lede: (t) => `Sua viagem montada ${t} passou pela moderação e já está visível no marketplace da Goldsainte. Viajantes podem reservá-la diretamente ou pedir variações sob medida.`,
    step1: 'Veja seu anúncio no ar exatamente como os viajantes veem.',
    step2: 'Compartilhe o link com sua audiência para gerar reservas diretas.',
    step3: 'Consultas recebidas aparecem no seu painel.',
    step4: 'Refine preços, fotos e inclusões quando quiser.',
    step5: 'Promovemos os anúncios mais excepcionais para nossa audiência curada.',
    cta: 'Ver viagem no ar',
  },
  ar: {
    subject: 'رحلتك منشورة الآن في السوق',
    title: 'رحلتك منشورة الآن في السوق',
    headline: 'رحلتك أصبحت منشورة.',
    tagline: 'يمكن للمسافرين المميزين اكتشاف قصتك الآن.',
    lede: (t) => `اجتازت رحلتك الجاهزة ${t} المراجعة وأصبحت ظاهرة في سوق Goldsainte. يمكن للمسافرين حجزها مباشرة أو طلب نسخ مخصصة.`,
    step1: 'شاهد إعلانك المنشور تماماً كما يراه المسافرون.',
    step2: 'شارك الرابط مع جمهورك لجذب حجوزات مباشرة.',
    step3: 'تظهر الاستفسارات الواردة في لوحتك.',
    step4: 'حسّن الأسعار والصور والمشمولات في أي وقت.',
    step5: 'نروج لأكثر الإعلانات تميزاً لدى جمهورنا المنتقى.',
    cta: 'اعرض الرحلة المنشورة',
  },
  ja: {
    subject: 'あなたの旅がマーケットプレイスに公開されました',
    title: 'あなたの旅がマーケットプレイスに公開されました',
    headline: '旅が公開されました。',
    tagline: '目の肥えた旅行者があなたのストーリーボードを見つけられます。',
    lede: (t) => `パッケージ旅行「${t}」が審査を通過し、Goldsainte マーケットプレイスに表示されています。旅行者は直接予約するか、オーダーメイドのバリエーションをリクエストできます。`,
    step1: '旅行者に見えるままの公開リスティングを確認しましょう。',
    step2: 'リンクをオーディエンスと共有し、直接予約につなげましょう。',
    step3: '届いたお問い合わせはダッシュボードに表示されます。',
    step4: '価格・写真・内容はいつでも磨けます。',
    step5: '特に優れたリスティングは、厳選されたオーディエンスに私たちがプロモートします。',
    cta: '公開中の旅を見る',
  },
  ko: {
    subject: '당신의 여행이 마켓플레이스에 공개되었습니다',
    title: '당신의 여행이 마켓플레이스에 공개되었습니다',
    headline: '여행이 공개되었습니다.',
    tagline: '안목 있는 여행자들이 이제 당신의 스토리보드를 발견할 수 있습니다.',
    lede: (t) => `패키지 여행 ${t}이(가) 심사를 통과해 Goldsainte 마켓플레이스에 공개되었습니다. 여행자는 바로 예약하거나 맞춤 변형을 요청할 수 있습니다.`,
    step1: '여행자에게 보이는 그대로 공개 리스팅을 확인하세요.',
    step2: '링크를 공유해 직접 예약을 유도하세요.',
    step3: '들어온 문의는 대시보드에 표시됩니다.',
    step4: '가격, 사진, 포함 사항은 언제든 다듬을 수 있습니다.',
    step5: '가장 뛰어난 리스팅은 큐레이션된 오디언스에게 홍보해 드립니다.',
    cta: '공개된 여행 보기',
  },
  zh: {
    subject: '你的旅程已在市场上线',
    title: '你的旅程已在市场上线',
    headline: '你的旅程已上线。',
    tagline: '眼光独到的旅行者现在可以发现你的 Storyboard。',
    lede: (t) => `你的打包旅程「${t}」已通过审核，现已在 Goldsainte 市场可见。旅行者可以直接预订，或请求定制变体。`,
    step1: '以旅行者的视角查看你已上线的房源。',
    step2: '把链接分享给你的受众，带来直接预订。',
    step3: '收到的咨询会显示在你的面板中。',
    step4: '价格、照片与包含内容可随时打磨。',
    step5: '我们会向精选受众推广最出色的房源。',
    cta: '查看已上线旅程',
  },
}

export const TripPublishedEmail = ({ tripId, tripName, lang }: Props) => {
  const s = pickLang(STRINGS, lang)
  return (
    <AuthEmailLayout
      title={s.title}
      headline={s.headline}
      tagline={s.tagline}
      lede={s.lede(tripName ?? '')}
      steps={[s.step1, s.step2, s.step3, s.step4, s.step5]}
      cta={{ label: s.cta, url: `https://goldsainte.ai/creator-dashboard` }}
    />
  )
}

export const template = {
  component: TripPublishedEmail,
  subject: (data: Record<string, any>) => pickLang(STRINGS, data?.lang).subject,
  displayName: 'Trip Published',
  previewData: { tripName: 'Amalfi in Bloom', tripId: 't-222' },
} satisfies TemplateEntry
