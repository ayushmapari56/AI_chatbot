import React from 'react';

const Services = () => {
    const servicesList = [
        { id: 1, title: 'Web Development', description: 'Building responsive and functional websites.' },
        { id: 2, title: 'Graphic Design', description: 'Creating visually appealing designs for various media.' },
        { id: 3, title: 'SEO Optimization', description: 'Improving website visibility on search engines.' },
        { id: 4, title: 'Digital Marketing', description: 'Promoting brands through digital channels.' },
    ];

    return (
        <section id="services" className="services">
            <h2>Our Services</h2>
            <div className="services-list">
                {servicesList.map(service => (
                    <div key={service.id} className="service-item">
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Services;