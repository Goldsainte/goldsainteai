import "../_shared/resend-guard.ts";
// Supabase Edge Function: send-contract-notification (v3, rebuilt Jul 10)
//
// Contract lifecycle notifications. Accepts two payload shapes:
//
//   A) Send flow (AgentContractBuilder):
//      { contractId, tripId, recipientEmail, recipientType: "traveler" | "creator" }
//      -> treated as event "sent". Response includes { emailDelivered } which the
//         builder checks (email is best-effort; the auto-DM is its reliable channel).
//
//   B) Lifecycle events (ContractSignPage):
//      { contractId, event: "signed" | "executed" | "revision_proposed", actorRole }
//
// Every event writes bell notifications (with action_url deep links) as the
// reliable channel, and attempts a branded email as best-effort. Email failures
// never fail the request (Resend domain may be unverified; the resend-guard
// import also drops suppressed recipients for compliance).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { pickLang, resolveRecipientLanguage, type EmailLang } from "../_shared/email-i18n.ts";

interface EventCopy {
  title: string;
  message: string;
  emailSubject: string;
  emailHeading: string;
  emailBody: string;
  ctaLabel: string;
}

interface S {
  yourTrip: string;
  tripWord: string;
  yourAgent: string;
  aParty: string;
  sent: (agentName: string, destination: string) => EventCopy;
  signed: (actorName: string, destination: string) => EventCopy;
  executed: (destination: string, destinationLabel: string) => EventCopy;
  revisionProposed: (actorName: string, destination: string, destinationLabel: string) => EventCopy;
  revisionAccepted: (actorName: string, destination: string, destinationLabel: string) => EventCopy;
  revisionRejected: (actorName: string, destination: string, destinationLabel: string, note: string | null) => EventCopy;
}

const P_OPEN = '<p style="color:#4a4a4a;line-height:1.6;margin-bottom:20px;">';

