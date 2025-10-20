import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";

const httpsAgent = new https.Agent({ rejectUnauthorized: false }); // allow self-signed SSL

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");

  if (!target) {
    return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Next.js Proxy)",
    };

    searchParams.forEach((value, key) => {
      if (key.startsWith("header_")) {
        headers[key.replace("header_", "")] = value;
      }
    });

    const response = await axios.get(target, {
      headers,
      httpsAgent,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("🔴 Proxy GET error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return NextResponse.json(
      {
        error: "Proxy GET request failed",
        details: error.message,
        status: error.response?.status,
        response: error.response?.data,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");

  if (!target) {
    return NextResponse.json({ error: "Missing target parameter" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "Content-Type": "application/json",
    };

    searchParams.forEach((value, key) => {
      if (key.startsWith("header_")) {
        headers[key.replace("header_", "")] = value;
      }
    });

    console.log("🟢 Proxying POST to:", target);
    console.log("Headers:", headers);
    console.log("Body:", body);

    const response = await axios.post(target, body, {
      headers,
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }),
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("🔴 Proxy POST error details:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return NextResponse.json(
      {
        error: "Proxy POST request failed",
        status: error.response?.status,
        remoteResponse: error.response?.data,
      },
      { status: 500 }
    );
  }
}
