import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar = () => {
  return (
    <header className="app-header">
      <nav className="nav-links">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/employees" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Employees
        </NavLink>
        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Tasks
        </NavLink>
      </nav>
      <div className="header-brand">
        MERN stack developer practical task
      </div>
    </header>
  );
};

export default Navbar;