const STRINGS: { en: S } & Partial<Record<EmailLang, S>> = {
  en: {
    yourTrip: 'your trip', tripWord: 'trip', yourAgent: 'Your travel agent', aParty: 'A party',
    sent: (a, d) => ({ title: 'Contract ready for your signature', message: `${a} has prepared your trip contract for ${d}. Review and sign to move forward.`, emailSubject: `Your Goldsainte trip contract \u2014 ${d}`, emailHeading: 'Review & sign your trip contract', emailBody: `${P_OPEN}${a} has prepared a service agreement for your upcoming trip to <strong>${d}</strong>. Please review it carefully \u2014 it covers payment terms, cancellation policies, and each party's responsibilities.</p>`, ctaLabel: 'Review & sign contract' }),
    signed: (a, d) => ({ title: `${a} signed the contract`, message: `${a} has signed the contract for ${d}. Open it to review and add your signature.`, emailSubject: `${a} signed \u2014 your signature is next`, emailHeading: 'A signature has been added', emailBody: `${P_OPEN}<strong>${a}</strong> has signed the contract for <strong>${d}</strong>. Once every party has signed, the contract is fully executed and the trip can proceed to deposit.</p>`, ctaLabel: 'Review the contract' }),
    executed: (d, dl) => ({ title: 'Contract fully executed', message: `All parties have signed the contract for ${d}. The trip can now proceed to deposit.`, emailSubject: `Fully executed \u2014 your ${dl} contract`, emailHeading: 'Your contract is fully executed', emailBody: `${P_OPEN}Every party has now signed the contract for <strong>${d}</strong>. A copy is available for download on the contract page, and the trip can proceed to deposit.</p>`, ctaLabel: 'View the executed contract' }),
    revisionProposed: (a, d, dl) => ({ title: 'Changes proposed to your contract', message: `${a} proposed changes to the contract for ${d}. Review them to accept or reject.`, emailSubject: `Proposed changes \u2014 your ${dl} contract`, emailHeading: 'Changes have been proposed', emailBody: `${P_OPEN}<strong>${a}</strong> has proposed changes to the contract for <strong>${d}</strong>. Open the contract to review, accept, or reject them.</p>`, ctaLabel: 'Review proposed changes' }),
    revisionAccepted: (a, d, dl) => ({ title: 'Proposed changes accepted', message: `${a} accepted the proposed changes to the contract for ${d}. The contract text has been updated \u2014 every party needs to sign again.`, emailSubject: `Changes accepted \u2014 your ${dl} contract`, emailHeading: 'Your proposed changes were accepted', emailBody: `${P_OPEN}<strong>${a}</strong> accepted the proposed changes to the contract for <strong>${d}</strong>. The contract text has been updated, so every party needs to sign the revised version.</p>`, ctaLabel: 'Review and sign' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'Proposed changes declined', message: `${a} declined the proposed changes to the contract for ${d}.${n ? ` Note: "${n}"` : ''} The current contract text stands.`, emailSubject: `Changes declined \u2014 your ${dl} contract`, emailHeading: 'Proposed changes were declined', emailBody: `${P_OPEN}<strong>${a}</strong> declined the proposed changes to the contract for <strong>${d}</strong>.${n ? ` They added a note: &ldquo;${n}&rdquo;.` : ''} The current contract text stands \u2014 you can review it or propose different changes.</p>`, ctaLabel: 'View the contract' }),
  },
  fr: {
    yourTrip: 'votre voyage', tripWord: 'voyage', yourAgent: 'Votre agent de voyage', aParty: 'Une partie',
    sent: (a, d) => ({ title: 'Contrat prêt pour votre signature', message: `${a} a préparé votre contrat de voyage pour ${d}. Relisez-le et signez pour avancer.`, emailSubject: `Votre contrat de voyage Goldsainte \u2014 ${d}`, emailHeading: 'Relisez et signez votre contrat de voyage', emailBody: `${P_OPEN}${a} a préparé un contrat de service pour votre voyage à venir vers <strong>${d}</strong>. Relisez-le attentivement \u2014 il couvre les conditions de paiement, les politiques d'annulation et les responsabilités de chaque partie.</p>`, ctaLabel: 'Relire et signer le contrat' }),
    signed: (a, d) => ({ title: `${a} a signé le contrat`, message: `${a} a signé le contrat pour ${d}. Ouvrez-le pour le relire et ajouter votre signature.`, emailSubject: `${a} a signé \u2014 votre signature est attendue`, emailHeading: 'Une signature a été ajoutée', emailBody: `${P_OPEN}<strong>${a}</strong> a signé le contrat pour <strong>${d}</strong>. Quand toutes les parties auront signé, le contrat sera pleinement exécuté et le voyage pourra passer à l'acompte.</p>`, ctaLabel: 'Relire le contrat' }),
    executed: (d, dl) => ({ title: 'Contrat pleinement exécuté', message: `Toutes les parties ont signé le contrat pour ${d}. Le voyage peut passer à l'acompte.`, emailSubject: `Pleinement exécuté \u2014 votre contrat ${dl}`, emailHeading: 'Votre contrat est pleinement exécuté', emailBody: `${P_OPEN}Toutes les parties ont signé le contrat pour <strong>${d}</strong>. Une copie est téléchargeable sur la page du contrat, et le voyage peut passer à l'acompte.</p>`, ctaLabel: 'Voir le contrat exécuté' }),
    revisionProposed: (a, d, dl) => ({ title: 'Modifications proposées à votre contrat', message: `${a} a proposé des modifications au contrat pour ${d}. Relisez-les pour accepter ou refuser.`, emailSubject: `Modifications proposées \u2014 votre contrat ${dl}`, emailHeading: 'Des modifications ont été proposées', emailBody: `${P_OPEN}<strong>${a}</strong> a proposé des modifications au contrat pour <strong>${d}</strong>. Ouvrez le contrat pour les relire, les accepter ou les refuser.</p>`, ctaLabel: 'Relire les modifications' }),
    revisionAccepted: (a, d, dl) => ({ title: 'Modifications acceptées', message: `${a} a accepté les modifications proposées au contrat pour ${d}. Le texte a été mis à jour \u2014 chaque partie doit signer à nouveau.`, emailSubject: `Modifications acceptées \u2014 votre contrat ${dl}`, emailHeading: 'Vos modifications ont été acceptées', emailBody: `${P_OPEN}<strong>${a}</strong> a accepté les modifications proposées au contrat pour <strong>${d}</strong>. Le texte du contrat a été mis à jour ; chaque partie doit signer la version révisée.</p>`, ctaLabel: 'Relire et signer' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'Modifications refusées', message: `${a} a refusé les modifications proposées au contrat pour ${d}.${n ? ` Note : \u00AB ${n} \u00BB` : ''} Le texte actuel du contrat demeure.`, emailSubject: `Modifications refusées \u2014 votre contrat ${dl}`, emailHeading: 'Les modifications ont été refusées', emailBody: `${P_OPEN}<strong>${a}</strong> a refusé les modifications proposées au contrat pour <strong>${d}</strong>.${n ? ` Avec cette note : &ldquo;${n}&rdquo;.` : ''} Le texte actuel demeure \u2014 vous pouvez le relire ou proposer d'autres modifications.</p>`, ctaLabel: 'Voir le contrat' }),
  },
  es: {
    yourTrip: 'tu viaje', tripWord: 'viaje', yourAgent: 'Tu agente de viajes', aParty: 'Una parte',
    sent: (a, d) => ({ title: 'Contrato listo para tu firma', message: `${a} ha preparado tu contrato de viaje para ${d}. Revísalo y firma para avanzar.`, emailSubject: `Tu contrato de viaje Goldsainte \u2014 ${d}`, emailHeading: 'Revisa y firma tu contrato de viaje', emailBody: `${P_OPEN}${a} ha preparado un contrato de servicios para tu próximo viaje a <strong>${d}</strong>. Revísalo con cuidado \u2014 cubre condiciones de pago, políticas de cancelación y las responsabilidades de cada parte.</p>`, ctaLabel: 'Revisar y firmar contrato' }),
    signed: (a, d) => ({ title: `${a} firmó el contrato`, message: `${a} ha firmado el contrato para ${d}. Ábrelo para revisarlo y añadir tu firma.`, emailSubject: `${a} firmó \u2014 tu firma es la siguiente`, emailHeading: 'Se ha añadido una firma', emailBody: `${P_OPEN}<strong>${a}</strong> ha firmado el contrato para <strong>${d}</strong>. Cuando todas las partes firmen, el contrato quedará plenamente ejecutado y el viaje podrá pasar al depósito.</p>`, ctaLabel: 'Revisar el contrato' }),
    executed: (d, dl) => ({ title: 'Contrato plenamente ejecutado', message: `Todas las partes han firmado el contrato para ${d}. El viaje puede pasar al depósito.`, emailSubject: `Plenamente ejecutado \u2014 tu contrato de ${dl}`, emailHeading: 'Tu contrato está plenamente ejecutado', emailBody: `${P_OPEN}Todas las partes han firmado el contrato para <strong>${d}</strong>. Hay una copia descargable en la página del contrato, y el viaje puede pasar al depósito.</p>`, ctaLabel: 'Ver contrato ejecutado' }),
    revisionProposed: (a, d, dl) => ({ title: 'Cambios propuestos a tu contrato', message: `${a} propuso cambios al contrato para ${d}. Revísalos para aceptar o rechazar.`, emailSubject: `Cambios propuestos \u2014 tu contrato de ${dl}`, emailHeading: 'Se han propuesto cambios', emailBody: `${P_OPEN}<strong>${a}</strong> ha propuesto cambios al contrato para <strong>${d}</strong>. Abre el contrato para revisarlos, aceptarlos o rechazarlos.</p>`, ctaLabel: 'Revisar cambios propuestos' }),
    revisionAccepted: (a, d, dl) => ({ title: 'Cambios aceptados', message: `${a} aceptó los cambios propuestos al contrato para ${d}. El texto se ha actualizado \u2014 cada parte debe firmar de nuevo.`, emailSubject: `Cambios aceptados \u2014 tu contrato de ${dl}`, emailHeading: 'Tus cambios propuestos fueron aceptados', emailBody: `${P_OPEN}<strong>${a}</strong> aceptó los cambios propuestos al contrato para <strong>${d}</strong>. El texto del contrato se ha actualizado, así que cada parte debe firmar la versión revisada.</p>`, ctaLabel: 'Revisar y firmar' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'Cambios rechazados', message: `${a} rechazó los cambios propuestos al contrato para ${d}.${n ? ` Nota: \u201C${n}\u201D` : ''} El texto actual del contrato se mantiene.`, emailSubject: `Cambios rechazados \u2014 tu contrato de ${dl}`, emailHeading: 'Los cambios propuestos fueron rechazados', emailBody: `${P_OPEN}<strong>${a}</strong> rechazó los cambios propuestos al contrato para <strong>${d}</strong>.${n ? ` Añadió una nota: &ldquo;${n}&rdquo;.` : ''} El texto actual se mantiene \u2014 puedes revisarlo o proponer cambios distintos.</p>`, ctaLabel: 'Ver el contrato' }),
  },
  de: {
    yourTrip: 'Ihre Reise', tripWord: 'Reise', yourAgent: 'Ihr Reiseagent', aParty: 'Eine Partei',
    sent: (a, d) => ({ title: 'Vertrag bereit für Ihre Unterschrift', message: `${a} hat Ihren Reisevertrag für ${d} vorbereitet. Prüfen und unterschreiben Sie, um fortzufahren.`, emailSubject: `Ihr Goldsainte-Reisevertrag \u2014 ${d}`, emailHeading: 'Prüfen & unterschreiben Sie Ihren Reisevertrag', emailBody: `${P_OPEN}${a} hat einen Dienstleistungsvertrag für Ihre bevorstehende Reise nach <strong>${d}</strong> vorbereitet. Bitte prüfen Sie ihn sorgfältig \u2014 er regelt Zahlungsbedingungen, Stornierungsrichtlinien und die Pflichten jeder Partei.</p>`, ctaLabel: 'Vertrag prüfen & unterschreiben' }),
    signed: (a, d) => ({ title: `${a} hat den Vertrag unterschrieben`, message: `${a} hat den Vertrag für ${d} unterschrieben. Öffnen Sie ihn, um zu prüfen und Ihre Unterschrift hinzuzufügen.`, emailSubject: `${a} hat unterschrieben \u2014 Ihre Unterschrift ist die nächste`, emailHeading: 'Eine Unterschrift wurde hinzugefügt', emailBody: `${P_OPEN}<strong>${a}</strong> hat den Vertrag für <strong>${d}</strong> unterschrieben. Sobald alle Parteien unterschrieben haben, ist der Vertrag vollständig ausgefertigt und die Reise kann zur Anzahlung übergehen.</p>`, ctaLabel: 'Vertrag prüfen' }),
    executed: (d, dl) => ({ title: 'Vertrag vollständig ausgefertigt', message: `Alle Parteien haben den Vertrag für ${d} unterschrieben. Die Reise kann zur Anzahlung übergehen.`, emailSubject: `Vollständig ausgefertigt \u2014 Ihr ${dl}-Vertrag`, emailHeading: 'Ihr Vertrag ist vollständig ausgefertigt', emailBody: `${P_OPEN}Alle Parteien haben den Vertrag für <strong>${d}</strong> unterschrieben. Eine Kopie steht auf der Vertragsseite zum Download bereit, und die Reise kann zur Anzahlung übergehen.</p>`, ctaLabel: 'Ausgefertigten Vertrag ansehen' }),
    revisionProposed: (a, d, dl) => ({ title: 'Änderungen an Ihrem Vertrag vorgeschlagen', message: `${a} hat Änderungen am Vertrag für ${d} vorgeschlagen. Prüfen Sie sie und nehmen Sie an oder lehnen Sie ab.`, emailSubject: `Vorgeschlagene Änderungen \u2014 Ihr ${dl}-Vertrag`, emailHeading: 'Änderungen wurden vorgeschlagen', emailBody: `${P_OPEN}<strong>${a}</strong> hat Änderungen am Vertrag für <strong>${d}</strong> vorgeschlagen. Öffnen Sie den Vertrag, um sie zu prüfen, anzunehmen oder abzulehnen.</p>`, ctaLabel: 'Änderungen prüfen' }),
    revisionAccepted: (a, d, dl) => ({ title: 'Änderungen angenommen', message: `${a} hat die vorgeschlagenen Änderungen am Vertrag für ${d} angenommen. Der Text wurde aktualisiert \u2014 jede Partei muss erneut unterschreiben.`, emailSubject: `Änderungen angenommen \u2014 Ihr ${dl}-Vertrag`, emailHeading: 'Ihre vorgeschlagenen Änderungen wurden angenommen', emailBody: `${P_OPEN}<strong>${a}</strong> hat die vorgeschlagenen Änderungen am Vertrag für <strong>${d}</strong> angenommen. Der Vertragstext wurde aktualisiert, daher muss jede Partei die überarbeitete Fassung unterschreiben.</p>`, ctaLabel: 'Prüfen und unterschreiben' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'Änderungen abgelehnt', message: `${a} hat die vorgeschlagenen Änderungen am Vertrag für ${d} abgelehnt.${n ? ` Notiz: \u201E${n}\u201C` : ''} Der aktuelle Vertragstext bleibt bestehen.`, emailSubject: `Änderungen abgelehnt \u2014 Ihr ${dl}-Vertrag`, emailHeading: 'Vorgeschlagene Änderungen wurden abgelehnt', emailBody: `${P_OPEN}<strong>${a}</strong> hat die vorgeschlagenen Änderungen am Vertrag für <strong>${d}</strong> abgelehnt.${n ? ` Mit dieser Notiz: &ldquo;${n}&rdquo;.` : ''} Der aktuelle Vertragstext bleibt bestehen \u2014 Sie können ihn prüfen oder andere Änderungen vorschlagen.</p>`, ctaLabel: 'Vertrag ansehen' }),
  },
  it: {
    yourTrip: 'il tuo viaggio', tripWord: 'viaggio', yourAgent: 'Il tuo agente di viaggio', aParty: 'Una parte',
    sent: (a, d) => ({ title: 'Contratto pronto per la tua firma', message: `${a} ha preparato il contratto di viaggio per ${d}. Esaminalo e firma per procedere.`, emailSubject: `Il tuo contratto di viaggio Goldsainte \u2014 ${d}`, emailHeading: 'Esamina e firma il contratto di viaggio', emailBody: `${P_OPEN}${a} ha preparato un contratto di servizi per il tuo prossimo viaggio a <strong>${d}</strong>. Esaminalo con cura \u2014 copre condizioni di pagamento, politiche di annullamento e responsabilità di ciascuna parte.</p>`, ctaLabel: 'Esamina e firma il contratto' }),
    signed: (a, d) => ({ title: `${a} ha firmato il contratto`, message: `${a} ha firmato il contratto per ${d}. Aprilo per esaminarlo e aggiungere la tua firma.`, emailSubject: `${a} ha firmato \u2014 tocca alla tua firma`, emailHeading: 'È stata aggiunta una firma', emailBody: `${P_OPEN}<strong>${a}</strong> ha firmato il contratto per <strong>${d}</strong>. Quando tutte le parti avranno firmato, il contratto sarà pienamente esecutivo e il viaggio potrà passare all'acconto.</p>`, ctaLabel: 'Esamina il contratto' }),
    executed: (d, dl) => ({ title: 'Contratto pienamente esecutivo', message: `Tutte le parti hanno firmato il contratto per ${d}. Il viaggio può passare all'acconto.`, emailSubject: `Pienamente esecutivo \u2014 il tuo contratto ${dl}`, emailHeading: 'Il tuo contratto è pienamente esecutivo', emailBody: `${P_OPEN}Tutte le parti hanno firmato il contratto per <strong>${d}</strong>. Una copia è scaricabile dalla pagina del contratto, e il viaggio può passare all'acconto.</p>`, ctaLabel: 'Vedi il contratto esecutivo' }),
    revisionProposed: (a, d, dl) => ({ title: 'Modifiche proposte al contratto', message: `${a} ha proposto modifiche al contratto per ${d}. Esaminale per accettare o rifiutare.`, emailSubject: `Modifiche proposte \u2014 il tuo contratto ${dl}`, emailHeading: 'Sono state proposte modifiche', emailBody: `${P_OPEN}<strong>${a}</strong> ha proposto modifiche al contratto per <strong>${d}</strong>. Apri il contratto per esaminarle, accettarle o rifiutarle.</p>`, ctaLabel: 'Esamina le modifiche' }),
    revisionAccepted: (a, d, dl) => ({ title: 'Modifiche accettate', message: `${a} ha accettato le modifiche proposte al contratto per ${d}. Il testo è stato aggiornato \u2014 ogni parte deve firmare di nuovo.`, emailSubject: `Modifiche accettate \u2014 il tuo contratto ${dl}`, emailHeading: 'Le tue modifiche sono state accettate', emailBody: `${P_OPEN}<strong>${a}</strong> ha accettato le modifiche proposte al contratto per <strong>${d}</strong>. Il testo del contratto è stato aggiornato, quindi ogni parte deve firmare la versione rivista.</p>`, ctaLabel: 'Esamina e firma' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'Modifiche rifiutate', message: `${a} ha rifiutato le modifiche proposte al contratto per ${d}.${n ? ` Nota: \u201C${n}\u201D` : ''} Il testo attuale del contratto resta valido.`, emailSubject: `Modifiche rifiutate \u2014 il tuo contratto ${dl}`, emailHeading: 'Le modifiche proposte sono state rifiutate', emailBody: `${P_OPEN}<strong>${a}</strong> ha rifiutato le modifiche proposte al contratto per <strong>${d}</strong>.${n ? ` Con questa nota: &ldquo;${n}&rdquo;.` : ''} Il testo attuale resta valido \u2014 puoi esaminarlo o proporre modifiche diverse.</p>`, ctaLabel: 'Vedi il contratto' }),
  },
  pt: {
    yourTrip: 'sua viagem', tripWord: 'viagem', yourAgent: 'Seu agente de viagens', aParty: 'Uma parte',
    sent: (a, d) => ({ title: 'Contrato pronto para sua assinatura', message: `${a} preparou seu contrato de viagem para ${d}. Revise e assine para avançar.`, emailSubject: `Seu contrato de viagem Goldsainte \u2014 ${d}`, emailHeading: 'Revise e assine seu contrato de viagem', emailBody: `${P_OPEN}${a} preparou um contrato de serviços para sua próxima viagem a <strong>${d}</strong>. Revise com atenção \u2014 ele cobre condições de pagamento, políticas de cancelamento e as responsabilidades de cada parte.</p>`, ctaLabel: 'Revisar e assinar contrato' }),
    signed: (a, d) => ({ title: `${a} assinou o contrato`, message: `${a} assinou o contrato para ${d}. Abra para revisar e adicionar sua assinatura.`, emailSubject: `${a} assinou \u2014 sua assinatura é a próxima`, emailHeading: 'Uma assinatura foi adicionada', emailBody: `${P_OPEN}<strong>${a}</strong> assinou o contrato para <strong>${d}</strong>. Quando todas as partes assinarem, o contrato estará plenamente executado e a viagem poderá seguir para o depósito.</p>`, ctaLabel: 'Revisar o contrato' }),
    executed: (d, dl) => ({ title: 'Contrato plenamente executado', message: `Todas as partes assinaram o contrato para ${d}. A viagem pode seguir para o depósito.`, emailSubject: `Plenamente executado \u2014 seu contrato de ${dl}`, emailHeading: 'Seu contrato está plenamente executado', emailBody: `${P_OPEN}Todas as partes assinaram o contrato para <strong>${d}</strong>. Uma cópia está disponível para download na página do contrato, e a viagem pode seguir para o depósito.</p>`, ctaLabel: 'Ver contrato executado' }),
    revisionProposed: (a, d, dl) => ({ title: 'Mudanças propostas ao seu contrato', message: `${a} propôs mudanças ao contrato para ${d}. Revise para aceitar ou recusar.`, emailSubject: `Mudanças propostas \u2014 seu contrato de ${dl}`, emailHeading: 'Mudanças foram propostas', emailBody: `${P_OPEN}<strong>${a}</strong> propôs mudanças ao contrato para <strong>${d}</strong>. Abra o contrato para revisar, aceitar ou recusar.</p>`, ctaLabel: 'Revisar mudanças propostas' }),
    revisionAccepted: (a, d, dl) => ({ title: 'Mudanças aceitas', message: `${a} aceitou as mudanças propostas ao contrato para ${d}. O texto foi atualizado \u2014 cada parte precisa assinar novamente.`, emailSubject: `Mudanças aceitas \u2014 seu contrato de ${dl}`, emailHeading: 'Suas mudanças propostas foram aceitas', emailBody: `${P_OPEN}<strong>${a}</strong> aceitou as mudanças propostas ao contrato para <strong>${d}</strong>. O texto do contrato foi atualizado, então cada parte precisa assinar a versão revisada.</p>`, ctaLabel: 'Revisar e assinar' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'Mudanças recusadas', message: `${a} recusou as mudanças propostas ao contrato para ${d}.${n ? ` Nota: \u201C${n}\u201D` : ''} O texto atual do contrato permanece.`, emailSubject: `Mudanças recusadas \u2014 seu contrato de ${dl}`, emailHeading: 'As mudanças propostas foram recusadas', emailBody: `${P_OPEN}<strong>${a}</strong> recusou as mudanças propostas ao contrato para <strong>${d}</strong>.${n ? ` Com a nota: &ldquo;${n}&rdquo;.` : ''} O texto atual permanece \u2014 você pode revisá-lo ou propor mudanças diferentes.</p>`, ctaLabel: 'Ver o contrato' }),
  },
  ar: {
    yourTrip: 'رحلتك', tripWord: 'الرحلة', yourAgent: 'وكيل سفرك', aParty: 'أحد الأطراف',
    sent: (a, d) => ({ title: 'العقد جاهز لتوقيعك', message: `أعد ${a} عقد رحلتك إلى ${d}. راجعه ووقّع للمتابعة.`, emailSubject: `عقد رحلتك من Goldsainte \u2014 ${d}`, emailHeading: 'راجع عقد رحلتك ووقّعه', emailBody: `${P_OPEN}أعد ${a} اتفاقية خدمات لرحلتك القادمة إلى <strong>${d}</strong>. راجعها بعناية \u2014 فهي تغطي شروط الدفع وسياسات الإلغاء ومسؤوليات كل طرف.</p>`, ctaLabel: 'راجع العقد ووقّع' }),
    signed: (a, d) => ({ title: `وقّع ${a} العقد`, message: `وقّع ${a} عقد رحلة ${d}. افتحه للمراجعة وإضافة توقيعك.`, emailSubject: `وقّع ${a} \u2014 توقيعك هو التالي`, emailHeading: 'أُضيف توقيع', emailBody: `${P_OPEN}وقّع <strong>${a}</strong> عقد رحلة <strong>${d}</strong>. متى وقّعت كل الأطراف يصبح العقد نافذاً بالكامل ويمكن للرحلة الانتقال إلى العربون.</p>`, ctaLabel: 'راجع العقد' }),
    executed: (d, dl) => ({ title: 'العقد نافذ بالكامل', message: `وقّعت كل الأطراف عقد رحلة ${d}. يمكن للرحلة الانتقال إلى العربون.`, emailSubject: `نافذ بالكامل \u2014 عقد ${dl}`, emailHeading: 'عقدك نافذ بالكامل', emailBody: `${P_OPEN}وقّعت كل الأطراف الآن عقد رحلة <strong>${d}</strong>. تتوفر نسخة للتنزيل في صفحة العقد، ويمكن للرحلة الانتقال إلى العربون.</p>`, ctaLabel: 'اعرض العقد النافذ' }),
    revisionProposed: (a, d, dl) => ({ title: 'اقتُرحت تعديلات على عقدك', message: `اقترح ${a} تعديلات على عقد رحلة ${d}. راجعها للقبول أو الرفض.`, emailSubject: `تعديلات مقترحة \u2014 عقد ${dl}`, emailHeading: 'اقتُرحت تعديلات', emailBody: `${P_OPEN}اقترح <strong>${a}</strong> تعديلات على عقد رحلة <strong>${d}</strong>. افتح العقد لمراجعتها وقبولها أو رفضها.</p>`, ctaLabel: 'راجع التعديلات المقترحة' }),
    revisionAccepted: (a, d, dl) => ({ title: 'قُبلت التعديلات المقترحة', message: `قبل ${a} التعديلات المقترحة على عقد رحلة ${d}. حُدّث النص \u2014 على كل طرف التوقيع مجدداً.`, emailSubject: `قُبلت التعديلات \u2014 عقد ${dl}`, emailHeading: 'قُبلت تعديلاتك المقترحة', emailBody: `${P_OPEN}قبل <strong>${a}</strong> التعديلات المقترحة على عقد رحلة <strong>${d}</strong>. حُدّث نص العقد، لذا على كل طرف توقيع النسخة المعدلة.</p>`, ctaLabel: 'راجع ووقّع' }),
    revisionRejected: (a, d, dl, n) => ({ title: 'رُفضت التعديلات المقترحة', message: `رفض ${a} التعديلات المقترحة على عقد رحلة ${d}.${n ? ` ملاحظة: \u201C${n}\u201D` : ''} يبقى نص العقد الحالي.`, emailSubject: `رُفضت التعديلات \u2014 عقد ${dl}`, emailHeading: 'رُفضت التعديلات المقترحة', emailBody: `${P_OPEN}رفض <strong>${a}</strong> التعديلات المقترحة على عقد رحلة <strong>${d}</strong>.${n ? ` مع هذه الملاحظة: &ldquo;${n}&rdquo;.` : ''} يبقى النص الحالي \u2014 يمكنك مراجعته أو اقتراح تعديلات أخرى.</p>`, ctaLabel: 'اعرض العقد' }),
  },
  ja: {
    yourTrip: 'あなたの旅', tripWord: '旅', yourAgent: 'あなたの旅行エージェント', aParty: '関係者',
    sent: (a, d) => ({ title: '契約書が署名待ちです', message: `${a} が ${d} の旅行契約書を用意しました。確認して署名し、前に進みましょう。`, emailSubject: `Goldsainte 旅行契約書 \u2014 ${d}`, emailHeading: '旅行契約書を確認して署名', emailBody: `${P_OPEN}${a} が <strong>${d}</strong> への旅のサービス契約書を用意しました。支払い条件、キャンセルポリシー、各当事者の責任を定めていますので、丁寧にご確認ください。</p>`, ctaLabel: '契約書を確認して署名' }),
    signed: (a, d) => ({ title: `${a} が契約書に署名しました`, message: `${a} が ${d} の契約書に署名しました。開いて確認し、あなたの署名を加えましょう。`, emailSubject: `${a} が署名 \u2014 次はあなたの番です`, emailHeading: '署名が追加されました', emailBody: `${P_OPEN}<strong>${a}</strong> が <strong>${d}</strong> の契約書に署名しました。全当事者の署名が揃うと契約は完全に締結され、旅はデポジットへ進めます。</p>`, ctaLabel: '契約書を確認' }),
    executed: (d, dl) => ({ title: '契約が完全に締結されました', message: `${d} の契約書に全当事者が署名しました。旅はデポジットへ進めます。`, emailSubject: `締結完了 \u2014 ${dl}の契約書`, emailHeading: '契約が完全に締結されました', emailBody: `${P_OPEN}<strong>${d}</strong> の契約書に全当事者が署名しました。契約ページからコピーをダウンロードでき、旅はデポジットへ進めます。</p>`, ctaLabel: '締結済み契約書を見る' }),
    revisionProposed: (a, d, dl) => ({ title: '契約への変更が提案されました', message: `${a} が ${d} の契約書への変更を提案しました。確認して承諾または却下してください。`, emailSubject: `変更提案 \u2014 ${dl}の契約書`, emailHeading: '変更が提案されました', emailBody: `${P_OPEN}<strong>${a}</strong> が <strong>${d}</strong> の契約書への変更を提案しました。契約書を開いて確認し、承諾または却下してください。</p>`, ctaLabel: '提案された変更を確認' }),
    revisionAccepted: (a, d, dl) => ({ title: '変更提案が承諾されました', message: `${a} が ${d} の契約書への変更提案を承諾しました。本文が更新されました \u2014 各当事者の再署名が必要です。`, emailSubject: `変更承諾 \u2014 ${dl}の契約書`, emailHeading: '変更提案が承諾されました', emailBody: `${P_OPEN}<strong>${a}</strong> が <strong>${d}</strong> の契約書への変更提案を承諾しました。契約本文が更新されたため、各当事者は改訂版に署名する必要があります。</p>`, ctaLabel: '確認して署名' }),
    revisionRejected: (a, d, dl, n) => ({ title: '変更提案が却下されました', message: `${a} が ${d} の契約書への変更提案を却下しました。${n ? `メモ：\u201C${n}\u201D ` : ''}現行の契約本文が維持されます。`, emailSubject: `変更却下 \u2014 ${dl}の契約書`, emailHeading: '変更提案は却下されました', emailBody: `${P_OPEN}<strong>${a}</strong> が <strong>${d}</strong> の契約書への変更提案を却下しました。${n ? `メモ：&ldquo;${n}&rdquo;。` : ''}現行の本文が維持されます \u2014 内容を確認するか、別の変更を提案できます。</p>`, ctaLabel: '契約書を見る' }),
  },
  ko: {
    yourTrip: '당신의 여행', tripWord: '여행', yourAgent: '당신의 여행 에이전트', aParty: '한 당사자',
    sent: (a, d) => ({ title: '서명을 기다리는 계약서', message: `${a}이(가) ${d} 여행 계약서를 준비했습니다. 검토하고 서명해 진행하세요.`, emailSubject: `Goldsainte 여행 계약서 \u2014 ${d}`, emailHeading: '여행 계약서를 검토하고 서명하세요', emailBody: `${P_OPEN}${a}이(가) <strong>${d}</strong> 여행의 서비스 계약서를 준비했습니다. 결제 조건, 취소 정책, 각 당사자의 책임을 담고 있으니 꼼꼼히 검토하세요.</p>`, ctaLabel: '계약서 검토 & 서명' }),
    signed: (a, d) => ({ title: `${a}이(가) 계약서에 서명했습니다`, message: `${a}이(가) ${d} 계약서에 서명했습니다. 열어서 검토하고 서명을 추가하세요.`, emailSubject: `${a} 서명 완료 \u2014 다음은 당신 차례입니다`, emailHeading: '서명이 추가되었습니다', emailBody: `${P_OPEN}<strong>${a}</strong>이(가) <strong>${d}</strong> 계약서에 서명했습니다. 모든 당사자가 서명하면 계약이 완전히 체결되고 여행은 계약금 단계로 넘어갑니다.</p>`, ctaLabel: '계약서 검토' }),
    executed: (d, dl) => ({ title: '계약이 완전히 체결되었습니다', message: `모든 당사자가 ${d} 계약서에 서명했습니다. 여행은 계약금 단계로 넘어갑니다.`, emailSubject: `체결 완료 \u2014 ${dl} 계약서`, emailHeading: '계약이 완전히 체결되었습니다', emailBody: `${P_OPEN}모든 당사자가 <strong>${d}</strong> 계약서에 서명했습니다. 계약 페이지에서 사본을 내려받을 수 있으며, 여행은 계약금 단계로 넘어갑니다.</p>`, ctaLabel: '체결된 계약서 보기' }),
    revisionProposed: (a, d, dl) => ({ title: '계약 변경이 제안되었습니다', message: `${a}이(가) ${d} 계약서 변경을 제안했습니다. 검토 후 수락하거나 거절하세요.`, emailSubject: `변경 제안 \u2014 ${dl} 계약서`, emailHeading: '변경이 제안되었습니다', emailBody: `${P_OPEN}<strong>${a}</strong>이(가) <strong>${d}</strong> 계약서 변경을 제안했습니다. 계약서를 열어 검토하고 수락 또는 거절하세요.</p>`, ctaLabel: '제안된 변경 검토' }),
    revisionAccepted: (a, d, dl) => ({ title: '변경 제안이 수락되었습니다', message: `${a}이(가) ${d} 계약서의 변경 제안을 수락했습니다. 본문이 업데이트되어 \u2014 모든 당사자가 다시 서명해야 합니다.`, emailSubject: `변경 수락 \u2014 ${dl} 계약서`, emailHeading: '변경 제안이 수락되었습니다', emailBody: `${P_OPEN}<strong>${a}</strong>이(가) <strong>${d}</strong> 계약서의 변경 제안을 수락했습니다. 계약 본문이 업데이트되었으므로 모든 당사자가 수정본에 서명해야 합니다.</p>`, ctaLabel: '검토하고 서명' }),
    revisionRejected: (a, d, dl, n) => ({ title: '변경 제안이 거절되었습니다', message: `${a}이(가) ${d} 계약서의 변경 제안을 거절했습니다.${n ? ` 메모: \u201C${n}\u201D` : ''} 현재 계약 본문이 유지됩니다.`, emailSubject: `변경 거절 \u2014 ${dl} 계약서`, emailHeading: '변경 제안이 거절되었습니다', emailBody: `${P_OPEN}<strong>${a}</strong>이(가) <strong>${d}</strong> 계약서의 변경 제안을 거절했습니다.${n ? ` 메모: &ldquo;${n}&rdquo;.` : ''} 현재 본문이 유지됩니다 \u2014 검토하거나 다른 변경을 제안할 수 있습니다.</p>`, ctaLabel: '계약서 보기' }),
  },
  zh: {
    yourTrip: '你的旅程', tripWord: '旅程', yourAgent: '你的旅行代理', aParty: '一方',
    sent: (a, d) => ({ title: '合同待你签署', message: `${a} 已为你准备了${d}的旅行合同。请审阅并签署以继续。`, emailSubject: `你的 Goldsainte 旅行合同 \u2014 ${d}`, emailHeading: '审阅并签署你的旅行合同', emailBody: `${P_OPEN}${a} 已为你即将前往 <strong>${d}</strong> 的旅程准备了服务协议。请仔细审阅 \u2014 其中涵盖付款条款、取消政策及各方责任。</p>`, ctaLabel: '审阅并签署合同' }),
    signed: (a, d) => ({ title: `${a} 已签署合同`, message: `${a} 已签署${d}的合同。打开查看并添加你的签名。`, emailSubject: `${a} 已签署 \u2014 接下来轮到你`, emailHeading: '新增了一个签名', emailBody: `${P_OPEN}<strong>${a}</strong> 已签署 <strong>${d}</strong> 的合同。所有各方签署后，合同即完全生效，旅程可进入订金阶段。</p>`, ctaLabel: '审阅合同' }),
    executed: (d, dl) => ({ title: '合同已完全生效', message: `各方均已签署${d}的合同。旅程可进入订金阶段。`, emailSubject: `完全生效 \u2014 你的${dl}合同`, emailHeading: '你的合同已完全生效', emailBody: `${P_OPEN}各方现已签署 <strong>${d}</strong> 的合同。合同页面提供副本下载，旅程可进入订金阶段。</p>`, ctaLabel: '查看已生效合同' }),
    revisionProposed: (a, d, dl) => ({ title: '合同收到修改提议', message: `${a} 对${d}的合同提出了修改。请审阅后接受或拒绝。`, emailSubject: `修改提议 \u2014 你的${dl}合同`, emailHeading: '收到修改提议', emailBody: `${P_OPEN}<strong>${a}</strong> 对 <strong>${d}</strong> 的合同提出了修改。打开合同审阅并选择接受或拒绝。</p>`, ctaLabel: '审阅修改提议' }),
    revisionAccepted: (a, d, dl) => ({ title: '修改提议已被接受', message: `${a} 接受了${d}合同的修改提议。文本已更新 \u2014 各方需重新签署。`, emailSubject: `修改已接受 \u2014 你的${dl}合同`, emailHeading: '你的修改提议已被接受', emailBody: `${P_OPEN}<strong>${a}</strong> 接受了 <strong>${d}</strong> 合同的修改提议。合同文本已更新，各方需签署修订版。</p>`, ctaLabel: '审阅并签署' }),
    revisionRejected: (a, d, dl, n) => ({ title: '修改提议被拒绝', message: `${a} 拒绝了${d}合同的修改提议。${n ? `备注：\u201C${n}\u201D ` : ''}当前合同文本维持不变。`, emailSubject: `修改被拒 \u2014 你的${dl}合同`, emailHeading: '修改提议被拒绝', emailBody: `${P_OPEN}<strong>${a}</strong> 拒绝了 <strong>${d}</strong> 合同的修改提议。${n ? `并附备注：&ldquo;${n}&rdquo;。` : ''}当前文本维持不变 \u2014 你可以审阅或提出不同的修改。</p>`, ctaLabel: '查看合同' }),
  },
};
import { resolveAllowedOrigin } from "../_shared/cors.ts";

