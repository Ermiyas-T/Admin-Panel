import apiClient from "./client";
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

  // Persist tokens and user info for the rest of the app to use
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("token", data.accessToken); // legacy key for compatibility
  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem(
    "permissions",
    JSON.stringify(data.user.permissions ?? []),
  );

  return data;
};