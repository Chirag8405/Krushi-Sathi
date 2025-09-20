/**
 * Shared code between client and server
 */

export interface DemoResponse {
  message: string;
}

export type LangCode = "en" | "ml" | "hi" | "mr" | "kn" | "gu" | "te";

export interface AdvisoryRequest {
  question?: string;
  imageBase64?: string; // optional data URL or base64 string
  lang: LangCode;
}

export interface AdvisoryResponse {
  title: string;
  text: string;
  steps: string[];
  lang: LangCode;
  source: "template" | "ai";
}

export interface AdvisoryRecord extends AdvisoryResponse {
  id: string;
  userId: string;
  createdAt: string; // ISO timestamp
}

export interface SaveAdvisoryRequest {
  userId: string;
  advisory: AdvisoryResponse;
}

export interface ListAdvisoriesResponse {
  items: AdvisoryRecord[];
}

export interface UpdatesResponse {
  weather: {
    temperatureC: number | null;
    windKph: number | null;
    description: string;
  };
  market: Array<{ crop: string; pricePerKgInr: number }>;
  schemes: Array<{ title: string; status: string }>;
}
