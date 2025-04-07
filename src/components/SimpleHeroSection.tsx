import { Box, Button, Container, Typography } from "@mui/material";

export default function SimpleHeroSection() {
    return (
        <Container sx={{ display: "flex", alignItems: "center", minHeight: "80vh" }}>
            {/* 왼쪽 텍스트 섹션 */}
            <Box sx={{ flex: 1, textAlign: "left" }}>
                <Typography variant="h1" color="primary">
                    Secure & Modern <br /> Digital Asset Management
                </Typography>
                <Typography variant="body1" sx={{ margin: "20px 0" }}>
                    Join BlockBit and experience seamless crypto trading with top-tier security and innovative features.
                </Typography>
                <Button variant="contained" color="primary" sx={{ padding: "10px 20px", fontSize: "18px" }}>
                    Get Started
                </Button>
            </Box>

            {/* 오른쪽 백그라운드 이미지 */}
            <Box
                sx={{
                    flex: 1,
                    background: "url('/hero-bg.png') center/cover no-repeat",
                    minHeight: "400px",
                    borderRadius: "10px",
                }}
            />
        </Container>
    );
}
