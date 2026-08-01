import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle, X, FilePlus } from "lucide-react";
import { useState } from "react";

interface Step10Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm";

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function validateFile(file: File, t: (k: string, o?: Record<string, unknown>) => string): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return t('agentApp.fileTooLarge', { name: file.name, size: (file.size / 1024 / 1024).toFixed(1) });
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extOk = ['pdf', 'jpg', 'jpeg', 'png', 'heic', 'heif'].includes(ext);
  if (file.type && !ALLOWED_TYPES.includes(file.type) && !extOk) {
    return t('agentApp.fileUnsupported', { name: file.name });
  }
  if (!file.type && !extOk) {
    return t('agentApp.fileNoType', { name: file.name });
  }
  return null;
}

export const Step10Documents = ({ formData, setFormData }: Step10Props) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const MAX_SUPPORTING_DOCS = 5;

  const handlePickMultiple = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;
    const existing: File[] = formData.supportingDocumentFiles ?? [];
    const room = MAX_SUPPORTING_DOCS - existing.length;
    if (room <= 0) {
      setErrors((prev) => ({ ...prev, supportingDocumentFiles: `Maximum ${MAX_SUPPORTING_DOCS} additional documents.` }));
      return;
    }
    const accepted: File[] = [];
    for (const file of picked.slice(0, room)) {
      const err = validateFile(file, t);
      if (err) {
        setErrors((prev) => ({ ...prev, supportingDocumentFiles: err }));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) {
      setErrors((prev) => { const n = { ...prev }; delete n.supportingDocumentFiles; return n; });
      setFormData({ ...formData, supportingDocumentFiles: [...existing, ...accepted] });
    }
  };

  const removeSupportingDoc = (idx: number) => {
    const existing: File[] = formData.supportingDocumentFiles ?? [];
    setFormData({ ...formData, supportingDocumentFiles: existing.filter((_: File, i: number) => i !== idx) });
  };

  const handlePick = (fieldKey: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file, t);
    if (err) {
      setErrors((prev) => ({ ...prev, [fieldKey]: err }));
      // clear the input so user can re-pick
      e.target.value = '';
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setFormData({ ...formData, [fieldKey]: file });
  };

  const submitError: string | undefined = formData.__documentUploadError;

  return (
    <div className="space-y-8">
      {submitError && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">{t('agentApp.uploadFailTitle')}</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">{t('agentApp.docsHeader')}</h3>
        </div>
        <p className="mb-6 text-sm text-[#6B7280] ml-4">
          {t('agentApp.docsIntro')}
        </p>
        <div className="space-y-5">
          <div>
            <Label htmlFor="businessLicenseFile" className="text-sm font-medium text-[#0a2225]">{t('agentApp.docBusinessLicense')} *</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="businessLicenseFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
                className="cursor-pointer"
                onChange={handlePick('businessLicenseFile')}
              />
              {formData.businessLicenseFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.businessLicenseFile.name}</p>
              )}
              {errors.businessLicenseFile && (
                <p className="mt-2 text-xs text-red-600">{errors.businessLicenseFile}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="insuranceCertificateFile" className="text-sm font-medium text-[#0a2225]">{t('agentApp.docEOCert')}</Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="insuranceCertificateFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
                className="cursor-pointer"
                onChange={handlePick('insuranceCertificateFile')}
              />
              {formData.insuranceCertificateFile && (
                <p className="mt-2 text-xs text-[#0c4d47]">✓ {formData.insuranceCertificateFile.name}</p>
              )}
              {errors.insuranceCertificateFile && (
                <p className="mt-2 text-xs text-red-600">{errors.insuranceCertificateFile}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="supportingDocumentFiles" className="text-sm font-medium text-[#0a2225]">
              {t('agentApp.docAdditional')} <span className="font-normal text-[#6B7280]">{t('agentApp.docAdditionalHint')}</span>
            </Label>
            <div className="mt-1.5 border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] bg-[#FDF9F0]/50 rounded-xl p-4 transition-colors cursor-pointer">
              <Input
                id="supportingDocumentFiles"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*"
                className="cursor-pointer"
                onChange={handlePickMultiple}
              />
              {(formData.supportingDocumentFiles ?? []).length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {(formData.supportingDocumentFiles as File[]).map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-xs text-[#0c4d47]">
                      <span className="truncate">✓ {f.name}</span>
                      <button
                        type="button"
                        aria-label={t('agentApp.removeFile', { name: f.name })}
                        onClick={() => removeSupportingDoc(i)}
                        className="ml-3 shrink-0 rounded p-0.5 text-[#6B7280] hover:bg-[#FDF9F0] hover:text-[#0a2225]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {errors.supportingDocumentFiles && (
                <p className="mt-2 text-xs text-red-600">{errors.supportingDocumentFiles}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
