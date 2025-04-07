"use client";

import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button, Container, TextField, Typography } from "@mui/material";
import SignUp from "@/app/signup/SignUp";

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = () => {
        login();
        router.push("/dashboard"); // 로그인 후 대시보드 이동
    };

    return (
       <SignUp></SignUp>
    );
}
