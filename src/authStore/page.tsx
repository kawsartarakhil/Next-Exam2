import { create } from "zustand";
import { persist } from "zustand/middleware";


interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, refreshToken?: string | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,

      setSession: (token: string, refreshToken?: string | null) => {
        //this runs after sucessful login
        const payload = JSON.parse(atob(token.split(".")[1]));
        set({
          //store the token and user
          token, //Save access token
          refreshToken: refreshToken || null, //Save refresh token use refreshToken if it exists, otherwise null
          user: {
            //                payload.sid || payload.sub
            // Means:
            // use sid, but if it's missing, use sub
            // Because different JWTs store IDs under different keys.
            // Same for:
            // payload.name || payload.fullName
            // Use whichever exists.
            // That's defensive coding, because backends are rarely as organized as developers pretend.
            id: payload.sid || payload.sub,
            name: payload.name || payload.fullName,
            email: payload.email,
            role: payload.role,
          },
        });
      },

      clearSession: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: "aether-auth" },
  ),
);


interface RegisterFormState {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: string;
  fieldErrors: Record<string, string>;
  serverError: string;
  successMsg: string;
  setField: (name: string, value: string) => void;
  setRole: (role: string) => void;
  setServerError: (msg: string) => void;
  setSuccessMsg: (msg: string) => void;
  validate: () => boolean;
  getPayload: () => { fullName: string; email: string; phoneNumber: string; password: string; role: string };
  reset: () => void;
}

export const useRegisterFormStore = create<RegisterFormState>((set, get) => ({
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",

  role: "Candidate",

  fieldErrors: {},

  serverError: "",
  successMsg: "",

  setField: (name: string, value: string) =>
    set((state) => ({
      [name]: value, //dynamically updates mekna feilds ro
      fieldErrors: { ...state.fieldErrors, [name]: "" },
    })),

  setRole: (role: string) => set({ role }),

  setServerError: (msg: string) => set({ serverError: msg, successMsg: "" }), //sets an error message and clears success message
  setSuccessMsg: (msg: string) => set({ successMsg: msg, serverError: "" }), //sucess message ro clear mekna wa error message ra show mekna

  validate: () => {
    const { fullName, email, phoneNumber, password, confirmPassword } = get();
    const errors: Record<string, string> = {};

    if (fullName.trim() === "") {
      errors.fullName = "Full name is required";
    }

    if (email.trim() === "") {
      errors.email = "Email is required";
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //the pattern that should be for the email the acceptable syntax

      if (!emailPattern.test(email)) {
        errors.email = "Enter a valid email";
      }
    }
    if (phoneNumber.trim() === "") {
      errors.phoneNumber = "Phone number is required";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    set({ fieldErrors: errors });
    return Object.keys(errors).length === 0;// return kna true ro agar no errors basha
  },

  getPayload: () => {
    const { fullName, email, phoneNumber, password, role } = get();
    return { fullName, email, phoneNumber, password, role };
  },

  reset: () =>
    set({
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      role: "Candidate",
      fieldErrors: {},
      serverError: "",
      successMsg: "",
    }),
}));


interface LoginFormState {
  email: string;
  password: string;
  fieldErrors: Record<string, string>;
  serverError: string;
  setField: (name: string, value: string) => void;
  setServerError: (msg: string) => void;
  validate: () => boolean;
  clearSession: () => void;
  getPayload: () => { email: string; password: string };
  reset: () => void;
}

//baroye log in
export const useLoginFormStore = create<LoginFormState>((set, get) => ({
  email: "",
  password: "",
  fieldErrors: {},
  serverError: "",

  setField: (name: string, value: string) =>
    set((state) => ({
      [name]: value,
      fieldErrors: { ...state.fieldErrors, [name]: "" },
      serverError: "",
    })),

  setServerError: (msg: string) => set({ serverError: msg }),

  validate: () => {
    const { email, password } = get();
    const errors: Record<string, string> = {};

    if (email.trim() === "") {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email";
    }

    if (!password) errors.password = "Password is required";

    set({ fieldErrors: errors });
    return Object.keys(errors).length === 0;
  },

  clearSession: () => {
    set({
      fieldErrors: {},
      serverError: "",
      email: "",
      password: "",
    });
  },

  getPayload: () => {
    const { email, password } = get();
    return { email, password };
  },

  reset: () =>
    set({ email: "", password: "", fieldErrors: {}, serverError: "" }),
}));

