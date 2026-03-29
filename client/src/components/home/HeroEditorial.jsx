import React from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { valideURLConvert } from '@/utils/valideURLConvert';
import logo from '@/assets/logo.png';

export const HeroEditorial = () => {
    const categoryData = useSelector((state) => state.product.allCategory);
    const navigate = useNavigate();

    const firstCategory = categoryData?.[0];

    const handleRedirectProductListPage = (id, cat) => {
        const url = `/${valideURLConvert(cat)}-${id}`;
        navigate(url);
    };

    const handleExploreClick = () => {
        handleRedirectProductListPage(firstCategory._id, firstCategory.name);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buttonNew = (
        <Button
            onClick={() => {
                handleExploreClick();
                scrollToTop();
            }}
            className="rounded-full bg-orange-600 px-6 py-6 text-white font-bold hover:bg-orange-700 transition-all"
        >
            Khám phá ngay
        </Button>
    );

    return (
        <section>
            <header className="mb-12">
                <div className="mb-4 flex items-center gap-2">
                    <img src={logo} alt="EatEase logo" width={30} height={30} />
                    <p className="text-xl uppercase tracking-[0.2em] text-orange-600 font-bold">
                        EatEase Restaurant
                    </p>
                </div>
                <h1 className="text-5xl text-foreground md:text-7xl font-['Noto_Serif'] uppercase font-bold tracking-tighter leading-none">
                    <span className="block">Ẩm thực</span>
                    <span className="block text-highlight">tinh hoa</span>
                    <span className="block">Hương vị đẳng cấp</span>
                </h1>
            </header>

            <div className="mb-16 flex items-center justify-center">
                {buttonNew}
            </div>
        </section>
    );
};
