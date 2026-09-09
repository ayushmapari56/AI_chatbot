import React from 'react';
import { testimonialsData } from '../data/siteData';

const Testimonials: React.FC = () => {
    return (
        <section className="testimonials">
            <h2>What Our Clients Say</h2>
            <div className="testimonials-container">
                {testimonialsData.map((testimonial, index) => (
                    <div key={index} className="testimonial">
                        <p>"{testimonial.quote}"</p>
                        <h4>- {testimonial.author}</h4>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Testimonials;