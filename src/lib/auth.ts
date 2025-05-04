// 사용자 정보 인터페이스
export interface UserInfo {
    usiNum: number;
    usiEmail: string;
    usiName: string;
}

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

// 사용자 정보 세션 스토리지에 저장
export const setUserInfo = (userInfo: UserInfo) => {
    if (typeof window !== "undefined") {
        window.sessionStorage.setItem("auth_user", JSON.stringify(userInfo));
    }
};

// 사용자 정보 가져오기
export const getUserInfo = (): UserInfo | null => {
    if (typeof window !== "undefined") {
        const userInfo = window.sessionStorage.getItem("auth_user");
        if (userInfo) {
            return JSON.parse(userInfo);
        }
    }
    return null;
};

// 사용자 ID 가져오기
export const getUserId = (): number | null => {
    const userInfo = getUserInfo();
    return userInfo ? userInfo.usiNum : null;
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
        
        if (data.token) {
            setCookie("auth_token", data.token);
            
            // 사용자 정보 저장
            const userInfo: UserInfo = {
                usiNum: data.usiNum,
                usiEmail: data.usiEmail,
                usiName: data.usiName
            };
            setUserInfo(userInfo);
        }
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};

export const logout = () => {
    deleteCookie("auth_token");
    if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("auth_user");
    }
};

// API 요청 시 인증 정보를 포함하는 헬퍼 함수
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getCookie("auth_token");
    
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
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
