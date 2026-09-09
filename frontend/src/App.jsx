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
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ExploreProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="dashboard" element={<MyProductsPage />} />
        <Route path="dashboard/products" element={<MyProductsPage />} />
        <Route path="dashboard/products/new" element={<AddProductPage />} />
        <Route path="dashboard/products/edit/:id" element={<AddProductPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

