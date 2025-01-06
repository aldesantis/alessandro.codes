import Dropdown, { DropdownItem } from "@components/ui/Dropdown.tsx";
import { useEffect, useState } from "react";

export default function NavbarDropdown(): React.ReactNode {
  const [currentPath, setCurrentPath] = useState<string>("");
  
  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);
  
  return (
    <Dropdown label="The Garden ↓">
      <DropdownItem href="/notes" active={currentPath.startsWith("/notes")}>Notes</DropdownItem>
      <DropdownItem href="/essays" active={currentPath.startsWith("/essays")}>Essays</DropdownItem>
    </Dropdown>
  );
}
