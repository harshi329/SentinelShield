import type { ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";

interface Props {
  children: ReactNode;
}

const MainLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <TopNavbar />

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;