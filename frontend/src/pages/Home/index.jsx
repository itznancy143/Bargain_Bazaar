import React from 'react';
import { HeroSection } from './HeroSection';
import { BargainingFlowSection } from './BargainingFlowSection';
import { CategoriesSection } from './CategoriesSection';
import { FeaturedProductsSection } from './FeaturedProductsSection';
import { TrustSection } from './TrustSection';
import { SellerCTASection } from './SellerCTASection';
import './Home.css';

export const HomePage = () => {
  return (
    <div className="home-page-root animate-fade-in">
      <HeroSection />
      <BargainingFlowSection />
      <CategoriesSection />
      <FeaturedProductsSection />
      <TrustSection />
      <SellerCTASection />
    </div>
  );
};
