import React from 'react';
import { portfolioItems } from '../data/siteData';

const Portfolio: React.FC = () => {
    return (
        <section id="portfolio">
            <h2>Our Portfolio</h2>
            <div className="portfolio-items">
                {portfolioItems.map((item) => (
                    <div key={item.id} className="portfolio-item">
                        <img src={item.image} alt={item.title} />
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Portfolio;