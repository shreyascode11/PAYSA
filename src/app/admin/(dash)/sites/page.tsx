import type { Metadata } from "next";
import QRCode from "qrcode";
import { PrintButton } from "@/components/admin/PrintButton";
import { adminPageContext } from "@/lib/admin-context";
import { checkinUrl, todaysSiteToken } from "@/lib/qr";
import { requestOrigin } from "@/lib/origin";
import { getRepo } from "@/lib/repo";
import { localDateKey } from "@/lib/time";
import { panel } from "@/components/admin/styles";

export const metadata: Metadata = { title: "Sites & QR" };


export default async function Sites() {
  const { org } = await adminPageContext();
  const sites = await getRepo().listSites(org.id);
  const origin = await requestOrigin();
  const today = localDateKey(new Date());
  const posters = await Promise.all(
    sites.map(async (s) => {
      const url = checkinUrl(origin, s.id, todaysSiteToken(s.id));
      const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
      return { site: s, url, src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` };
    }),
  );

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Sites & check-in QR</h1>
          <p className="text-navy-950/70">Codes rotate daily. Print today&apos;s poster each morning. Workers can also check in by GPS inside the radius.</p>
        </div>
        <PrintButton />
      </div>
      <ul className="grid gap-6 md:grid-cols-2">
        {posters.map(({ site, url, src }) => (
          <li key={site.id} className={`break-inside-avoid ${panel} p-6 text-center`}>
            <h2 className="text-2xl font-extrabold">{site.name}</h2>
            <p className="mb-3 text-navy-950/70">
              {org.name} · valid {today}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- inline generated SVG data URL */}
            <img src={src} alt={`Check-in QR code for ${site.name}, valid today`} className="mx-auto size-64 rounded-3xl bg-ivory-50 p-3 ring-1 ring-navy-950/10" />
            <p className="mt-3 text-lg font-bold">Scan to start / end work · काम शुरू करें · வேலை தொடங்கு</p>
            <p className="no-print mt-2 text-xs text-navy-950/70">
              GPS radius {site.radiusM} m ·{" "}
              <a href={url} className="break-all underline">
                test link
              </a>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
