const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Получить токен от Clerk
export const getClerkToken = async (getToken) => {
  try {
    const token = await getToken();
    return token;
  } catch (error) {
    console.error('Ошибка получения токена:', error);
    return null;
  }
};

// Простой API вызов с токеном
export const apiCall = async (url, options = {}, getToken) => {
  try {
    const token = await getClerkToken(getToken);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Строим полный URL правильно
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}/${url.replace(/^\/+/, '')}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    return response;
  } catch (error) {
    console.error('Ошибка API вызова:', error);
    throw error;
  }
}; 