import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Type, Sparkles, Paintbrush, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MomentDrawingCanvas } from "./MomentDrawingCanvas";
import { StoryInteractionCreator } from "./StoryInteractionCreator";

interface CreateMomentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateMomentModal = ({ open, onOpenChange }: CreateMomentModalProps) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"media" | "type">("media");
  const [showDrawing, setShowDrawing] = useState(false);
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const [showInteractionCreator, setShowInteractionCreator] = useState(false);
  const [interaction, setInteraction] = useState<any>(null);
  
  // Text styling options
  const [textContent, setTextContent] = useState("");
  const [textFont, setTextFont] = useState("classic");
  const [textAnimation, setTextAnimation] = useState("none");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textBgType, setTextBgType] = useState<"none" | "solid" | "outline">("none");
  const [bgGradient, setBgGradient] = useState("linear-gradient(135deg, #667eea 0%, #764ba2 100%)");

  const fonts = [
    { value: "classic", label: "Classic", className: "font-story-classic" },
    { value: "modern", label: "Modern", className: "font-story-modern" },
    { value: "elegant", label: "Elegant", className: "font-story-elegant" },
    { value: "typewriter", label: "Typewriter", className: "font-story-typewriter" },
    { value: "neon", label: "Neon", className: "font-story-neon" },
  ];

  const animations = [
    { value: "none", label: "None" },
    { value: "sparkle", label: "Sparkle" },
    { value: "pop", label: "Pop" },
    { value: "fadeIn", label: "Fade In" },
  ];

  const gradients = [
    { value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "Purple Dream" },
    { value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", label: "Pink Sunset" },
    { value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", label: "Ocean Blue" },
    { value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", label: "Mint Fresh" },
    { value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", label: "Sunrise" },
    { value: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", label: "Deep Sea" },
    { value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", label: "Pastel" },
    { value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", label: "Rose" },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        toast.error("Please select an image or video file");
        return;
      }
      
      // Check file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleCreate = async () => {
    if (mode === "media" && !file) {
      toast.error("Please select a file");
      return;
    }

    if (mode === "type" && !textContent.trim()) {
      toast.error("Please enter some text");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let mediaUrl = "";
      let mediaType: "image" | "video" | "text" = "text";

      if (mode === "media" && file) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('moments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('moments')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaType = file.type.startsWith('image/') ? 'image' : 'video';
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error: insertError } = await supabase
        .from('moments')
        .insert({
          user_id: user.id,
          media_url: mediaUrl || null,
          media_type: mediaType,
          caption: mode === "type" ? textContent : (caption.trim() || null),
          expires_at: expiresAt.toISOString(),
          duration_seconds: mediaType === 'video' ? null : 5,
          drawing_data: drawingData,
          interactions: interaction,
          text_styling: mode === "type" ? {
            font: textFont,
            animation: textAnimation,
            color: textColor,
            bgType: textBgType,
            bgGradient: bgGradient,
          } : null,
        });

      if (insertError) throw insertError;

      toast.success("Moment created!");
      handleClose();
    } catch (error) {
      console.error('Error creating moment:', error);
      toast.error("Failed to create moment");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (preview) URL.revokeObjectURL(preview);
    setCaption("");
    setFile(null);
    setPreview(null);
    setTextContent("");
    setMode("media");
    setShowDrawing(false);
    setDrawingData(null);
    setInteraction(null);
    onOpenChange(false);
  };

  const getTextAnimationClass = () => {
    switch (textAnimation) {
      case "sparkle": return "animate-sparkle";
      case "pop": return "animate-pop";
      case "fadeIn": return "animate-fadeIn";
      default: return "";
    }
  };

  const getFontClass = () => {
    switch (textFont) {
      case "classic": return "font-story-classic";
      case "modern": return "font-story-modern";
      case "elegant": return "font-story-elegant";
      case "typewriter": return "font-story-typewriter";
      case "neon": return "font-story-neon";
      default: return "font-story-classic";
    }
  };

  const getTextBgClass = () => {
    if (textBgType === "solid") return "text-bg-solid";
    if (textBgType === "outline") return "text-bg-outline";
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Moment</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "media" | "type")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="media">
              <Upload className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="type">
              <Type className="w-4 h-4 mr-2" />
              Type Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="space-y-4">
            {!preview ? (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="moment-file"
                />
                <label htmlFor="moment-file" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload an image or video
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max size: 50MB
                  </p>
                </label>
              </div>
            ) : (
              <>
                {!showDrawing ? (
                  <div className="relative w-full h-[350px] bg-black rounded-lg overflow-hidden">
                    {file?.type.startsWith('image/') ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={preview} className="w-full h-full object-cover" controls />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        if (preview) URL.revokeObjectURL(preview);
                        setFile(null);
                        setPreview(null);
                        setDrawingData(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {file?.type.startsWith('image/') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 gap-2"
                        onClick={() => setShowDrawing(true)}
                      >
                        <Paintbrush className="w-4 h-4" />
                        Draw
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <MomentDrawingCanvas
                      backgroundImage={preview}
                      width={400}
                      height={350}
                      onDrawingChange={setDrawingData}
                      initialDrawing={drawingData}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowDrawing(false)}
                      className="w-full"
                    >
                      Done Drawing
                    </Button>
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {caption.length}/200
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowInteractionCreator(true)}
                className="w-full"
                type="button"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {interaction ? 'Edit Interactive Element' : 'Add Interactive Element'}
              </Button>
              {interaction && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {interaction.type === 'poll' && `Poll: ${interaction.data.question}`}
                  {interaction.type === 'question' && `Question: ${interaction.data.text}`}
                  {interaction.type === 'quiz' && `Quiz: ${interaction.data.question}`}
                  {interaction.type === 'countdown' && `Countdown: ${interaction.data.label}`}
                  {interaction.type === 'slider' && `Slider: ${interaction.data.question}`}
                  {interaction.type === 'add_yours' && `Add Yours: ${interaction.data.prompt}`}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!file || uploading}
                className="flex-1"
              >
                {uploading ? "Creating..." : "Create Moment"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            {/* Preview */}
            <div 
              className="relative w-full h-[350px] rounded-lg overflow-hidden flex items-center justify-center p-8"
              style={{ background: bgGradient }}
            >
              <div className="text-center max-w-md px-4">
                {textContent ? (
                  <p
                    key={`${textFont}-${textAnimation}-${textBgType}-${textColor}-${textContent.length}`}
                    className={`
                      text-4xl font-bold
                      ${getFontClass()}
                      ${getTextAnimationClass()}
                      ${getTextBgClass()}
                    `}
                    style={
                      textBgType === "solid" 
                        ? { 
                            background: textColor,
                            color: '#FFFFFF',
                          }
                        : textBgType === "outline"
                        ? {
                            WebkitTextStroke: `3px ${textColor}`,
                            WebkitTextFillColor: 'white',
                            color: textColor,
                          }
                        : { 
                            color: textColor,
                          }
                    }
                  >
                    {textContent}
                  </p>
                ) : (
                  <p className="text-white/50 text-lg">Enter your text below</p>
                )}
              </div>
            </div>

            {/* Text Input */}
            <div>
              <Label htmlFor="text">Your Text</Label>
              <Textarea
                id="text"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Type your message..."
                maxLength={150}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {textContent.length}/150
              </p>
            </div>

            {/* Font Selection */}
            <div>
              <Label>Font Style</Label>
              <Select value={textFont} onValueChange={setTextFont}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span className={font.className}>{font.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Animation */}
            <div>
              <Label>
                <Sparkles className="w-4 h-4 inline mr-2" />
                Animation
              </Label>
              <Select value={textAnimation} onValueChange={setTextAnimation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {animations.map((anim) => (
                    <SelectItem key={anim.value} value={anim.value}>
                      {anim.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Text Color */}
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="textColor"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <div className="flex-1 grid grid-cols-6 gap-2">
                  {["#FFFFFF", "#000000", "#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      aria-label={`Set color to ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Text Background */}
            <div>
              <Label>Text Background</Label>
              <Select value={textBgType} onValueChange={(v) => setTextBgType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Background Gradient */}
            <div>
              <Label>Background Gradient</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {gradients.map((grad) => (
                  <button
                    key={grad.value}
                    onClick={() => setBgGradient(grad.value)}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      bgGradient === grad.value ? "border-primary scale-105" : "border-border"
                    }`}
                    style={{ background: grad.value }}
                    title={grad.label}
                    aria-label={`Set gradient to ${grad.label}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!textContent.trim() || uploading}
                className="flex-1"
              >
                {uploading ? "Creating..." : "Create Moment"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <StoryInteractionCreator
        open={showInteractionCreator}
        onOpenChange={setShowInteractionCreator}
        onSave={(data) => {
          setInteraction(data);
          setShowInteractionCreator(false);
        }}
      />
    </Dialog>
  );
};
