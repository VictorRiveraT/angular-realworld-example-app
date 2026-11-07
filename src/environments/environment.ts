// Detectamos si el navegador está corriendo en localhost o 127.0.0.1
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const environment = {
  // Si es local, production es false. Si es nube, es true.
  production: !isLocal,

  // LÓGICA DINÁMICA:
  // ¿Estoy en local? -> Usa localhost:8000
  // ¿Estoy en Vercel? -> Usa Render PHP
  phpApiUrl: isLocal 
    ? 'http://localhost:8000/api' 
    : 'https://slim-php-realworld-example-app.onrender.com/api',

  // ¿Estoy en local? -> Usa localhost:8085
  // ¿Estoy en Vercel? -> Usa Render Python
  pythonApiUrl: isLocal 
    ? 'http://localhost:8085/api' 
    : 'https://twodo-backend-python.onrender.com/api'
};
