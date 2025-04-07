export const setCookie = (name: string, value: string, days: number = 7) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + value + expires + "; path=/";
};

export const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
};

export const deleteCookie = (name: string) => {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export const isLoggedIn = () => {
    if (typeof window !== "undefined") {
        return getCookie("auth_token") !== null;
    }
    return false;
};

export const login = async (email: string, password: string) => {
    try {
        const response = await fetch('http://localhost:8080/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usiEmail : email, usiPwd : password }),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        
        if (data.auth_token) {
            setCookie("auth_token", data.auth_token);
        }
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};

export const logout = () => {
    deleteCookie("auth_token");
};

// API 요청 시 인증 정보를 포함하는 헬퍼 함수
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
    });
    
    if (response.status === 401) {
        logout();
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    
    return response;
};
