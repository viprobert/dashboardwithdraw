// src/services/th39.service.ts
import api from "../utils/axios";
import siteData from "../data/sites.json";

const site: any = siteData.find((s) => s.id === 5);
if (!site) throw new Error("TH39 site config not found in sites.json");


let cachedToken: string | null = localStorage.getItem("th39_token") || null;

/**
 * Login and get new token
 */
async function loginAndGetToken(): Promise<string> {
  const res = await api.post(
    `/api/proxy?target=${encodeURIComponent(site.loginUrl)}&header_Referer=${encodeURIComponent(site.referer)}`,
    {
      operatorName: site.operatorName,
      password: site.password,
    }
  );

  const token = res?.data?.data?.token || res?.data?.token;
  if (!token) throw new Error("Login failed: token not found");

  cachedToken = token;
  localStorage.setItem("th39_token", token); 
  return token;
}

/**
 * Fetch task counts
 */
export async function fetchTH39Counts(pageNo = 1, maxResult = 50) {
  try {
    let token = cachedToken;

    if (!token) token = await loginAndGetToken();
    
    const url = new URL(site.getCountUrl);
    url.searchParams.set("pageNo", pageNo.toString());
    url.searchParams.set("maxResult", maxResult.toString());

    const res : any = await api.get(
      `/api/proxy?target=${encodeURIComponent(url.toString())}&header_Authorization=${encodeURIComponent(`${token}`)}`
    );

    const items = res?.data?.value?.WTD?.getResults || [];
    console.log("✅ Raw items:", items);

    const counts = {
      new: 0,
      review: 0,
      transfer: 0,
      bounce: 0,
    };

    for (const item of items) {
      const stateName = item?.state?.stateName;
      switch (stateName) {
        case "Withdraw-New":
          counts.new++;
          break;
        case "Withdraw-In-Review":
          counts.review++;
          break;
        case "Withdraw-Approve-IR":
        case "Withdraw-Approve":
          counts.transfer++;
          break;
        case "Third-Party-Refusal":
          counts.bounce++;
          break;
      }
    }

    console.log("🧮 TH39 counts:", counts);
    return counts;
  } catch (error: any) {

    const status = error?.response?.status;
    const code = error?.response?.data?.errorCode;

    if (status === 401 || code === "INVALID_TOKEN") {
      console.warn("Token invalid — retrying login...");
      localStorage.removeItem("th39_token");
      cachedToken = null;
      const newToken = await loginAndGetToken();
      return await fetchTH39Counts(pageNo, maxResult);
    }

    console.error("🔴 fetchTH39Counts error:", error);
    throw error;
  }
}
