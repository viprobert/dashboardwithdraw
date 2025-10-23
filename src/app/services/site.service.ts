import api from "../utils/axios";
import siteData from "../data/sites.json"
import { showOtpDialog } from "../components/OtpDialogHandler"

interface SiteConfig {
  id: number;
  name: string;
  loginUrl: string;
  referer: string;
  operatorName: string;
  password: string;
  getCountUrl: string;
}

const tokenCache: Record<number, string | null> = {};

// 🔹 Get site config
function getSite(siteId: number): SiteConfig {
  const site: any = siteData.find((s) => s.id === siteId);
  if (!site) throw new Error(`Site config not found for ID ${siteId}`);
  return site;
}

// 🔹 Login for site and cache token
async function loginAndGetToken(site: SiteConfig): Promise<string> {
  console.log(`🔐 Logging in for ${site.name}...`);

  const res = await api.post(
    `/api/proxy?target=${encodeURIComponent(site.loginUrl)}&header_Referer=${encodeURIComponent(site.referer)}`,
    {
      operatorName: site.operatorName,
      password: site.password,
    }
  );

  const token = res?.data?.data?.token || res?.data?.token;
  
  if (res?.data?.data?.needOtp === true || res?.data?.errorCode?.includes("OTP") || res?.data?.data?.errorCode?.include("OTP")) {
    console.warn(`⚠️ ${site.name} requires OTP authentication`);

    const otpToken = await showOtpDialog({
      siteName: site.name,
      referer: site.referer,
      operatorName: site.operatorName,
    });

    if (!otpToken) {
      console.warn(`${site.name}: OTP canceled.`);
      throw new Error("OTP canceled");
    }

    localStorage.setItem(`${site.name.toLowerCase()}_token`, otpToken);
    tokenCache[site.id] = otpToken;
    return otpToken;
  }

  if (!token) throw new Error(`Login failed for ${site.name}`);

  tokenCache[site.id] = token;
  localStorage.setItem(`${site.name.toLowerCase()}_token`, token);

  console.log(`✅ Login success: ${site.name}`);
  return token;
}

// 🔹 Fetch and count with re-login on token invalid
export async function fetchSiteCounts(siteId: number, pageNo = 1, maxResult = 50) {
  const site = getSite(siteId);

  let token =
    tokenCache[site.id] || localStorage.getItem(`${site.name.toLowerCase()}_token`);
  if (!token) token = await loginAndGetToken(site);

  const buildUrl = () => {
    const url = new URL(site.getCountUrl);
    url.searchParams.set("pageNo", pageNo.toString());
    url.searchParams.set("maxResult", maxResult.toString());
    return url.toString();
  };

  const callAPI = async (authToken: string) => {
    return await api.get(
      `/api/proxy?target=${encodeURIComponent(buildUrl())}&header_Authorization=${encodeURIComponent(authToken)}`
    );
  };

  try {
    const res: any = await callAPI(token);

    const items =
      res?.data?.value?.WTD?.getResults ??
      res?.data?.data?.value?.WTD?.getResults ??
      [];

    const counts = { new: 0, review: 0, transfer: 0, bounce: 0 };
    for (const item of items) {
      switch (item?.state?.stateName) {
        case "Withdraw-New":
          counts.new++;
          break;
        case "Withdraw-In-Review":
          counts.review++;
          break;
        case "Withdraw-Approve":
        case "Withdraw-Approve-IR":
          counts.transfer++;
          break;
        case "Third-Party-Refusal":
          counts.bounce++;
          break;
      }
    }

    console.log(`🧮 ${site.name} counts:`, counts);
    return counts;
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const errorCode = data?.errorCode || data?.data?.errorCode;

    // check 401 and proxy 500 wrapping 401
    const isInvalidToken =
      status === 401 ||
      errorCode === "INVALID_TOKEN" ||
      (status === 500 && data?.status === 401);

    if (isInvalidToken) {
      console.warn(`⚠️ ${site.name}: token invalid, reauthenticating...`);

      localStorage.removeItem(`${site.name.toLowerCase()}_token`);
      tokenCache[site.id] = null;

      const newToken = await loginAndGetToken(site);

      console.log(`🔁 Retrying ${site.name} with new token...`);
      const retryRes: any = await callAPI(newToken);

      const items =
        retryRes?.data?.value?.WTD?.getResults ??
        retryRes?.data?.data?.value?.WTD?.getResults ??
        [];

      const counts = { new: 0, review: 0, transfer: 0, bounce: 0 };
      for (const item of items) {
        switch (item?.state?.stateName) {
          case "Withdraw-New":
            counts.new++;
            break;
          case "Withdraw-In-Review":
            counts.review++;
            break;
          case "Withdraw-Approve":
          case "Withdraw-Approve-IR":
            counts.transfer++;
            break;
          case "Third-Party-Refusal":
            counts.bounce++;
            break;
        }
      }

      console.log(`🧮 ${site.name} (after re-login) counts:`, counts);
      return counts;
    }

    console.error(`🔴 ${site.name} fetch error:`, error);
    throw error;
  }
}
