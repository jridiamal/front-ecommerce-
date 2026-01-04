import Header from "@/components/Header";
import Footer from "@/components/Footer"; 

export default function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            
            <Header /> 
           
            <main className="flex-grow pt-4 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
<Footer/>
        </div>
    );
}