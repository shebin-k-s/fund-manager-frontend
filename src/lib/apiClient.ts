import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  let accessToken = localStorage.getItem("auth_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url?.includes('/unlock')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "/api/refresh",
          {},
          { withCredentials: true }
        );

        const accessToken = res.data.accessToken;
        localStorage.setItem("auth_token", accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch {
        
        localStorage.removeItem("auth_token");
        setTimeout(() => {
          window.location.href = "/unlock";
        }, 500);

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;