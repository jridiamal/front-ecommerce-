import Header from "@/components/Header";
import Center from "@/components/Center";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { mongooseConnect } from "@/lib/mongoose";
import ProductsGrid from "@/components/ProductsGrid";
import styled from "styled-components";
import Link from "next/link";

// --- STYLES ---

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 40px;
  margin-bottom: 30px;
`;

const PrimaryBlue = "#007bff";

const BackArrow = styled(Link)`
  text-decoration: none;
  font-size: 2.2rem;
  color: ${PrimaryBlue};
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  &:hover {
    transform: translateX(-5px);
  }
`;

const CategoryTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: ${PrimaryBlue};
  text-transform: capitalize;
  @media screen and (max-width: 768px) {
    font-size: 1.6rem;
  }
`;

const NoProducts = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-top: 20px;
`;

// --- COMPOSANT ---

export default function CategoryPage({ category, products }) {
  if (!category) {
    return (
      <>
        <Header />
        <Center>
          <CategoryHeader>
            <BackArrow href={"/categories"}>←</BackArrow>
            <CategoryTitle>Catégorie non trouvée</CategoryTitle>
          </CategoryHeader>
        </Center>
      </>
    );
  }

  return (
    <>
      <Header />
      <Center>
        <CategoryHeader>
          {/* Flèche de retour bleue vers la page de toutes les catégories */}
          <BackArrow href={"/categories"}>←</BackArrow>
          <CategoryTitle>{category.name}</CategoryTitle>
        </CategoryHeader>
        
        {products.length > 0 ? (
          <ProductsGrid products={products} />
        ) : (
          <NoProducts>Aucun produit trouvé dans cette catégorie.</NoProducts>
        )}
      </Center>
    </>
  );
}

// --- SERVEUR ---

export async function getServerSideProps(context) {
  await mongooseConnect();
  
  const categoryId = context.query.id; 

  try {
    const category = await Category.findById(categoryId).lean();
    
    if (!category) {
        return { notFound: true }; 
    }

    const products = await Product.find({ category: categoryId }, null, {sort:{'_id':-1}}).lean();
    
    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        products: JSON.parse(JSON.stringify(products)),
      }
    };
  } catch (e) {
    return { notFound: true };
  }
}