"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useRegisterFormStore } from "@/src/authStore/page"

const registerRequest = async (payload) => {
  const { data } = await  axios.post("/api/Auth/register", payload)
  return data
}
const Register = () => {
  const router = useRouter()
  const {
    fullName, email, phoneNumber, password, confirmPassword,
    role, fieldErrors, serverError, successMsg,
    setField, setRole, setServerError, setSuccessMsg,
    validate, getPayload, reset,
  } = useRegisterFormStore()


  const { mutate: registerUser, isPending } = useMutation({
    mutationFn: registerRequest,
    onSuccess: () => {
      setSuccessMsg("Account created! Redirecting to login...")
      reset()
      setTimeout(() => router.push("/auth/login"), 1500)
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Registration failed. Please try again."
      setServerError(msg)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const isValid = validate()
    if (!isValid) return
    registerUser(getPayload())
  }
  return (
    <div className=" bg-black flex items-center justify-center text-white p-13">

      {/* Glow blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500 rounded-full blur-3xl opacity-40"></div>

      <div className="bg-[#111] w-[490px] rounded-3xl p-8 shadow-2xl">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-purple-400">Aether</h1>
          <p className="text-[12px] text-gray-400">
            THE FUTURE OF PROFESSIONAL NEXUS
          </p>
        </div>

        <div className=" w-70 bg-black rounded-full p-1 mb-6 flex justify-center gap-3 ml-18 p-2">
          <Link href="/auth/login">
            <button className="text-gray-400">
              Sign In
            </button>
          </Link>
          <button className="rounded-full bg-gray-800 w-30">
            Register
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-lg">Create your account</h2>
          <p className="text-xs text-gray-400">
            Join the future of professional networking.
          </p>
        </div>

      
        {serverError && (
          <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-xl px-3 py-2 mb-3">
            {serverError}
          </p>
        )}
        {successMsg && (
          <p className="text-xs text-green-400 bg-green-950 border border-green-800 rounded-xl px-3 py-2 mb-3">
            {successMsg}
          </p>
        )}

  
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setRole("Candidate")}
            className={`flex-1 bg-gray-900 rounded-xl p-2 text-xs ${role === "Candidate" ? "border border-purple-500" : "text-gray-400"}`}
          >
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole("Organization")}
            className={`flex-1 bg-gray-900 rounded-xl p-2 text-xs ${role === "Organization" ? "border border-purple-500" : "text-gray-400"}`}
          >
            Organization
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-5">

            <div className="mb-3">
              <p className="text-xs mb-1 text-gray-400">FULL NAME</p>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
              />
              {fieldErrors.fullName && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs mb-1 text-gray-400">EMAIL ADDRESS</p>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setField("email", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs mb-1 text-gray-400">PHONE NUMBER</p>
              <input
                type="text"
                placeholder="+992..."
                value={phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
              />
              {fieldErrors.phoneNumber && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.phoneNumber}</p>
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs mb-1 text-gray-400">PASSWORD</p>
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setField("password", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs mb-1 text-gray-400">CONFIRM PASSWORD</p>
              <input
                type="password"
                placeholder="confirm password"
                value={confirmPassword}
                onChange={(e) => setField("confirmPassword", e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 text-black font-semibold mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mb-3">
          OR CONTINUE WITH
        </p>

        <div className="flex gap-2 mb-4">
          <button
            className="flex-1 bg-gray-900 p-2 rounded-xl text-sm"
          >
            Google
          </button>
          <button
            className="flex-1 bg-gray-900 p-2 rounded-xl text-sm"
          >
            GitHub
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Already have an account?
          <Link href="/auth/login">
            <span className="text-purple-400 cursor-pointer">Sign In</span>
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register