import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Axios from '../utils/Axios';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiArrowRight, FiSkipForward, FiStar, FiGift } from 'react-icons/fi';
import { MdOutlineQrCodeScanner } from 'react-icons/md';

export default function CustomerCheckinPage() {
    const [searchParams] = useSearchParams();
    const tableId = searchParams.get('tableId') || '';
    const tableNumber = decodeURIComponent(searchParams.get('tableNumber') || '');
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [returnCustomer, setReturnCustomer] = useState(null); // Khách cũ quay lại

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        // Nếu đang hiện thông tin khách cũ mà người dùng thay đổi, xóa đi
        if (returnCustomer) setReturnCustomer(null);
    };

    // Bỏ qua – Guest mode
    const handleSkip = () => {
        sessionStorage.setItem('tableSession', JSON.stringify({
            tableId, tableNumber, isGuest: true,
        }));
        navigate(`/table-menu`);
    };

    // Nhập thông tin – lưu loyalty (US – Customer Check-in)
    const handleCheckin = async (e) => {
        e.preventDefault();
        if (!form.phone || form.phone.trim().length < 9) {
            toast.error('Vui lòng nhập số điện thoại hợp lệ để tích điểm.');
            return;
        }
        setLoading(true);
        try {
            const res = await Axios({
                url: '/api/customer/checkin',
                method: 'POST',
                data: { name: form.name.trim(), phone: form.phone.trim() },
            });
            if (res.data?.success) {
                const customer = res.data.data;
                const isNew = res.data.isNewCustomer;

                sessionStorage.setItem('tableSession', JSON.stringify({
                    tableId, tableNumber,
                    isGuest: false,
                    customerId: customer._id,
                    customerName: customer.name || form.name,
                    customerPhone: customer.phone,
                    totalPoints: customer.totalPoints,
                    visitCount: customer.visitCount,
                }));

                if (isNew) {
                    toast.success(`🎉 Chào mừng ${form.name || 'bạn'}! Tài khoản loyalty đã được tạo.`);
                } else {
                    // Hiện loyalty card trước khi vào menu
                    setReturnCustomer(customer);
                    return; // Dừng ở đây, đợi user bấm "Vào Menu"
                }

                navigate(`/table-menu`);
            }
        } catch (_err) {
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Hiện loyalty card cho khách cũ → bấm vào menu
    if (returnCustomer) {
        const hasPoints = (returnCustomer.totalPoints || 0) > 0;
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    {/* Welcome back card */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        {/* Card header */}
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 pt-8 pb-6 text-white text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="absolute rounded-full bg-white"
                                        style={{ width: `${40 + i * 20}px`, height: `${40 + i * 20}px`, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3 }}
                                    />
                                ))}
                            </div>
                            <div className="relative">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">
                                    👋
                                </div>
                                <h2 className="text-xl font-bold">Chào mừng trở lại!</h2>
                                <p className="text-lg font-semibold mt-1 text-white/90">
                                    {returnCustomer.name || form.phone}
                                </p>
                                {tableNumber && (
                                    <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-sm mt-2">
                                        Bàn {tableNumber}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Loyalty stats */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
                                    <FiStar className="mx-auto text-orange-500 text-xl mb-1" />
                                    <p className="text-2xl font-bold text-orange-600">
                                        {returnCustomer.totalPoints || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">Điểm tích lũy</p>
                                </div>
                                <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
                                    <FiGift className="mx-auto text-amber-500 text-xl mb-1" />
                                    <p className="text-2xl font-bold text-amber-600">
                                        {returnCustomer.visitCount || 1}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">Lần ghé thăm</p>
                                </div>
                            </div>

                            {hasPoints && (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2">
                                    <FiGift className="text-yellow-500 flex-shrink-0" />
                                    <p className="text-sm text-yellow-800">
                                        Bạn có <strong>{returnCustomer.totalPoints} điểm</strong> – có thể dùng để đổi ưu đãi!
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/table-menu')}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-200"
                            >
                                Vào Menu ngay 🍽️
                                <FiArrowRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main check-in form
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Top bar */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-white text-center">
                        <div className="w-16 h-16 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MdOutlineQrCodeScanner className="text-white text-4xl" />
                        </div>
                        <h1 className="text-2xl font-bold">EatEase</h1>
                        <p className="text-white/80 text-sm mt-1">Nhà hàng thông minh</p>
                        {tableNumber && (
                            <div className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mt-3">
                                🪑 Bàn {tableNumber}
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Heading */}
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-gray-800">Chào mừng bạn!</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Nhập thông tin để <strong className="text-orange-500">tích điểm loyalty</strong>, hoặc bỏ qua để xem menu ngay.
                            </p>
                        </div>

                        {/* Loyalty perks preview */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-3.5 flex items-start gap-3">
                            <FiStar className="text-orange-500 text-lg mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-gray-600">
                                <p className="font-semibold text-orange-700">Tích điểm mỗi lần ăn</p>
                                <p>Đổi điểm lấy ưu đãi &amp; món miễn phí!</p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCheckin} className="space-y-3">
                            <div className="relative">
                                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Tên của bạn (tùy chọn)"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 text-gray-800 placeholder-gray-400 transition"
                                />
                            </div>
                            <div className="relative">
                                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Số điện thoại *"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 text-gray-800 placeholder-gray-400 transition"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !form.phone}
                                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-orange-200"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        Xác nhận &amp; Xem menu
                                        <FiArrowRight />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-gray-400 text-xs">hoặc</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Skip */}
                        <button
                            onClick={handleSkip}
                            className="w-full flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-orange-300 text-gray-500 hover:text-orange-500 font-medium py-3 rounded-xl transition-all duration-200"
                        >
                            <FiSkipForward />
                            Bỏ qua – Xem menu ngay
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            🔒 Thông tin chỉ dùng để tích điểm, không chia sẻ bên ngoài.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
