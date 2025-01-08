'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import { ModeToggle } from "@/components/mode-toggle";

export function Header() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/generate-image",
      label: "Generate Image",
      active: pathname === "/generate-image",
    },
    {
      href: "/remove-background",
      label: "Remove BG",
      active: pathname === "/remove-background",
    },
    {
      href: "/live2d",
      label: "2D Image to Video",
      active: pathname === "/live2d",
    },
    {
      href: "/soundtovideo",
      label: "Add Sound to Video",
      active: pathname === "/soundtovideo",
    },
    
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block pl-5">
              AI Creative Tool
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              {routes.map((route) => (
                <NavigationMenuItem key={route.href}>
                  <Link href={route.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        route.active && "bg-accent text-accent-foreground"
                      )}
                    >
                      {route.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
