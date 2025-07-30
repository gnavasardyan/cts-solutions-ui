import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
    staleTime: 0, // Always refetch to get latest auth state
    refetchOnWindowFocus: true,
  });

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated: !!user && !!token,
    logout: () => {
      localStorage.removeItem("authToken");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
      window.location.href = "/login";
    },
  };
}
