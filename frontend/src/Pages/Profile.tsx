import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '../Store/productStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, signOut, addToast } = useStore();

  const [nameInput, setNameInput] = useState(user?.name || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-on-surface-variant font-bold">Please sign in to view your profile.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const handleSaveChanges = () => {
    if (!nameInput.trim() || !emailInput.trim()) {
      addToast("Full Name and Email and cannot be blank.", "error");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setUser({
        ...user,
        name: nameInput,
        email: emailInput,
      });
      setIsSaving(false);
      addToast("Profile credentials updated successfully!", "success");
    }, 600);
  };

  const handleDeleteAccount = () => {
    const confirm = window.confirm(
      "Are you absolutely sure you want to delete your FreshDrop account? All active harvest credits and orders will be irreversibly deleted."
    );
    if (confirm) {
      addToast("Account has been permanently deleted.", "info");
      signOut();
      navigate("/");
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in max-w-4xl mx-auto">
      
      {/* Profile Header Card */}
      <section className="flex flex-col items-center py-8 relative overflow-hidden bg-white rounded-2xl border border-outline-variant/20 shadow-sm">
        {/* Decorative background image */}
        <div className="absolute -right-12 -top-12 w-48 h-48 opacity-10 pointer-events-none">
          <img
            alt="Decorative illustration"
            className="w-full h-full object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv5Z2qP1uwzBR51qh2Q3vHpUfhD2rRvgaBTzv3_weIGiMqOVXmX50q3wMeY6_FeAbrH2LRENF-gj2jx8G2NdwEwb45Qf4eqkT1rFp3gL3gPz7Ixj3_YybUthoJVXkOPv_02zwxQTcNrxrq4oVOeb50MYwxvXuph3_8cFXp-qwyY9XujDyowlcFsuOpwVS1ip5C1eVhuiztU81lc2SHkm-ZwW_GrMiSvwIfJWklX3Oo1O308TcAjlpOcwyFoEphwrfYc0acOQvmPg"
          />
        </div>

        <div className="relative group">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-secondary-container p-1 bg-white">
            <img
              className="w-full h-full object-cover rounded-full"
              alt="Portrait"
              src={user.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=user"}
            />
          </div>
          <button
            onClick={() => addToast("Custom avatar upload coming soon with cloud storage integration!", "info")}
            className="absolute bottom-1 right-1 bg-primary text-on-primary p-2 rounded-full shadow-lg border-2 border-white hover:scale-105 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        <div className="text-center mt-4 space-y-1">
          <h2 className="font-caveat text-4xl text-on-surface font-black leading-none">{user.name}</h2>
          <p className="text-primary font-black uppercase text-[10px] tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">
            FreshDrop Gold Member
          </p>
        </div>
      </section>

      {/* Personal Info Form */}
      <section className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-5">
        <h3 className="font-sans font-bold text-[17px] text-on-surface flex items-center gap-2 border-b border-slate-50 pb-3">
          <span className="material-symbols-outlined text-primary text-[22px]">person</span>
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 text-xs text-left">
            <label className="font-extrabold tracking-widest text-[#6B705C] uppercase block">FULL NAME</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5 text-xs text-left">
            <label className="font-extrabold tracking-widest text-[#6B705C] uppercase block">EMAIL ADDRESS</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-semibold"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-primary hover:bg-[#005313] text-white px-8 py-3 rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow hover:-translate-y-0.5 transition-all duration-150 cursor-pointer disabled:bg-emerald-800/40"
          >
            {isSaving ? "Saving Settings..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Navigation Options List */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/history")}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-outline-variant/15 hover:border-primary/40 shadow-sm group hover:bg-[#f1f3ff]/40 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-secondary-container/60 rounded-full">
              <span className="material-symbols-outlined text-primary text-xl">shopping_bag</span>
            </div>
            <div>
              <span className="font-bold text-sm text-on-surface block leading-none">My Orders</span>
              <span className="text-[10px] text-outline mt-1 font-semibold block">Review historical transactions</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        <button
          onClick={() => addToast("Your Downtown address is saved as default! Add option coming soon.", "info")}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-outline-variant/15 hover:border-primary/40 shadow-sm group hover:bg-[#f1f3ff]/40 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-secondary-container/60 rounded-full">
              <span className="material-symbols-outlined text-primary text-xl">location_on</span>
            </div>
            <div>
              <span className="font-bold text-sm text-on-surface block leading-none">Saved Addresses</span>
              <span className="text-[10px] text-outline mt-1 font-semibold block">Edit delivery destinations</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        <button
          onClick={() => addToast("Secured through Payhero! You can manage cards at checkout.", "info")}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-outline-variant/15 hover:border-primary/40 shadow-sm group hover:bg-[#f1f3ff]/40 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-secondary-container/60 rounded-full">
              <span className="material-symbols-outlined text-primary text-xl">credit_card</span>
            </div>
            <div>
              <span className="font-bold text-sm text-on-surface block leading-none">Payment Methods</span>
              <span className="text-[10px] text-outline mt-1 font-semibold block">Manage saved credit and M-PESA channels</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>

        <button
          onClick={() => addToast("Support chat is online! Contact us at support@freshdrop.com.", "info")}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-outline-variant/15 hover:border-primary/40 shadow-sm group hover:bg-[#f1f3ff]/40 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center bg-secondary-container/60 rounded-full">
              <span className="material-symbols-outlined text-primary text-xl">help</span>
            </div>
            <div>
              <span className="font-bold text-sm text-on-surface block leading-none">Help Center</span>
              <span className="text-[10px] text-outline mt-1 font-semibold block">24/7 sustainable farmers customer desk</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>
      </section>

      {/* Brand logo illustration banner */}
      <section className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-2xl border border-outline-variant/15 shadow-sm gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="font-caveat text-3xl font-black text-primary">Managing your harvest, simply.</h4>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Thank you for buying organic. 80% of all commissions go directly back to small scale farmers and kiosks!
          </p>
        </div>
        <div className="w-32 h-auto shrink-0 opacity-80 pointer-events-none self-center">
          <img
            alt="Sustainable harvest crop"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv5Z2qP1uwzBR51qh2Q3vHpUfhD2rRvgaBTzv3_weIGiMqOVXmX50q3wMeY6_FeAbrH2LRENF-gj2jx8G2NdwEwb45Qf4eqkT1rFp3gL3gPz7Ixj3_YybUthoJVXkOPv_02zwxQTcNrxrq4oVOeb50MYwxvXuph3_8cFXp-qwyY9XujDyowlcFsuOpwVS1ip5C1eVhuiztU81lc2SHkm-ZwW_GrMiSvwIfJWklX3Oo1O308TcAjlpOcwyFoEphwrfYc0acOQvmPg"
            className="w-full h-auto object-contain"
          />
        </div>
      </section>

      {/* Danger Zone Section */}
      <section className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-left space-y-4">
        <div className="flex items-center gap-2 text-rose-850">
          <span className="material-symbols-outlined font-bold text-rose-600" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <h3 className="font-sans font-black text-sm uppercase tracking-wider">Danger Zone</h3>
        </div>
        <p className="text-xs font-semibold text-rose-900/80 leading-relaxed">
          Permanently delete your FreshDrop account and all associated storage data. This action is irreversible. All rewards credits will be terminated.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="w-full md:w-auto bg-error text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-rose-800 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          Delete Account
        </button>
      </section>

    </div>
  );
}
