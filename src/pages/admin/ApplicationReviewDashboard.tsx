import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Award,
  Shield,
  Users,
  Building,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Loader2,
  CheckCheck,
  ArrowLeft,
  X,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

// ============================================================================
// TYPES
// ============================================================================

interface AgentApplication {
  id: string;
  status: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  agency_name: string;
  business_type: string;
  business_address: string;
  business_city: string | null;
  business_state: string | null;
  business_country: string | null;
  website?: string | null;
  years_experience: number;
  service_types: string[] | null;
  specialties: string[] | null;
  languages: string[] | null;
  license_number: string | null;
  license_state: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  commission_rate: number | null;
  documents: any;
  stripe_verification_session_id: string | null;
  stripe_verification_status: string | null;
  stripe_verified_at: string | null;
  stripe_verification_report?: any;
  submitted_at: string | null;
  created_at: string | null;
  reviewed_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
}

interface BrandApplication {
  id: string;
  status: string | null;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  brand_name: string;
  brand_type: string | null;
  bio: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_country: string | null;
  website?: string | null;
  regions: string[] | null;
  cities: string[] | null;
  style_tags: string[] | null;
  price_range: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[] | null;
  amenities: string[] | null;
  sustainability_certifications: string[] | null;
  quality_certifications: string[] | null;
  documents: any;
  stripe_verification_session_id: string | null;
  stripe_verification_status: string | null;
  stripe_verified_at: string | null;
  submitted_at: string | null;
  created_at: string | null;
  reviewed_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
}

type Application = AgentApplication | BrandApplication;

interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  application: Application | null;
  applicationType: 'agent' | 'brand';
  onApprove: (notes: string, sendEmail: boolean) => Promise<void>;
}

interface RejectionDialogProps {
  open: boolean;
  onClose: () => void;
  application: Application | null;
  applicationType: 'agent' | 'brand';
  onReject: (reason: string, allowResubmission: boolean) => Promise<void>;
}

// ============================================================================
// LUXURY STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string; icon: any }> = {
    pending_verification: {
      label: 'Pending Verification',
      bgColor: 'bg-[#FDF9F0]',
      textColor: 'text-[#6B7280]',
      borderColor: 'border-[#E5DFC6]',
      icon: Clock,
    },
    verified: {
      label: 'Verified · Awaiting Review',
      bgColor: 'bg-[#d4e7dd]',
      textColor: 'text-[#0c4d47]',
      borderColor: 'border-[#0c4d47]/20',
      icon: CheckCircle,
    },
    pending_review: {
      label: 'Under Review',
      bgColor: 'bg-[#f5e9c5]',
      textColor: 'text-[#6d5223]',
      borderColor: 'border-[#C7A962]/30',
      icon: Eye,
    },
    approved: {
      label: 'Approved',
      bgColor: 'bg-[#cfe8d7]',
      textColor: 'text-[#0c4d47]',
      borderColor: 'border-[#0c4d47]/20',
      icon: CheckCheck,
    },
    rejected: {
      label: 'Rejected',
      bgColor: 'bg-[#f0d1d1]',
      textColor: 'text-[#5b2c2c]',
      borderColor: 'border-[#5b2c2c]/20',
      icon: XCircle,
    },
    failed: {
      label: 'Verification Failed',
      bgColor: 'bg-[#fef3cd]',
      textColor: 'text-[#856404]',
      borderColor: 'border-[#856404]/20',
      icon: AlertTriangle,
    },
  };

  const config = configs[status] || configs.pending_verification;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// ============================================================================
