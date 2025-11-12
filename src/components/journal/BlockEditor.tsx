import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./ImageUpload";
import {
  Trash2,
  GripVertical,
  Type,
  Heading2,
  Heading3,
  Quote,
  Image as ImageIcon,
  Images,
  Link as LinkIcon,
  Megaphone,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Block {
  id: string;
  block_type: string;
  content: any;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const BLOCK_TYPES = [
  { value: "paragraph", label: "Paragraph", icon: Type },
  { value: "h2", label: "Heading 2", icon: Heading2 },
  { value: "h3", label: "Heading 3", icon: Heading3 },
  { value: "pullquote", label: "Pull Quote", icon: Quote },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "gallery", label: "Gallery", icon: Images },
  { value: "embed", label: "Embed", icon: LinkIcon },
  { value: "cta", label: "Call to Action", icon: Megaphone },
];

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [selectedBlockType, setSelectedBlockType] = useState<string>("paragraph");

  const addBlock = () => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      block_type: selectedBlockType,
      content: getDefaultContent(selectedBlockType),
    };
    onChange([...blocks, newBlock]);
  };

  const getDefaultContent = (blockType: string) => {
    switch (blockType) {
      case "paragraph":
      case "h2":
      case "h3":
        return { text: "" };
      case "pullquote":
        return { text: "", attribution: "" };
      case "image":
        return { url: "", alt: "", caption: "", credit: "" };
      case "gallery":
        return { images: [] };
      case "embed":
        return { url: "", html: "" };
      case "cta":
        return { title: "", description: "", buttonText: "", destination: "" };
      default:
        return {};
    }
  };

  const updateBlock = (id: string, content: any) => {
    onChange(
      blocks.map((block) =>
        block.id === id ? { ...block, content } : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [
      newBlocks[targetIndex],
      newBlocks[index],
    ];
    onChange(newBlocks);
  };

  const renderBlockEditor = (block: Block, index: number) => {
    switch (block.block_type) {
      case "paragraph":
      case "h2":
      case "h3":
        return (
          <Textarea
            value={block.content.text || ""}
            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
            placeholder={`Enter ${block.block_type} text...`}
            rows={block.block_type === "paragraph" ? 4 : 2}
          />
        );

      case "pullquote":
        return (
          <div className="space-y-2">
            <Textarea
              value={block.content.text || ""}
              onChange={(e) =>
                updateBlock(block.id, { ...block.content, text: e.target.value })
              }
              placeholder="Enter quote text..."
              rows={3}
            />
            <Input
              value={block.content.attribution || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  attribution: e.target.value,
                })
              }
              placeholder="Attribution (optional)"
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-2">
            <ImageUpload
              currentImageUrl={block.content.url}
              onImageUploaded={(url) =>
                updateBlock(block.id, { ...block.content, url })
              }
            />
            <Input
              value={block.content.alt || ""}
              onChange={(e) =>
                updateBlock(block.id, { ...block.content, alt: e.target.value })
              }
              placeholder="Alt text"
            />
            <Input
              value={block.content.caption || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  caption: e.target.value,
                })
              }
              placeholder="Caption (optional)"
            />
            <Input
              value={block.content.credit || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  credit: e.target.value,
                })
              }
              placeholder="Photo credit (optional)"
            />
          </div>
        );

      case "embed":
        return (
          <div className="space-y-2">
            <Input
              value={block.content.url || ""}
              onChange={(e) =>
                updateBlock(block.id, { ...block.content, url: e.target.value })
              }
              placeholder="Embed URL (YouTube, Instagram, etc.)"
            />
          </div>
        );

      case "cta":
        return (
          <div className="space-y-2">
            <Input
              value={block.content.title || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  title: e.target.value,
                })
              }
              placeholder="CTA Title"
            />
            <Textarea
              value={block.content.description || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  description: e.target.value,
                })
              }
              placeholder="Description (optional)"
              rows={2}
            />
            <Input
              value={block.content.buttonText || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  buttonText: e.target.value,
                })
              }
              placeholder="Button text"
            />
            <Input
              value={block.content.destination || ""}
              onChange={(e) =>
                updateBlock(block.id, {
                  ...block.content,
                  destination: e.target.value,
                })
              }
              placeholder="Destination (optional)"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Block Controls */}
      <div className="flex gap-2">
        <Select value={selectedBlockType} onValueChange={setSelectedBlockType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select block type" />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button onClick={addBlock}>Add Block</Button>
      </div>

      {/* Blocks List */}
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="bg-background border border-border rounded-xl p-4"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-1 pt-2">
                <button
                  onClick={() => moveBlock(index, "up")}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {BLOCK_TYPES.find((t) => t.value === block.block_type)
                      ?.label || block.block_type}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(block.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {renderBlockEditor(block, index)}
              </div>
            </div>
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No content blocks yet. Add your first block above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
