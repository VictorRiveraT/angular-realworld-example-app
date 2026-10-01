import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { JwtService } from "../auth/services/jwt.service";
import { USE_PYTHON_API } from "./api-context.token";

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);

  // Cada API recibe el token que ella misma emitió durante el login.
  const token = req.context.get(USE_PYTHON_API)
    ? window.localStorage.getItem("python_token")
    : jwtService.getToken();

  let scheme: string = "Token"; // Default for PHP (RealWorld spec)

  // 1. Adjust only the prefix ("Token" vs "Bearer")
  if (req.context.get(USE_PYTHON_API)) {
    // FastAPI (Python) uses the OAuth2 standard "Bearer"
    scheme = "Bearer";
  }

  // 2. Clone the request and add the header if token exists
  const request = req.clone({
    setHeaders: {
      // If token exists, we inject: Authorization: Bearer xxxxx
      ...(token ? { Authorization: `${scheme} ${token}` } : {}),
    },
  });

  return next(request);
};
