import { Drawer, List, ListItem, ListItemText } from "@mui/material";
import Link from "next/link";

export default function Sidebar() {
    return (
        <Drawer variant="permanent" sx={{ width: "250px", flexShrink: 0 }}>
            <List>
                <ListItem button component={Link} href="/dashboard/wallet">
                    <ListItemText primary="Wallet" />
                </ListItem>
                <ListItem button component={Link} href="/dashboard/trade">
                    <ListItemText primary="Trade" />
                </ListItem>
                <ListItem button component={Link} href="/dashboard/quant">
                    <ListItemText primary="Quant" />
                </ListItem>
            </List>
        </Drawer>
    );
}
