import styled from "styled-components";
import ProductBox from "./ProductBox";

const Grid = styled.div`
  display: grid;
  /* 2 colonnes sur mobile, 3 sur tablette, 4 sur desktop */
  grid-template-columns: 1fr 1fr; 
  gap: 15px;

  @media screen and (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
  }

  @media screen and (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
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
