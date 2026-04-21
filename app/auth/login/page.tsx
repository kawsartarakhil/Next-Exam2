"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useAuthStore, useLoginFormStore } from "@/src/authStore/page"


const loginRequest = async (payload: { email: string; password: string }) => {
  const { data } = await axios.post(`/api/Auth/login`, payload)
  return data
}

const Login = () => {
  const router = useRouter()
  const { setSession } = useAuthStore()

  const {
    email, password,
    fieldErrors, serverError,
    setField, setServerError,
    validate, getPayload, reset,
  } = useLoginFormStore()

  const { mutate: loginUser, isPending } = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      const token = data?.token || data?.accessToken || data?.data
      const refreshToken = data?.refreshToken || null

      setSession(token, refreshToken)
      reset()
      router.push("/feed")
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.title ||
        "Invalid email or password. Please try again."
      setServerError(msg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = validate()
    if (!isValid) return
    loginUser(getPayload())
  }

 

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden text-white">

      {/* Glow blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500 rounded-full blur-3xl opacity-40"></div>

      <div className="bg-[#111] w-[400px] rounded-3xl p-8 shadow-2xl">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold text-purple-400">Aether</h1>
          <p className="text-[12px] text-gray-400">
            THE FUTURE OF PROFESSIONAL NEXUS
          </p>
        </div>

        <div className="w-70 bg-black rounded-full p-1 mb-6 flex justify-center gap-3 ml-5 p-2">
          <button className="rounded-full bg-gray-800 w-30">
            Sign In
          </button>
          <Link href="/auth/register">
            <button className="text-gray-400">
              Register
            </button>
          </Link>
        </div>

        <div className="mb-4">
          <h2 className="text-lg">Welcome back</h2>
          <p className="text-xs text-gray-400">
            Enter your credentials to access your professional hub.
          </p>
        </div>

        {serverError && (
          <p className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-xl px-3 py-2 mb-3">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <p className="text-xs mb-1 text-gray-400">EMAIL ADDRESS</p>
            <input
              type="text"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setField("email", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>PASSWORD</span>
              <Link href="/auth/forgot-password">
                <span className="text-purple-400 cursor-pointer">FORGOT PASSWORD?</span>
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setField("password", e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-800 text-sm outline-none"
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-300 text-black font-semibold mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "SIGNING IN..." : "SIGN IN TO AETHER"}
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
            Apple ID
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Dont have an account?
          <Link href="/auth/register">
            <span className="text-purple-400 cursor-pointer">Sign In</span>
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login