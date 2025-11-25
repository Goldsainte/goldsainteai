import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; variant: any; icon: any }> = {
    pending_verification: {
      label: 'Pending Verification',
      variant: 'secondary',
      icon: Clock,
    },
    verified: {
      label: 'Verified - Awaiting Review',
      variant: 'default',
      icon: CheckCircle,
    },
    pending_review: {
      label: 'Under Review',
      variant: 'default',
      icon: Eye,
    },
    approved: {
      label: 'Approved',
      variant: 'default',
      icon: CheckCheck,
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      icon: XCircle,
    },
    failed: {
      label: 'Verification Failed',
      variant: 'destructive',
      icon: AlertTriangle,
    },
  };

  const config = configs[status] || configs.pending_verification;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant as any} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

// ============================================================================
// APPROVAL DIALOG
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approve Application
          </DialogTitle>
          <DialogDescription>
            You are about to approve {name}'s {applicationType} application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>What happens next:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>A Supabase Auth account will be created</li>
                <li>Profile and {applicationType} records will be created</li>
                <li>Temporary password will be generated</li>
                <li>Welcome email will be sent with login credentials (if enabled)</li>
                <li>Applicant can immediately log in and start using the platform</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
            <Textarea
              id="approvalNotes"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any internal notes about this approval..."
              rows={4}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              These notes are for internal records only and won't be shared with the applicant.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendWelcomeEmail"
              checked={sendWelcomeEmail}
              onChange={(e) => setSendWelcomeEmail(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="sendWelcomeEmail" className="cursor-pointer">
              Send welcome email with login credentials
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={isSubmitting}>
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
// REJECTION DIALOG
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Application
          </DialogTitle>
          <DialogDescription>
            You are about to reject {name}'s {applicationType} application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              This action will notify the applicant via email with the rejection reason provided below.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="template">Use Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a rejection reason template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rejectionReason">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a clear reason for rejection. This will be sent to the applicant."
              rows={6}
              className="mt-1"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Be professional and constructive. This reason will be included in the rejection email.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowResubmission"
              checked={allowResubmission}
              onChange={(e) => setAllowResubmission(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="allowResubmission" className="cursor-pointer">
              Allow applicant to resubmit after addressing issues
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting || !rejectionReason.trim()}
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
// APPLICATION DETAIL VIEW - AGENT
// ============================================================================

const AgentApplicationDetail: React.FC<{
  application: AgentApplication;
  onApprove: () => void;
  onReject: () => void;
}> = ({ application, onApprove, onReject }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {application.first_name} {application.last_name}
          </h2>
          <p className="text-muted-foreground">{application.agency_name}</p>
          <div className="mt-2">
            <StatusBadge status={application.status} />
          </div>
        </div>

        <div className="flex gap-2">
          {application.status === 'verified' && (
            <>
              <Button variant="outline" onClick={onReject}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={onApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <a href={`mailto:${application.email}`} className="text-primary hover:underline">
                {application.email}
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{application.phone}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-sm">
              {application.business_address}
              {application.business_city && `, ${application.business_city}`}
              {application.business_state && `, ${application.business_state}`}
              <br />
              {application.business_country}
            </span>
          </div>
          {application.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={application.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {application.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Business Type</Label>
              <p className="mt-1 capitalize">{application.business_type?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Years of Experience</Label>
              <p className="mt-1">{application.years_experience} years</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Commission Rate</Label>
              <p className="mt-1">{application.commission_rate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services & Specialties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Services & Specializations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Service Types</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(application.service_types || []).map((service) => (
                <Badge key={service} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Specialties</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(application.specialties || []).map((specialty) => (
                <Badge key={specialty} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Languages</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(application.languages || []).map((language) => (
                <Badge key={language} variant="secondary">
                  {language}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licensing & Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Licensing & Insurance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">License Number</Label>
              <p className="mt-1">{application.license_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">License State</Label>
              <p className="mt-1">{application.license_state}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Insurance Provider</Label>
              <p className="mt-1">{application.insurance_provider}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Policy Number</Label>
              <p className="mt-1">{application.insurance_policy_number}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.type}</p>
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Stripe Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <p className="mt-1">
                <Badge
                  variant={
                    application.stripe_verification_status === 'verified'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {application.stripe_verification_status}
                </Badge>
              </p>
            </div>
            {application.stripe_verified_at && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Verified At</Label>
                <p className="mt-1 text-sm">
                  {format(new Date(application.stripe_verified_at), 'PPp')}
                </p>
              </div>
            )}
          </div>

          {application.stripe_verification_report && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-mono text-muted-foreground">
                Session ID: {application.stripe_verification_session_id}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Submitted:</span>
            <span>{format(new Date(application.submitted_at), 'PPp')}</span>
          </div>
          {application.stripe_verified_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Verified:</span>
              <span>{format(new Date(application.stripe_verified_at), 'PPp')}</span>
            </div>
          )}
          {application.approved_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Approved:</span>
              <span>{format(new Date(application.approved_at), 'PPp')}</span>
            </div>
          )}
          {application.rejected_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Rejected:</span>
              <span>{format(new Date(application.rejected_at), 'PPp')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason (if applicable) */}
      {application.status === 'rejected' && application.rejection_reason && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Rejection Reason:</strong>
            <p className="mt-2">{application.rejection_reason}</p>
          </AlertDescription>
        </Alert>
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
}> = ({ application, onApprove, onReject }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{application.brand_name}</h2>
          <p className="text-muted-foreground">{application.brand_type}</p>
          <div className="mt-2">
            <StatusBadge status={application.status} />
          </div>
        </div>

        <div className="flex gap-2">
          {application.status === 'verified' && (
            <>
              <Button variant="outline" onClick={onReject}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={onApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Cover Image */}
      {application.cover_image_url && (
        <Card>
          <CardContent className="p-0">
            <img
              src={application.cover_image_url}
              alt={application.brand_name}
              className="w-full h-64 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Primary Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Name</Label>
            <p className="mt-1">{application.primary_contact_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${application.primary_contact_email}`}
              className="text-sm text-primary hover:underline"
            >
              {application.primary_contact_email}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{application.primary_contact_phone}</span>
          </div>
        </CardContent>
      </Card>

      {/* Brand Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{application.bio}</p>
        </CardContent>
      </Card>

      {/* Location & Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location & Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Regions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(application.regions || []).map((region) => (
                <Badge key={region} variant="secondary">
                  {region}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Cities</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(application.cities || []).map((city) => (
                <Badge key={city} variant="outline">
                  {city}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Style Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(application.style_tags || []).map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Price Range</Label>
            <p className="mt-1 capitalize">{application.price_range?.replace('_', ' ') || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Gallery */}
      {application.gallery_urls && application.gallery_urls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {application.gallery_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {application.amenities && (application.amenities || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(application.amenities || []).map((amenity) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {((application.sustainability_certifications || []).length > 0 ||
        (application.quality_certifications || []).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(application.sustainability_certifications || []).length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Sustainability</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(application.sustainability_certifications || []).map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(application.quality_certifications || []).length > 0 && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Quality</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(application.quality_certifications || []).map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {application.documents && application.documents.length > 0 ? (
            <div className="space-y-2">
              {application.documents.map((doc: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{doc.type}</p>
                      <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted-foreground">Submitted:</span>
            <span>{format(new Date(application.submitted_at), 'PPp')}</span>
          </div>
          {application.stripe_verified_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Verified:</span>
              <span>{format(new Date(application.stripe_verified_at), 'PPp')}</span>
            </div>
          )}
          {application.approved_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Approved:</span>
              <span>{format(new Date(application.approved_at), 'PPp')}</span>
            </div>
          )}
          {application.rejected_at && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Rejected:</span>
              <span>{format(new Date(application.rejected_at), 'PPp')}</span>
            </div>
          )}
        </CardContent>
      </Card>
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
        pendingAgents:
          agents?.filter((a) => a.status === 'pending_verification').length || 0,
        pendingBrands:
          brands?.filter((b) => b.status === 'pending_verification').length || 0,
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
    } catch (error: any) {
      console.error('Rejection error:', error);
      throw new Error(error.message || 'Failed to reject application');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Applications Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage agent and brand applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{stats.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Brands</p>
                <p className="text-2xl font-bold">{stats.totalBrands}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Review</p>
                <p className="text-2xl font-bold">
                  {stats.verifiedAgents + stats.verifiedBrands}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
                <p className="text-2xl font-bold">
                  {stats.pendingAgents + stats.pendingBrands}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_verification">Pending Verification</SelectItem>
                <SelectItem value="verified">Verified - Awaiting Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="failed">Verification Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Applications List */}
        <div className="col-span-12 lg:col-span-5">
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="agents">
                    Agents ({filteredAgentApplications.length})
                  </TabsTrigger>
                  <TabsTrigger value="brands">
                    Brands ({filteredBrandApplications.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {activeTab === 'agents' ? (
                  <div className="divide-y">
                    {filteredAgentApplications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No agent applications found
                      </div>
                    ) : (
                      filteredAgentApplications.map((app) => (
                        <div
                          key={app.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 ${
                            selectedApplication?.id === app.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">
                                {app.first_name} {app.last_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{app.agency_name}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={app.status} />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(app.submitted_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredBrandApplications.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No brand applications found
                      </div>
                    ) : (
                      filteredBrandApplications.map((app) => (
                        <div
                          key={app.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 ${
                            selectedApplication?.id === app.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedApplication(app)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              {app.logo_url && (
                                <img
                                  src={app.logo_url}
                                  alt={app.brand_name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold">{app.brand_name}</h3>
                                <p className="text-sm text-muted-foreground">{app.brand_type}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex items-center justify-between">
                            <StatusBadge status={app.status} />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(app.submitted_at), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Application Detail */}
        <div className="col-span-12 lg:col-span-7">
          <Card>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px] pr-4">
                {selectedApplication ? (
                  activeTab === 'agents' ? (
                    <AgentApplicationDetail
                      application={selectedApplication as AgentApplication}
                      onApprove={() => setApprovalDialogOpen(true)}
                      onReject={() => setRejectionDialogOpen(true)}
                    />
                  ) : (
                    <BrandApplicationDetail
                      application={selectedApplication as BrandApplication}
                      onApprove={() => setApprovalDialogOpen(true)}
                      onReject={() => setRejectionDialogOpen(true)}
                    />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select an application to view details
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

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
    </div>
  );
}
