import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import './Layout.css';

export const Layout = () => {
  return (
    <div className="app-layout-wrapper">
      <Navbar />
      <main className="app-main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
