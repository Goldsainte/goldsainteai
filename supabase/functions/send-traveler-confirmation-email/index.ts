import "../_shared/resend-guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface S {
  subject: (destination: string, ref: string) => string;
  h1: string;
  refLine: (ref: string) => string;
  h2Details: string;
  lblDestination: string;
  lblDeparture: string;
  lblReturn: string;
  travelers: (n: number) => string;
  lblTravelers: string;
  budgetUpTo: (cur: string, amount: string) => string;
  lblBudget: string;
  whatNext: string;
  s1t: string; s1b: string;
  s2t: string; s2b: string;
  s3t: string; s3b: string;
  s4t: string; s4b: string;
  s5t: string; s5b: string;
  trackBids: string;
  trackText: string;
  btnDashboard: string;
  contactInfo: string;
  contactText: string;
  lblEmail: string;
  lblPhone: string;
  notProvided: string;
  refFooter: (ref: string) => string;
  keepRef: string;
  questions: string;
  legal: string;
  rights: (year: string) => string;
}

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: { subject: (d, r) => `Trip Request Confirmed - ${d} (${r})`, h1: '\u2713 Trip Request Confirmed', refLine: (r) => `Reference: ${r}`, h2Details: 'Your Request Details', lblDestination: 'Destination:', lblDeparture: 'Departure:', lblReturn: 'Return:', travelers: (n) => `${n} adult(s)`, lblTravelers: 'Travelers:', budgetUpTo: (c, a) => `Up to ${c} ${a}`, lblBudget: 'Budget:', whatNext: 'What Happens Next', s1t: '1. AI Matching in Progress', s1b: 'Our AI is analyzing your requirements and matching you with certified agents who specialize in your destination and travel type.', s2t: '2. Agents Review Your Request', s2b: 'Top-matched agents (typically 3-8) will receive your trip details and can submit custom proposals.', s3t: '3. You Receive Bids (2-4 hours)', s3b: "Most agents respond within 2-4 hours. You'll receive email notifications when bids arrive.", s4t: '4. Compare & Choose', s4b: 'Review proposals, compare pricing and services, then select the agent that best fits your needs.', s5t: '5. Your Agent Takes Over', s5b: 'Once you accept a bid, your chosen agent will handle all the planning and booking.', trackBids: 'Track Your Bids', trackText: 'View incoming proposals and manage your trip request in real-time:', btnDashboard: 'View Marketplace Dashboard', contactInfo: 'Contact Information', contactText: "We'll contact you at:", lblEmail: 'Email:', lblPhone: 'Phone:', notProvided: 'Not provided', refFooter: (r) => `Reference Number: ${r}`, keepRef: 'Keep this for tracking your request.', questions: 'Questions? Reply to this email or contact our support team.', legal: 'Trips booked on Goldsainte are sold by independent travel professionals, who are the seller of record and are paid directly for your trip. Goldsainte is a technology platform that connects you with these professionals \u2014 we are not a travel agency, tour operator, or the seller of your travel.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. All rights reserved.` },
  fr: { subject: (d, r) => `Demande de voyage confirmée - ${d} (${r})`, h1: '\u2713 Demande de voyage confirmée', refLine: (r) => `Référence : ${r}`, h2Details: 'Détails de votre demande', lblDestination: 'Destination :', lblDeparture: 'Départ :', lblReturn: 'Retour :', travelers: (n) => `${n} adulte(s)`, lblTravelers: 'Voyageurs :', budgetUpTo: (c, a) => `Jusqu'à ${c} ${a}`, lblBudget: 'Budget :', whatNext: 'La suite', s1t: '1. Mise en relation par IA en cours', s1b: 'Notre IA analyse vos besoins et vous associe à des agents certifiés, spécialistes de votre destination et de votre type de voyage.', s2t: '2. Les agents examinent votre demande', s2b: 'Les agents les mieux adaptés (3 à 8 en général) reçoivent les détails de votre voyage et peuvent soumettre des propositions sur mesure.', s3t: '3. Vous recevez des offres (2 à 4 heures)', s3b: 'La plupart des agents répondent sous 2 à 4 heures. Vous serez averti par e-mail à chaque nouvelle offre.', s4t: '4. Comparez et choisissez', s4b: "Examinez les propositions, comparez prix et services, puis choisissez l'agent qui vous convient le mieux.", s5t: '5. Votre agent prend le relais', s5b: 'Une fois une offre acceptée, votre agent gère toute la planification et la réservation.', trackBids: 'Suivez vos offres', trackText: 'Consultez les propositions entrantes et gérez votre demande en temps réel :', btnDashboard: 'Voir le tableau de bord', contactInfo: 'Coordonnées', contactText: 'Nous vous contacterons à :', lblEmail: 'E-mail :', lblPhone: 'Téléphone :', notProvided: 'Non renseigné', refFooter: (r) => `Numéro de référence : ${r}`, keepRef: 'Conservez-le pour suivre votre demande.', questions: 'Des questions ? Répondez à cet e-mail ou contactez notre équipe support.', legal: 'Les voyages réservés sur Goldsainte sont vendus par des professionnels du voyage indépendants, vendeurs officiels payés directement pour votre voyage. Goldsainte est une plateforme technologique qui vous met en relation avec ces professionnels \u2014 nous ne sommes ni agence de voyage, ni tour-opérateur, ni vendeur de votre voyage.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. Tous droits réservés.` },
  es: { subject: (d, r) => `Solicitud de viaje confirmada - ${d} (${r})`, h1: '\u2713 Solicitud de viaje confirmada', refLine: (r) => `Referencia: ${r}`, h2Details: 'Detalles de tu solicitud', lblDestination: 'Destino:', lblDeparture: 'Salida:', lblReturn: 'Regreso:', travelers: (n) => `${n} adulto(s)`, lblTravelers: 'Viajeros:', budgetUpTo: (c, a) => `Hasta ${c} ${a}`, lblBudget: 'Presupuesto:', whatNext: 'Qué sigue', s1t: '1. Emparejamiento por IA en curso', s1b: 'Nuestra IA analiza tus requisitos y te empareja con agentes certificados especializados en tu destino y tipo de viaje.', s2t: '2. Los agentes revisan tu solicitud', s2b: 'Los agentes mejor emparejados (normalmente 3-8) reciben los detalles y pueden enviar propuestas a medida.', s3t: '3. Recibes ofertas (2-4 horas)', s3b: 'La mayoría de los agentes responde en 2-4 horas. Recibirás avisos por correo cuando lleguen ofertas.', s4t: '4. Compara y elige', s4b: 'Revisa las propuestas, compara precios y servicios, y elige el agente que mejor encaje contigo.', s5t: '5. Tu agente toma el mando', s5b: 'Al aceptar una oferta, tu agente se encarga de toda la planificación y reserva.', trackBids: 'Sigue tus ofertas', trackText: 'Mira las propuestas entrantes y gestiona tu solicitud en tiempo real:', btnDashboard: 'Ver panel del marketplace', contactInfo: 'Datos de contacto', contactText: 'Te contactaremos en:', lblEmail: 'Correo:', lblPhone: 'Teléfono:', notProvided: 'No facilitado', refFooter: (r) => `Número de referencia: ${r}`, keepRef: 'Guárdalo para seguir tu solicitud.', questions: '¿Preguntas? Responde a este correo o contacta con soporte.', legal: 'Los viajes reservados en Goldsainte los venden profesionales de viajes independientes, que son el vendedor registrado y cobran directamente por tu viaje. Goldsainte es una plataforma tecnológica que te conecta con estos profesionales \u2014 no somos agencia de viajes, turoperador ni vendedor de tu viaje.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. Todos los derechos reservados.` },
  de: { subject: (d, r) => `Reiseanfrage bestätigt - ${d} (${r})`, h1: '\u2713 Reiseanfrage bestätigt', refLine: (r) => `Referenz: ${r}`, h2Details: 'Ihre Anfragedetails', lblDestination: 'Ziel:', lblDeparture: 'Abreise:', lblReturn: 'Rückkehr:', travelers: (n) => `${n} Erwachsene(r)`, lblTravelers: 'Reisende:', budgetUpTo: (c, a) => `Bis zu ${c} ${a}`, lblBudget: 'Budget:', whatNext: 'Wie es weitergeht', s1t: '1. KI-Matching läuft', s1b: 'Unsere KI analysiert Ihre Anforderungen und ordnet Sie zertifizierten Agenten zu, die auf Ihr Ziel und Ihre Reiseart spezialisiert sind.', s2t: '2. Agenten prüfen Ihre Anfrage', s2b: 'Die passendsten Agenten (in der Regel 3-8) erhalten Ihre Reisedetails und können maßgeschneiderte Angebote einreichen.', s3t: '3. Sie erhalten Gebote (2-4 Stunden)', s3b: 'Die meisten Agenten antworten innerhalb von 2-4 Stunden. Bei neuen Geboten werden Sie per E-Mail benachrichtigt.', s4t: '4. Vergleichen & wählen', s4b: 'Prüfen Sie die Angebote, vergleichen Sie Preise und Leistungen und wählen Sie den passenden Agenten.', s5t: '5. Ihr Agent übernimmt', s5b: 'Sobald Sie ein Gebot annehmen, übernimmt Ihr Agent die gesamte Planung und Buchung.', trackBids: 'Gebote verfolgen', trackText: 'Sehen Sie eingehende Angebote und verwalten Sie Ihre Anfrage in Echtzeit:', btnDashboard: 'Marktplatz-Dashboard ansehen', contactInfo: 'Kontaktdaten', contactText: 'Wir erreichen Sie unter:', lblEmail: 'E-Mail:', lblPhone: 'Telefon:', notProvided: 'Nicht angegeben', refFooter: (r) => `Referenznummer: ${r}`, keepRef: 'Bewahren Sie sie zur Nachverfolgung auf.', questions: 'Fragen? Antworten Sie auf diese E-Mail oder kontaktieren Sie unser Support-Team.', legal: 'Auf Goldsainte gebuchte Reisen werden von unabhängigen Reiseprofis verkauft, die der eingetragene Verkäufer sind und direkt für Ihre Reise bezahlt werden. Goldsainte ist eine Technologieplattform, die Sie mit diesen Profis verbindet \u2014 wir sind weder Reisebüro noch Reiseveranstalter noch Verkäufer Ihrer Reise.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. Alle Rechte vorbehalten.` },
  it: { subject: (d, r) => `Richiesta di viaggio confermata - ${d} (${r})`, h1: '\u2713 Richiesta di viaggio confermata', refLine: (r) => `Riferimento: ${r}`, h2Details: 'Dettagli della tua richiesta', lblDestination: 'Destinazione:', lblDeparture: 'Partenza:', lblReturn: 'Ritorno:', travelers: (n) => `${n} adulto/i`, lblTravelers: 'Viaggiatori:', budgetUpTo: (c, a) => `Fino a ${c} ${a}`, lblBudget: 'Budget:', whatNext: 'Cosa succede ora', s1t: '1. Matching IA in corso', s1b: 'La nostra IA analizza le tue esigenze e ti abbina ad agenti certificati specializzati nella tua destinazione e nel tuo tipo di viaggio.', s2t: '2. Gli agenti esaminano la richiesta', s2b: 'Gli agenti più adatti (di norma 3-8) ricevono i dettagli e possono inviare proposte su misura.', s3t: '3. Ricevi offerte (2-4 ore)', s3b: 'La maggior parte degli agenti risponde entro 2-4 ore. Riceverai email a ogni nuova offerta.', s4t: '4. Confronta e scegli', s4b: "Esamina le proposte, confronta prezzi e servizi, poi scegli l'agente più adatto.", s5t: '5. Il tuo agente prende il timone', s5b: "Accettata un'offerta, l'agente scelto gestirà tutta la pianificazione e la prenotazione.", trackBids: 'Segui le tue offerte', trackText: 'Vedi le proposte in arrivo e gestisci la richiesta in tempo reale:', btnDashboard: 'Vedi dashboard marketplace', contactInfo: 'Contatti', contactText: 'Ti contatteremo a:', lblEmail: 'Email:', lblPhone: 'Telefono:', notProvided: 'Non fornito', refFooter: (r) => `Numero di riferimento: ${r}`, keepRef: 'Conservalo per seguire la richiesta.', questions: 'Domande? Rispondi a questa email o contatta il supporto.', legal: 'I viaggi prenotati su Goldsainte sono venduti da professionisti indipendenti, venditori registrati pagati direttamente per il tuo viaggio. Goldsainte è una piattaforma tecnologica che ti connette con questi professionisti \u2014 non siamo agenzia di viaggio, tour operator né venditore del tuo viaggio.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. Tutti i diritti riservati.` },
  pt: { subject: (d, r) => `Pedido de viagem confirmado - ${d} (${r})`, h1: '\u2713 Pedido de viagem confirmado', refLine: (r) => `Referência: ${r}`, h2Details: 'Detalhes do seu pedido', lblDestination: 'Destino:', lblDeparture: 'Partida:', lblReturn: 'Retorno:', travelers: (n) => `${n} adulto(s)`, lblTravelers: 'Viajantes:', budgetUpTo: (c, a) => `Até ${c} ${a}`, lblBudget: 'Orçamento:', whatNext: 'O que vem a seguir', s1t: '1. Matching por IA em andamento', s1b: 'Nossa IA analisa seus requisitos e combina você com agentes certificados, especializados no seu destino e tipo de viagem.', s2t: '2. Agentes analisam seu pedido', s2b: 'Os agentes mais compatíveis (normalmente 3-8) recebem os detalhes e podem enviar propostas sob medida.', s3t: '3. Você recebe lances (2-4 horas)', s3b: 'A maioria dos agentes responde em 2-4 horas. Você será avisado por e-mail quando chegarem lances.', s4t: '4. Compare e escolha', s4b: 'Revise as propostas, compare preços e serviços e escolha o agente ideal.', s5t: '5. Seu agente assume', s5b: 'Ao aceitar um lance, o agente escolhido cuida de todo o planejamento e reserva.', trackBids: 'Acompanhe seus lances', trackText: 'Veja propostas chegando e gerencie seu pedido em tempo real:', btnDashboard: 'Ver painel do marketplace', contactInfo: 'Contato', contactText: 'Falaremos com você em:', lblEmail: 'E-mail:', lblPhone: 'Telefone:', notProvided: 'Não informado', refFooter: (r) => `Número de referência: ${r}`, keepRef: 'Guarde para acompanhar seu pedido.', questions: 'Dúvidas? Responda a este e-mail ou fale com o suporte.', legal: 'As viagens reservadas na Goldsainte são vendidas por profissionais independentes, que são o vendedor registrado e recebem diretamente pela sua viagem. A Goldsainte é uma plataforma de tecnologia que conecta você a esses profissionais \u2014 não somos agência de viagens, operadora nem vendedora da sua viagem.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. Todos os direitos reservados.` },
  ar: { subject: (d, r) => `تأكيد طلب الرحلة - ${d} (${r})`, h1: '\u2713 تم تأكيد طلب الرحلة', refLine: (r) => `المرجع: ${r}`, h2Details: 'تفاصيل طلبك', lblDestination: 'الوجهة:', lblDeparture: 'المغادرة:', lblReturn: 'العودة:', travelers: (n) => `${n} من البالغين`, lblTravelers: 'المسافرون:', budgetUpTo: (c, a) => `حتى ${c} ${a}`, lblBudget: 'الميزانية:', whatNext: 'ما التالي', s1t: '1. المطابقة بالذكاء الاصطناعي جارية', s1b: 'يحلل ذكاؤنا الاصطناعي متطلباتك ويطابقك مع وكلاء معتمدين متخصصين في وجهتك ونوع سفرك.', s2t: '2. يراجع الوكلاء طلبك', s2b: 'يستلم الوكلاء الأنسب (عادة 3-8) تفاصيل رحلتك ويمكنهم تقديم عروض مخصصة.', s3t: '3. تستلم العروض (2-4 ساعات)', s3b: 'يرد معظم الوكلاء خلال 2-4 ساعات. ستصلك إشعارات بريدية عند وصول العروض.', s4t: '4. قارن واختر', s4b: 'راجع العروض وقارن الأسعار والخدمات ثم اختر الوكيل الأنسب لك.', s5t: '5. يتولى وكيلك المهمة', s5b: 'بعد قبول عرض، يتولى وكيلك المختار كل التخطيط والحجز.', trackBids: 'تابع عروضك', trackText: 'اعرض العروض الواردة وأدر طلبك لحظة بلحظة:', btnDashboard: 'اعرض لوحة السوق', contactInfo: 'بيانات التواصل', contactText: 'سنتواصل معك على:', lblEmail: 'البريد:', lblPhone: 'الهاتف:', notProvided: 'غير متوفر', refFooter: (r) => `رقم المرجع: ${r}`, keepRef: 'احتفظ به لمتابعة طلبك.', questions: 'أسئلة؟ رد على هذه الرسالة أو تواصل مع فريق الدعم.', legal: 'الرحلات المحجوزة عبر Goldsainte يبيعها مختصو سفر مستقلون، وهم البائع المسجل ويتقاضون مباشرة مقابل رحلتك. Goldsainte منصة تقنية تصلك بهؤلاء المختصين \u2014 لسنا وكالة سفر ولا منظم رحلات ولا بائع رحلتك.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. جميع الحقوق محفوظة.` },
  ja: { subject: (d, r) => `旅のリクエスト確定 - ${d}（${r}）`, h1: '\u2713 旅のリクエストが確定しました', refLine: (r) => `参照番号：${r}`, h2Details: 'リクエスト内容', lblDestination: '目的地：', lblDeparture: '出発：', lblReturn: '帰着：', travelers: (n) => `大人 ${n} 名`, lblTravelers: '旅行者：', budgetUpTo: (c, a) => `${c} ${a} まで`, lblBudget: '予算：', whatNext: 'この後の流れ', s1t: '1. AI マッチング進行中', s1b: 'AI がご要望を分析し、目的地と旅のタイプに精通した認定エージェントとマッチングします。', s2t: '2. エージェントがリクエストを確認', s2b: '最適なエージェント（通常3〜8名）が旅の詳細を受け取り、オーダーメイドの提案を提出できます。', s3t: '3. 入札が届く（2〜4時間）', s3b: 'ほとんどのエージェントは2〜4時間以内に応答します。入札が届くとメールでお知らせします。', s4t: '4. 比較して選ぶ', s4b: '提案を確認し、価格とサービスを比べて、最適なエージェントを選びましょう。', s5t: '5. エージェントにお任せ', s5b: '入札を承諾すると、選んだエージェントが計画と予約のすべてを担います。', trackBids: '入札を追跡', trackText: '届いた提案をリアルタイムで確認・管理できます：', btnDashboard: 'マーケットプレイスを見る', contactInfo: '連絡先', contactText: 'ご連絡先：', lblEmail: 'メール：', lblPhone: '電話：', notProvided: '未提供', refFooter: (r) => `参照番号：${r}`, keepRef: 'リクエスト追跡のため保管してください。', questions: 'ご質問はこのメールへの返信またはサポートチームへ。', legal: 'Goldsainte で予約された旅は、独立した旅のプロフェッショナルが販売者として直接対価を受け取ります。Goldsainte はお客様とプロをつなぐテクノロジープラットフォームであり \u2014 旅行代理店でもツアーオペレーターでも旅の販売者でもありません。', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. All rights reserved.` },
  ko: { subject: (d, r) => `여행 요청 확정 - ${d} (${r})`, h1: '\u2713 여행 요청이 확정되었습니다', refLine: (r) => `참조번호: ${r}`, h2Details: '요청 상세', lblDestination: '목적지:', lblDeparture: '출발:', lblReturn: '귀국:', travelers: (n) => `성인 ${n}명`, lblTravelers: '여행자:', budgetUpTo: (c, a) => `최대 ${c} ${a}`, lblBudget: '예산:', whatNext: '다음 단계', s1t: '1. AI 매칭 진행 중', s1b: 'AI가 요구 사항을 분석해 목적지와 여행 유형에 특화된 인증 에이전트와 매칭합니다.', s2t: '2. 에이전트가 요청 검토', s2b: '가장 잘 맞는 에이전트(보통 3~8명)가 여행 상세를 받고 맞춤 제안을 제출할 수 있습니다.', s3t: '3. 입찰 수신 (2~4시간)', s3b: '대부분의 에이전트는 2~4시간 안에 응답합니다. 입찰이 도착하면 이메일로 알려드립니다.', s4t: '4. 비교하고 선택', s4b: '제안을 검토하고 가격과 서비스를 비교한 뒤 가장 잘 맞는 에이전트를 선택하세요.', s5t: '5. 에이전트가 맡습니다', s5b: '입찰을 수락하면 선택한 에이전트가 모든 계획과 예약을 처리합니다.', trackBids: '입찰 추적', trackText: '들어오는 제안을 실시간으로 확인하고 요청을 관리하세요:', btnDashboard: '마켓플레이스 대시보드 보기', contactInfo: '연락처', contactText: '다음 연락처로 연락드립니다:', lblEmail: '이메일:', lblPhone: '전화:', notProvided: '미제공', refFooter: (r) => `참조번호: ${r}`, keepRef: '요청 추적을 위해 보관하세요.', questions: '질문이 있으면 이 메일에 회신하거나 지원팀에 문의하세요.', legal: 'Goldsainte에서 예약된 여행은 독립 여행 전문가가 판매하며, 이들이 등록 판매자로서 직접 대금을 받습니다. Goldsainte는 이들 전문가와 연결하는 기술 플랫폼일 뿐 \u2014 여행사, 투어 운영사, 여행 판매자가 아닙니다.', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. All rights reserved.` },
  zh: { subject: (d, r) => `旅行需求已确认 - ${d}（${r}）`, h1: '\u2713 旅行需求已确认', refLine: (r) => `参考编号：${r}`, h2Details: '你的需求详情', lblDestination: '目的地：', lblDeparture: '出发：', lblReturn: '返程：', travelers: (n) => `${n} 位成人`, lblTravelers: '旅行者：', budgetUpTo: (c, a) => `最高 ${c} ${a}`, lblBudget: '预算：', whatNext: '接下来会发生什么', s1t: '1. AI 匹配进行中', s1b: '我们的 AI 正在分析你的需求，为你匹配精通该目的地与旅行类型的认证代理。', s2t: '2. 代理审阅你的需求', s2b: '匹配度最高的代理（通常 3-8 位）将收到你的旅行详情并可提交定制提案。', s3t: '3. 收到报价（2-4 小时）', s3b: '多数代理会在 2-4 小时内回应。报价到达时你会收到邮件通知。', s4t: '4. 比较并选择', s4b: '审阅提案，比较价格与服务，选出最适合你的代理。', s5t: '5. 代理接手', s5b: '接受报价后，所选代理将负责全部规划与预订。', trackBids: '追踪你的报价', trackText: '实时查看新提案并管理你的需求：', btnDashboard: '查看市场面板', contactInfo: '联系信息', contactText: '我们将通过以下方式联系你：', lblEmail: '邮箱：', lblPhone: '电话：', notProvided: '未提供', refFooter: (r) => `参考编号：${r}`, keepRef: '请保留以便追踪你的需求。', questions: '有疑问？回复本邮件或联系我们的支持团队。', legal: '在 Goldsainte 预订的旅程由独立旅行专业人士出售，他们是登记卖方并直接收取旅费。Goldsainte 是连接你与这些专业人士的技术平台 \u2014 我们不是旅行社、旅游运营商，也不是你旅程的卖方。', rights: (y) => `\u00A9 ${y} Goldsainte AI Inc. 保留所有权利。` },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  "Vary": "Origin",
};
}



Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { inquiryId, jobId, referenceNumber, lang: requestLang } = await req.json();

    // Fetch inquiry and job details
    const { data: inquiry } = await supabaseClient
      .from('agent_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .single();

    const { data: job } = await supabaseClient
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!inquiry || !job) {
      throw new Error('Inquiry or job not found');
    }

    const travelDetails = inquiry.conversation_data?.travelDetails || {};
    const dashboardUrl = `${(Deno.env.get('SUPABASE_URL') || '').replace('//', '//app.')}/marketplace?job=${jobId}`;

    // Send confirmation email
    const lang = await resolveRecipientLanguage(supabaseClient, requestLang ?? null, inquiry.guest_email ?? null);
    const s = pickLang(STRINGS, lang);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #0a2225; background: #f7f3ea; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0c4d47; color: #f7f3ea; padding: 30px; text-align: center; border-radius: 2px 2px 0 0; }
          .content { background: #ffffff; padding: 30px; border-radius: 0 0 2px 2px; border: 1px solid #E5DFC6; border-top: 0; }
          .section { background: #FDF9F0; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #C7A962; }
          .highlight { background: #F6F0E4; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #0c4d47; color: #f7f3ea !important; padding: 18px 40px; text-decoration: none; border-radius: 2px; margin: 20px 0; font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .check { color: #10b981; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${s.h1}</h1>
            <p style="margin: 10px 0 0 0;">${s.refLine(referenceNumber)}</p>
          </div>
          <div class="content">
            <div class="section">
              <h2 style="margin-top: 0; color: #0c4d47;">${s.h2Details}</h2>
              <p><strong>${s.lblDestination}</strong> ${job.destination}</p>
              ${travelDetails.departureDate ? `<p><strong>${s.lblDeparture}</strong> ${travelDetails.departureDate}</p>` : ''}
              ${travelDetails.returnDate ? `<p><strong>${s.lblReturn}</strong> ${travelDetails.returnDate}</p>` : ''}
              ${travelDetails.travelers ? `<p><strong>${s.lblTravelers}</strong> ${s.travelers(travelDetails.travelers.adults || 1)}</p>` : ''}
              ${job.budget_max ? `<p><strong>${s.lblBudget}</strong> ${s.budgetUpTo(job.currency, String(job.budget_max))}</p>` : ''}
            </div>

            <div class="highlight">
              <h3 style="margin-top: 0;"><span class="check">\u2713</span> ${s.whatNext}</h3>
              <p><strong>${s.s1t}</strong><br/>
              ${s.s1b}</p>
              
              <p><strong>${s.s2t}</strong><br/>
              ${s.s2b}</p>
              
              <p><strong>${s.s3t}</strong><br/>
              ${s.s3b}</p>
              
              <p><strong>${s.s4t}</strong><br/>
              ${s.s4b}</p>
              
              <p><strong>${s.s5t}</strong><br/>
              ${s.s5b}</p>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">${s.trackBids}</h3>
              <p>${s.trackText}</p>
              <a href="${dashboardUrl}" class="button">${s.btnDashboard}</a>
            </div>

            <div class="section">
              <h3 style="margin-top: 0;">${s.contactInfo}</h3>
              <p>${s.contactText}</p>
              <p><strong>${s.lblEmail}</strong> ${inquiry.guest_email}<br/>
              <strong>${s.lblPhone}</strong> ${inquiry.guest_phone || s.notProvided}</p>
            </div>

            <div class="footer">
              <p>${s.refFooter(referenceNumber)}<br/>
              ${s.keepRef}</p>
              <p>${s.questions}</p>
              <p style="margin-top: 20px; font-size: 11px; color: #999; line-height: 1.6;">
                ${s.legal}
              </p>
              <p style="margin-top: 16px;">${s.rights(String(new Date().getFullYear()))}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    if (Deno.env.get('RESEND_API_KEY')) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          },
          body: JSON.stringify({
            from: 'Goldsainte Travel <hello@goldsainte.com>',
            to: [inquiry.guest_email],
            subject: s.subject(job.destination, referenceNumber),
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const error = await resendResponse.text();
          throw new Error(`Failed to send email: ${error}`);
        }

        const data = await resendResponse.json();
        console.log('Confirmation email sent to:', inquiry.guest_email, 'ID:', data?.id);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-traveler-confirmation-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
