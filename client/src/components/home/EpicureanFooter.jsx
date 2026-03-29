import React from 'react';

export const EpicureanFooter = () => {
    return (
        <footer className="w-full border-t border-[#C05E42]/10 bg-[#fdf9f4]">
            <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 max-w-screen-2xl mx-auto">
                <div className="text-lg font-['Noto_Serif'] font-bold text-[#1c1c19]">
                    The Modern Epicurean
                </div>
                <div className="flex flex-wrap justify-center gap-8 font-['Inter'] text-xs uppercase tracking-[0.1em]">
                    <span className="text-[#56423d]">Hours: 5PM - 11PM</span>
                    <a
                        className="text-[#56423d] hover:text-[#C05E42] transition-colors"
                        href="#"
                    >
                        Instagram
                    </a>
                    <a
                        className="text-[#56423d] hover:text-[#C05E42] transition-colors"
                        href="#"
                    >
                        Facebook
                    </a>
                    <a
                        className="text-[#56423d] hover:text-[#C05E42] transition-colors"
                        href="#"
                    >
                        Policy
                    </a>
                    <a
                        className="text-[#56423d] hover:text-[#C05E42] transition-colors"
                        href="#"
                    >
                        Privacy
                    </a>
                </div>
                <div className="text-[10px] text-[#56423d] uppercase tracking-[0.1em]">
                    © 2024 The Modern Epicurean.
                </div>
            </div>
        </footer>
    );
};
