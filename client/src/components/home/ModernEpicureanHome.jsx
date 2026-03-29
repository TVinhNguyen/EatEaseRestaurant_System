import React from 'react';
import { Header } from './Header';
import { HeroEditorial } from './HeroEditorial';
import { BentoGrid } from './BentoGrid';
import { FeaturedDishes } from './FeaturedDishes';
import { ReservationBlock } from './ReservationBlock';
import { Testimonial } from './Testimonial';
import { EpicureanFooter } from './EpicureanFooter';

export const ModernEpicureanHome = () => {
    return (
        <div className="text-[#1c1c19]">
            {/* Header/Navigation */}
            <Header />

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-screen-2xl mx-auto">
                {/* Hero Editorial Section */}
                <HeroEditorial />

                {/* Bento Grid Layout */}
                <BentoGrid />

                {/* Featured Creations Section */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-6 gap-6">
                    <FeaturedDishes />
                </div>

                {/* Reservation & Testimonial Section */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-6 gap-6">
                    <ReservationBlock />
                    <Testimonial />
                </div>
            </main>

            {/* Footer */}
            <EpicureanFooter />
        </div>
    );
};

export default ModernEpicureanHome;
