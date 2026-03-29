import React from 'react';

export const BentoGrid = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:gap-8">
            {/* Large Hero Tile */}
            <div className="md:col-span-4 lg:col-span-4 bg-white rounded-xl overflow-hidden group flex flex-col border border-[#C05E42]/5">
                <div className="relative flex-grow overflow-hidden m-2 rounded-lg aspect-[16/10] md:aspect-auto">
                    <img
                        alt="Signature Dish"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWgGZdfPxA2f7-LfZaCL-Wl1sa2xU_XNDz4WNLJ-nOXy3aHsrqVZYDPMmD4R_A1cs3T8y5qrU-ilDzZSPfI9usFKYsOlIo6KGfeguP9kB9bk9b4JzOCBxFcpiBIfTqXdGo3X68Zko-G4IkdasU0LqQonAP7HUEbsbTeedgmmKjWXE7zj3fWFx1ii4Y8N3Rl7z--BL-X8Hm9LJCp3ezC3-7WFYWFqxnqkYH8bmT_1DyyfRPkRCJ9QlG-tyg096uXoBRM6giBTg878Th"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c19]/70 via-[#1c1c19]/20 to-transparent flex items-end p-8">
                        <div>
                            <span className="bg-[#C05E42] text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block font-['Inter']">
                                The Signature Selection
                            </span>
                            <h2 className="text-white text-3xl md:text-5xl font-['Noto_Serif'] font-bold mb-2">
                                Dry-Aged Wagyu with Truffle Jus
                            </h2>
                            <p className="text-white/80 text-sm max-w-lg hidden md:block">
                                Ethically sourced beef aged for 45 days, served
                                with a velvet-smooth reduction of seasonal black
                                truffles.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 flex justify-between items-center">
                    <p className="text-[#56423d] font-['Inter'] text-xs md:text-sm uppercase tracking-widest font-semibold">
                        Market Selection • Seasonal
                    </p>
                    <button className="bg-[#ebe8e3] text-[#1c1c19] px-6 py-2 rounded-full font-['Inter'] text-xs font-bold uppercase tracking-widest hover:bg-[#C05E42] hover:text-white transition-all duration-300">
                        Discover More
                    </button>
                </div>
            </div>

            {/* Cuisine Categories */}
            <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-6">
                <h3 className="text-sm font-['Inter'] font-bold uppercase tracking-[0.2em] text-[#C05E42] px-2">
                    Cuisine Chapters
                </h3>
                <div className="grid grid-cols-2 gap-4 flex-grow">
                    {/* Starters */}
                    <a
                        className="relative group overflow-hidden rounded-xl aspect-square bg-[#f7f3ee] border border-[#C05E42]/5"
                        href="#"
                    >
                        <img
                            alt="Starters"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo_ZMDg1czZumEx-AS4Dg1BBk-UocfWpAaycYxCkEptlkY_Lve-w0Rq94rtNX2o9es1U9GCYr0uOwqOQWBA5cpMlSjzzLuC0dNN_GsVeb3jLZrNieXQJcxsq_5p4B2BZdzaYqkGTtne_5YdOs9GydaSziu5HluTGzn-WynJdRQTVi4sgqxqUBRKKczP3K3eMjUcOwsm6KRH7zUU7aKjn6b5ZQST1g2KrOLAI6Iv3-LMxNsXd19oH9f6dAVT_uIIlkFX631DxV6-xbQ"
                        />
                        <div className="absolute inset-0 bg-[#1c1c19]/30 flex items-center justify-center">
                            <span className="text-white font-['Noto_Serif'] text-lg md:text-xl font-bold">
                                Starters
                            </span>
                        </div>
                    </a>

                    {/* Mains */}
                    <a
                        className="relative group overflow-hidden rounded-xl aspect-square bg-[#f7f3ee] border border-[#C05E42]/5"
                        href="#"
                    >
                        <img
                            alt="Mains"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9JNqVau8WckNat2Z6yTpC-jkubSSFzBzg_4PJG20oRKdVxRzBK8tKcbARbnpoBSM24BUnHVn668wHPhgcwE3eZ4LDZ3_LizxB9CGZdPSkUF48_dTp7e39MQyeMw-V48tY1yayDaG9HnUszoaLlqGpbOQO88zrKvKkRVWvUFwR1E9v-TLWZbo7Ts3AE8ZpwzV2b4NXF9Q8IOyvicFpvaTaDjhFQxSyssIi9hW-jsAnsa_70OM_z-ag45wn4xUKXhQFvazm8ovUnJZl"
                        />
                        <div className="absolute inset-0 bg-[#1c1c19]/30 flex items-center justify-center">
                            <span className="text-white font-['Noto_Serif'] text-lg md:text-xl font-bold">
                                Mains
                            </span>
                        </div>
                    </a>

                    {/* Desserts */}
                    <a
                        className="relative group overflow-hidden rounded-xl aspect-square bg-[#f7f3ee] border border-[#C05E42]/5"
                        href="#"
                    >
                        <img
                            alt="Desserts"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs3yQbu_TG8vUWAipluUCZ8fBUhCCr57t2cFhmUycQ6nxmJHLxRIkSMC7QV5pBw52mL5RKRIFYwQmNwvANoVpayMAGfCcL-Ex-ySg0OjcVjs-lETO79mUZPiQ9Kt854whtntEuuvHEpwiiV0ULGPZPWqgYYOxuXJzkA7XXk6IGALXR79WSoiB06kfLsBldQfZqwoD0oFI546i0qi78LeAWVHZ1g6zkiQBZx4Ll8UZBkduNBYljVTQHUMe5MPq39OApCamkc7W_HeVc"
                        />
                        <div className="absolute inset-0 bg-[#1c1c19]/30 flex items-center justify-center">
                            <span className="text-white font-['Noto_Serif'] text-lg md:text-xl font-bold">
                                Desserts
                            </span>
                        </div>
                    </a>

                    {/* Cellar */}
                    <a
                        className="relative group overflow-hidden rounded-xl aspect-square bg-[#f7f3ee] border border-[#C05E42]/5"
                        href="#"
                    >
                        <img
                            alt="Wine"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAD_Tk3JJbqV-TRCs3TXEJsicBd0bVDmgsCzachWusHadmSFe4x1hr1ghKRQDtUEhKh5cI3ue4OQkYWiz_cnr5Mlsqn9mVEBnUNNZ78nbMaulFsjaE9KNsxtTlbKH61GIt07wF0Y-xd0S0a4GGxTnjVW8WfLkXRCZcfwy4WMx7g5l-EBOLUaT3nerCf8Pu6vhvqfiMvQXqLBt5mKprxV7gXXkZOu3_2eYcMm9MpXBx4EuKll9w7PYQpe3Uae2woQbIbIE2Kj25UaA3G"
                        />
                        <div className="absolute inset-0 bg-[#1c1c19]/30 flex items-center justify-center">
                            <span className="text-white font-['Noto_Serif'] text-lg md:text-xl font-bold">
                                Cellar
                            </span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};
