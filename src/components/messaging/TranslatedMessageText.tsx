// TranslatedMessageText — drop-in translated rendering for any message body.
//
// Wraps useTranslatedContent so surfaces that render messages inside plain
// .map() callbacks (where hooks can't be called) get translation by swapping
// `{msg.body}` for `<TranslatedMessageText text={msg.body} enabled={!isSelf} />`.
// Reuses the msg.* toggle keys; inherits the surrounding text styling, so it
// drops into any bubble regardless of that surface's palette.
//
// Same failure philosophy as the hook: any problem renders the original text.

import { useTranslation } from "react-i18next";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";

export function TranslatedMessageText({
  text,
  enabled = true,
  toggleClassName,
  showToggle = true,
}: {
  text: string | null | undefined;
  /** Pass false for the viewer's own messages: renders plain text, zero calls. */
  enabled?: boolean;
  /** Optional override for the toggle's styling (defaults to subtle, color-inherit). */
  toggleClassName?: string;
  /** Pass false for one-line surfaces (inbox previews) where a toggle can't fit. */
  showToggle?: boolean;
}) {
  const { t } = useTranslation();
  const translated = useTranslatedContent(text, { enabled });

  if (!translated.isTranslated) {
    return <>{text ?? ""}</>;
  }

  if (!showToggle) {
    return <>{translated.text}</>;
  }

  return (
    <>
      {translated.text}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          translated.toggle();
        }}
        className={
          toggleClassName ??
          "mt-0.5 block text-[11px] leading-tight text-current opacity-55 underline-offset-2 hover:underline"
        }
      >
        {translated.showOriginal
          ? t("msg.showTranslation", "Show translation")
          : `${t("msg.translated", "Translated")} \u00b7 ${t("msg.showOriginal", "Show original")}`}
      </button>
    </>
  );
}
