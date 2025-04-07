import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        primary: { main: "#1976D2" }, // 파란색
        secondary: { main: "#D32F2F" }, // 빨간색
        background: { default: "#FFFFFF" }, // 흰색 배경
        text: { primary: "#333333", secondary: "#666666" },
    },
    typography: {
        fontFamily: "Roboto, sans-serif",
        h1: { fontSize: "48px", fontWeight: "bold" }, // 메인 타이틀 크기
        h2: { fontSize: "36px", fontWeight: "bold" }, // 서브 타이틀
        body1: { fontSize: "18px" }, // 기본 텍스트
    },
    shape: { borderRadius: 8 },
});

export default theme;
