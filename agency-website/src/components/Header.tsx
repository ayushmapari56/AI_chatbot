import React from 'react';

const Header: React.FC = () => {
    return (
        <header>
            <div className="logo">
                <a href="#services" aria-label="Go to services">
                    <h1>
                        <span className="brand-main">Agen- </span>
                        <span className="bigtop">bigtop</span>
                        <br />
                        <span className="brand-sub">Ciy-social</span>
                    </h1>
                </a>
            </div>
            <nav>
                <ul>
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#portfolio">Portfolio</a></li>
                    <li><a href="#testimonials">Testimonials</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;