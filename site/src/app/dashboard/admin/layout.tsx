// Admin pages bypass the main dashboard layout (they have their own full-screen design)
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
