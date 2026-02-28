import Navbar from "../../components/layout/Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </>
  );
}
