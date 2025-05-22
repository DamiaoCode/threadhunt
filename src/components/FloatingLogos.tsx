// components/FloatingLogos.tsx
import Image from "next/image";

const floatingLogos = [
  {
    src: "/images/reddit-logo.png",
    style: "top-[20%] left-[25%] rotate-340 w-50",
  },
  {
    src: "/images/stackoverflow-logo.png",
    style: "top-[30%] right-[30%] w-30 rotate-40",
  },
  {
    src: "/images/twitter-logo.png",
    style: "bottom-[20%] left-[30%] rotate-15 w-30",
  },
  {
    src: "/images/quora-logo.png",
    style: "bottom-[25%] right-[35%] w-20 rotate-40",
  },
];

export default function FloatingLogos() {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      {floatingLogos.map((logo, i) => (
        <Image
          key={i}
          src={logo.src}
          alt="bg-logo"
          width={64}
          height={64}
          className={`absolute opacity-10 animate-float-slow ${logo.style}`}
        />
      ))}
    </div>
  );
}
