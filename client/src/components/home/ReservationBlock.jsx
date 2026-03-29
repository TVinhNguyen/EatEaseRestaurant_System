import React from 'react';

export const ReservationBlock = () => {
    return (
        <div className="md:col-span-4 lg:col-span-3 bg-[#f1ede8] rounded-xl p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-center border border-[#C05E42]/10">
            <div className="flex-1">
                <h3 className="text-3xl font-['Noto_Serif'] font-bold mb-4">
                    Secure Your Table
                </h3>
                <p className="text-[#56423d] font-['Inter'] text-sm mb-6">
                    Experience our tasting menu, available Tuesday through
                    Sunday. Recommended bookings are 2 weeks in advance.
                </p>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-3 border border-[#C05E42]/5">
                        <span className="text-[#C05E42] text-lg">📅</span>
                        <span className="text-xs font-medium">Select Date</span>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-3 border border-[#C05E42]/5">
                        <span className="text-[#C05E42] text-lg">👥</span>
                        <span className="text-xs font-medium">2 Guests</span>
                    </div>
                </div>
            </div>
            <button className="w-full md:w-auto bg-[#C05E42] text-white px-10 py-5 rounded-full font-['Inter'] text-sm font-bold uppercase tracking-[0.15em] shadow-lg shadow-[#C05E42]/20 hover:scale-[1.02] active:scale-95 transition-all">
                Find Availability
            </button>
        </div>
    );
};
