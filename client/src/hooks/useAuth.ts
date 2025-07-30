import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const token = localStorage.getItem("authToken");
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: () => {
      if (!token) {
        throw new Error("No token");
      }
      return apiRequest("GET", "/api/auth/user", undefined, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    retry: false,
    enabled: !!token,
  });

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    logout: () => {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    },
  };
}
