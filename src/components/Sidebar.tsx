import { Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";

export default function Sidebar() {
    return (
        <Drawer variant="permanent" sx={{ width: "250px", flexShrink: 0 }}>
            <List>
                <ListItemButton component={Link} href="/dashboard/wallet">
                    <ListItemText primary="Wallet" />
                </ListItemButton>
                <ListItemButton component={Link} href="/dashboard/trade">
                    <ListItemText primary="Trade" />
                </ListItemButton>
                <ListItemButton component={Link} href="/dashboard/quant">
                    <ListItemText primary="Quant" />
                </ListItemButton>
            </List>
        </Drawer>
    );
}
