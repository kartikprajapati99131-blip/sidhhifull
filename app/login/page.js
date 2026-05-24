"use client"
import React, { useEffect } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/navigation'
import Loginform from '@/components/login'

const Login = () => {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    document.title = "login -furniture store"

    if (session) {
      router.replace('/')
    }
    else {
      router.replace('/login')
    }
  }, [session, router])

  return (
    <div>
      <Loginform />
    </div>
  )
}

export default Login