// LUXURY APPROVAL DIALOG
// ============================================================================

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  open,
  onClose,
  application,
  applicationType,
  onApprove,
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      await onApprove(approvalNotes, sendWelcomeEmail);
      toast.success('Application approved successfully');
      onClose();
      setApprovalNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!application) return null;

  const name =
    applicationType === 'agent'
      ? `${(application as AgentApplication).first_name} ${(application as AgentApplication).last_name}`
      : (application as BrandApplication).brand_name;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-[#E5DFC6] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-secondary text-xl text-[#0a2225]">
            <CheckCircle className="h-5 w-5 text-[#0c4d47]" />
            Approve Application
          </DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            You are about to approve {name}'s {applicationType} application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#d4e7dd] border border-[#0c4d47]/20 rounded-xl p-4">
            <p className="text-sm text-[#0c4d47]">
              <strong>What happens next:</strong>
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-[#0c4d47]/80">
              <li>A Supabase Auth account will be created</li>
              <li>Profile and {applicationType} records will be created</li>
              <li>Temporary password will be generated</li>
              <li>Welcome email will be sent with login credentials (if enabled)</li>
              <li>Applicant can immediately log in and start using the platform</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="approvalNotes" className="text-[#0a2225] font-medium">
              Approval Notes (Optional)
            </Label>
            <Textarea
              id="approvalNotes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any internal notes about this approval..."
              rows={4}
              className="mt-2 border-[#E5DFC6] rounded-xl focus:ring-[#C7A962] focus:border-[#C7A962]"
            />
            <p className="text-xs text-[#6B7280] mt-1">
              These notes are for internal records only and won't be shared with the applicant.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendWelcomeEmail"
              checked={sendWelcomeEmail}
              onChange={(e) => setSendWelcomeEmail(e.target.checked)}
              className="h-4 w-4 rounded border-[#E5DFC6] text-[#0c4d47] focus:ring-[#C7A962]"
            />
            <Label htmlFor="sendWelcomeEmail" className="cursor-pointer text-[#0a2225]">
              Send welcome email with login credentials
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F5EFE1] rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="bg-[#0c4d47] hover:bg-[#0a3d3a] text-[#E5DFC6] rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// LUXURY REJECTION DIALOG
// ============================================================================

const RejectionDialog: React.FC<RejectionDialogProps> = ({
  open,
  onClose,
  application,
  applicationType,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [allowResubmission, setAllowResubmission] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const rejectionTemplates = {
    agent: [
      {
        value: 'insufficient_experience',
        label: 'Insufficient Experience',
        text: 'After careful review, we found that your professional experience does not currently meet our requirements for luxury travel planning. We recommend gaining additional experience in high-end travel coordination and reapplying in the future.',
      },
      {
        value: 'incomplete_documentation',
        label: 'Incomplete Documentation',
        text: 'Your application is missing required documentation. Please ensure you have uploaded: valid travel agent license, professional liability insurance certificate, and business registration documents. You may resubmit once these documents are provided.',
      },
      {
        value: 'license_verification',
        label: 'License Verification Issue',
        text: 'We were unable to verify your travel agent license. Please ensure your license is current and in good standing with the appropriate regulatory body, then resubmit your application.',
      },
      {
        value: 'insurance_requirements',
        label: 'Insurance Requirements Not Met',
        text: 'Your professional liability insurance does not meet our minimum coverage requirements of $1,000,000. Please update your insurance policy and resubmit.',
      },
    ],
    brand: [
      {
        value: 'not_luxury_tier',
        label: 'Not Luxury-Tier Brand',
        text: 'Thank you for your interest in Goldsainte. After review, we have determined that your brand does not currently align with our luxury positioning and target demographic. We wish you the best in your endeavors.',
      },
      {
        value: 'incomplete_profile',
        label: 'Incomplete Brand Profile',
        text: 'Your brand profile is missing key information and imagery required for listing on our platform. Please provide: high-quality gallery images (minimum 5), detailed amenities list, sustainability certifications (if applicable), and a comprehensive brand story.',
      },
      {
        value: 'quality_standards',
        label: 'Quality Standards Not Met',
        text: 'After review of your submitted materials, we found that your brand does not currently meet our quality and service standards. We recommend enhancing your offerings and imagery before reapplying.',
      },
      {
        value: 'location_coverage',
        label: 'Location Not in Coverage Area',
        text: 'At this time, we are not accepting brands in your geographic region as we focus on building our network in select destinations. We will notify you when we expand to your area.',
      },
    ],
  };

  const templates = rejectionTemplates[applicationType];

  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    const template = templates.find((t) => t.value === value);
    if (template) {
      setRejectionReason(template.text);
    }
  };

  const handleReject = async () => {
    if (!application) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(rejectionReason, allowResubmission);
      toast.success('Application rejected');
      onClose();
      setRejectionReason('');
      setSelectedTemplate('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!application) return null;

  const name =
    applicationType === 'agent'
      ? `${(application as AgentApplication).first_name} ${(application as AgentApplication).last_name}`
      : (application as BrandApplication).brand_name;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-[#E5DFC6] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-secondary text-xl text-[#0a2225]">
            <XCircle className="h-5 w-5 text-[#5b2c2c]" />
            Reject Application
          </DialogTitle>
          <DialogDescription className="text-[#6B7280]">
            You are about to reject {name}'s {applicationType} application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#f0d1d1] border border-[#5b2c2c]/20 rounded-xl p-4">
            <p className="text-sm text-[#5b2c2c]">
              This action will notify the applicant via email with the rejection reason provided below.
            </p>
          </div>

          <div>
            <Label htmlFor="template" className="text-[#0a2225] font-medium">
              Use Template (Optional)
            </Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="mt-2 border-[#E5DFC6] rounded-xl focus:ring-[#C7A962]">
                <SelectValue placeholder="Select a rejection reason template" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                {templates.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rejectionReason" className="text-[#0a2225] font-medium">
              Rejection Reason <span className="text-[#5b2c2c]">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a clear reason for rejection. This will be sent to the applicant."
              rows={6}
              className="mt-2 border-[#E5DFC6] rounded-xl focus:ring-[#C7A962] focus:border-[#C7A962]"
              required
            />
            <p className="text-xs text-[#6B7280] mt-1">
              Be professional and constructive. This reason will be included in the rejection email.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowResubmission"
              checked={allowResubmission}
              onChange={(e) => setAllowResubmission(e.target.checked)}
              className="h-4 w-4 rounded border-[#E5DFC6] text-[#0c4d47] focus:ring-[#C7A962]"
            />
            <Label htmlFor="allowResubmission" className="cursor-pointer text-[#0a2225]">
              Allow applicant to resubmit after addressing issues
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F5EFE1] rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting || !rejectionReason.trim()}
            className="bg-[#5b2c2c] hover:bg-[#4a2424] text-white rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// LUXURY CARD COMPONENT
// ============================================================================

const LuxuryCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#E5DFC6] shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const LuxuryCardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 pb-3 sm:p-6 sm:pb-4 ${className}`}>{children}</div>
);

const LuxuryCardTitle: React.FC<{ children: React.ReactNode; icon?: any; className?: string }> = ({ children, icon: Icon, className = '' }) => (
  <h3 className={`font-secondary text-lg text-[#0a2225] flex items-center gap-2 ${className}`}>
    {Icon && <Icon className="h-5 w-5 text-[#C7A962]" />}
    {children}
  </h3>
);

const LuxuryCardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 pt-0 sm:p-6 sm:pt-0 ${className}`}>{children}</div>
);

// ============================================================================
// LUXURY BADGE FOR TAGS
// ============================================================================

const LuxuryBadge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'outline' }> = ({ children, variant = 'default' }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
      variant === 'outline'
        ? 'border border-[#E5DFC6] bg-white text-[#0a2225]'
        : 'bg-[#F5EFE1] text-[#0a2225] border border-[#E5DFC6]'
    }`}
  >
    {children}
  </span>
);

// ============================================================================
// APPLICATION DETAIL VIEW - AGENT
// ============================================================================

const AgentApplicationDetail: React.FC<{
  application: AgentApplication;
  onApprove: () => void;
  onReject: () => void;
  onSkipVerification?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}> = ({ application, onApprove, onReject, onSkipVerification, onClose, showCloseButton }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between pr-8">
        <div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mb-2 -ml-2 text-[#6B7280] hover:text-[#0a2225]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Button>
          )}
          <h2 className="font-secondary text-2xl text-[#0a2225]">
            {application.first_name} {application.last_name}
          </h2>
          <p className="text-[#6B7280] mt-1">{application.agency_name}</p>
          <div className="mt-3">
            <StatusBadge status={application.status} />
          </div>
        </div>
      </div>

      {/* Action Buttons - Show based on status */}
      <div className="flex flex-wrap gap-2">
        {application.status === 'verified' && (
          <Alert className="w-full bg-[#cfe8d7] border-[#0c4d47]/20 rounded-xl">
            <CheckCheck className="h-4 w-4 text-[#0c4d47]" />
            <AlertDescription className="text-[#0c4d47]">
              Identity verified — agent account is live. No admin action needed.
              {!application.user_id && (
                <span className="block mt-2 text-[#5b2c2c]">
                  ⚠ Account record missing (webhook may have failed). Click below to re-run provisioning.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        {application.status === 'verified' && !application.user_id && (
          <Button
            onClick={onApprove}
            className="bg-[#0c4d47] hover:bg-[#0a3d3a] text-[#E5DFC6] rounded-xl"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Re-run Account Provisioning
          </Button>
        )}
        {application.status === 'pending_verification' && (
          <>
            <Alert className="w-full bg-[#fef3cd] border-[#856404]/20 rounded-xl overflow-hidden">
              <Clock className="h-4 w-4 text-[#856404]" />
              <AlertDescription className="text-[#856404] break-words">
                Waiting for applicant to complete identity verification via Stripe Identity.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={onSkipVerification}
              className="border-[#856404]/30 text-[#856404] hover:bg-[#fef3cd] rounded-xl"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Skip Verification (Admin Override)
            </Button>
          </>
        )}
        {application.status === 'approved' && (
          <Alert className="w-full bg-[#cfe8d7] border-[#0c4d47]/20 rounded-xl">
            <CheckCheck className="h-4 w-4 text-[#0c4d47]" />
            <AlertDescription className="text-[#0c4d47]">
              This application has been approved. The applicant has been notified and can now access the platform.
            </AlertDescription>
          </Alert>
        )}
        {application.status === 'rejected' && (
          <Alert className="w-full bg-[#f0d1d1] border-[#5b2c2c]/20 rounded-xl">
            <XCircle className="h-4 w-4 text-[#5b2c2c]" />
            <AlertDescription className="text-[#5b2c2c]">
              This application has been rejected.
            </AlertDescription>
          </Alert>
        )}
        {application.status === 'failed' && (
          <>
            <Alert className="w-full bg-[#f0d1d1] border-[#5b2c2c]/20 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-[#5b2c2c]" />
              <AlertDescription className="text-[#5b2c2c]">
                Identity verification failed. The applicant may need to retry.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={onSkipVerification}
              className="border-[#856404]/30 text-[#856404] hover:bg-[#fef3cd] rounded-xl"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Override & Mark Verified
            </Button>
          </>
        )}
      </div>

      <div className="border-t border-[#E5DFC6]" />

      {/* Contact Information */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Mail}>Contact Information</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-[#C7A962]" />
            <a href={`mailto:${application.email}`} className="text-sm text-[#0c4d47] hover:underline">
              {application.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-[#C7A962]" />
            <span className="text-sm text-[#0a2225]">{application.phone}</span>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-[#C7A962] mt-0.5" />
            <span className="text-sm text-[#0a2225]">
              {application.business_address}
              {application.business_city && `, ${application.business_city}`}
              {application.business_state && `, ${application.business_state}`}
              <br />
              {application.business_country}
            </span>
          </div>
          {application.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-[#C7A962]" />
              <a
                href={application.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0c4d47] hover:underline flex items-center gap-1"
              >
                {application.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Business Information */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Building}>Business Information</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Business Type</p>
              <p className="mt-1 text-[#0a2225] capitalize">{application.business_type?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Years of Experience</p>
              <p className="mt-1 text-[#0a2225]">{application.years_experience} years</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Commission Rate</p>
              <p className="mt-1 text-[#0a2225]">{application.commission_rate}%</p>
            </div>
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Services & Specialties */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Award}>Services & Specializations</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-4">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Service Types</p>
            <div className="flex flex-wrap gap-2">
              {(application.service_types || []).map((service) => (
                <LuxuryBadge key={service}>{service}</LuxuryBadge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {(application.specialties || []).map((specialty) => (
                <LuxuryBadge key={specialty} variant="outline">{specialty}</LuxuryBadge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Languages</p>
            <div className="flex flex-wrap gap-2">
              {(application.languages || []).map((language) => (
                <LuxuryBadge key={language}>{language}</LuxuryBadge>
              ))}
            </div>
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Licensing & Insurance */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Shield}>Licensing & Insurance</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">License Number</p>
              <p className="mt-1 text-[#0a2225]">{application.license_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">License State</p>
              <p className="mt-1 text-[#0a2225]">{application.license_state || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Insurance Provider</p>
              <p className="mt-1 text-[#0a2225]">{application.insurance_provider || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Policy Number</p>
              <p className="mt-1 text-[#0a2225]">{application.insurance_policy_number || 'N/A'}</p>
            </div>
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Documents */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={FileText}>Uploaded Documents</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-[#E5DFC6] rounded-xl hover:bg-[#F5EFE1] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[#C7A962]" />
                    <div>
                      <p className="font-medium text-sm text-[#0a2225]">{doc.type}</p>
                      <p className="text-xs text-[#6B7280]">{doc.fileName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                    className="text-[#0c4d47] hover:bg-[#d4e7dd]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">No documents uploaded</p>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Stripe Verification */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Shield}>Identity Verification</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Status</p>
              <div className="mt-2">
                <StatusBadge status={application.stripe_verification_status || 'pending_verification'} />
              </div>
            </div>
            {application.stripe_verified_at && (
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Verified At</p>
                <p className="mt-1 text-sm text-[#0a2225]">
                  {format(new Date(application.stripe_verified_at), 'PPp')}
                </p>
              </div>
            )}
          </div>

          {application.stripe_verification_report && (
            <div className="bg-[#F5EFE1] p-3 rounded-xl mt-4">
              <p className="text-xs font-mono text-[#6B7280]">
                Session ID: {application.stripe_verification_session_id}
              </p>
            </div>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Timeline */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Calendar}>Timeline</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#6B7280] w-24">Submitted:</span>
            <span className="text-[#0a2225]">{format(new Date(application.submitted_at), 'PPp')}</span>
          </div>
          {application.stripe_verified_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280] w-24">Verified:</span>
              <span className="text-[#0a2225]">{format(new Date(application.stripe_verified_at), 'PPp')}</span>
            </div>
          )}
          {application.approved_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280] w-24">Approved:</span>
              <span className="text-[#0c4d47]">{format(new Date(application.approved_at), 'PPp')}</span>
            </div>
          )}
          {application.rejected_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280] w-24">Rejected:</span>
              <span className="text-[#5b2c2c]">{format(new Date(application.rejected_at), 'PPp')}</span>
            </div>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Rejection Reason (if applicable) */}
      {application.status === 'rejected' && application.rejection_reason && (
        <div className="bg-[#f0d1d1] border border-[#5b2c2c]/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#5b2c2c] mt-0.5" />
            <div>
              <p className="font-medium text-[#5b2c2c]">Rejection Reason</p>
              <p className="mt-2 text-sm text-[#5b2c2c]/80">{application.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// APPLICATION DETAIL VIEW - BRAND
// ============================================================================

const BrandApplicationDetail: React.FC<{
  application: BrandApplication;
  onApprove: () => void;
  onReject: () => void;
  onSkipVerification?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}> = ({ application, onApprove, onReject, onSkipVerification, onClose, showCloseButton }) => {
  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between pr-8">
        <div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="mb-2 -ml-2 text-[#6B7280] hover:text-[#0a2225]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Button>
          )}
          <h2 className="font-secondary text-2xl text-[#0a2225]">{application.brand_name}</h2>
          <p className="text-[#6B7280] mt-1 capitalize">{application.brand_type}</p>
          <div className="mt-3">
            <StatusBadge status={application.status} />
          </div>
        </div>
      </div>

      {/* Action Buttons - Show based on status */}
      <div className="flex flex-wrap gap-2">
        {application.status === 'verified' && (
          <>
            <Button
              variant="outline"
              onClick={onReject}
              className="border-[#E5DFC6] text-[#5b2c2c] hover:bg-[#f0d1d1] rounded-xl"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={onApprove}
              className="bg-[#0c4d47] hover:bg-[#0a3d3a] text-[#E5DFC6] rounded-xl"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </>
        )}
        {application.status === 'pending_verification' && (
          <>
            <Alert className="w-full bg-[#fef3cd] border-[#856404]/20 rounded-xl overflow-hidden">
              <Clock className="h-4 w-4 text-[#856404]" />
              <AlertDescription className="text-[#856404] break-words">
                Waiting for applicant to complete identity verification via Stripe Identity.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={onSkipVerification}
              className="border-[#856404]/30 text-[#856404] hover:bg-[#fef3cd] rounded-xl"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Skip Verification (Admin Override)
            </Button>
          </>
        )}
        {application.status === 'approved' && (
          <Alert className="w-full bg-[#cfe8d7] border-[#0c4d47]/20 rounded-xl">
            <CheckCheck className="h-4 w-4 text-[#0c4d47]" />
            <AlertDescription className="text-[#0c4d47]">
              This application has been approved. The applicant has been notified and can now access the platform.
            </AlertDescription>
          </Alert>
        )}
        {application.status === 'rejected' && (
          <Alert className="w-full bg-[#f0d1d1] border-[#5b2c2c]/20 rounded-xl">
            <XCircle className="h-4 w-4 text-[#5b2c2c]" />
            <AlertDescription className="text-[#5b2c2c]">
              This application has been rejected.
            </AlertDescription>
          </Alert>
        )}
        {application.status === 'failed' && (
          <>
            <Alert className="w-full bg-[#f0d1d1] border-[#5b2c2c]/20 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-[#5b2c2c]" />
              <AlertDescription className="text-[#5b2c2c]">
                Identity verification failed. The applicant may need to retry.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={onSkipVerification}
              className="border-[#856404]/30 text-[#856404] hover:bg-[#fef3cd] rounded-xl"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Override & Mark Verified
            </Button>
          </>
        )}
      </div>

      <div className="border-t border-[#E5DFC6]" />

      {/* Cover Image */}
      {application.cover_image_url && (
        <div className="rounded-2xl overflow-hidden border border-[#E5DFC6]">
          <img
            src={application.cover_image_url}
            alt={application.brand_name}
            className="w-full h-48 sm:h-64 object-cover"
          loading="lazy"/>
        </div>
      )}

      {/* Contact Information */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Users}>Primary Contact</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-3">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Name</p>
            <p className="mt-1 text-[#0a2225]">{application.primary_contact_name}</p>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="h-4 w-4 text-[#C7A962] shrink-0" />
            <a
              href={`mailto:${application.primary_contact_email}`}
              className="text-sm text-[#0c4d47] hover:underline break-all min-w-0"
            >
              {application.primary_contact_email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-[#C7A962]" />
            <span className="text-sm text-[#0a2225]">{application.primary_contact_phone}</span>
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Brand Description */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={FileText}>About</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          <p className="text-sm leading-relaxed text-[#0a2225]">{application.bio}</p>
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Location & Style */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={MapPin}>Location & Style</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-4">
          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Regions</p>
            <div className="flex flex-wrap gap-2">
              {(application.regions || []).map((region) => (
                <LuxuryBadge key={region}>{region}</LuxuryBadge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Cities</p>
            <div className="flex flex-wrap gap-2">
              {(application.cities || []).map((city) => (
                <LuxuryBadge key={city} variant="outline">{city}</LuxuryBadge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Style Tags</p>
            <div className="flex flex-wrap gap-2">
              {(application.style_tags || []).map((tag) => (
                <LuxuryBadge key={tag}>{tag}</LuxuryBadge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Price Range</p>
            <p className="mt-1 capitalize text-[#0a2225]">{application.price_range?.replace('_', ' ') || 'N/A'}</p>
          </div>
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Gallery */}
      {application.gallery_urls && application.gallery_urls.length > 0 && (
        <LuxuryCard>
          <LuxuryCardHeader>
            <LuxuryCardTitle>Gallery</LuxuryCardTitle>
          </LuxuryCardHeader>
          <LuxuryCardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {application.gallery_urls.map((url, index) => (
                <img key={index}
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-40 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-[#E5DFC6]"
                  onClick={() => window.open(url, '_blank')} loading="lazy" />
              ))}
            </div>
          </LuxuryCardContent>
        </LuxuryCard>
      )}

      {/* Amenities */}
      {application.amenities && (application.amenities || []).length > 0 && (
        <LuxuryCard>
          <LuxuryCardHeader>
            <LuxuryCardTitle>Amenities</LuxuryCardTitle>
          </LuxuryCardHeader>
          <LuxuryCardContent>
            <div className="flex flex-wrap gap-2">
              {(application.amenities || []).map((amenity) => (
                <LuxuryBadge key={amenity} variant="outline">{amenity}</LuxuryBadge>
              ))}
            </div>
          </LuxuryCardContent>
        </LuxuryCard>
      )}

      {/* Certifications */}
      {((application.sustainability_certifications || []).length > 0 ||
        (application.quality_certifications || []).length > 0) && (
        <LuxuryCard>
          <LuxuryCardHeader>
            <LuxuryCardTitle icon={Award}>Certifications</LuxuryCardTitle>
          </LuxuryCardHeader>
          <LuxuryCardContent className="space-y-4">
            {(application.sustainability_certifications || []).length > 0 && (
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Sustainability</p>
                <div className="flex flex-wrap gap-2">
                  {(application.sustainability_certifications || []).map((cert) => (
                    <LuxuryBadge key={cert}>{cert}</LuxuryBadge>
                  ))}
                </div>
              </div>
            )}

            {(application.quality_certifications || []).length > 0 && (
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide mb-2">Quality</p>
                <div className="flex flex-wrap gap-2">
                  {(application.quality_certifications || []).map((cert) => (
                    <LuxuryBadge key={cert}>{cert}</LuxuryBadge>
                  ))}
                </div>
              </div>
            )}
          </LuxuryCardContent>
        </LuxuryCard>
      )}

      {/* Documents */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={FileText}>Uploaded Documents</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent>
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-[#E5DFC6] rounded-xl hover:bg-[#F5EFE1] transition-colors min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-[#C7A962] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[#0a2225] truncate">{doc.type}</p>
                      <p className="text-xs text-[#6B7280] truncate">{doc.fileName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                    className="text-[#0c4d47] hover:bg-[#d4e7dd]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">No documents uploaded</p>
          )}
        </LuxuryCardContent>
      </LuxuryCard>

      {/* Timeline */}
      <LuxuryCard>
        <LuxuryCardHeader>
          <LuxuryCardTitle icon={Calendar}>Timeline</LuxuryCardTitle>
        </LuxuryCardHeader>
        <LuxuryCardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-[#6B7280] w-20 sm:w-24 shrink-0">Submitted:</span>
            <span className="text-[#0a2225] min-w-0 break-words">{format(new Date(application.submitted_at), 'PPp')}</span>
          </div>
          {application.stripe_verified_at && (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#6B7280] w-20 sm:w-24 shrink-0">Verified:</span>
              <span className="text-[#0a2225] min-w-0 break-words">{format(new Date(application.stripe_verified_at), 'PPp')}</span>
            </div>
          )}
          {application.approved_at && (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#6B7280] w-20 sm:w-24 shrink-0">Approved:</span>
              <span className="text-[#0c4d47] min-w-0 break-words">{format(new Date(application.approved_at), 'PPp')}</span>
            </div>
          )}
          {application.rejected_at && (
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[#6B7280] w-20 sm:w-24 shrink-0">Rejected:</span>
              <span className="text-[#5b2c2c] min-w-0 break-words">{format(new Date(application.rejected_at), 'PPp')}</span>
            </div>
          )}
        </LuxuryCardContent>
      </LuxuryCard>
    </div>
  );
};

// ============================================================================
// MAIN ADMIN APPLICATIONS PAGE
// ============================================================================

export default function AdminApplicationsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'agents' | 'brands'>('agents');
  const [agentApplications, setAgentApplications] = useState<AgentApplication[]>([]);
  const [brandApplications, setBrandApplications] = useState<BrandApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [skipVerificationDialogOpen, setSkipVerificationDialogOpen] = useState(false);
  
  // Mobile sheet state
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalBrands: 0,
    pendingAgents: 0,
    pendingBrands: 0,
    verifiedAgents: 0,
    verifiedBrands: 0,
  });

  // Fetch applications
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      // Fetch agent applications
      const { data: agents, error: agentError } = await supabase
        .from('agent_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (agentError) throw agentError;

      // Fetch brand applications
      const { data: brands, error: brandError } = await supabase
        .from('brand_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (brandError) throw brandError;

      setAgentApplications(agents || []);
      setBrandApplications(brands || []);

      // Calculate stats
      setStats({
        totalAgents: agents?.length || 0,
        totalBrands: brands?.length || 0,
        pendingAgents: agents?.filter((a) => a.status === 'pending_verification').length || 0,
        pendingBrands: brands?.filter((b) => b.status === 'pending_verification').length || 0,
        verifiedAgents: agents?.filter((a) => a.status === 'verified').length || 0,
        verifiedBrands: brands?.filter((b) => b.status === 'verified').length || 0,
      });
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter applications
  const filteredAgentApplications = agentApplications.filter((app) => {
    const matchesSearch =
      (app.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.agency_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredBrandApplications = brandApplications.filter((app) => {
    const matchesSearch =
      (app.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.primary_contact_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.primary_contact_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle approval
  const handleApprove = async (notes: string, sendEmail: boolean) => {
    if (!selectedApplication) return;

    try {
      const { data, error } = await supabase.functions.invoke('approve-application', {
        body: {
          action: 'approve',
          applicationId: selectedApplication.id,
          applicationType: activeTab === 'agents' ? 'agent' : 'brand',
          approvalNotes: notes,
          sendWelcomeEmail: sendEmail,
        },
      });

      if (error) throw error;

      // Refresh applications
      await fetchApplications();
      setSelectedApplication(null);
    } catch (error: any) {
      console.error('Approval error:', error);
      throw new Error(error.message || 'Failed to approve application');
    }
  };

  // Handle rejection
  const handleReject = async (reason: string, allowResubmission: boolean) => {
    if (!selectedApplication) return;

    try {
      const { data, error } = await supabase.functions.invoke('approve-application', {
        body: {
          action: 'reject',
          applicationId: selectedApplication.id,
          applicationType: activeTab === 'agents' ? 'agent' : 'brand',
          rejectionReason: reason,
          allowResubmission,
        },
      });

      if (error) throw error;

      // Refresh applications
      await fetchApplications();
      setSelectedApplication(null);
      setMobileSheetOpen(false);
    } catch (error: any) {
      console.error('Rejection error:', error);
      throw new Error(error.message || 'Failed to reject application');
    }
  };

  // Handle skip verification (admin override)
  const handleSkipVerification = async () => {
    if (!selectedApplication) return;

    try {
      const table = activeTab === 'agents' ? 'agent_applications' : 'brand_applications';
      
      const { error } = await supabase
        .from(table)
        .update({
          status: 'verified',
          stripe_verification_status: 'admin_override',
          stripe_verified_at: new Date().toISOString(),
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast.success('Verification skipped - application marked as verified');
      setSkipVerificationDialogOpen(false);
      await fetchApplications();
      
      // Refresh selected application
      const updatedApp = activeTab === 'agents' 
        ? agentApplications.find(a => a.id === selectedApplication.id)
        : brandApplications.find(b => b.id === selectedApplication.id);
      if (updatedApp) {
        setSelectedApplication({ ...updatedApp, status: 'verified' });
      }
    } catch (error: any) {
      console.error('Skip verification error:', error);
      toast.error(error.message || 'Failed to skip verification');
    }
  };

  // Handle application selection
  const handleSelectApplication = (app: Application) => {
    setSelectedApplication(app);
    // On mobile, open the sheet
    if (window.innerWidth < 1024) {
      setMobileSheetOpen(true);
    }
  };

  // Close mobile sheet
  const handleCloseMobileSheet = () => {
    setMobileSheetOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF9F0]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0c4d47]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#0a2225] mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">Applications Management</h1>
          <p className="text-[#6B7280] mt-2">
            Review and manage agent and brand applications
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <LuxuryCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Total Agents</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-1">{stats.totalAgents}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#d4e7dd] flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#0c4d47]" />
                </div>
              </div>
            </div>
          </LuxuryCard>

          <LuxuryCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Total Brands</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-1">{stats.totalBrands}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#F5EFE1] flex items-center justify-center">
                  <Building className="h-6 w-6 text-[#C7A962]" />
                </div>
              </div>
            </div>
          </LuxuryCard>

          <LuxuryCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Awaiting Review</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-1">
                    {stats.verifiedAgents + stats.verifiedBrands}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#f5e9c5] flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#6d5223]" />
                </div>
              </div>
            </div>
          </LuxuryCard>

          <LuxuryCard>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Pending Verification</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-1">
                    {stats.pendingAgents + stats.pendingBrands}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#fef3cd] flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-[#856404]" />
                </div>
              </div>
            </div>
          </LuxuryCard>
        </div>

        {/* Filters */}
        <LuxuryCard className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 border-[#E5DFC6] rounded-xl focus:ring-[#C7A962] focus:border-[#C7A962] bg-white"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[220px] border-[#E5DFC6] rounded-xl focus:ring-[#C7A962] bg-white">
                  <Filter className="h-4 w-4 mr-2 text-[#6B7280]" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5DFC6] rounded-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  <SelectItem value="verified">Verified - Awaiting Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Verification Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </LuxuryCard>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Applications List */}
          <div className="col-span-12 lg:col-span-5">
            <LuxuryCard>
              <div className="p-4 border-b border-[#E5DFC6]">
                {/* Luxury Tabs */}
                <div className="bg-[#F5EFE1] rounded-xl p-1 flex">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
                      activeTab === 'agents'
                        ? 'bg-[#0c4d47] text-[#E5DFC6] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#0a2225]'
                    }`}
                  >
                    Agents ({filteredAgentApplications.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('brands')}
                    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
                      activeTab === 'brands'
                        ? 'bg-[#0c4d47] text-[#E5DFC6] shadow-sm'
                        : 'text-[#6B7280] hover:text-[#0a2225]'
                    }`}
                  >
                    Brands ({filteredBrandApplications.length})
                  </button>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                {activeTab === 'agents' ? (
                  <div className="divide-y divide-[#E5DFC6]">
                    {filteredAgentApplications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Users className="h-12 w-12 mx-auto text-[#E5DFC6] mb-3" />
                        <p className="font-secondary text-[#0a2225]">No agent applications found</p>
                        <p className="text-sm text-[#6B7280] mt-1">Try adjusting your search or filters</p>
                      </div>
                    ) : (
                      filteredAgentApplications.map((app) => (
                        <div
                          key={app.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedApplication?.id === app.id
                              ? 'bg-[#F5EFE1]'
                              : 'hover:bg-[#FDF9F0]'
                          }`}
                          onClick={() => handleSelectApplication(app)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-[#0a2225]">
                                {app.first_name} {app.last_name}
                              </h3>
                              <p className="text-sm text-[#6B7280]">{app.agency_name}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#C7A962]" />
                          </div>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={app.status} />
                            <span className="text-xs text-[#6B7280]">
                              {format(new Date(app.submitted_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5DFC6]">
                    {filteredBrandApplications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Building className="h-12 w-12 mx-auto text-[#E5DFC6] mb-3" />
                        <p className="font-secondary text-[#0a2225]">No brand applications found</p>
                        <p className="text-sm text-[#6B7280] mt-1">Try adjusting your search or filters</p>
                      </div>
                    ) : (
                      filteredBrandApplications.map((app) => (
                        <div
                          key={app.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedApplication?.id === app.id
                              ? 'bg-[#F5EFE1]'
                              : 'hover:bg-[#FDF9F0]'
                          }`}
                          onClick={() => handleSelectApplication(app)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {app.logo_url && (
                                <img
                                  src={app.logo_url}
                                  alt={app.brand_name}
                                  className="h-10 w-10 rounded-xl object-cover border border-[#E5DFC6]"
                                loading="lazy"/>
                              )}
                              <div>
                                <h3 className="font-medium text-[#0a2225]">{app.brand_name}</h3>
                                <p className="text-sm text-[#6B7280] capitalize">{app.brand_type}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-[#C7A962]" />
                          </div>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={app.status} />
                            <span className="text-xs text-[#6B7280]">
                              {format(new Date(app.submitted_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </LuxuryCard>
          </div>

          {/* Detail Panel - Hidden on mobile (shown in sheet instead) */}
          <div className="hidden lg:block col-span-7">
            <LuxuryCard className="p-6">
              {selectedApplication ? (
                activeTab === 'agents' ? (
                  <AgentApplicationDetail
                    application={selectedApplication as AgentApplication}
                    onApprove={() => setApprovalDialogOpen(true)}
                    onReject={() => setRejectionDialogOpen(true)}
                    onSkipVerification={() => setSkipVerificationDialogOpen(true)}
                  />
                ) : (
                  <BrandApplicationDetail
                    application={selectedApplication as BrandApplication}
                    onApprove={() => setApprovalDialogOpen(true)}
                    onReject={() => setRejectionDialogOpen(true)}
                    onSkipVerification={() => setSkipVerificationDialogOpen(true)}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-[600px] text-center">
                  <div className="h-16 w-16 rounded-full bg-[#F5EFE1] flex items-center justify-center mb-4">
                    <Eye className="h-8 w-8 text-[#C7A962]" />
                  </div>
                  <h3 className="font-secondary text-xl text-[#0a2225]">Select an application</h3>
                  <p className="text-sm text-[#6B7280] mt-2 max-w-sm">
                    Choose an application from the list to view details and take action
                  </p>
                </div>
              )}
            </LuxuryCard>
          </div>
        </div>
      </div>

      {/* Mobile Detail Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="right" className="w-full max-w-full sm:max-w-xl p-0 bg-[#FDF9F0] overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 sm:p-6">
              {selectedApplication && (
                activeTab === 'agents' ? (
                  <AgentApplicationDetail
                    application={selectedApplication as AgentApplication}
                    onApprove={() => setApprovalDialogOpen(true)}
                    onReject={() => setRejectionDialogOpen(true)}
                    onSkipVerification={() => setSkipVerificationDialogOpen(true)}
                    onClose={handleCloseMobileSheet}
                    showCloseButton
                  />
                ) : (
                  <BrandApplicationDetail
                    application={selectedApplication as BrandApplication}
                    onApprove={() => setApprovalDialogOpen(true)}
                    onReject={() => setRejectionDialogOpen(true)}
                    onSkipVerification={() => setSkipVerificationDialogOpen(true)}
                    onClose={handleCloseMobileSheet}
                    showCloseButton
                  />
                )
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <ApprovalDialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        application={selectedApplication}
        applicationType={activeTab === 'agents' ? 'agent' : 'brand'}
        onApprove={handleApprove}
      />

      <RejectionDialog
        open={rejectionDialogOpen}
        onClose={() => setRejectionDialogOpen(false)}
        application={selectedApplication}
        applicationType={activeTab === 'agents' ? 'agent' : 'brand'}
        onReject={handleReject}
      />

      {/* Skip Verification Confirmation Dialog */}
      <Dialog open={skipVerificationDialogOpen} onOpenChange={setSkipVerificationDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-[#E5DFC6] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-secondary text-xl text-[#0a2225]">
              <ShieldAlert className="h-5 w-5 text-[#856404]" />
              Skip Identity Verification
            </DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              Are you sure you want to skip identity verification for this application?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#fef3cd] border border-[#856404]/20 rounded-xl p-4 my-4">
            <p className="text-sm text-[#856404]">
              <strong>Warning:</strong> This will mark the application as verified without completing Stripe Identity verification. 
              Use this only for testing or when you have manually verified the applicant's identity through other means.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSkipVerificationDialogOpen(false)}
              className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F5EFE1] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSkipVerification}
              className="bg-[#856404] hover:bg-[#6d5203] text-white rounded-xl"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Skip Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
