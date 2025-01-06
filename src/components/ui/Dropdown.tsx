import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

export function DropdownItem({
  children,
  href,
  active = false,
}: React.PropsWithChildren<{
  href: string;
  active?: boolean;
}>): React.ReactNode {
  return (
    <MenuItem>
      <a
        href={href}
        className={`block px-4 py-2 text-sm text-gray-700 hover:text-orange-700 ${active ? "text-orange-700" : ""}`}
      >
        {children}
      </a>
    </MenuItem>
  );
}

export default function Dropdown({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>): React.ReactNode {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex w-full justify-center hover:text-orange-700">
          {label}
        </MenuButton>
      </div>

      <MenuItems
        transition
        className="absolute right-0 z-10 mt-2 min-w-32 origin-top-right rounded-md bg-zinc-100 shadow-md ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="py-1">{children}</div>
      </MenuItems>
    </Menu>
  );
}
