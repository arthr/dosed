import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Button as ShadcnButton } from "@/components/ui/button";

import "./styles/retro.css";

export const buttonVariants = cva("", {
  variants: {
    font: {
      normal: "",
      retro: "retro",
    },
    variant: {
      default: "bg-foreground",
      destructive: "bg-foreground",
      outline: "bg-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: "h-9 px-4 py-2 has-[>svg]:px-3",
      sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
      lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
      icon: "size-9",
    },
    borderSize: {
      sm: "",
      md: "",
      lg: "",
      xl: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    borderSize: "md",
  },
});

export interface BitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

const borderSizeMap = {
  sm: {
    pixel: 4,
    cornerClass: "size-0.5",
    heightClass: "h-0.5",
    widthClass: "w-0.5",
  },
  md: {
    pixel: 6,
    cornerClass: "size-1.5",
    heightClass: "h-1.5",
    widthClass: "w-1.5",
  },
  lg: {
    pixel: 8,
    cornerClass: "size-2",
    heightClass: "h-2",
    widthClass: "w-2",
  },
  xl: {
    pixel: 10,
    cornerClass: "size-2.5",
    heightClass: "h-2.5",
    widthClass: "w-2.5",
  },
};

interface PixelatedBorderProps {
  variant: BitButtonProps["variant"];
  borderSize: keyof typeof borderSizeMap;
}

function PixelatedBorder({ variant, borderSize }: PixelatedBorderProps) {
  const border = borderSizeMap[borderSize];
  const offset = border.pixel;
  const heightCalc = `calc(100% - ${offset * 2}px)`;

  return (
    <>
      {/* Top borders */}
      <div
        className={cn("absolute w-1/2 bg-foreground dark:bg-ring", border.heightClass)}
        style={{ top: -offset, left: offset }}
      />
      <div
        className={cn("absolute w-1/2 bg-foreground dark:bg-ring", border.heightClass)}
        style={{ top: -offset, right: offset }}
      />

      {/* Bottom borders */}
      <div
        className={cn("absolute w-1/2 bg-foreground dark:bg-ring", border.heightClass)}
        style={{ bottom: -offset, left: offset }}
      />
      <div
        className={cn("absolute w-1/2 bg-foreground dark:bg-ring", border.heightClass)}
        style={{ bottom: -offset, right: offset }}
      />

      {/* Corners */}
      <div className={cn("absolute top-0 left-0 bg-foreground dark:bg-ring", border.cornerClass)} />
      <div className={cn("absolute top-0 right-0 bg-foreground dark:bg-ring", border.cornerClass)} />
      <div className={cn("absolute bottom-0 left-0 bg-foreground dark:bg-ring", border.cornerClass)} />
      <div className={cn("absolute bottom-0 right-0 bg-foreground dark:bg-ring", border.cornerClass)} />

      {/* Side borders */}
      <div
        className={cn("absolute bg-foreground dark:bg-ring", border.widthClass)}
        style={{ top: offset, left: -offset, height: heightCalc }}
      />
      <div
        className={cn("absolute bg-foreground dark:bg-ring", border.widthClass)}
        style={{ top: offset, right: -offset, height: heightCalc }}
      />

      {/* Shadows */}
      {variant !== "outline" && (
        <>
          <div className={cn("absolute top-0 left-0 w-full bg-foreground/20", border.heightClass)} />
          <div className={cn("absolute left-0 w-3 bg-foreground/20", border.heightClass)} style={{ top: offset }} />
          <div className={cn("absolute bottom-0 left-0 w-full bg-foreground/20", border.heightClass)} />
          <div className={cn("absolute right-0 w-3 bg-foreground/20", border.heightClass)} style={{ bottom: offset }} />
        </>
      )}
    </>
  );
}

interface IconBorderProps {
  borderSize: keyof typeof borderSizeMap;
}

function IconBorder({ borderSize }: IconBorderProps) {
  const border = borderSizeMap[borderSize];
  const offset = border.pixel / 2;

  return (
    <>
      <div
        className="absolute top-0 left-0 w-full bg-foreground dark:bg-ring pointer-events-none"
        style={{ height: offset }}
      />
      <div
        className="absolute bottom-0 w-full bg-foreground dark:bg-ring pointer-events-none"
        style={{ height: offset }}
      />
      <div
        className="absolute h-1/2 bg-foreground dark:bg-ring pointer-events-none"
        style={{ top: offset, left: -offset, width: offset }}
      />
      <div
        className="absolute h-1/2 bg-foreground dark:bg-ring pointer-events-none"
        style={{ bottom: offset, left: -offset, width: offset }}
      />
      <div
        className="absolute h-1/2 bg-foreground dark:bg-ring pointer-events-none"
        style={{ top: offset, right: -offset, width: offset }}
      />
      <div
        className="absolute h-1/2 bg-foreground dark:bg-ring pointer-events-none"
        style={{ bottom: offset, right: -offset, width: offset }}
      />
    </>
  );
}

function Button({ children, asChild, ...props }: BitButtonProps) {
  const { variant, size, className, font, borderSize } = props;
  const finalBorderSize = (borderSize || "md") as keyof typeof borderSizeMap;

  return (
    <ShadcnButton
      {...props}
      className={cn(
        "rounded-none active:translate-y-1 transition-transform relative inline-flex items-center justify-center gap-1.5 border-none",
        font !== "normal" && "retro",
        className
      )}
      size={size}
      variant={variant}
      asChild={asChild}
    >
      {asChild ? (
        <span className="relative inline-flex items-center justify-center gap-1.5">
          {children}

          {variant !== "ghost" && variant !== "link" && size !== "icon" && (
            <PixelatedBorder variant={variant} borderSize={finalBorderSize} />
          )}

          {size === "icon" && <IconBorder borderSize={finalBorderSize} />}
        </span>
      ) : (
        <>
          {children}

          {variant !== "ghost" && variant !== "link" && size !== "icon" && (
            <PixelatedBorder variant={variant} borderSize={finalBorderSize} />
          )}

          {size === "icon" && <IconBorder borderSize={finalBorderSize} />}
        </>
      )}
    </ShadcnButton>
  );
}

export { Button };
