export const API_BASE_URL = 'https://vitar.medi.lk/api';

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: any;
}

export interface VerifyResponse {
  success: boolean;
  message?: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Login successful',
          token: data.token || data.accessToken || data.data?.token,
          user: data.user || data.data?.user || { email },
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Login failed',
        };
      }
    } catch (error: any) {
      console.error('Login API error:', error);
      return {
        success: false,
        message: error?.message || 'Network error, please try again.',
      };
    }
  },

  async verifyEmail(email: string, otp: string): Promise<VerifyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });
      
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Email verified successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Verification failed',
        };
      }
    } catch (error: any) {
      console.error('Verify email API error:', error);
      return {
        success: false,
        message: error?.message || 'Network error, please try again.',
      };
    }
  },

  async resendOtp(email: string): Promise<ResendOtpResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'OTP sent successfully',
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Failed to resend OTP',
        };
      }
    } catch (error: any) {
      console.error('Resend OTP API error:', error);
      return {
        success: false,
        message: error?.message || 'Network error, please try again.',
      };
    }
  },
};
