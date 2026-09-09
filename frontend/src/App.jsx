import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/Home';
import { ExploreProductsPage } from './pages/Products/ExploreProductsPage';
import { ProductDetailPage } from './pages/Products/ProductDetailPage';
import { AddProductPage } from './pages/Products/AddProductPage';
import { MyProductsPage } from './pages/Products/MyProductsPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { NegotiationPage } from './pages/Offers/NegotiationPage';
import { OffersDashboardPage } from './pages/Offers/OffersDashboardPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ExploreProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="negotiation/:productId" element={<NegotiationPage />} />
        <Route path="negotiation/offer/:id" element={<NegotiationPage />} />
        <Route path="offers" element={<OffersDashboardPage />} />
        <Route path="dashboard" element={<MyProductsPage />} />
        <Route path="dashboard/products" element={<MyProductsPage />} />
        <Route path="dashboard/products/new" element={<AddProductPage />} />
        <Route path="dashboard/products/edit/:id" element={<AddProductPage />} />
        <Route path="dashboard/offers" element={<OffersDashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

