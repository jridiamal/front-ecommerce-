import styled from "styled-components";
import ProductBox from "./ProductBox";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); /* full responsive */
  gap: 20px;       /* espace entre cartes */
  width: 100%;
  padding: 0 10px;  /* padding mobile */
  box-sizing: border-box;
`;

export default function ProductsGrid({ products }) {
  return (
    <Grid>
      {products.map((p) => (
        <ProductBox
          key={p._id}
          _id={p._id}
          title={p.title}
          price={p.price}
          images={p.images}
          properties={p.properties}
          outOfStock={p.outOfStock}
          reference={p.reference}
        />
      ))}
    </Grid>
  );
}
