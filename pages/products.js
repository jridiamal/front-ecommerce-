import Header from "@/components/Header";
import styled from "styled-components";
import Center from "@/components/Center";
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import ProductsGrid from "@/components/ProductsGrid";
import Title from "@/components/Title";

const PageContent = styled.div`
  margin-top: 10px; 
  padding: 20px 0;
`;

export default function ProductsPage({ products }) {
  return (
    <>
      <Header />
      <PageContent>
        <Center>
          <Title>tous les produits</Title>
          <ProductsGrid products={products} />
        </Center>
      </PageContent>
    </>
  );
}

export async function getServerSideProps() {
  await mongooseConnect();
  const products = await Product.find({}, null, { sort: { _id: -1 } });
  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
    },
  };
}
