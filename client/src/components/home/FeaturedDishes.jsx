import React from 'react';

const dishes = [
    {
        name: 'Hearth-Roasted Heritage Carrots',
        description:
            'Miso glaze, toasted pumpkin seeds, carrot-top chimichurri.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJP5OMhesP0Ibd9b5ngEEQO6-rxr8cWk0d8drprHVFtETf2xnsymIRAEfjsaFHaQp5CT0sx9NGb5pTKv4nCBcGaNE3Y2rFMuf5-qi5OYdqzxK6QyjVuLuUk8EFVsFmbzKvhbjC2pA-LGlYdwmNjyWvrQZoKePMyRZL9IUY5GdjUTCI9iRZsKSX6A58X3_66gp7FWst61OmmYd6h8if8JS4sR5higXGmmnboq7ExyhnXEJ0_omp70ejiKjB3ZSMnHADyJx_labzS6ng',
        category: 'Starter',
    },
    {
        name: 'Coastal Halibut & Saffron',
        description:
            'Leek fondue, crispy capers, saffron-infused beurre blanc.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH50FRuLxTtDnpVmRy5fOO90eW6TStIk_Q9C5itl2gIZF7oMEl2MJnHYhP5-ojmTkpbOGGIEWXbzQSZ_a5r5k2iHV5WEu6OebOW8PLzmh1YjIJnIMAN8eJCZyszSFSGalRNu_SP8HX3AJoUeANWs8BAdKktWfPLKCgGKKxVz84n3mId_D5EctfKiQWz5-MM2aI72wMh9XnrLimV5qerH3pINZMssGck_rwqzOIAvzQ9NezEYxtIS7ANo-xLr1MgfY7ylti8zVPmLeQ',
        category: 'Main',
    },
    {
        name: 'Summer Berry Soufflé',
        description:
            'Elderflower cream, wild strawberries, verbena shortbread.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARHYZwc7rpo3N_qrlYZ9u6qkVNK6fyEJkmcYLbyeFDtsSspSx2WkQAbTnCJkv8JAXiLOU7X3nu1WKa30OTuECIUU9n7nYmyteauRJfvZSiWR4wP-Xj2jC4Vl_sJQnfS7zqkEs6o70QpxiXrXhRiakgbHL2Wg1xO7dues63iNSX9kH3jBg7Qk4HdwJV9LlAJFWMIZz3vYoM2rXufaY79AK2YRCTuqzeSOaCj_qGtN3e1K4sJhuJ5_Y_YLqTcAeGtGLdGq5wwPo0Xo-S',
        category: 'Dessert',
    },
];

export const FeaturedDishes = () => {
    return (
        <div className="md:col-span-6 lg:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-3 flex justify-between items-end mb-2">
                <div>
                    <h3 className="text-3xl font-['Noto_Serif'] font-bold">
                        Featured Creations
                    </h3>
                    <p className="text-[#56423d] font-['Inter'] text-sm mt-1">
                        This month&apos;s highlighted plates from Executive Chef
                        Adrian Vance.
                    </p>
                </div>
                <a
                    className="text-[#C05E42] font-['Inter'] text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
                    href="#"
                >
                    View Full Menu <span className="text-sm">→</span>
                </a>
            </div>

            {dishes.map((dish, index) => (
                <div key={index} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-xl mb-4 aspect-[4/5] bg-[#f7f3ee]">
                        <img
                            alt={dish.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            src={dish.image}
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-[#1c1c19]">
                            {dish.category}
                        </div>
                    </div>
                    <h4 className="text-xl font-['Noto_Serif'] font-bold mb-1 group-hover:text-[#C05E42] transition-colors">
                        {dish.name}
                    </h4>
                    <p className="text-[#56423d] text-sm font-['Inter']">
                        {dish.description}
                    </p>
                </div>
            ))}
        </div>
    );
};
