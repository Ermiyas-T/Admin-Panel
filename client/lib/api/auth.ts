import apiClient from "./client";
import { LoginResponse, MeResponse } from "@/types";

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};

export const getCurrentUser = async (): Promise<MeResponse["user"]> => {
  const response = await apiClient.get<MeResponse>("/auth/me", {
    skipLoginRedirect: true,
  });
  return response.data.user;
};
