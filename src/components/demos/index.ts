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
import AnimatedTextDemo from './AnimatedTextDemo.astro';
import CookieConsentDemo from './CookieConsentDemo.astro';
import IconDemo from './IconDemo.astro';
import AnimatedBackgroundDemo from './AnimatedBackgroundDemo.astro';
import ModalDemo from './ModalDemo.astro';
import AnnouncementBarDemo from './AnnouncementBarDemo.astro';
import HotspotDemo from './HotspotDemo.astro';
import InfoCircleDemo from './InfoCircleDemo.astro';
import SlideBoxDemo from './SlideBoxDemo.astro';
import CountdownDemo from './CountdownDemo.astro';
import ContentToggleDemo from './ContentToggleDemo.astro';
import OffCanvasDemo from './OffCanvasDemo.astro';
import VideoGalleryDemo from './VideoGalleryDemo.astro';
import MapDemo from './MapDemo.astro';
import LinkEffectsDemo from './LinkEffectsDemo.astro';
import TabcordionDemo from './TabcordionDemo.astro';
import TooltipDemo from './TooltipDemo.astro';
import ResponsiveTableDemo from './ResponsiveTableDemo.astro';
import NoticeDemo from './NoticeDemo.astro';
import ToastDemo from './ToastDemo.astro';
import LoadingDemo from './LoadingDemo.astro';

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
  'animated-text': AnimatedTextDemo,
  'cookie-consent': CookieConsentDemo,
  icon: IconDemo,
  'animated-background': AnimatedBackgroundDemo,
  modal: ModalDemo,
  'announcement-bar': AnnouncementBarDemo,
  hotspot: HotspotDemo,
  'info-circle': InfoCircleDemo,
  'slide-box': SlideBoxDemo,
  countdown: CountdownDemo,
  'content-toggle': ContentToggleDemo,
  'off-canvas': OffCanvasDemo,
  'video-gallery': VideoGalleryDemo,
  map: MapDemo,
  'link-effects': LinkEffectsDemo,
  tabcordion: TabcordionDemo,
  tooltip: TooltipDemo,
  'responsive-table': ResponsiveTableDemo,
  notice: NoticeDemo,
  toast: ToastDemo,
  loading: LoadingDemo,
};
