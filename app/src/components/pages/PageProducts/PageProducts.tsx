import Products from "~/components/pages/PageProducts/components/Products";
import Box from "@mui/material/Box";

export default function PageProducts() {
  console.log("PageProducts");

  return (
    <Box py={3}>
      <h2>Greentings from AWS js practitioner app!</h2>
      <Products />
    </Box>
  );
}
