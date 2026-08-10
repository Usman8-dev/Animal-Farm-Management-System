import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
// });

const api = axios.create({
  baseURL: "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("token");
//       window.location.href = "/";
//     }
//     return Promise.reject(error);
//   }
// );

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";

      // Do NOT redirect on login / register failures
      const isAuthEndpoint =
        url.includes("/user/login") ||
        url.includes("/user/register");

      if (!isAuthEndpoint) {
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    }

    return Promise.reject(error); // always re-throw so your catch block still works
  }
);

export default api;