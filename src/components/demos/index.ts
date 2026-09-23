/**
 * Every element's demo, keyed by catalogue `id`. The gallery pages and superherotech.ai's
 * /elements/ pages both render demos from this map, so neither keeps its own list.
 *
 * Each demo takes an optional `assetBase` prop (default `/demo/`) naming where public/demo/
 * is served; the website passes `/elements-demo/`. Reference assets through `asset('<file>')`
 * so `npm run check` can find them.
 *
 * `npm run check` reads the `'<id>': Component` lines below, so keep one entry per line.
 */
import BeforeAfterDemo from './BeforeAfterDemo.astro';
import ParticleFieldDemo from './ParticleFieldDemo.astro';
import MegaMenuDemo from './MegaMenuDemo.astro';
import VideoBackgroundDemo from './VideoBackgroundDemo.astro';
import ParallaxBandDemo from './ParallaxBandDemo.astro';
import ScrollRevealDemo from './ScrollRevealDemo.astro';
import BusinessHoursDemo from './BusinessHoursDemo.astro';
import NewsTickerDemo from './NewsTickerDemo.astro';
import FlipBoxDemo from './FlipBoxDemo.astro';
import SocialGridDemo from './SocialGridDemo.astro';
import AccordionDemo from './AccordionDemo.astro';
import CardSliderDemo from './CardSliderDemo.astro';
import TabsDemo from './TabsDemo.astro';
import InfoListDemo from './InfoListDemo.astro';
import VideoPlayerDemo from './VideoPlayerDemo.astro';
import TestimonialCarouselDemo from './TestimonialCarouselDemo.astro';

// Astro components have no exported public type; this is the shape both callers need.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AstroComponent = (props: any) => any;

export const demos: Record<string, AstroComponent> = {
  'before-after': BeforeAfterDemo,
  'particle-field': ParticleFieldDemo,
  'mega-menu': MegaMenuDemo,
  'video-background': VideoBackgroundDemo,
  'parallax-band': ParallaxBandDemo,
  'scroll-reveal': ScrollRevealDemo,
  'business-hours': BusinessHoursDemo,
  'news-ticker': NewsTickerDemo,
  'flip-box': FlipBoxDemo,
  'social-grid': SocialGridDemo,
  accordion: AccordionDemo,
  'card-slider': CardSliderDemo,
  tabs: TabsDemo,
  'info-list': InfoListDemo,
  'video-player': VideoPlayerDemo,
  'testimonial-carousel': TestimonialCarouselDemo,
};
