import type { ReportLabels, ReportTypeOption } from "@/components/ReportFlow";
import type { Translator } from "./i18n";
import { categoriesFor } from "./sectors";
import type { ReportType, Sector } from "./types";

export function reportLabels(t: Translator): ReportLabels {
  return {
    step1: t("report.step1"),
    step2: t("report.step2"),
    step3: t("report.step3"),
    hold: t("report.holdToRecord"),
    recording: t("report.recording"),
    transcribing: t("report.transcribing"),
    heard: t("report.heard"),
    typeLabel: t("report.typeLabel"),
    photo: t("report.photo"),
    photoRemove: t("report.photoRemove"),
    anonymous: t("report.anonymous"),
    anonymousOn: t("report.anonymousOn"),
    anonymousOff: t("report.anonymousOff"),
    submit: t("report.submit"),
    sending: t("report.sending"),
    needText: t("report.needText"),
    needCategory: t("report.needCategory"),
    doneTitle: t("report.doneTitle"),
    doneIntro: t("report.doneIntro"),
    track: t("report.track"),
    newReport: t("report.newReport"),
    copy: t("common.copy"),
    copied: t("common.copied"),
    listen: t("common.listen"),
    stop: t("common.stop"),
    errors: {
      micDenied: t("report.micDenied"),
      aiUnavailable: t("report.aiUnavailable"),
      tooLong: t("report.tooLong"),
      generic: t("common.error"),
      tooMany: t("common.tooMany"),
      offline: t("common.offline"),
    },
  };
}

export function reportTypeOption(type: ReportType, label: string, sector: Sector, t: Translator): ReportTypeOption {
  return {
    type,
    label,
    categories: categoriesFor(type, sector).map((id) => ({ id, label: t(`report.cat.${id}`) })),
  };
}
