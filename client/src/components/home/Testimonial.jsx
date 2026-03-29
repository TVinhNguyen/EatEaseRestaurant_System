import React from 'react';

export const Testimonial = () => {
    return (
        <div className="md:col-span-2 lg:col-span-3 bg-[#1c1c19] text-[#fdf9f4] rounded-xl p-8 lg:p-10 flex flex-col justify-center border border-white/5">
            <div className="mb-6 flex gap-1">
                <span className="text-[#C05E42] text-3xl">★</span>
                <span className="text-[#C05E42] text-3xl">★</span>
                <span className="text-[#C05E42] text-3xl">★</span>
            </div>
            <p className="text-xl lg:text-2xl font-['Noto_Serif'] italic leading-relaxed mb-6">
                &quot;A masterful display of technique and terroir. The Modern
                Epicurean isn&apos;t just a restaurant; it&apos;s a love letter
                to the ingredient.&quot;
            </p>
            <p className="font-['Inter'] text-[10px] uppercase tracking-[0.3em] opacity-60">
                — The Gastronomic Review
            </p>
        </div>
    );
};
