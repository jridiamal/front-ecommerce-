import styled from "styled-components";
import ProductBox from "./ProductBox";
const Grid = styled.div`
  display: grid;
  gap: 50px;
  margin-top: 50px;

  @media (min-width: 900px) {
    grid-template-columns: 1.1fr 1fr;
  }
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