function corsHeaders(req?: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

type PartyRole = "traveler" | "agent" | "creator";
type LifecycleEvent = "sent" | "signed" | "executed" | "revision_proposed" | "revision_accepted" | "revision_rejected";

interface Party {
  role: PartyRole;
  userId: string;
  name: string;
  email: string | null;
  signLink: string;
}

const APP_URL = Deno.env.get("APP_URL") || "https://goldsainte.ai";

// ---------------------------------------------------------------------------
// Branded email shell (best-effort; failures are logged, never thrown)
// ---------------------------------------------------------------------------
function emailShell(heading: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  // Matches the approved Goldsainte layout (_shared/email-templates/_layout.tsx):
  // cream background, wordmark, Playfair serif headline, dark-green uppercase
  // CTA, fallback link, help footer.
  const logoUrl =
    "https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:'Helvetica Neue',Arial,sans-serif;color:#0a2225;">
  <div style="width:100%;background:#f7f3ea;padding:48px 16px;">
    <div style="max-width:560px;margin:0 auto;background:#f7f3ea;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tbody><tr>
        <td align="center" style="padding:8px 0 28px;"><img src="${logoUrl}" alt="Goldsainte" style="height:22px;width:auto;max-width:240px;display:block;margin:0 auto;"/></td>
      </tr></tbody></table>
      <hr style="border:0;border-top:1px solid rgba(10,34,37,0.15);margin:0 0 28px;"/>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-weight:400;font-size:34px;line-height:1.15;color:#0a2225;margin:0 0 14px;text-align:center;letter-spacing:-0.01em;">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#0a2225;opacity:0.85;margin:0 0 32px;text-align:center;">${bodyHtml}</div>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#0c4d47;color:#f7f3ea !important;text-decoration:none;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;padding:18px 40px;border-radius:2px;font-weight:500;">${ctaLabel}</a>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#0a2225;opacity:0.55;text-align:center;margin:0 0 48px;">Or paste this link into your browser:<br/><a href="${ctaUrl}" style="color:#0c4d47;word-break:break-all;text-decoration:underline;">${ctaUrl}</a></p>
      <p style="font-size:13px;line-height:1.7;color:#0a2225;opacity:0.8;text-align:center;margin:36px 0 0;">If you have any questions, concerns, or require assistance, please contact <a href="mailto:support@goldsainte.com" style="color:#0c4d47;">Goldsainte Support</a>.</p>
      <p style="font-size:10px;letter-spacing:0.1em;color:#0a2225;opacity:0.45;text-align:center;text-transform:uppercase;padding:8px 0 0;">This is an automated message from Goldsainte</p>
    </div>
  </div>
</body></html>`;
}

async function sendBrandedEmail(
  to: string,
  subject: string,
  heading: string,
  bodyHtml: string,
  ctaLabel: string,
  ctaUrl: string,
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email skipped for:", to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte Contracts <hello@goldsainte.com>",
        to,
        subject,
        html: emailShell(heading, bodyHtml, ctaLabel, ctaUrl),
      }),
    });
    if (!res.ok) {
      console.error("Email soft-failed:", res.status, await res.text());
      return false;
    }
    console.log("Email delivered to:", to);
    return true;
  } catch (e) {
    console.error("Email soft-failed:", e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }

  try {
    const body = await req.json();
    const contractId: string | undefined = body.contractId;
    const event: LifecycleEvent = body.event ?? "sent";
    const actorRole: PartyRole | undefined = body.actorRole;
    // Optional free-text note (e.g. the rejection message) — escaped before use in HTML.
    const rawNote: string = typeof body.note === "string" ? body.note : "";
    const note = rawNote.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
    const recipientEmailOverride: string | undefined = body.recipientEmail;
    const recipientType: PartyRole = body.recipientType ?? "traveler";

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: contractId" }),
        { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // Load the contract with its trip
    const { data: contract, error: contractError } = await supabase
      .from("trip_contracts")
      .select("*, trips(id, destination, start_date, end_date)")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      console.error("Contract not found:", contractError);
      return new Response(
        JSON.stringify({ error: `Contract not found: ${contractError?.message ?? contractId}` }),
        { status: 404, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Resolve all parties on the contract
    const partyIds = [contract.agent_id, contract.traveler_id, contract.creator_id]
      .filter(Boolean) as string[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", partyIds);
    const byId = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const travelerInfoName = [contract.traveler_info?.firstName, contract.traveler_info?.lastName]
      .filter(Boolean).join(" ");

    function makeParty(role: PartyRole, userId: string | null): Party | null {
      if (!userId) return null;
      const p: any = byId.get(userId);
      const fallback = role === "traveler" && travelerInfoName
        ? travelerInfoName
        : role.charAt(0).toUpperCase() + role.slice(1);
      return {
        role,
        userId,
        name: p?.full_name || fallback,
        email: p?.email ?? null,
        signLink: `${APP_URL}/contract/${contractId}/sign?type=${role}`,
      };
    }

    const parties: Party[] = [
      makeParty("agent", contract.agent_id),
      makeParty("traveler", contract.traveler_id),
      makeParty("creator", contract.creator_id),
    ].filter(Boolean) as Party[];

    const destinationRaw: string | null =
      contract.trips?.destination || contract.trip_info?.destination || null;
    const agentNameRaw = parties.find((p) => p.role === "agent")?.name ?? null;
    const actor = actorRole ? parties.find((p) => p.role === actorRole) : undefined;
    const actorNameRaw = actor?.name ?? (actorRole ? actorRole : null);
    // Decide recipients + a per-language copy builder per event. Copy is
    // resolved per recipient so each party reads in their own language.
    // Subject-safe destination: the tripWord fallback avoids "your your trip
    // contract" when the destination falls back to the phrase "your trip".
    let recipients: Party[];
    let build: (s: S) => EventCopy;

    switch (event) {
      case "sent": {
        recipients = parties.filter((p) => p.role === recipientType);
        build = (s) => s.sent(agentNameRaw ?? s.yourAgent, destinationRaw ?? s.yourTrip);
        break;
      }
      case "signed": {
        recipients = parties.filter((p) => p.role !== actorRole);
        build = (s) => s.signed(actorNameRaw ?? s.aParty, destinationRaw ?? s.yourTrip);
        break;
      }
      case "executed": {
        recipients = parties; // everyone, including the final signer
        build = (s) => s.executed(destinationRaw ?? s.yourTrip, destinationRaw ?? s.tripWord);
        break;
      }
      case "revision_proposed": {
        recipients = parties.filter((p) => p.role !== actorRole);
        build = (s) => s.revisionProposed(actorNameRaw ?? s.aParty, destinationRaw ?? s.yourTrip, destinationRaw ?? s.tripWord);
        break;
      }
      case "revision_accepted": {
        recipients = parties.filter((p) => p.role !== actorRole);
        build = (s) => s.revisionAccepted(actorNameRaw ?? s.aParty, destinationRaw ?? s.yourTrip, destinationRaw ?? s.tripWord);
        break;
      }
      case "revision_rejected": {
        recipients = parties.filter((p) => p.role !== actorRole);
        build = (s) => s.revisionRejected(actorNameRaw ?? s.aParty, destinationRaw ?? s.yourTrip, destinationRaw ?? s.tripWord, note ?? null);
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unknown event: ${event}` }),
          { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
        );
    }

    if (!recipients.length) {
      return new Response(
        JSON.stringify({ error: `No recipients resolved for event "${event}" on this contract` }),
        { status: 422, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    // Bell notifications — the reliable channel
    let bellDelivered = 0;
    for (const r of recipients) {
      const rLang = await resolveRecipientLanguage(supabase, null, r.email ?? null);
      const c = build(pickLang(STRINGS, rLang));
      const { error: bellError } = await supabase.from("notifications").insert({
        user_id: r.userId,
        type: "system_announcement",
        title: c.title,
        message: c.message,
        action_url: r.signLink,
        entity_type: "trip_contract",
        entity_id: contractId,
      });
      if (bellError) console.error(`Bell failed for ${r.role}:`, bellError.message);
      else bellDelivered++;
    }

    // Emails — best-effort
    let emailDelivered = false;
    for (const r of recipients) {
      const to = (event === "sent" && r.role === recipientType && recipientEmailOverride)
        ? recipientEmailOverride
        : r.email;
      if (!to) continue;
      const rLang = await resolveRecipientLanguage(supabase, null, to);
      const c = build(pickLang(STRINGS, rLang));
      const ok = await sendBrandedEmail(to, c.emailSubject, c.emailHeading, c.emailBody, c.ctaLabel, r.signLink);
      emailDelivered = emailDelivered || ok;
    }

    return new Response(
      JSON.stringify({
        success: true,
        event,
        bellDelivered,
        emailDelivered,
        signingLink: recipients[0].signLink,
        message: `Notified ${bellDelivered}/${recipients.length} by bell; email ${emailDelivered ? "delivered" : "soft-failed or skipped"}.`,
      }),
      { headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-contract-notification error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to send contract notification" }),
      { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } },
    );
  }
});
