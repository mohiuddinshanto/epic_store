"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";

type PerView = { mobile: number; tablet: number; desktop: number };

type Props = {
  items: ReactNode[];
  seconds: number;
  auto: boolean;
  perView: PerView;
  pagination: boolean;
  loop: boolean;
  ariaLabel?: string;
  spaceBetween?: number;
};

const maxPerView = (p: PerView) => Math.max(1, Math.ceil(p.mobile), Math.ceil(p.tablet), Math.ceil(p.desktop));

export function CarouselSlider({ items, seconds, auto, perView, pagination, loop, ariaLabel, spaceBetween = 20 }: Props) {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  const hasRoomToMove = items.length > maxPerView(perView);
  const canLoop = loop && hasRoomToMove;
  const useAutoplay = auto && hasRoomToMove;

  const arrows = hasRoomToMove && (
    <>
      <button
        ref={prevRef}
        type="button"
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-600 opacity-0 shadow-md transition-all hover:border-primary/40 hover:text-primary md:grid group-hover:opacity-100"
      >
        <FiChevronLeft size={20} />
      </button>
      <button
        ref={nextRef}
        type="button"
        aria-label="Next slide"
        className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-600 opacity-0 shadow-md transition-all hover:border-primary/40 hover:text-primary md:grid group-hover:opacity-100"
      >
        <FiChevronRight size={20} />
      </button>
    </>
  );

  return (
    <div className="group relative">
      {arrows}
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={spaceBetween}
        slidesPerView={perView.mobile}
        loop={canLoop}
        grabCursor
        touchRatio={1.1}
        onBeforeInit={(sw) => {
          if (prevRef.current && nextRef.current) {
            sw.params.navigation!.prevEl = prevRef.current;
            sw.params.navigation!.nextEl = nextRef.current;
          }
        }}
        onInit={(sw) => {
          if (prevRef.current && nextRef.current) {
            sw.navigation.init();
            sw.navigation.update();
          }
        }}
        autoplay={
          useAutoplay
            ? { delay: Math.max(1, seconds) * 1000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        pagination={pagination && hasRoomToMove ? { clickable: true, dynamicBullets: true } : false}
        breakpoints={{
          640: { slidesPerView: perView.tablet },
          1024: { slidesPerView: perView.desktop },
        }}
        className="carousel-swiper no-scrollbar !items-stretch"
        aria-label={ariaLabel}
      >
        {items.map((el, i) => (
          <SwiperSlide key={i} className="!h-auto">{el}</SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}