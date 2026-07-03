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
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
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

export const trackingApi = {
  async getDriverNurses(
    driverId: string,
    token: string | null,
  ): Promise<{ success: boolean; nurses: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/tracking/driver/${driverId}/nurses`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const nurses =
          Array.isArray(data) ? data :
          Array.isArray(data.nurses) ? data.nurses :
          Array.isArray(data.data) ? data.data :
          [];
        return { success: true, nurses };
      }
      return { success: false, nurses: [], message: data.message || 'Failed to fetch assigned nurses' };
    } catch (error: any) {
      console.error('Tracking API error:', error);
      return { success: false, nurses: [], message: error?.message || 'Network error' };
    }
  },

  async getAllLocations(
    token: string | null,
  ): Promise<{ success: boolean; locations: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/tracking/admin/locations`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const locations =
          Array.isArray(data) ? data :
          Array.isArray(data.locations) ? data.locations :
          Array.isArray(data.data) ? data.data :
          [];
        return { success: true, locations };
      }
      return { success: false, locations: [], message: data.message || 'Failed to fetch locations' };
    } catch (error: any) {
      console.error('Tracking API error:', error);
      return { success: false, locations: [], message: error?.message || 'Network error' };
    }
  },
};

function authHeaders(token: string | null): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const tripsApi = {
  async getAll(token: string | null): Promise<{ success: boolean; trips: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/trips`, { headers: authHeaders(token) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const trips = Array.isArray(data) ? data : Array.isArray(data.trips) ? data.trips : Array.isArray(data.data) ? data.data : [];
        return { success: true, trips };
      }
      return { success: false, trips: [], message: data.message || 'Failed to fetch trips' };
    } catch (error: any) {
      return { success: false, trips: [], message: error?.message || 'Network error' };
    }
  },

  async create(tripData: Record<string, any>, token: string | null): Promise<{ success: boolean; trip?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(tripData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, trip: data.trip ?? data.data ?? data };
      return { success: false, message: data.message || 'Failed to create trip' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error' };
    }
  },
};

export const vehiclesApi = {
  async getAll(token: string | null): Promise<{ success: boolean; vehicles: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, { headers: authHeaders(token) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const vehicles = Array.isArray(data) ? data : Array.isArray(data.vehicles) ? data.vehicles : Array.isArray(data.data) ? data.data : [];
        return { success: true, vehicles };
      }
      return { success: false, vehicles: [], message: data.message || 'Failed to fetch vehicles' };
    } catch (error: any) {
      return { success: false, vehicles: [], message: error?.message || 'Network error' };
    }
  },

  async create(vehicleData: Record<string, any>, token: string | null): Promise<{ success: boolean; vehicle?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(vehicleData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, vehicle: data.vehicle ?? data.data ?? data };
      return { success: false, message: data.message || 'Failed to create vehicle' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error' };
    }
  },
};

export const patientsApi = {
  async getAll(token: string | null): Promise<{ success: boolean; patients: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, { headers: authHeaders(token) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const patients = Array.isArray(data) ? data : Array.isArray(data.patients) ? data.patients : Array.isArray(data.data) ? data.data : [];
        return { success: true, patients };
      }
      return { success: false, patients: [], message: data.message || 'Failed to fetch patients' };
    } catch (error: any) {
      return { success: false, patients: [], message: error?.message || 'Network error' };
    }
  },

  async create(patientData: Record<string, any>, token: string | null): Promise<{ success: boolean; patient?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(patientData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, patient: data.patient ?? data.data ?? data };
      return { success: false, message: data.message || 'Failed to register patient' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error' };
    }
  },
};

export const usersApi = {
  async getAll(token: string | null): Promise<{ success: boolean; users: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, { headers: authHeaders(token) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const users = Array.isArray(data) ? data : Array.isArray(data.users) ? data.users : Array.isArray(data.data) ? data.data : [];
        return { success: true, users };
      }
      return { success: false, users: [], message: data.message || 'Failed to fetch users' };
    } catch (error: any) {
      return { success: false, users: [], message: error?.message || 'Network error' };
    }
  },

  async create(userData: Record<string, any>, token: string | null): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(userData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, user: data.user ?? data.data ?? data };
      return { success: false, message: data.message || 'Failed to register user' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error' };
    }
  },
};

export const rolesApi = {
  async getAll(token: string | null): Promise<{ success: boolean; roles: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, { headers: authHeaders(token) });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const roles = Array.isArray(data) ? data : Array.isArray(data.roles) ? data.roles : Array.isArray(data.data) ? data.data : [];
        return { success: true, roles };
      }
      return { success: false, roles: [], message: data.message || 'Failed to fetch roles' };
    } catch (error: any) {
      return { success: false, roles: [], message: error?.message || 'Network error' };
    }
  },

  async create(roleData: Record<string, any>, token: string | null): Promise<{ success: boolean; role?: any; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(roleData),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, role: data.role ?? data.data ?? data };
      return { success: false, message: data.message || 'Failed to create role' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Network error' };
    }
  },
};
