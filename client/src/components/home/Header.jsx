import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, MessageSquare } from 'lucide-react';
import logo from '@/assets/logo.png';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaBoxOpen,
    FaCaretDown,
    FaCaretUp,
    FaCalendarAlt,
    FaHome,
    FaInfoCircle,
    FaPhone,
} from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import UserMenu from '@/components/UserMenu';
import { useGlobalContext } from '@/provider/GlobalProvider';
import defaultAvatar from '@/assets/defaultAvatar.png';
import Search from '@/components/Search';
import { valideURLConvert } from '@/utils/valideURLConvert';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSupportChat } from '@/contexts/SupportChatContext';

export const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const user = useSelector((state) => state?.user);
    const { unreadCount } = useSupportChat();
    const categoryData =
        useSelector((state) => state.product.allCategory) || [];
    const firstCategory = categoryData.length > 0 ? categoryData[0] : null;
    // eslint-disable-next-line no-unused-vars
    const { totalPrice, totalQty } = useGlobalContext();

    const links = [
        {
            href: '/',
            icon: <FaHome size={14} />,
            label: 'Trang chủ',
        },
        {
            href: firstCategory
                ? `/${valideURLConvert(firstCategory.name)}-${firstCategory._id}`
                : '/products',
            icon: <FaBoxOpen size={14} />,
            label: 'Thực đơn',
        },
        {
            href: '/about',
            icon: <FaInfoCircle size={14} />,
            label: 'Giới thiệu',
        },
        {
            href: '/contact',
            icon: <FaPhone size={14} />,
            label: 'Liên hệ',
        },
    ];

    const navigate = useNavigate();
    const [openUserMenu, setOpenUserMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (event) => {
            if (!menuRef.current) return;
            const isClickInside = menuRef.current.contains(event.target);
            const isToggleButton = event.target.closest(
                'button[aria-haspopup="true"]'
            );
            if (!isClickInside && !isToggleButton) {
                setOpenUserMenu(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') setOpenUserMenu(false);
        };
        document.addEventListener('mousedown', handleClick, true);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClick, true);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const toggleUserMenu = useCallback((e) => {
        e.stopPropagation();
        setOpenUserMenu((prev) => !prev);
    }, []);

    const closeMenu = useCallback(() => setOpenUserMenu(false), []);
    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

    const redirectToLoginPage = () => navigate('/login');

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleClickBooking = (e) => {
        if (!user?._id) {
            e.preventDefault();
            redirectToLoginPage();
        } else {
            scrollToTop();
        }
    };

    return (
        <nav className="fixed top-0 w-full z-50 liquid-glass-header font-semibold">
            <div className="h-20 flex justify-between items-center px-8 max-w-screen-2xl mx-auto w-full">
                {/* Brand Logo */}
                <Link
                    to="/"
                    onClick={scrollToTop}
                    className="flex items-center justify-center gap-1.5"
                >
                    <img src={logo} alt="EatEase logo" width={30} height={30} />
                    <span className="text-orange-800 font-['Noto_Serif'] font-bold text-2xl tracking-tighter">
                        EatEase
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-6 tracking-tight">
                    <nav className="flex items-center gap-6 text-sm">
                        {links.map((l) => {
                            return (
                                <Link
                                    key={l.href}
                                    to={l.href}
                                    className="hover:text-orange-500 transition-colors flex items-center gap-[6px]"
                                >
                                    {l.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <Link
                        to="/booking"
                        onClick={handleClickBooking}
                        className="bg-orange-700 text-white px-8 py-2 rounded-full text-sm font-medium tracking-wide hover:opacity-90 transition-all active:scale-95"
                    >
                        Đặt bàn
                    </Link>
                </div>

                {/* User Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <ThemeToggle />
                    <div className="flex items-center justify-end gap-5">
                        {user?._id ? (
                            <div className="flex items-center gap-4">
                                {user.role === 'ADMIN' && (
                                    <Link
                                        to="/dashboard/support-chat"
                                        className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                                        title="Hỗ trợ khách hàng"
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-[#1a1a1a]">
                                                {unreadCount > 9
                                                    ? '9+'
                                                    : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                )}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={toggleUserMenu}
                                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-background/15 transition-colors"
                                        aria-expanded={openUserMenu}
                                        aria-haspopup="true"
                                        aria-label="User menu"
                                        type="button"
                                    >
                                        <div className="relative p-0.5 overflow-hidden rounded-full liquid-glass-2">
                                            <img
                                                src={
                                                    user.avatar || defaultAvatar
                                                }
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full object-cover"
                                                width={32}
                                                height={32}
                                            />
                                        </div>
                                        <div className="flex flex-col items-start flex-1 min-w-0">
                                            <span className="text-sm font-medium truncate max-w-16 lg:max-w-20 xl:max-w-max">
                                                {user.name}
                                            </span>
                                            {user.role === 'ADMIN' && (
                                                <span className="text-xs text-highlight py-0.5 px-1 bg-background rounded-md">
                                                    Quản trị
                                                </span>
                                            )}
                                        </div>
                                        {openUserMenu ? (
                                            <FaCaretUp
                                                className="flex-shrink-0 ml-2"
                                                size={15}
                                            />
                                        ) : (
                                            <FaCaretDown
                                                className="flex-shrink-0 ml-2"
                                                size={15}
                                            />
                                        )}
                                    </button>
                                    <AnimatePresence>
                                        {openUserMenu && (
                                            <motion.div
                                                className="absolute right-0 top-full mt-2 z-50 w-64"
                                                initial={{
                                                    opacity: 0,
                                                    y: -10,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: -10,
                                                }}
                                                transition={{
                                                    duration: 0.15,
                                                    ease: 'easeOut',
                                                }}
                                            >
                                                <UserMenu
                                                    close={closeMenu}
                                                    menuTriggerRef={menuRef}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={redirectToLoginPage}
                                className="underline text-sm hover:text-foreground transition-colors"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <Sheet
                        open={isMobileMenuOpen}
                        onOpenChange={setIsMobileMenuOpen}
                    >
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-gray-700 bg-gray-800 hover:bg-gray-600 hover:text-lime-300"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="liquid-glass border-gray-800 p-0 w-72 flex flex-col"
                        >
                            <div className="flex items-center gap-1.5 px-4 py-4 border-b border-gray-800">
                                <Link
                                    to="/"
                                    onClick={scrollToTop}
                                    className="flex items-center gap-1.5"
                                >
                                    <img
                                        src={logo}
                                        alt="EatEase logo"
                                        width={25}
                                        height={25}
                                        className="h-5 w-5"
                                    />
                                    <span className="font-semibold tracking-wide">
                                        EatEase
                                    </span>
                                </Link>
                            </div>

                            <div className="px-2">
                                <Search />
                            </div>

                            <nav className="flex flex-col gap-1 mt-2 text-gray-200">
                                {links.map((l) => {
                                    const isBookingLink = l.href === '/booking';
                                    const handleClick = () => {
                                        if (isBookingLink && !user?._id) {
                                            redirectToLoginPage();
                                            closeMobileMenu();
                                        } else {
                                            closeMenu();
                                            closeMobileMenu();
                                            scrollToTop();
                                        }
                                    };
                                    return (
                                        <Link
                                            key={l.href}
                                            to={
                                                isBookingLink && !user?._id
                                                    ? '#'
                                                    : l.href
                                            }
                                            onClick={handleClick}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 hover:text-purple-400 transition-colors"
                                        >
                                            <span className="inline-flex items-center justify-center w-5 h-5">
                                                {l.icon}
                                            </span>
                                            <span className="text-sm">
                                                {l.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="mt-auto border-t border-gray-800 p-4">
                                <div className="flex items-center justify-center w-full gap-5">
                                    {user?._id ? (
                                        <div
                                            className="relative w-full"
                                            ref={menuRef}
                                        >
                                            <button
                                                onClick={toggleUserMenu}
                                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                                aria-expanded={openUserMenu}
                                                aria-haspopup="true"
                                                aria-label="User menu"
                                                type="button"
                                            >
                                                <div className="relative p-0.5 overflow-hidden rounded-full liquid-glass">
                                                    <img
                                                        src={
                                                            user.avatar ||
                                                            defaultAvatar
                                                        }
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                        width={32}
                                                        height={32}
                                                    />
                                                </div>
                                                <div className="flex flex-col items-start flex-1 min-w-0">
                                                    <span className="text-sm font-medium">
                                                        {user.name}
                                                    </span>
                                                    {user.role === 'ADMIN' && (
                                                        <span className="text-xs text-purple-400">
                                                            Quản trị viên
                                                        </span>
                                                    )}
                                                </div>
                                                {openUserMenu ? (
                                                    <FaCaretDown
                                                        className="flex-shrink-0 ml-2"
                                                        size={15}
                                                    />
                                                ) : (
                                                    <FaCaretUp
                                                        className="flex-shrink-0 ml-2"
                                                        size={15}
                                                    />
                                                )}
                                            </button>
                                            <AnimatePresence>
                                                {openUserMenu && (
                                                    <motion.div
                                                        className="absolute right-0 bottom-full mb-2 z-50 w-64"
                                                        initial={{
                                                            opacity: 0,
                                                            y: 10,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -10,
                                                        }}
                                                        transition={{
                                                            duration: 0.15,
                                                            ease: 'easeOut',
                                                        }}
                                                    >
                                                        <UserMenu
                                                            close={() => {
                                                                closeMenu();
                                                                closeMobileMenu();
                                                            }}
                                                            menuTriggerRef={
                                                                menuRef
                                                            }
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                redirectToLoginPage();
                                                closeMenu();
                                                closeMobileMenu();
                                                scrollToTop();
                                            }}
                                            className="w-full bg-lime-400 text-black font-medium rounded-lg px-6 py-2.5 hover:bg-lime-300 hover:shadow-md hover:scale-[1.02] transition-all"
                                        >
                                            Đăng nhập
                                        </button>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
};
