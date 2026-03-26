import { useState } from "react";
import { Plus, Trash2, Instagram, Linkedin, Youtube, Twitter, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SocialAccount {
  id?: string;
  platform: string;
  handle: string;
  profile_url: string;
  followers_count: number;
  sort_order?: number;
}

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter/X" },
] as const;

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "instagram": return <Instagram className={className} />;
    case "linkedin": return <Linkedin className={className} />;
    case "youtube": return <Youtube className={className} />;
    case "twitter": return <Twitter className={className} />;
    default: return <Globe className={className} />;
  }
}

interface Props {
  accounts: SocialAccount[];
  onChange: (accounts: SocialAccount[]) => void;
}

export function CreatorSocialAccountsEditor({ accounts, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<SocialAccount, "id">>({
    platform: "instagram",
    handle: "",
    profile_url: "",
    followers_count: 0,
  });

  const resetForm = () => {
    setForm({ platform: "instagram", handle: "", profile_url: "", followers_count: 0 });
    setAdding(false);
    setEditIdx(null);
  };

  const usedPlatforms = accounts.map((a) => a.platform);
  const availablePlatforms = PLATFORMS.filter(
    (p) => !usedPlatforms.includes(p.value) || (editIdx !== null && accounts[editIdx]?.platform === p.value)
  );

  const handleSaveEntry = () => {
    if (!form.handle.trim() || !form.profile_url.trim()) return;
    const updated = [...accounts];
    if (editIdx !== null) {
      updated[editIdx] = { ...updated[editIdx], ...form };
      setEditIdx(null);
    } else {
      updated.push({ ...form, sort_order: updated.length });
    }
    onChange(updated);
    resetForm();
  };

  const handleEdit = (idx: number) => {
    const a = accounts[idx];
    setForm({
      platform: a.platform,
      handle: a.handle,
      profile_url: a.profile_url,
      followers_count: a.followers_count,
    });
    setEditIdx(idx);
    setAdding(true);
  };

  const handleDelete = (idx: number) => {
    onChange(accounts.filter((_, i) => i !== idx));
  };

  const platformLabel = (val: string) => PLATFORMS.find((p) => p.value === val)?.label || val;

  return (
    <div className="space-y-3">
      {/* Existing entries */}
      {accounts.map((acc, idx) => (
        <div
          key={acc.platform}
          className="flex items-center justify-between rounded-xl border border-[#E5DFC6] bg-[#F5F0E0]/30 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <PlatformIcon platform={acc.platform} className="h-4 w-4 text-[#0c4d47]" />
            <div>
              <p className="text-sm font-medium text-[#0a2225]">{platformLabel(acc.platform)}</p>
              <p className="text-xs text-[#6B7280]">
                {acc.handle} · {formatFollowers(acc.followers_count)} followers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="xs" onClick={() => handleEdit(idx)} className="text-[#6B7280] hover:text-[#0a2225]">
              Edit
            </Button>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(idx)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {/* Add/Edit form */}
      {adding ? (
        <div className="rounded-xl border border-[#E5DFC6] bg-white p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#6B7280]">Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger className="mt-1 border-[#E5DFC6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePlatforms.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Handle</Label>
              <Input
                className="mt-1 border-[#E5DFC6]"
                placeholder="@yourhandle"
                value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#6B7280]">Profile URL</Label>
              <Input
                className="mt-1 border-[#E5DFC6]"
                placeholder="https://instagram.com/yourhandle"
                value={form.profile_url}
                onChange={(e) => setForm({ ...form, profile_url: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-[#6B7280]">Followers</Label>
              <Input
                className="mt-1 border-[#E5DFC6]"
                type="number"
                min={0}
                placeholder="24800"
                value={form.followers_count || ""}
                onChange={(e) => setForm({ ...form, followers_count: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSaveEntry}
              disabled={!form.handle.trim() || !form.profile_url.trim()}
              className="bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
            >
              {editIdx !== null ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        availablePlatforms.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
            className="border-dashed border-[#E5DFC6] text-[#6B7280] hover:text-[#0a2225]"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Social Account
          </Button>
        )
      )}
    </div>
  );
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return count.toString();
}
