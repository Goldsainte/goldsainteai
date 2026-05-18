/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as tripRequestReceived } from './trip-request-received.tsx'
import { template as newProposalReceived } from './new-proposal-received.tsx'
import { template as bookingConfirmationTraveler } from './booking-confirmation-traveler.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'
import { template as newMessageTraveler } from './new-message-traveler.tsx'
import { template as tripReminder } from './trip-reminder.tsx'
import { template as reviewRequest } from './review-request.tsx'
import { template as welcomeProfessional } from './welcome-professional.tsx'
import { template as newTripMatch } from './new-trip-match.tsx'
import { template as newInquiryProfessional } from './new-inquiry-professional.tsx'
import { template as proposalAccepted } from './proposal-accepted.tsx'
import { template as proposalDeclined } from './proposal-declined.tsx'
import { template as bookingConfirmationProfessional } from './booking-confirmation-professional.tsx'
import { template as payoutSent } from './payout-sent.tsx'
import { template as newMessageProfessional } from './new-message-professional.tsx'
import { template as tripPublished } from './trip-published.tsx'
import { template as adminNewUserPending } from './admin-new-user-pending.tsx'
import { template as adminNewTripPending } from './admin-new-trip-pending.tsx'
import { template as identityVerificationUpdate } from './identity-verification-update.tsx'
import { template as disputeOpened } from './dispute-opened.tsx'
import { template as adminQueueAlert } from './admin-queue-alert.tsx'
import { template as applicationReceivedProfessional } from './application-received-professional.tsx'
import { template as applicationApprovedProfessional } from './application-approved-professional.tsx'
import { template as applicationDeclinedProfessional } from './application-declined-professional.tsx'
import { template as applicationInfoRequestedProfessional } from './application-info-requested-professional.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'trip-request-received': tripRequestReceived,
  'new-proposal-received': newProposalReceived,
  'booking-confirmation-traveler': bookingConfirmationTraveler,
  'payment-receipt': paymentReceipt,
  'new-message-traveler': newMessageTraveler,
  'trip-reminder': tripReminder,
  'review-request': reviewRequest,
  'welcome-professional': welcomeProfessional,
  'new-trip-match': newTripMatch,
  'new-inquiry-professional': newInquiryProfessional,
  'proposal-accepted': proposalAccepted,
  'proposal-declined': proposalDeclined,
  'booking-confirmation-professional': bookingConfirmationProfessional,
  'payout-sent': payoutSent,
  'new-message-professional': newMessageProfessional,
  'trip-published': tripPublished,
  'admin-new-user-pending': adminNewUserPending,
  'admin-new-trip-pending': adminNewTripPending,
  'identity-verification-update': identityVerificationUpdate,
  'dispute-opened': disputeOpened,
  'admin-queue-alert': adminQueueAlert,
  'application-received-professional': applicationReceivedProfessional,
  'application-approved-professional': applicationApprovedProfessional,
  'application-declined-professional': applicationDeclinedProfessional,
  'application-info-requested-professional': applicationInfoRequestedProfessional,
}
