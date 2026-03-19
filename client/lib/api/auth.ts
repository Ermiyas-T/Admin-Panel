import apiClient from "./client";
import { persistAuthSession } from "@/lib/auth/auth-session-storage";
import { LoginResponse } from "@/types";

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  const data = response.data;

  // Persisting the session lives in one helper so the API layer and store
  // always stay in sync about which keys are used.
  persistAuthSession(data);

  return data;
};
