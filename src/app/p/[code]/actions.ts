"use server";

import { redirect } from "next/navigation";
import { CONSENT_VERSION } from "@/lib/config";
import { isValidCode } from "@/lib/code";
import { markInterested, markOptOut, registerProvider } from "@/lib/prospects";

function checkCode(code: unknown): string {
  if (typeof code !== "string" || !isValidCode(code)) redirect("/");
  return code;
}

export async function joinAction(formData: FormData) {
  const code = checkCode(formData.get("code"));
  await markInterested(code);
  redirect(`/p/${code}/registro`);
}

export async function declineAction(formData: FormData) {
  const code = checkCode(formData.get("code"));
  await markOptOut({ code }, "no_me_interesa");
  redirect(`/p/${code}?r=baja`);
}

export async function registerAction(formData: FormData) {
  const code = checkCode(formData.get("code"));
  if (formData.get("consent") !== "on") redirect(`/p/${code}/registro?e=consentimiento`);
  await markInterested(code);
  const result = await registerProvider(code, {
    name: String(formData.get("name") ?? ""),
    trade: String(formData.get("trade") ?? ""),
    zone: String(formData.get("zone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    consentVersion: CONSENT_VERSION,
  });
  if (!result.ok) redirect(`/p/${code}/registro?e=${result.error}`);
  redirect(`/p/${code}?r=ok`);
}
