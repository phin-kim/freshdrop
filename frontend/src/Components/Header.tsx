import { useNavigate } from "react-router";

const Header =()=>{
    const navigate = useNavigate();
    return(
         <header className="bg-white sticky top-0 z-40 border-b border-outline-variant/10 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-3xl font-bold">location_on</span>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold tracking-widest text-[#6B705C] uppercase">DELIVER TO</span>
                          <span id="deliver-destination-header" className="text-sm font-bold text-primary">{deliveryLocation}</span>
                        </div>
                      </div>
        
                      <h1 className="font-caveat text-3xl md:text-4xl text-primary font-bold flex items-center gap-1.5 cursor-pointer" onClick={() => {navigate("/home"); setSearchQuery(""); }}>
                        <span className="material-symbols-outlined">eco</span>
                        FreshDrop
                      </h1>
        
                      {/* Profile card and cart count in Header trigger */}
                      <div className="flex items-center gap-2.5">
                        <button
                         // onClick={() => addToast("No new delivery alerts. All systems operational!", "info")}
                          className="relative p-2.5 rounded-full hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-primary font-bold text-2xl">notifications</span>
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                        </button>
        
                        {/*<button
                          onClick={() => setActiveTab("cart")}
                          className="relative p-2.5 rounded-full hover:bg-surface-container-low transition-colors"
                        >
                          <span className="material-symbols-outlined text-primary font-bold text-2xl">shopping_cart</span>
                          {cart.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-tertiary-container text-on-tertiary-container font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                              {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                          )}
                        </button>*/}
        
                        
                      </div>
                    </div>
                  </header>
    )
}
export default Header