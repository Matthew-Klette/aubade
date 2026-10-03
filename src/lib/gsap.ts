"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

// Register once, at module load, for every client component that imports from here.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Signature easing: fast start, long luxurious settle. */
export const EASE_OUT = "expo.out";
/** Length of the opening curtain, which the hero waits for. */
export const INTRO_SECONDS = 1.9;

export { gsap, ScrollTrigger, SplitText, useGSAP };
