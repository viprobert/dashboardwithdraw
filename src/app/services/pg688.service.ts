// src/services/pg688.service.ts
import api from "../utils/axios";
import siteData from "../data/sites.json";

const site: any = siteData.find((s) => s.id === 1);
if (!site) throw new Error("PG688 site config not found in sites.json");


let cachedToken: string | null = null;

/**
 * Login and get new token
 */
async function loginAndGetToken(): Promise<string> {
  const res = await api.post(
    `/api/proxy?target=${encodeURIComponent(site.loginUrl)}&header_Referer=${encodeURIComponent(site.referer)}&header_Origin=${encodeURIComponent(site.referer)}&header_X-Requested-With=XMLHttpRequest`,
    {
      operatorName: site.operatorName,
      password: site.password,
    }
  );

  const token = res?.data?.data?.token || res?.data?.token;
  if (!token) throw new Error("Login failed: token not found");

  cachedToken = token;
  return token;
}

/**
 * Fetch task counts
 */
export async function fetchPG688Counts(pageNo = 1, maxResult = 50) {
  try {
    let token = cachedToken;

    if (!token) token = await loginAndGetToken();

    const res = await api.get(
      `/api/proxy?target=${encodeURIComponent(
        `${site.getCountUrl}?pageNo=${pageNo}&maxResult=${maxResult}`
      )}&header_Authorization=${encodeURIComponent(`Bearer ${token}`)}`
    );

    console.log("data",res.data);
    return res.data;
  } catch (error: any) {
    // If token expired, retry login once
    if (error.response?.status === 401) {
      console.warn("Token expired — reauthenticating...");
      const newToken = await loginAndGetToken();
      const retryRes = await api.get(
        `/api/proxy?target=${encodeURIComponent(
          `${site.getCountUrl}?pageNo=${pageNo}&maxResult=${maxResult}`
        )}&header_Authorization=${encodeURIComponent(newToken
        )}&header_Referer=${encodeURIComponent(site.referer)}`
      );
      return retryRes.data;
    }

    throw error;
  }
}
