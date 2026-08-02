import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

/* Rebuilt 2 Aug 2026 — this page previously described the pre-pivot
   commission/OTA model (partner commissions, aggregator fees), violating the
   platform's truth standard. It is now the positioning page:
   category → promise → explanation, current model only. */
const WhatWeDo = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#FDF9F0] text-[#0a2225]">
      <Helmet><title>{t("wd.metaTitle")}</title></Helmet>
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-20">
        <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">{t("wd.kicker")}</p>
        <h1 className="mt-4 font-secondary text-[38px] leading-tight md:text-[48px]">{t("wd.title")}</h1>
        <p className="mt-6 text-[17px] leading-relaxed text-[#0a2225]/70">{t("wd.intro")}</p>

        <div className="mt-14 space-y-10">
          {["creators", "specialists", "travelers"].map((k, i) => (
            <div key={k} className="border-l-2 border-[#C7A962] pl-6">
              <p className="text-[12px] uppercase tracking-[0.24em] text-[#8D6B2F]">{["I.", "II.", "III."][i]} {t(`wd.${k}T`)}</p>
              <p className="mt-2 text-[16px] leading-relaxed text-[#0a2225]/75">{t(`wd.${k}B`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-y border-[#0a2225]/10 py-10">
          <p className="text-[12px] uppercase tracking-[0.28em] text-[#8D6B2F]">{t("wd.moneyK")}</p>
          <p className="mt-3 text-[16px] leading-relaxed text-[#0a2225]/75">{t("wd.moneyB")}</p>
        </div>

        <p className="mt-12 font-secondary text-[22px] leading-snug">{t("wd.closing")}</p>
        <Link to="/auth?mode=signup" className="mt-8 inline-flex rounded-full bg-[#0c4d47] px-7 py-3 text-[14px] tracking-wide text-[#E5DFC6]">{t("wd.cta")}</Link>
      </div>
    </div>
  );
};
export default WhatWeDo;
